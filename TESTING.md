# Guide des Tests - Virail Studio

Ce document décrit la stratégie de test complète pour l'application Virail Studio, incluant les tests unitaires, d'intégration et end-to-end.

## 🎯 Vue d'ensemble

Notre suite de tests couvre :
- **Tests unitaires** : Services, composants, hooks
- **Tests d'intégration** : Flux critiques (auth, analyses)
- **Tests E2E** : Navigation et interactions utilisateur

## 📁 Structure des Tests

```
src/
├── __tests__/
│   └── integration/          # Tests d'intégration
├── components/
│   └── __tests__/           # Tests des composants
├── hooks/
│   └── __tests__/           # Tests des hooks
├── pages/
│   └── __tests__/           # Tests des pages
├── services/
│   └── __tests__/           # Tests des services
├── mocks/                   # Mocks MSW
└── setupTests.ts           # Configuration Jest

e2e/                        # Tests E2E Playwright
├── auth.spec.ts
├── analyses.spec.ts
├── competition.spec.ts
└── navigation.spec.ts
```

## 🚀 Installation et Configuration

### Dépendances

Les dépendances de test sont déjà installées :
- Jest + React Testing Library
- MSW (Mock Service Worker)
- Playwright
- @testing-library/user-event

### Configuration

- `jest.config.js` : Configuration Jest
- `playwright.config.ts` : Configuration Playwright
- `src/setupTests.ts` : Setup global des tests
- `src/mocks/` : Handlers MSW pour les API

## 🧪 Types de Tests

### 1. Tests Unitaires

#### Services (`src/services/__tests__/`)

```bash
# Tests des services
npm run test src/services/__tests__/
```

**Couverture :**
- `authService.test.ts` : Authentification, tokens, sessions
- `apiService.test.ts` : Requêtes API, gestion d'erreurs
- `competitiveAnalysisService.test.ts` : Analyses concurrentielles

#### Composants (`src/components/__tests__/`)

```bash
# Tests des composants
npm run test src/components/__tests__/
```

**Couverture :**
- `AppSidebar.test.tsx` : Navigation, états, interactions
- `button.test.tsx` : Variants, tailles, événements

#### Hooks (`src/hooks/__tests__/`)

```bash
# Tests des hooks
npm run test src/hooks/__tests__/
```

**Couverture :**
- `useAuth.test.ts` : État d'authentification, login/logout
- `useCompetitiveAnalysis.test.ts` : Analyses, quotas, erreurs

#### Pages (`src/pages/__tests__/`)

```bash
# Tests des pages
npm run test src/pages/__tests__/
```

**Couverture :**
- `Analyses.test.tsx` : Métriques, formulaires, états
- `Competition.test.tsx` : Analyses concurrentielles, résultats

### 2. Tests d'Intégration (`src/__tests__/integration/`)

```bash
# Tests d'intégration
npm run test src/__tests__/integration/
```

**Flux testés :**
- `auth-flow.test.tsx` : Connexion, inscription, sessions
- `analysis-flow.test.tsx` : Analyses de sites, concurrentielles

### 3. Tests E2E (`e2e/`)

```bash
# Tests E2E
npm run test:e2e
```

**Scénarios :**
- `auth.spec.ts` : Flux d'authentification complet
- `analyses.spec.ts` : Page d'analyses, formulaires
- `competition.spec.ts` : Analyses concurrentielles
- `navigation.spec.ts` : Navigation entre pages

## 🎮 Commandes de Test

### Tests Unitaires et d'Intégration

```bash
# Lancer tous les tests
npm run test

# Tests en mode watch
npm run test:watch

# Tests avec couverture
npm run test:coverage

# Tests pour CI
npm run test:ci
```

### Tests E2E

```bash
# Tests E2E
npm run test:e2e

# Tests E2E avec interface
npm run test:e2e:ui

# Tests E2E en mode headed
npm run test:e2e:headed

# Debug des tests E2E
npm run test:e2e:debug
```

### Tous les Tests

```bash
# Lancer tous les tests (unitaires + E2E)
npm run test:all
```

## 📊 Couverture de Code

### Objectifs de Couverture

- **Services** : 90%+
- **Hooks** : 85%+
- **Composants** : 80%+
- **Pages** : 75%+

### Rapport de Couverture

```bash
npm run test:coverage
```

Le rapport est généré dans `coverage/` avec :
- Rapport HTML : `coverage/lcov-report/index.html`
- Rapport LCOV : `coverage/lcov.info`

## 🔧 Mocks et Fixtures

### MSW (Mock Service Worker)

Les mocks API sont définis dans `src/mocks/handlers.ts` :

```typescript
// Exemple de mock
http.post('/api/v1/auth/login', () => {
  return HttpResponse.json({
    access_token: 'mock-token',
    user: { id: 1, email: 'test@example.com' }
  });
});
```

### Fixtures de Test

Les données de test sont centralisées dans `src/lib/test-data.ts` :

```typescript
export const mockUser = {
  id: '1',
  email: 'test@example.com',
  username: 'testuser'
};

export const mockReports = [
  { id: '1', url: 'https://example.com', score: 85 }
];
```

## 🐛 Debugging des Tests

### Tests Unitaires

```bash
# Debug avec Node.js
node --inspect-brk node_modules/.bin/jest --runInBand

# Tests spécifiques
npm run test -- --testNamePattern="AuthService"
```

### Tests E2E

```bash
# Debug avec Playwright
npm run test:e2e:debug

# Tests spécifiques
npx playwright test auth.spec.ts --debug
```

### Logs et Traces

- **Jest** : Logs dans la console
- **Playwright** : Traces dans `test-results/`

## 🚀 Intégration Continue

### GitHub Actions

Le workflow CI exécute :

```yaml
- name: Run Unit Tests
  run: npm run test:ci

- name: Run E2E Tests
  run: npm run test:e2e
```

### Pré-commit Hooks

```bash
# Installer les hooks
npm install --save-dev husky lint-staged

# Configuration dans package.json
"husky": {
  "hooks": {
    "pre-commit": "lint-staged"
  }
}
```

## 📝 Bonnes Pratiques

### Écriture de Tests

1. **Nommage descriptif** : `should handle user login successfully`
2. **Arrange-Act-Assert** : Structure claire des tests
3. **Tests isolés** : Chaque test est indépendant
4. **Mocking approprié** : Mocker les dépendances externes

### Exemple de Test

```typescript
describe('AuthService', () => {
  it('should login user successfully', async () => {
    // Arrange
    const credentials = { username: 'test', password: 'pass' };
    mockAuthService.login.mockResolvedValue(mockResponse);

    // Act
    const result = await AuthService.login(credentials);

    // Assert
    expect(result).toEqual(mockResponse);
    expect(mockAuthService.login).toHaveBeenCalledWith(credentials);
  });
});
```

### Maintenance des Tests

1. **Mettre à jour les mocks** quand l'API change
2. **Refactorer les tests** avec le code
3. **Supprimer les tests obsolètes**
4. **Documenter les tests complexes**

## 🔍 Dépannage

### Problèmes Courants

#### Tests qui échouent de manière intermittente

```bash
# Vérifier les timeouts
npm run test -- --testTimeout=10000

# Tests en série
npm run test -- --runInBand
```

#### Problèmes de mocks

```typescript
// Vérifier l'ordre des mocks
beforeEach(() => {
  jest.clearAllMocks();
});
```

#### Problèmes E2E

```bash
# Vérifier les selectors
npx playwright test --headed --debug

# Capturer les screenshots
npx playwright test --screenshot=only-on-failure
```

### Support

Pour toute question sur les tests :
1. Consulter ce guide
2. Vérifier les logs d'erreur
3. Utiliser les outils de debug
4. Contacter l'équipe de développement

## 📚 Ressources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [MSW Documentation](https://mswjs.io/docs/)

---

*Dernière mise à jour : Janvier 2025*
