import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const fixturesDir = path.join(__dirname, '../../fixtures');

test.describe('Document Upload Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should upload a single TXT file successfully', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    const sampleFile = path.join(fixturesDir, 'test.txt');

    await fileInput.setInputFiles(sampleFile);

    await expect(page.locator('[data-testid="upload-success"]')).toBeVisible({ timeout: 30000 });
    await expect(page.locator('text=Document uploaded successfully')).toBeVisible();

    await expect(page.locator('[data-testid="document-list"]')).toBeVisible();
    await expect(page.locator('text=test.txt')).toBeVisible();
  });

  test('should upload multiple files sequentially', async ({ page }) => {
    const files = ['doc1.txt', 'doc2.txt', 'doc3.txt'];
    const fileInput = page.locator('input[type="file"]');

    for (const file of files) {
      const filePath = path.join(fixturesDir, file);
      await fileInput.setInputFiles(filePath);

      await expect(page.locator('[data-testid="upload-success"]')).toBeVisible({ timeout: 30000 });
    }

    await expect(page.locator('[data-testid="document-list"]')).toBeVisible();

    for (const file of files) {
      await expect(page.locator(`text=${file}`)).toBeVisible();
    }
  });

  test('should show error for file exceeding size limit', async ({ page }) => {
    const largeFile = path.join(fixturesDir, 'large-test.txt');
    const elevenMB = 11 * 1024 * 1024;
    const content = 'x'.repeat(elevenMB);
    fs.writeFileSync(largeFile, content);

    try {
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(largeFile);

      await expect(page.locator('[data-testid="upload-error"]')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=File size exceeds')).toBeVisible();
    } finally {
      fs.unlinkSync(largeFile);
    }
  });

  test('should delete uploaded document', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    const sampleFile = path.join(fixturesDir, 'delete-test.txt');

    await fileInput.setInputFiles(sampleFile);

    await expect(page.locator('[data-testid="upload-success"]')).toBeVisible({ timeout: 30000 });
    await expect(page.locator('[data-testid="document-list"]')).toBeVisible();

    const deleteButton = page.locator('[data-testid="delete-document-button"]').first();
    await deleteButton.click();

    const confirmDeleteButton = page.locator('button:has-text("Delete")').last();
    await confirmDeleteButton.click();

    await expect(page.locator('text=delete-test.txt')).not.toBeVisible({ timeout: 5000 });
  });
});
