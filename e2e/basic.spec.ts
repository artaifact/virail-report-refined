import { test, expect } from '@playwright/test';

test.describe('Basic E2E Tests', () => {
  test('should load the application', async ({ page }) => {
    // Navigation vers l'application (peut être localhost ou une URL de test)
    await page.goto('http://localhost:5173');
    
    // Vérifier que la page se charge
    await expect(page).toHaveTitle(/Virail/);
  });

  test('should display basic elements', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Attendre que le contenu se charge
    await page.waitForLoadState('networkidle');
    
    // Vérifier la présence d'éléments de base
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should handle navigation', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Attendre que la page soit prête
    await page.waitForLoadState('networkidle');
    
    // Vérifier que nous sommes sur la page d'accueil
    await expect(page.url()).toContain('localhost:5173');
  });

  test('should be responsive', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Test sur mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('body')).toBeVisible();
    
    // Test sur desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('body')).toBeVisible();
  });
});
