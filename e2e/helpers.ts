import { type Page } from '@playwright/test';
import crypto from 'node:crypto';

export function uniqueUser() {
  const id = crypto.randomUUID().slice(0, 8);
  return {
    email: `test-${id}@example.com`,
    username: `user${id}`,
    password: 'TestPassword123!',
  };
}

export async function registerUser(page: Page, user?: ReturnType<typeof uniqueUser>) {
  const u = user ?? uniqueUser();
  await page.goto('/register', { waitUntil: 'networkidle' });
  await page.getByLabel('Email').fill(u.email);
  await page.getByLabel('Username').fill(u.username);
  await page.getByLabel('Password').fill(u.password);
  await page.getByRole('button', { name: 'Create account' }).click();
  // Auth redirects use window.location.href (full page load), so wait for networkidle
  await page.waitForURL('/boards', { waitUntil: 'load' });
  return u;
}

export async function loginUser(page: Page, user: ReturnType<typeof uniqueUser>) {
  await page.goto('/login', { waitUntil: 'networkidle' });
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password').fill(user.password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL('/boards', { waitUntil: 'load' });
}

export async function createBoard(page: Page, name: string) {
  await page.getByRole('button', { name: '+ Create Board' }).click();
  await page.getByPlaceholder('Board name').fill(name);
  await page.getByRole('button', { name: 'Create', exact: true }).click();
  // Wait for board card to appear
  await page.getByText(name).waitFor();
}
