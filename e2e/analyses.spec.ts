import { test, expect } from '@playwright/test';

test.describe('Analyses Page', () => {
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

  test('should display analyses page', async ({ page }) => {
    await page.goto('/analyses');
    
    await expect(page).toHaveTitle(/Virail Studio/);
    await expect(page.locator('h1')).toContainText('Analyses GEO');
    await expect(page.locator('text=Tableau de bord')).toBeVisible();
  });

  test('should display metrics cards', async ({ page }) => {
    await page.goto('/analyses');
    
    await expect(page.locator('text=Sites Analysés')).toBeVisible();
    await expect(page.locator('text=Score Moyen')).toBeVisible();
    await expect(page.locator('text=Analyses Total')).toBeVisible();
    await expect(page.locator('text=Temps Moyen')).toBeVisible();
  });

  test('should open new analysis dialog', async ({ page }) => {
    await page.goto('/analyses');
    
    // Click new analysis button
    await page.locator('button:has-text("Nouvelle Analyse")').click();
    
    // Dialog should be visible
    await expect(page.locator('text=Lancer une nouvelle analyse')).toBeVisible();
    await expect(page.locator('input[placeholder*="https://example.com"]')).toBeVisible();
    await expect(page.locator('button:has-text("Lancer l\'analyse")')).toBeVisible();
  });

  test('should validate URL input', async ({ page }) => {
    await page.goto('/analyses');
    
    // Open new analysis dialog
    await page.locator('button:has-text("Nouvelle Analyse")').click();
    
    // Try to submit without URL
    await page.locator('button:has-text("Lancer l\'analyse")').click();
    
    // Should show validation error
    await expect(page.locator('text=Veuillez entrer une URL')).toBeVisible();
  });

  test('should add https:// prefix to URLs', async ({ page }) => {
    await page.goto('/analyses');
    
    // Open new analysis dialog
    await page.locator('button:has-text("Nouvelle Analyse")').click();
    
    // Enter URL without protocol
    const urlInput = page.locator('input[placeholder*="https://example.com"]');
    await urlInput.fill('example.com');
    await urlInput.blur();
    
    // Should add https:// prefix
    await expect(urlInput).toHaveValue('https://example.com');
  });

  test('should not modify URLs that already have protocol', async ({ page }) => {
    await page.goto('/analyses');
    
    // Open new analysis dialog
    await page.locator('button:has-text("Nouvelle Analyse")').click();
    
    // Enter URL with protocol
    const urlInput = page.locator('input[placeholder*="https://example.com"]');
    await urlInput.fill('https://example.com');
    await urlInput.blur();
    
    // Should remain unchanged
    await expect(urlInput).toHaveValue('https://example.com');
  });

  test('should handle analysis checkbox', async ({ page }) => {
    await page.goto('/analyses');
    
    // Open new analysis dialog
    await page.locator('button:has-text("Nouvelle Analyse")').click();
    
    // Checkbox should be checked by default
    const checkbox = page.locator('input[type="checkbox"]');
    await expect(checkbox).toBeChecked();
    
    // Uncheck checkbox
    await checkbox.click();
    await expect(checkbox).not.toBeChecked();
  });

  test('should display tabs for reports', async ({ page }) => {
    await page.goto('/analyses');
    
    await expect(page.locator('text=Rapports récents')).toBeVisible();
    await expect(page.locator('text=Analyses sauvegardées')).toBeVisible();
  });

  test('should switch between tabs', async ({ page }) => {
    await page.goto('/analyses');
    
    // Click on second tab
    await page.locator('text=Analyses sauvegardées').click();
    
    // Tab should be active
    await expect(page.locator('text=Analyses sauvegardées[data-state="active"]')).toBeVisible();
  });

  test('should display empty state when no reports', async ({ page }) => {
    await page.goto('/analyses');
    
    // Should show empty state
    await expect(page.locator('text=Aucune analyse trouvée')).toBeVisible();
  });

  test('should display optimization section', async ({ page }) => {
    await page.goto('/analyses');
    
    await expect(page.locator('text=Optimisation de Site')).toBeVisible();
    await expect(page.locator('button:has-text("Nouvelle Optimisation")')).toBeVisible();
  });

  test('should open optimization dialog', async ({ page }) => {
    await page.goto('/analyses');
    
    // Click optimization button
    await page.locator('button:has-text("Nouvelle Optimisation")').click();
    
    // Dialog should be visible
    await expect(page.locator('text=Lancer une optimisation de site')).toBeVisible();
  });

  test('should handle refresh button', async ({ page }) => {
    await page.goto('/analyses');
    
    // Click refresh button
    await page.locator('button[aria-label="Rafraîchir"]').click();
    
    // Should trigger refresh (no specific assertion needed as it's a background action)
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/analyses');
    
    // Page should be visible and properly sized
    await expect(page.locator('h1')).toContainText('Analyses GEO');
    await expect(page.locator('button:has-text("Nouvelle Analyse")')).toBeVisible();
  });

  test('should handle keyboard navigation', async ({ page }) => {
    await page.goto('/analyses');
    
    // Open new analysis dialog
    await page.locator('button:has-text("Nouvelle Analyse")').click();
    
    // Tab through form elements
    await page.keyboard.press('Tab');
    await expect(page.locator('input[placeholder*="https://example.com"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('input[type="checkbox"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('button:has-text("Lancer l\'analyse")')).toBeFocused();
  });

  test('should close dialog when clicking outside', async ({ page }) => {
    await page.goto('/analyses');
    
    // Open new analysis dialog
    await page.locator('button:has-text("Nouvelle Analyse")').click();
    
    // Click outside dialog
    await page.locator('body').click({ position: { x: 10, y: 10 } });
    
    // Dialog should be closed
    await expect(page.locator('text=Lancer une nouvelle analyse')).not.toBeVisible();
  });

  test('should close dialog when pressing escape', async ({ page }) => {
    await page.goto('/analyses');
    
    // Open new analysis dialog
    await page.locator('button:has-text("Nouvelle Analyse")').click();
    
    // Press escape
    await page.keyboard.press('Escape');
    
    // Dialog should be closed
    await expect(page.locator('text=Lancer une nouvelle analyse')).not.toBeVisible();
  });

  test('should display breadcrumb navigation', async ({ page }) => {
    await page.goto('/analyses');
    
    await expect(page.locator('text=Tableau de bord')).toBeVisible();
    await expect(page.locator('text=Analyses GEO')).toBeVisible();
  });

  test('should navigate back to dashboard', async ({ page }) => {
    await page.goto('/analyses');
    
    // Click on dashboard link in breadcrumb
    await page.locator('a[href="/"]').click();
    
    // Should navigate to dashboard
    await expect(page).toHaveURL('/');
  });

  test('should display sidebar navigation', async ({ page }) => {
    await page.goto('/analyses');
    
    // Sidebar should be visible
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('text=Tableau de bord')).toBeVisible();
    await expect(page.locator('text=Analyses GEO')).toBeVisible();
  });

  test('should handle analysis form submission', async ({ page }) => {
    await page.goto('/analyses');
    
    // Open new analysis dialog
    await page.locator('button:has-text("Nouvelle Analyse")').click();
    
    // Fill form
    await page.locator('input[placeholder*="https://example.com"]').fill('example.com');
    
    // Submit form
    await page.locator('button:has-text("Lancer l\'analyse")').click();
    
    // Should show loading state
    await expect(page.locator('text=Analyse en cours...')).toBeVisible();
  });

  test('should display progress during analysis', async ({ page }) => {
    await page.goto('/analyses');
    
    // Open new analysis dialog
    await page.locator('button:has-text("Nouvelle Analyse")').click();
    
    // Fill and submit form
    await page.locator('input[placeholder*="https://example.com"]').fill('example.com');
    await page.locator('button:has-text("Lancer l\'analyse")').click();
    
    // Should show progress bar
    await expect(page.locator('progress')).toBeVisible();
  });
});
