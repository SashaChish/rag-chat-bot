import { test, expect } from '@playwright/test';
import path from 'path';

const fixturesDir = path.join(__dirname, '../../fixtures');

test.describe('Upload and Query Flow', () => {
  test('should upload document and query successfully', async ({ page }) => {
    await page.goto('/');

    const fileInput = page.locator('input[type="file"]');
    const sampleFile = path.join(fixturesDir, 'test.txt');

    await fileInput.setInputFiles(sampleFile);

    const uploadButton = page.locator('button:has-text("Upload")');
    await uploadButton.click();

    await expect(page.locator('text=Document uploaded successfully')).toBeVisible();

    const chatInput = page.locator('textarea[placeholder*="Ask"]');
    await chatInput.fill('What does this document contain?');

    const sendButton = page.locator('button:has-text("Send")');
    await sendButton.click();

    await expect(page.locator('text=Sample document content')).toBeVisible();

    const sourcesSection = page.locator('text=Sources');
    await expect(sourcesSection).toBeVisible();

    const documentSource = page.locator('text=test.txt');
    await expect(documentSource).toBeVisible();
  });

  test('should delete uploaded document', async ({ page }) => {
    await page.goto('/');

    const fileInput = page.locator('input[type="file"]');
    const sampleFile = path.join(fixturesDir, 'delete-test.txt');

    await fileInput.setInputFiles(sampleFile);
    const uploadButton = page.locator('button:has-text("Upload")');
    await uploadButton.click();

    await expect(page.locator('text=Document uploaded successfully')).toBeVisible();

    const documentList = page.locator('[data-testid="document-list"]');
    await expect(documentList).toBeVisible();

    const deleteButton = page.locator('button[aria-label*="Delete"]').first();
    await deleteButton.click();

    await expect(page.locator('text=Document deleted successfully')).toBeVisible();

    await expect(page.locator('text=delete-test.txt')).not.toBeVisible();
  });
});
