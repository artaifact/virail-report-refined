import { miFetch } from '../compat';

const mockRefresh = jest.fn();
jest.mock('@/services/authService', () => ({
  AuthService: { getAccessToken: () => null, getUser: () => null, refreshAccessToken: () => mockRefresh() },
}));

const reply = (status: number) => Promise.resolve({ ok: status < 400, status, json: async () => ({}) } as Response);

describe('miFetch : session expirée', () => {
  const fetchMock = jest.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    mockRefresh.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it('renouvelle la session une fois puis rejoue l’appel (avant : 401 sur Catalogues au premier chargement)', async () => {
    fetchMock.mockReturnValueOnce(reply(401)).mockReturnValueOnce(reply(200));
    mockRefresh.mockResolvedValue('nouveau-jeton');
    const res = await miFetch('/catalog');
    expect(res.status).toBe(200);
    expect(mockRefresh).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('un seul renouvellement pour plusieurs appels simultanés', async () => {
    let calls = 0;
    fetchMock.mockImplementation(() => reply(calls++ < 3 ? 401 : 200));
    mockRefresh.mockImplementation(() => new Promise((r) => setTimeout(() => r('jeton'), 10)));
    const all = await Promise.all([miFetch('/a'), miFetch('/b'), miFetch('/c')]);
    expect(all.map((r) => r.status)).toEqual([200, 200, 200]);
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });

  it('session non renouvelable : la 401 est rendue telle quelle', async () => {
    fetchMock.mockReturnValue(reply(401));
    mockRefresh.mockResolvedValue(null);
    expect((await miFetch('/x')).status).toBe(401);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
