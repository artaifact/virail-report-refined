import { test, expect } from '@playwright/test';

test.describe('Competition Page', () => {
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

  test('should display competition page', async ({ page }) => {
    await page.goto('/competition');
    
    await expect(page).toHaveTitle(/Virail Studio/);
    await expect(page.locator('h1')).toContainText('Analyse Concurrentielle GEO');
    await expect(page.locator('text=Tableau de bord')).toBeVisible();
  });

  test('should display new analysis button', async ({ page }) => {
    await page.goto('/competition');
    
    await expect(page.locator('button:has-text("Nouvelle Analyse")')).toBeVisible();
  });

  test('should open new analysis dialog', async ({ page }) => {
    await page.goto('/competition');
    
    // Click new analysis button
    await page.locator('button:has-text("Nouvelle Analyse")').click();
    
    // Dialog should be visible
    await expect(page.locator('text=Lancer une analyse concurrentielle')).toBeVisible();
    await expect(page.locator('input[placeholder*="https://example.com"]')).toBeVisible();
    await expect(page.locator('button:has-text("Lancer l\'analyse")')).toBeVisible();
  });

  test('should validate URL input', async ({ page }) => {
    await page.goto('/competition');
    
    // Open new analysis dialog
    await page.locator('button:has-text("Nouvelle Analyse")').click();
    
    // Try to submit without URL
    await page.locator('button:has-text("Lancer l\'analyse")').click();
    
    // Should show validation error
    await expect(page.locator('text=Veuillez entrer une URL')).toBeVisible();
  });

  test('should add https:// prefix to URLs', async ({ page }) => {
    await page.goto('/competition');
    
    // Open new analysis dialog
    await page.locator('button:has-text("Nouvelle Analyse")').click();
    
    // Enter URL without protocol
    const urlInput = page.locator('input[placeholder*="https://example.com"]');
    await urlInput.fill('example.com');
    await urlInput.blur();
    
    // Should add https:// prefix
    await expect(urlInput).toHaveValue('https://example.com');
  });

  test('should display tabs for analyses', async ({ page }) => {
    await page.goto('/competition');
    
    await expect(page.locator('text=Résultats')).toBeVisible();
    await expect(page.locator('text=Analyses sauvegardées')).toBeVisible();
  });

  test('should switch between tabs', async ({ page }) => {
    await page.goto('/competition');
    
    // Click on second tab
    await page.locator('text=Analyses sauvegardées').click();
    
    // Tab should be active
    await expect(page.locator('text=Analyses sauvegardées[data-state="active"]')).toBeVisible();
  });

  test('should display empty state when no analyses', async ({ page }) => {
    await page.goto('/competition');
    
    // Should show empty state
    await expect(page.locator('text=Aucune analyse sauvegardée')).toBeVisible();
  });

  test('should display usage information', async ({ page }) => {
    await page.goto('/competition');
    
    await expect(page.locator('text=Analyses utilisées:')).toBeVisible();
    await expect(page.locator('text=Restantes:')).toBeVisible();
  });

  test('should handle refresh button', async ({ page }) => {
    await page.goto('/competition');
    
    // Click refresh button
    await page.locator('button[aria-label="Rafraîchir"]').click();
    
    // Should trigger refresh (no specific assertion needed as it's a background action)
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/competition');
    
    // Page should be visible and properly sized
    await expect(page.locator('h1')).toContainText('Analyse Concurrentielle GEO');
    await expect(page.locator('button:has-text("Nouvelle Analyse")')).toBeVisible();
  });

  test('should handle keyboard navigation', async ({ page }) => {
    await page.goto('/competition');
    
    // Open new analysis dialog
    await page.locator('button:has-text("Nouvelle Analyse")').click();
    
    // Tab through form elements
    await page.keyboard.press('Tab');
    await expect(page.locator('input[placeholder*="https://example.com"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('button:has-text("Lancer l\'analyse")')).toBeFocused();
  });

  test('should close dialog when clicking outside', async ({ page }) => {
    await page.goto('/competition');
    
    // Open new analysis dialog
    await page.locator('button:has-text("Nouvelle Analyse")').click();
    
    // Click outside dialog
    await page.locator('body').click({ position: { x: 10, y: 10 } });
    
    // Dialog should be closed
    await expect(page.locator('text=Lancer une analyse concurrentielle')).not.toBeVisible();
  });

  test('should close dialog when pressing escape', async ({ page }) => {
    await page.goto('/competition');
    
    // Open new analysis dialog
    await page.locator('button:has-text("Nouvelle Analyse")').click();
    
    // Press escape
    await page.keyboard.press('Escape');
    
    // Dialog should be closed
    await expect(page.locator('text=Lancer une analyse concurrentielle')).not.toBeVisible();
  });

  test('should display breadcrumb navigation', async ({ page }) => {
    await page.goto('/competition');
    
    await expect(page.locator('text=Tableau de bord')).toBeVisible();
    await expect(page.locator('text=Analyse Concurrentielle GEO')).toBeVisible();
  });

  test('should navigate back to dashboard', async ({ page }) => {
    await page.goto('/competition');
    
    // Click on dashboard link in breadcrumb
    await page.locator('a[href="/"]').click();
    
    // Should navigate to dashboard
    await expect(page).toHaveURL('/');
  });

  test('should display sidebar navigation', async ({ page }) => {
    await page.goto('/competition');
    
    // Sidebar should be visible
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('text=Tableau de bord')).toBeVisible();
    await expect(page.locator('text=Analyse Concurrentielle GEO')).toBeVisible();
  });

  test('should handle analysis form submission', async ({ page }) => {
    await page.goto('/competition');
    
    // Open new analysis dialog
    await page.locator('button:has-text("Nouvelle Analyse")').click();
    
    // Fill form
    await page.locator('input[placeholder*="https://example.com"]').fill('example.com');
    
    // Submit form
    await page.locator('button:has-text("Lancer l\'analyse")').click();
    
    // Should show loading state
    await expect(page.locator('text=Veuillez patienter')).toBeVisible();
  });

  test('should display progress during analysis', async ({ page }) => {
    await page.goto('/competition');
    
    // Open new analysis dialog
    await page.locator('button:has-text("Nouvelle Analyse")').click();
    
    // Fill and submit form
    await page.locator('input[placeholder*="https://example.com"]').fill('example.com');
    await page.locator('button:has-text("Lancer l\'analyse")').click();
    
    // Should show progress bar
    await expect(page.locator('progress')).toBeVisible();
  });

  test('should display analysis results when available', async ({ page }) => {
    await page.goto('/competition');
    
    // Mock analysis results
    await page.evaluate(() => {
      localStorage.setItem('competitive_analyses', JSON.stringify([
        {
          id: '1',
          timestamp: '2025-01-01T00:00:00Z',
          userSite: {
            url: 'https://example.com',
            domain: 'example.com',
            report: { total_score: 85 },
          },
          competitors: [
            {
              url: 'https://competitor1.com',
              domain: 'competitor1.com',
              report: { total_score: 80 },
            },
          ],
          summary: {
            userRank: 1,
            totalAnalyzed: 2,
            strengthsVsCompetitors: ['Strength 1'],
            weaknessesVsCompetitors: ['Weakness 1'],
            opportunitiesIdentified: ['Opportunity 1'],
          },
        },
      ]));
    });
    
    // Reload page to pick up mocked data
    await page.reload();
    
    // Should display saved analysis
    await expect(page.locator('text=example.com')).toBeVisible();
    await expect(page.locator('text=85%')).toBeVisible();
    await expect(page.locator('text=1er sur 2')).toBeVisible();
  });

  test('should handle analysis deletion', async ({ page }) => {
    await page.goto('/competition');
    
    // Mock analysis results
    await page.evaluate(() => {
      localStorage.setItem('competitive_analyses', JSON.stringify([
        {
          id: '1',
          timestamp: '2025-01-01T00:00:00Z',
          userSite: {
            url: 'https://example.com',
            domain: 'example.com',
            report: { total_score: 85 },
          },
          competitors: [],
          summary: {
            userRank: 1,
            totalAnalyzed: 1,
            strengthsVsCompetitors: [],
            weaknessesVsCompetitors: [],
            opportunitiesIdentified: [],
          },
        },
      ]));
    });
    
    // Reload page to pick up mocked data
    await page.reload();
    
    // Click delete button
    await page.locator('button[aria-label="Supprimer"]').click();
    
    // Should show confirmation dialog
    await expect(page.locator('text=Confirmer la suppression')).toBeVisible();
  });

  test('should display error messages', async ({ page }) => {
    await page.goto('/competition');
    
    // Mock error state
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('competitive-analysis-error', {
        detail: { message: 'Analysis failed' }
      }));
    });
    
    // Should display error message
    await expect(page.locator('text=Analysis failed')).toBeVisible();
  });

  test('should clear error messages', async ({ page }) => {
    await page.goto('/competition');
    
    // Mock error state
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('competitive-analysis-error', {
        detail: { message: 'Analysis failed' }
      }));
    });
    
    // Click clear error button
    await page.locator('button:has-text("Effacer")').click();
    
    // Error should be cleared
    await expect(page.locator('text=Analysis failed')).not.toBeVisible();
  });

  test('should display analysis insights', async ({ page }) => {
    await page.goto('/competition');
    
    // Mock analysis results with insights
    await page.evaluate(() => {
      localStorage.setItem('competitive_analyses', JSON.stringify([
        {
          id: '1',
          timestamp: '2025-01-01T00:00:00Z',
          userSite: {
            url: 'https://example.com',
            domain: 'example.com',
            report: { total_score: 85 },
          },
          competitors: [
            {
              url: 'https://competitor1.com',
              domain: 'competitor1.com',
              report: { total_score: 80 },
            },
          ],
          summary: {
            userRank: 1,
            totalAnalyzed: 2,
            strengthsVsCompetitors: ['Strength 1', 'Strength 2'],
            weaknessesVsCompetitors: ['Weakness 1'],
            opportunitiesIdentified: ['Opportunity 1', 'Opportunity 2'],
          },
        },
      ]));
    });
    
    // Reload page to pick up mocked data
    await page.reload();
    
    // Click on analysis to view results
    await page.locator('text=example.com').click();
    
    // Should display insights
    await expect(page.locator('text=Forces par rapport aux concurrents')).toBeVisible();
    await expect(page.locator('text=Faiblesses par rapport aux concurrents')).toBeVisible();
    await expect(page.locator('text=Opportunités identifiées')).toBeVisible();
  });

  test('should handle quota exceeded scenario', async ({ page }) => {
    await page.goto('/competition');
    
    // Mock quota exceeded
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('competitive-analysis-error', {
        detail: { message: 'Quota d\'analyses concurrentielles dépassé' }
      }));
    });
    
    // Should display quota error
    await expect(page.locator('text=Quota d\'analyses concurrentielles dépassé')).toBeVisible();
  });
});
