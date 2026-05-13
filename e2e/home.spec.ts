import { test, expect } from '@playwright/test';

test('homepage has title and login link', async ({ page }) => {
  await page.goto('/');

  // Verify heading
  await expect(page.locator('h1')).toHaveText('Welcome to SkillzHub');

  // Verify description
  await expect(page.locator('p').first()).toContainText('The C2B marketplace for skilled GoPro and FPV footage');

  // Verify login link exists and points to correct route
  const loginLink = page.getByRole('link', { name: 'Login / Sign Up' });
  await expect(loginLink).toBeVisible();
  await expect(loginLink).toHaveAttribute('href', '/api/auth/signin');
});
