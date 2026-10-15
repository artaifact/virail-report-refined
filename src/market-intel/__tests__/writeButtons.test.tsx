import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import FollowButton from '../components/workspace/FollowButton';
import GoldenQueue from '../components/GoldenQueue';

let mockUser: { is_admin?: boolean } | null = { is_admin: true };
jest.mock('@/services/authService', () => ({ AuthService: { getAccessToken: () => null, getUser: () => mockUser } }));

const reply = (status: number, body: unknown) =>
  Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(body) } as Response);

describe("boutons d'écriture : API de virail et motif du refus", () => {
  const fetchMock = jest.fn();
  beforeEach(() => {
    mockUser = { is_admin: true };
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it('« + Suivre » appelle /api/v1/market-intelligence et montre pourquoi il est refusé', async () => {
    fetchMock.mockReturnValue(reply(403, { detail: 'Réservé aux administrateurs' }));
    render(<MemoryRouter><FollowButton entryId={7} marketId="crm-smb" /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(screen.getByRole('button')).toHaveTextContent('Échec'));
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/v1/market-intelligence/catalog/entries/7/follow');
    expect(init).toMatchObject({ method: 'POST', credentials: 'include' });
    expect(screen.getByRole('button')).toHaveAttribute('title', 'Réservé aux administrateurs');
  });

  it('la vérité terrain envoie sa réponse à /api/v1/market-intelligence', async () => {
    fetchMock.mockReturnValue(reply(403, { detail: 'Réservé aux administrateurs' }));
    const item = { company_id: 'hubspot', company: 'HubSpot', kind: 'mcp_official', claim: true,
      question: 'HubSpot a-t-il un MCP officiel ?', evidence: 'https://exemple.test', evidence_is_search: false };
    render(<MemoryRouter><GoldenQueue items={[item]} marketId="crm-smb" facts={0} /></MemoryRouter>);
    fireEvent.click(screen.getByText(/Oui, c.est vrai/));
    await waitFor(() => expect(screen.getByText(/Réservé aux administrateurs/)).toBeInTheDocument());
    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/market-intelligence/markets/crm-smb/golden');
  });

  it("rien pour un client : les écritures sont réservées aux administrateurs", () => {
    mockUser = { is_admin: false };
    const { container } = render(<MemoryRouter><FollowButton entryId={7} marketId="crm-smb" /></MemoryRouter>);
    expect(container).toBeEmptyDOMElement();
    const item = { company_id: 'hubspot', company: 'HubSpot', kind: 'mcp_official', claim: true,
      question: 'Q ?', evidence: 'https://exemple.test', evidence_is_search: false };
    render(<MemoryRouter><GoldenQueue items={[item]} marketId="crm-smb" facts={0} /></MemoryRouter>);
    expect(screen.queryByText(/Oui, c.est vrai/)).toBeNull();
    expect(screen.getByText(/Réservé aux administrateurs/)).toBeInTheDocument();
  });
});
