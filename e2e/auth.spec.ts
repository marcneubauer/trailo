import { test, expect } from '@playwright/test';
import { uniqueUser, registerUser, loginUser } from './helpers';

test.describe('Authentication', () => {
  test('register a new account', async ({ page }) => {
    const user = uniqueUser();
    await page.goto('/register', { waitUntil: 'networkidle' });
    await page.getByLabel('Email').fill(user.email);
    await page.getByLabel('Username').fill(user.username);
    await page.getByLabel('Password').fill(user.password);
    await page.getByRole('button', { name: 'Create account' }).click();

    await page.waitForURL('/boards', { waitUntil: 'load' });
    await expect(page.getByText(user.username)).toBeVisible();
    await expect(page.getByText('Your Boards')).toBeVisible();
  });

  test('log out and log back in', async ({ page }) => {
    const user = await registerUser(page);

    // Log out (uses window.location.href)
    await page.getByRole('button', { name: 'Log out' }).click();
    await page.waitForURL('/login', { waitUntil: 'load' });

    // Log back in
    await loginUser(page, user);
    await expect(page.getByText(user.username)).toBeVisible();
  });

  test('access protected page without auth redirects to login', async ({ page }) => {
    await page.goto('/boards');
    await page.waitForURL('/login');
    await expect(page.getByText('Sign in to KanBang')).toBeVisible();
  });

  test('register with duplicate email shows error', async ({ page }) => {
    const user = await registerUser(page);

    // Log out
    await page.getByRole('button', { name: 'Log out' }).click();
    await page.waitForURL('/login', { waitUntil: 'load' });

    // Try to register with the same email
    await page.goto('/register', { waitUntil: 'networkidle' });
    await page.getByLabel('Email').fill(user.email);
    await page.getByLabel('Username').fill('different-user');
    await page.getByLabel('Password').fill(user.password);
    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page.getByText(/already/i)).toBeVisible();
  });

  test('login with wrong password shows error', async ({ page }) => {
    const user = await registerUser(page);

    // Log out
    await page.getByRole('button', { name: 'Log out' }).click();
    await page.waitForURL('/login', { waitUntil: 'load' });

    // Try wrong password
    await page.getByLabel('Email').fill(user.email);
    await page.getByLabel('Password').fill('WrongPassword123!');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();

    await expect(page.locator('.error')).toBeVisible();
  });
});
