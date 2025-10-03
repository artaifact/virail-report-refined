import { test, expect } from '@playwright/test';

test.describe('Navigation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.goto('/');
    
    // Mock localStorage to simulate authenticated user
    await page.evaluate(() => {
      localStorage.setItem('user', JSON.stringify({
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
      }));
      localStorage.setItem('access_token', 'mock-token');
    });
  });

  test('should navigate through all main pages', async ({ page }) => {
    // Dashboard
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Tableau de bord');
    
    // Analyses
    await page.goto('/analyses');
    await expect(page.locator('h1')).toContainText('Analyses GEO');
    
    // Competition
    await page.goto('/competition');
    await expect(page.locator('h1')).toContainText('Analyse Concurrentielle GEO');
    
    // Site Optimization
    await page.goto('/site-optimization');
    await expect(page.locator('h1')).toContainText('Optimisation de Site');
    
    // Textual Optimization
    await page.goto('/textual-optimization');
    await expect(page.locator('h1')).toContainText('Optimisation Textuelle');
  });

  test('should use sidebar navigation', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to Analyses via sidebar
    await page.locator('nav a[href="/analyses"]').click();
    await expect(page).toHaveURL('/analyses');
    await expect(page.locator('h1')).toContainText('Analyses GEO');
    
    // Navigate to Competition via sidebar
    await page.locator('nav a[href="/competition"]').click();
    await expect(page).toHaveURL('/competition');
    await expect(page.locator('h1')).toContainText('Analyse Concurrentielle GEO');
    
    // Navigate back to Dashboard via sidebar
    await page.locator('nav a[href="/"]').click();
    await expect(page).toHaveURL('/');
    await expect(page.locator('h1')).toContainText('Tableau de bord');
  });

  test('should use breadcrumb navigation', async ({ page }) => {
    await page.goto('/analyses');
    
    // Navigate back to dashboard via breadcrumb
    await page.locator('nav a[href="/"]').click();
    await expect(page).toHaveURL('/');
    await expect(page.locator('h1')).toContainText('Tableau de bord');
  });

  test('should maintain active state in sidebar', async ({ page }) => {
    await page.goto('/analyses');
    
    // Analyses link should be active
    await expect(page.locator('nav a[href="/analyses"][data-state="active"]')).toBeVisible();
    
    // Navigate to competition
    await page.locator('nav a[href="/competition"]').click();
    
    // Competition link should be active
    await expect(page.locator('nav a[href="/competition"][data-state="active"]')).toBeVisible();
  });

  test('should handle mobile navigation', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Sidebar should be visible
    await expect(page.locator('nav')).toBeVisible();
    
    // Navigate via sidebar on mobile
    await page.locator('nav a[href="/analyses"]').click();
    await expect(page).toHaveURL('/analyses');
  });

  test('should navigate to pricing page', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to pricing via sidebar
    await page.locator('nav a[href="/pricing"]').click();
    await expect(page).toHaveURL('/pricing');
    await expect(page.locator('h1')).toContainText('Plans et Tarifs');
  });

  test('should navigate to profile page', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to profile via sidebar
    await page.locator('nav a[href="/profile"]').click();
    await expect(page).toHaveURL('/profile');
    await expect(page.locator('h1')).toContainText('Profile');
  });

  test('should navigate to help page', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to help via sidebar
    await page.locator('nav a[href="/help"]').click();
    await expect(page).toHaveURL('/help');
    await expect(page.locator('h1')).toContainText('Aide');
  });

  test('should handle logout navigation', async ({ page }) => {
    await page.goto('/');
    
    // Click logout button
    await page.locator('button:has-text("Se déconnecter")').click();
    
    // Should redirect to login
    await expect(page).toHaveURL('/login');
  });

  test('should handle back button navigation', async ({ page }) => {
    await page.goto('/');
    await page.goto('/analyses');
    
    // Use browser back button
    await page.goBack();
    
    // Should return to dashboard
    await expect(page).toHaveURL('/');
    await expect(page.locator('h1')).toContainText('Tableau de bord');
  });

  test('should handle forward button navigation', async ({ page }) => {
    await page.goto('/');
    await page.goto('/analyses');
    await page.goBack();
    
    // Use browser forward button
    await page.goForward();
    
    // Should return to analyses
    await expect(page).toHaveURL('/analyses');
    await expect(page.locator('h1')).toContainText('Analyses GEO');
  });

  test('should handle direct URL navigation', async ({ page }) => {
    // Navigate directly to a specific page
    await page.goto('/competition');
    
    // Should load the page correctly
    await expect(page.locator('h1')).toContainText('Analyse Concurrentielle GEO');
    
    // Sidebar should reflect current page
    await expect(page.locator('nav a[href="/competition"][data-state="active"]')).toBeVisible();
  });

  test('should handle 404 navigation', async ({ page }) => {
    await page.goto('/nonexistent-page');
    
    // Should show 404 page
    await expect(page.locator('h1')).toContainText('Page non trouvée');
    await expect(page.locator('text=Retour à l\'accueil')).toBeVisible();
  });

  test('should navigate to 404 and back to home', async ({ page }) => {
    await page.goto('/nonexistent-page');
    
    // Click back to home button
    await page.locator('a[href="/"]').click();
    
    // Should return to dashboard
    await expect(page).toHaveURL('/');
    await expect(page.locator('h1')).toContainText('Tableau de bord');
  });

  test('should handle keyboard navigation', async ({ page }) => {
    await page.goto('/');
    
    // Tab through navigation links
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Should focus on navigation elements
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('should maintain scroll position during navigation', async ({ page }) => {
    await page.goto('/analyses');
    
    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 500));
    
    // Navigate to different page
    await page.locator('nav a[href="/competition"]').click();
    
    // Navigate back
    await page.locator('nav a[href="/analyses"]').click();
    
    // Page should be reloaded, scroll position reset
    const scrollPosition = await page.evaluate(() => window.scrollY);
    expect(scrollPosition).toBe(0);
  });

  test('should handle navigation with query parameters', async ({ page }) => {
    await page.goto('/analyses?tab=saved');
    
    // Should load page with query parameters
    await expect(page).toHaveURL('/analyses?tab=saved');
    await expect(page.locator('h1')).toContainText('Analyses GEO');
  });

  test('should handle navigation with hash fragments', async ({ page }) => {
    await page.goto('/#section1');
    
    // Should load page with hash fragment
    await expect(page).toHaveURL('/#section1');
  });

  test('should handle rapid navigation', async ({ page }) => {
    // Rapidly navigate between pages
    await page.goto('/');
    await page.goto('/analyses');
    await page.goto('/competition');
    await page.goto('/');
    
    // Should end up on dashboard
    await expect(page).toHaveURL('/');
    await expect(page.locator('h1')).toContainText('Tableau de bord');
  });

  test('should handle navigation during loading', async ({ page }) => {
    await page.goto('/');
    
    // Start navigation
    await page.locator('nav a[href="/analyses"]').click();
    
    // Immediately navigate to another page
    await page.locator('nav a[href="/competition"]').click();
    
    // Should end up on competition page
    await expect(page).toHaveURL('/competition');
    await expect(page.locator('h1')).toContainText('Analyse Concurrentielle GEO');
  });

  test('should handle navigation with form data', async ({ page }) => {
    await page.goto('/analyses');
    
    // Open new analysis dialog
    await page.locator('button:has-text("Nouvelle Analyse")').click();
    
    // Fill form
    await page.locator('input[placeholder*="https://example.com"]').fill('example.com');
    
    // Navigate away
    await page.locator('nav a[href="/competition"]').click();
    
    // Navigate back
    await page.locator('nav a[href="/analyses"]').click();
    
    // Form should be reset
    await page.locator('button:has-text("Nouvelle Analyse")').click();
    await expect(page.locator('input[placeholder*="https://example.com"]')).toHaveValue('');
  });

  test('should handle navigation with unsaved changes', async ({ page }) => {
    await page.goto('/analyses');
    
    // Open new analysis dialog
    await page.locator('button:has-text("Nouvelle Analyse")').click();
    
    // Fill form
    await page.locator('input[placeholder*="https://example.com"]').fill('example.com');
    
    // Try to navigate away
    await page.locator('nav a[href="/competition"]').click();
    
    // Should navigate (no unsaved changes warning in this implementation)
    await expect(page).toHaveURL('/competition');
  });

  test('should handle navigation with active modals', async ({ page }) => {
    await page.goto('/analyses');
    
    // Open modal
    await page.locator('button:has-text("Nouvelle Analyse")').click();
    
    // Navigate away
    await page.locator('nav a[href="/competition"]').click();
    
    // Should navigate and close modal
    await expect(page).toHaveURL('/competition');
    await expect(page.locator('text=Lancer une nouvelle analyse')).not.toBeVisible();
  });
});
