import { test, expect } from '@playwright/test';
import path from 'path';

const fixturesDir = path.join(__dirname, '../../fixtures');

test.describe('Multi-Document Queries', () => {
  test('should upload multiple documents and query across them', async ({ page }) => {
    await page.goto('/');

    const fileInput = page.locator('input[type="file"]');

    const file1 = path.join(fixturesDir, 'doc1.txt');
    const file2 = path.join(fixturesDir, 'doc2.txt');
    const file3 = path.join(fixturesDir, 'doc3.txt');

    await fileInput.setInputFiles([file1, file2, file3]);

    const uploadButton = page.locator('button:has-text("Upload")');
    await uploadButton.click();

    await expect(page.locator('text=Documents uploaded successfully')).toBeVisible();

    const documentList = page.locator('[data-testid="document-list"]');
    await expect(documentList).toBeVisible();

    await expect(page.locator('text=doc1.txt')).toBeVisible();
    await expect(page.locator('text=doc2.txt')).toBeVisible();
    await expect(page.locator('text=doc3.txt')).toBeVisible();

    const chatInput = page.locator('textarea[placeholder*="Ask"]');
    await chatInput.fill('What do these documents say about AI and machine learning?');

    const sendButton = page.locator('button:has-text("Send")');
    await sendButton.click();

    await page.waitForTimeout(2000);

    const sourcesSection = page.locator('text=Sources');
    await expect(sourcesSection).toBeVisible();

    const sourcesList = page.locator('[data-testid="source-item"]');
    const sourceCount = await sourcesList.count();
    expect(sourceCount).toBeGreaterThan(0);

    const uniqueSources = new Set();
    for (let i = 0; i < sourceCount; i++) {
      const sourceText = await sourcesList.nth(i).textContent();
      if (sourceText) {
        if (sourceText.includes('doc1.txt')) uniqueSources.add('doc1.txt');
        if (sourceText.includes('doc2.txt')) uniqueSources.add('doc2.txt');
        if (sourceText.includes('doc3.txt')) uniqueSources.add('doc3.txt');
      }
    }

    expect(uniqueSources.size).toBeGreaterThan(1);
  });

  test('should query specific document from multiple uploads', async ({ page }) => {
    await page.goto('/');

    const fileInput = page.locator('input[type="file"]');

    const aiDoc = path.join(fixturesDir, 'ai.txt');
    const weatherDoc = path.join(fixturesDir, 'weather.txt');

    await fileInput.setInputFiles([aiDoc, weatherDoc]);

    const uploadButton = page.locator('button:has-text("Upload")');
    await uploadButton.click();

    await expect(page.locator('text=Documents uploaded successfully')).toBeVisible();

    const chatInput = page.locator('textarea[placeholder*="Ask"]');
    await chatInput.fill('What is artificial intelligence?');

    const sendButton = page.locator('button:has-text("Send")');
    await sendButton.click();

    await page.waitForTimeout(1500);

    const responseContainer = page.locator('[data-testid="chat-response"]').last();
    const responseText = await responseContainer.textContent();
    expect(responseText?.toLowerCase()).toContain('artificial intelligence');

    const aiSource = page.locator('text=ai.txt');
    await expect(aiSource).toBeVisible();

    const weatherSource = page.locator('text=weather.txt');
    const isWeatherSourceVisible = await weatherSource.isVisible().catch(() => false);
    expect(isWeatherSourceVisible).toBeFalsy();
  });
});
