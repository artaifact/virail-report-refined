import { apiService } from '../apiService';

describe('apiService : lectures simultanées mutualisées', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve({
      ok: true, status: 200, headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ plans: [] }), text: async () => '{"plans": []}',
    }), 5)));
  });

  it('deux lectures identiques en même temps : une seule requête (recette : subscriptions/current ×3)', async () => {
    await Promise.all([apiService.getPlans(), apiService.getPlans()]);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('lectures successives : chacune interroge le serveur (pas de cache)', async () => {
    await apiService.getPlans();
    await apiService.getPlans();
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
