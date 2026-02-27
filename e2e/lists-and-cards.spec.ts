import { test, expect } from '@playwright/test';
import { registerUser, createBoard } from './helpers';

test.describe('Lists and Cards', () => {
  test.beforeEach(async ({ page }) => {
    await registerUser(page);
    await createBoard(page, 'Test Board');
    await page.getByText('Test Board').click();
    await page.waitForURL(/\/boards\//);
  });

  test('add a list to a board', async ({ page }) => {
    await page.getByText('+ Add another list').click();
    await page.getByPlaceholder('Enter list name...').fill('To Do');
    await page.getByRole('button', { name: 'Add List' }).click();

    await expect(page.locator('.list-name', { hasText: 'To Do' })).toBeVisible();
  });

  test('add multiple lists', async ({ page }) => {
    // Add first list
    await page.getByText('+ Add another list').click();
    await page.getByPlaceholder('Enter list name...').fill('To Do');
    await page.getByRole('button', { name: 'Add List' }).click();
    await expect(page.locator('.list-name', { hasText: 'To Do' })).toBeVisible();

    // Form stays open after adding, just type the next name
    await page.getByPlaceholder('Enter list name...').fill('In Progress');
    await page.getByRole('button', { name: 'Add List' }).click();
    await expect(page.locator('.list-name', { hasText: 'In Progress' })).toBeVisible();

    await expect(page.locator('.list-column')).toHaveCount(2);
  });

  test('rename a list', async ({ page }) => {
    // Create list
    await page.getByText('+ Add another list').click();
    await page.getByPlaceholder('Enter list name...').fill('Old List');
    await page.getByRole('button', { name: 'Add List' }).click();

    // Double-click to edit
    await page.locator('.list-name', { hasText: 'Old List' }).dblclick();
    const input = page.locator('.list-name-input');
    await input.clear();
    await input.fill('Renamed List');
    await input.press('Enter');

    await expect(page.locator('.list-name', { hasText: 'Renamed List' })).toBeVisible();
  });

  test('delete a list', async ({ page }) => {
    // Create list
    await page.getByText('+ Add another list').click();
    await page.getByPlaceholder('Enter list name...').fill('Remove Me');
    await page.getByRole('button', { name: 'Add List' }).click();

    page.on('dialog', (dialog) => dialog.accept());
    await page.getByLabel('Delete list').click({ force: true });

    await expect(page.locator('.list-column')).toHaveCount(0);
  });

  test('add a card to a list', async ({ page }) => {
    // Create list
    await page.getByText('+ Add another list').click();
    await page.getByPlaceholder('Enter list name...').fill('My List');
    await page.getByRole('button', { name: 'Add List' }).click();

    // Add card
    await page.getByText('+ Add a card').click();
    await page.getByPlaceholder('Enter a title for this card...').fill('My First Card');
    await page.getByRole('button', { name: 'Add Card' }).click();

    await expect(page.locator('.card-title', { hasText: 'My First Card' })).toBeVisible();
  });

  test('add multiple cards to a list', async ({ page }) => {
    // Create list
    await page.getByText('+ Add another list').click();
    await page.getByPlaceholder('Enter list name...').fill('Tasks');
    await page.getByRole('button', { name: 'Add List' }).click();

    // Add cards
    await page.getByText('+ Add a card').click();
    await page.getByPlaceholder('Enter a title for this card...').fill('Card A');
    await page.getByRole('button', { name: 'Add Card' }).click();
    await expect(page.locator('.card-title', { hasText: 'Card A' })).toBeVisible();

    // Form stays open after adding, just type the next title
    await page.getByPlaceholder('Enter a title for this card...').fill('Card B');
    await page.getByRole('button', { name: 'Add Card' }).click();
    await expect(page.locator('.card-title', { hasText: 'Card B' })).toBeVisible();

    await expect(page.locator('.card-item')).toHaveCount(2);
  });

  test('edit a card title', async ({ page }) => {
    // Create list + card
    await page.getByText('+ Add another list').click();
    await page.getByPlaceholder('Enter list name...').fill('Tasks');
    await page.getByRole('button', { name: 'Add List' }).click();

    await page.getByText('+ Add a card').click();
    await page.getByPlaceholder('Enter a title for this card...').fill('Original Title');
    await page.getByRole('button', { name: 'Add Card' }).click();

    // Double-click to edit
    await page.locator('.card-title', { hasText: 'Original Title' }).dblclick();
    const input = page.locator('.card-title-input');
    await input.clear();
    await input.fill('Updated Title');
    await input.press('Enter');

    await expect(page.locator('.card-title', { hasText: 'Updated Title' })).toBeVisible();
  });

  test('delete a card', async ({ page }) => {
    // Create list + card
    await page.getByText('+ Add another list').click();
    await page.getByPlaceholder('Enter list name...').fill('Tasks');
    await page.getByRole('button', { name: 'Add List' }).click();

    await page.getByText('+ Add a card').click();
    await page.getByPlaceholder('Enter a title for this card...').fill('Delete Me');
    await page.getByRole('button', { name: 'Add Card' }).click();

    await page.locator('.card-item', { hasText: 'Delete Me' }).locator('.card-delete').click({
      force: true,
    });

    await expect(page.locator('.card-item')).toHaveCount(0);
  });

  test('data persists after page reload', async ({ page }) => {
    // Create list + card
    await page.getByText('+ Add another list').click();
    await page.getByPlaceholder('Enter list name...').fill('Persistent List');
    await page.getByRole('button', { name: 'Add List' }).click();

    await page.getByText('+ Add a card').click();
    await page.getByPlaceholder('Enter a title for this card...').fill('Persistent Card');
    await page.getByRole('button', { name: 'Add Card' }).click();

    // Reload and verify
    await page.reload();

    await expect(page.locator('.list-name', { hasText: 'Persistent List' })).toBeVisible();
    await expect(page.locator('.card-title', { hasText: 'Persistent Card' })).toBeVisible();
  });
});
