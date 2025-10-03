import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login');
    
    await expect(page).toHaveTitle(/Virail Studio/);
    await expect(page.locator('h1')).toContainText('Connexion');
    await expect(page.locator('input[placeholder*="nom d\'utilisateur"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="mot de passe"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should display registration page', async ({ page }) => {
    await page.goto('/register');
    
    await expect(page).toHaveTitle(/Virail Studio/);
    await expect(page.locator('h1')).toContainText('Inscription');
    await expect(page.locator('input[placeholder*="nom d\'utilisateur"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="email"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="mot de passe"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="confirmer"]')).toBeVisible();
  });

  test('should validate login form fields', async ({ page }) => {
    await page.goto('/login');
    
    // Try to submit empty form
    await page.locator('button[type="submit"]').click();
    
    // Should show validation errors
    await expect(page.locator('text=Ce champ est requis')).toBeVisible();
  });

  test('should validate registration form fields', async ({ page }) => {
    await page.goto('/register');
    
    // Try to submit empty form
    await page.locator('button[type="submit"]').click();
    
    // Should show validation errors
    await expect(page.locator('text=Ce champ est requis')).toBeVisible();
  });

  test('should validate email format in registration', async ({ page }) => {
    await page.goto('/register');
    
    // Fill form with invalid email
    await page.locator('input[placeholder*="nom d\'utilisateur"]').fill('testuser');
    await page.locator('input[placeholder*="email"]').fill('invalid-email');
    await page.locator('input[placeholder*="mot de passe"]').fill('password123');
    await page.locator('input[placeholder*="confirmer"]').fill('password123');
    
    await page.locator('button[type="submit"]').click();
    
    // Should show email validation error
    await expect(page.locator('text=Format d\'email invalide')).toBeVisible();
  });

  test('should validate password confirmation', async ({ page }) => {
    await page.goto('/register');
    
    // Fill form with mismatched passwords
    await page.locator('input[placeholder*="nom d\'utilisateur"]').fill('testuser');
    await page.locator('input[placeholder*="email"]').fill('test@example.com');
    await page.locator('input[placeholder*="mot de passe"]').fill('password123');
    await page.locator('input[placeholder*="confirmer"]').fill('differentpassword');
    
    await page.locator('button[type="submit"]').click();
    
    // Should show password mismatch error
    await expect(page.locator('text=Les mots de passe ne correspondent pas')).toBeVisible();
  });

  test('should navigate between login and register pages', async ({ page }) => {
    await page.goto('/login');
    
    // Click on register link
    await page.locator('a[href="/register"]').click();
    await expect(page).toHaveURL('/register');
    
    // Click on login link
    await page.locator('a[href="/login"]').click();
    await expect(page).toHaveURL('/login');
  });

  test('should redirect to login when accessing protected route', async ({ page }) => {
    // Try to access protected route
    await page.goto('/analyses');
    
    // Should redirect to login
    await expect(page).toHaveURL('/login');
  });

  test('should show loading state during form submission', async ({ page }) => {
    await page.goto('/login');
    
    // Fill form
    await page.locator('input[placeholder*="nom d\'utilisateur"]').fill('testuser');
    await page.locator('input[placeholder*="mot de passe"]').fill('password123');
    
    // Submit form
    await page.locator('button[type="submit"]').click();
    
    // Should show loading state
    await expect(page.locator('button[type="submit"]:disabled')).toBeVisible();
  });

  test('should handle form validation on input', async ({ page }) => {
    await page.goto('/login');
    
    // Try to submit empty form first
    await page.locator('button[type="submit"]').click();
    
    // Start typing in username field
    await page.locator('input[placeholder*="nom d\'utilisateur"]').fill('test');
    
    // Validation error should be cleared
    await expect(page.locator('text=Ce champ est requis')).not.toBeVisible();
  });

  test('should display Google login option', async ({ page }) => {
    await page.goto('/login');
    
    // Should show Google login button
    await expect(page.locator('button:has-text("Google")')).toBeVisible();
  });

  test('should display forgot password link', async ({ page }) => {
    await page.goto('/login');
    
    // Should show forgot password link
    await expect(page.locator('a:has-text("Mot de passe oublié")')).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/login');
    
    // Form should be visible and properly sized
    await expect(page.locator('input[placeholder*="nom d\'utilisateur"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="mot de passe"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should handle keyboard navigation', async ({ page }) => {
    await page.goto('/login');
    
    // Tab through form elements
    await page.keyboard.press('Tab');
    await expect(page.locator('input[placeholder*="nom d\'utilisateur"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('input[placeholder*="mot de passe"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('button[type="submit"]')).toBeFocused();
  });

  test('should clear form when navigating away and back', async ({ page }) => {
    await page.goto('/login');
    
    // Fill form
    await page.locator('input[placeholder*="nom d\'utilisateur"]').fill('testuser');
    await page.locator('input[placeholder*="mot de passe"]').fill('password123');
    
    // Navigate away
    await page.goto('/register');
    
    // Navigate back
    await page.goto('/login');
    
    // Form should be cleared
    await expect(page.locator('input[placeholder*="nom d\'utilisateur"]')).toHaveValue('');
    await expect(page.locator('input[placeholder*="mot de passe"]')).toHaveValue('');
  });
});
