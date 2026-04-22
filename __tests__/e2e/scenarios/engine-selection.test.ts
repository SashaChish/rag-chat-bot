import { test, expect } from '@playwright/test';
import path from 'path';

const fixturesDir = path.join(__dirname, '../../fixtures');

test.describe('Engine Selection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    const fileInput = page.locator('input[type="file"]');
    const sampleFile = path.join(fixturesDir, 'ai.txt');

    await fileInput.setInputFiles(sampleFile);

    await expect(page.locator('[data-testid="upload-success"]')).toBeVisible({ timeout: 30000 });
  });

  test('should have engine selector visible', async ({ page }) => {
    const engineSelector = page.locator('[data-testid="engine-selector"]');
    await expect(engineSelector).toBeVisible();
    await expect(engineSelector).not.toBeDisabled();
  });

  test('should select Condense Question engine by default', async ({ page }) => {
    const engineSelector = page.locator('[data-testid="engine-selector"]');
    await expect(engineSelector).toBeVisible();

    const description = page.locator('text=Condenses conversation history');
    await expect(description).toBeVisible();
  });

  test('should switch to Context Engine', async ({ page }) => {
    const engineSelector = page.locator('[data-testid="engine-selector"]');
    await engineSelector.click();

    const contextOption = page.locator('text=Context Engine').first();
    await contextOption.click();

    const description = page.locator('text=Retrieves relevant documents');
    await expect(description).toBeVisible();
  });

  test('should send query with Condense Question engine', async ({ page }) => {
    const description = page.locator('text=Condenses conversation history');
    await expect(description).toBeVisible();

    const chatInput = page.locator('textarea[placeholder*="Ask"]');
    await chatInput.fill('What is this document about?');

    const sendButton = page.locator('button:has-text("Send")');
    await sendButton.click();

    const response = page.locator('[data-testid="chat-response"]').last();
    await expect(response).toBeVisible({ timeout: 30000 });

    const responseText = await response.textContent();
    expect(responseText?.length).toBeGreaterThan(10);
  });

  test('should send query with Context Engine', async ({ page }) => {
    const engineSelector = page.locator('[data-testid="engine-selector"]');
    await engineSelector.click();

    const contextOption = page.locator('text=Context Engine').first();
    await contextOption.click();

    const chatInput = page.locator('textarea[placeholder*="Ask"]');
    await chatInput.fill('Summarize the content');

    const sendButton = page.locator('button:has-text("Send")');
    await sendButton.click();

    const response = page.locator('[data-testid="chat-response"]').last();
    await expect(response).toBeVisible({ timeout: 30000 });
  });

  test('should disable engine selector during streaming', async ({ page }) => {
    const chatInput = page.locator('textarea[placeholder*="Ask"]');
    await chatInput.fill('Tell me about the document');

    const sendButton = page.locator('button:has-text("Send")');
    await sendButton.click();

    const engineSelector = page.locator('[data-testid="engine-selector"]');
    await expect(engineSelector).toBeDisabled({ timeout: 1000 });

    await expect(page.locator('[data-testid="streaming-indicator"]')).not.toBeVisible({ timeout: 30000 });

    await expect(engineSelector).not.toBeDisabled();
  });

  test('should switch between engines mid-conversation', async ({ page }) => {
    const chatInput = page.locator('textarea[placeholder*="Ask"]');
    await chatInput.fill('What is this about?');

    const sendButton = page.locator('button:has-text("Send")');
    await sendButton.click();

    const response = page.locator('[data-testid="chat-response"]').last();
    await expect(response).toBeVisible({ timeout: 30000 });

    const engineSelector = page.locator('[data-testid="engine-selector"]');
    await engineSelector.click();

    const contextOption = page.locator('text=Context Engine').first();
    await contextOption.click();

    const contextDescription = page.locator('text=Retrieves relevant documents');
    await expect(contextDescription).toBeVisible();

    await chatInput.fill('Can you elaborate?');
    await sendButton.click();

    const secondResponse = page.locator('[data-testid="chat-response"]').last();
    await expect(secondResponse).toBeVisible({ timeout: 30000 });
  });
});
