import { test, expect } from '@playwright/test';
import path from 'path';

const fixturesDir = path.join(__dirname, '../../fixtures');

test.describe('Streaming Response', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    const fileInput = page.locator('input[type="file"]');
    const sampleFile = path.join(fixturesDir, 'stream-test.txt');

    await fileInput.setInputFiles(sampleFile);

    await expect(page.locator('[data-testid="upload-success"]')).toBeVisible({ timeout: 30000 });
  });

  test('should stream chat response progressively', async ({ page }) => {
    const chatInput = page.locator('textarea[placeholder*="Ask"]');
    await chatInput.fill('Tell me about streaming responses');

    const sendButton = page.locator('button:has-text("Send")');
    await sendButton.click();

    const responseContainer = page.locator('[data-testid="chat-response"]').last();

    const streamingIndicator = page.locator('[data-testid="streaming-indicator"]');
    await expect(streamingIndicator).toBeVisible({ timeout: 5000 });

    const contentSnapshots: number[] = [];

    for (let i = 0; i < 3; i++) {
      await page.waitForTimeout(100);
      const content = await responseContainer.textContent();
      contentSnapshots.push(content?.length || 0);
    }

    let hasProgressed = false;
    for (let i = 1; i < contentSnapshots.length; i++) {
      if (contentSnapshots[i] > contentSnapshots[i - 1]) {
        hasProgressed = true;
        break;
      }
    }
    expect(hasProgressed).toBe(true);

    await expect(streamingIndicator).not.toBeVisible({ timeout: 30000 });

    const finalContent = await responseContainer.textContent();
    expect(finalContent?.length).toBeGreaterThan(10);
  });

  test('should show Thinking indicator during streaming', async ({ page }) => {
    const chatInput = page.locator('textarea[placeholder*="Ask"]');
    await chatInput.fill('What is this document about?');

    const sendButton = page.locator('button:has-text("Send")');
    await sendButton.click();

    const streamingIndicator = page.locator('[data-testid="streaming-indicator"]');
    await expect(streamingIndicator).toBeVisible({ timeout: 5000 });
    await expect(streamingIndicator).toContainText('Thinking');

    await expect(streamingIndicator).not.toBeVisible({ timeout: 30000 });
  });

  test('should complete response after streaming ends', async ({ page }) => {
    const chatInput = page.locator('textarea[placeholder*="Ask"]');
    await chatInput.fill('Summarize the content');

    const sendButton = page.locator('button:has-text("Send")');
    await sendButton.click();

    const responseContainer = page.locator('[data-testid="chat-response"]').last();

    const streamingIndicator = page.locator('[data-testid="streaming-indicator"]');
    await expect(streamingIndicator).not.toBeVisible({ timeout: 30000 });

    const finalContent = await responseContainer.textContent();
    expect(finalContent?.length).toBeGreaterThan(10);

    const lastWord = finalContent?.trim().split(' ').pop();
    expect(lastWord).toBeDefined();
    expect(lastWord?.length).toBeGreaterThan(0);
  });

  test('should disable input during streaming', async ({ page }) => {
    const chatInput = page.locator('textarea[placeholder*="Ask"]');
    await chatInput.fill('Tell me about the document');

    const sendButton = page.locator('button:has-text("Send")');
    await sendButton.click();

    await expect(chatInput).toBeDisabled({ timeout: 1000 });

    const streamingIndicator = page.locator('[data-testid="streaming-indicator"]');
    await expect(streamingIndicator).not.toBeVisible({ timeout: 30000 });

    await expect(chatInput).not.toBeDisabled();
  });

  test('should update button text during streaming', async ({ page }) => {
    const chatInput = page.locator('textarea[placeholder*="Ask"]');
    await chatInput.fill('What is streaming?');

    const sendButton = page.locator('button:has-text("Send")');
    await sendButton.click();

    await expect(sendButton).toContainText('Sending...', { timeout: 1000 });
    expect(await sendButton.isDisabled()).toBe(true);

    const streamingIndicator = page.locator('[data-testid="streaming-indicator"]');
    await expect(streamingIndicator).not.toBeVisible({ timeout: 30000 });

    await expect(sendButton).toContainText('Send');
    expect(await sendButton.isDisabled()).toBe(false);
  });

  test('should handle multiple sequential streaming queries', async ({ page }) => {
    const chatInput = page.locator('textarea[placeholder*="Ask"]');
    const sendButton = page.locator('button:has-text("Send")');

    await chatInput.fill('First question about the document');
    await sendButton.click();

    const firstResponse = page.locator('[data-testid="chat-response"]').first();
    await expect(firstResponse).toBeVisible({ timeout: 30000 });

    await chatInput.fill('Second follow-up question');
    await sendButton.click();

    const responses = page.locator('[data-testid="chat-response"]');
    await expect(responses).toHaveCount(2, { timeout: 30000 });

    const secondResponse = responses.last();
    const content = await secondResponse.textContent();
    expect(content?.length).toBeGreaterThan(5);
  });
});

test.describe('Streaming Response - Error Handling', () => {
  test('should handle streaming errors gracefully', async ({ page }) => {
    await page.goto('/');

    const chatInput = page.locator('textarea[placeholder*="Ask"]');
    await chatInput.fill('Test query without documents');

    const sendButton = page.locator('button:has-text("Send")');
    await sendButton.click();

    const response = page.locator('[data-testid="chat-response"]').last();
    await expect(response).toBeVisible({ timeout: 30000 });

    const content = await response.textContent();
    expect(content?.length).toBeGreaterThan(0);
  });

  test('should recover from streaming interruption', async ({ page }) => {
    await page.goto('/');

    const fileInput = page.locator('input[type="file"]');
    const sampleFile = path.join(fixturesDir, 'test.txt');

    await fileInput.setInputFiles(sampleFile);

    await expect(page.locator('[data-testid="upload-success"]')).toBeVisible({ timeout: 30000 });

    const chatInput = page.locator('textarea[placeholder*="Ask"]');
    await chatInput.fill('What is this about?');

    const sendButton = page.locator('button:has-text("Send")');
    await sendButton.click();

    const response = page.locator('[data-testid="chat-response"]').last();
    await expect(response).toBeVisible({ timeout: 30000 });

    await chatInput.fill('Another question');
    await sendButton.click();

    const responses = page.locator('[data-testid="chat-response"]');
    await expect(responses).toHaveCount(2, { timeout: 30000 });
  });
});
