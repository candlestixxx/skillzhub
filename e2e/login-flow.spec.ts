import { test, expect } from '@playwright/test';

test.describe('Authentication Flows', () => {
  test('User can navigate to login page and see the signin form', async ({ page }) => {
    await page.goto('/');

    // Click the login link in the header
    const loginLink = page.getByRole('link', { name: 'Login / Sign Up' });
    await expect(loginLink).toBeVisible();
    await loginLink.click();

    // Check we landed on the login/signup API endpoint path
    await expect(page).toHaveURL(/.*\/api\/auth\/signin/);

  });
});
