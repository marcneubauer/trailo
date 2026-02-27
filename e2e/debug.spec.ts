import { test, expect } from '@playwright/test';

test('debug register flow', async ({ page, context }) => {
  await page.goto('/register');
  await page.waitForTimeout(1000);

  await page.getByLabel('Email').fill('debug2@example.com');
  await page.getByLabel('Username').fill('debuguser2');
  await page.getByLabel('Password').fill('TestPassword123!');
  await page.getByRole('button', { name: 'Create account' }).click();

  await page.waitForURL('/boards');
  console.log('=== AFTER goto /boards ===');
  console.log('URL:', page.url());
  const cookies1 = await context.cookies();
  console.log('COOKIES:', cookies1.map((c) => c.name).join(', '));
  const html1 = await page.locator('body').innerHTML();
  console.log('HAS NAV:', html1.includes('nav-brand'));
  console.log('HAS USERNAME:', html1.includes('debuguser2'));

  // Now hard reload
  await page.reload();
  await page.waitForTimeout(1000);
  console.log('=== AFTER HARD RELOAD ===');
  console.log('URL:', page.url());
  const html2 = await page.locator('body').innerHTML();
  console.log('HAS NAV:', html2.includes('nav-brand'));
  console.log('HAS USERNAME:', html2.includes('debuguser2'));

  // Check if nav text is visible
  const navUser = page.locator('.nav-user');
  const navExists = await navUser.count();
  console.log('NAV USER ELEMENTS:', navExists);
  if (navExists > 0) {
    console.log('NAV USER TEXT:', await navUser.textContent());
  }
});
