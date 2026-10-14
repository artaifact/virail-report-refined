import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { clearClientCache, useLoader } from '../compat';

jest.mock('@/services/authService', () => ({ AuthService: { getAccessToken: () => null } }));

const wrapper = ({ children }: { children: ReactNode }) => <MemoryRouter>{children}</MemoryRouter>;

/** Promesses résolues à la main : on contrôle quand chaque marché « revient du réseau ». */
function deferred<T>() {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => { resolve = r; });
  return { promise, resolve };
}

describe('useLoader : changement de marché', () => {
  beforeEach(() => clearClientCache());

  it("affiche l'attente du nouveau marché au lieu de rester figé sur le précédent", async () => {
    const pending: Record<string, ReturnType<typeof deferred<string>>> = { a: deferred(), b: deferred() };
    const { result, rerender } = renderHook(({ m }) => useLoader(() => pending[m].promise, [m]), {
      wrapper, initialProps: { m: 'a' },
    });
    await act(async () => pending.a.resolve('marché A'));
    expect(result.current.data).toBe('marché A');

    rerender({ m: 'b' });
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(true);

    await act(async () => pending.b.resolve('marché B'));
    expect(result.current.data).toBe('marché B');
  });

  it('montre tout de suite un marché déjà visité, sans attendre le réseau', async () => {
    const load = jest.fn((m: string) => Promise.resolve(`marché ${m}`));
    const { result, rerender } = renderHook(({ m }) => useLoader(() => load(m), [m]), {
      wrapper, initialProps: { m: 'a' },
    });
    await waitFor(() => expect(result.current.data).toBe('marché a'));
    rerender({ m: 'b' });
    await waitFor(() => expect(result.current.data).toBe('marché b'));

    load.mockImplementation(() => new Promise<string>(() => {}));  // le réseau ne répond plus
    rerender({ m: 'a' });
    expect(result.current.data).toBe('marché a');
    expect(result.current.loading).toBe(false);
  });

  it('une réponse tardive du marché précédent ne remplace pas le marché affiché', async () => {
    const pending: Record<string, ReturnType<typeof deferred<string>>> = { a: deferred(), b: deferred() };
    const { result, rerender } = renderHook(({ m }) => useLoader(() => pending[m].promise, [m]), {
      wrapper, initialProps: { m: 'a' },
    });
    rerender({ m: 'b' });
    await act(async () => pending.b.resolve('marché B'));
    await act(async () => pending.a.resolve('marché A'));
    expect(result.current.data).toBe('marché B');
  });
});
