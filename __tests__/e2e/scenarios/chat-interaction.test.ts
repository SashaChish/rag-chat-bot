import { test, expect } from '@playwright/test';
import path from 'path';

const fixturesDir = path.join(__dirname, '../../fixtures');

test.describe('Chat Interaction', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    const fileInput = page.locator('input[type="file"]');
    const sampleFile = path.join(fixturesDir, 'ai.txt');

    await fileInput.setInputFiles(sampleFile);

    await expect(page.locator('[data-testid="upload-success"]')).toBeVisible({ timeout: 30000 });
  });

  test('should send a basic query and receive response', async ({ page }) => {
    const chatInput = page.locator('textarea[placeholder*="Ask"]');
    await chatInput.fill('What is this document about?');

    const sendButton = page.locator('button:has-text("Send")');
    await sendButton.click();

    const response = page.locator('[data-testid="chat-response"]').last();
    await expect(response).toBeVisible({ timeout: 30000 });

    const responseText = await response.textContent();
    expect(responseText?.length).toBeGreaterThan(10);
  });

  test('should show streaming indicator during response', async ({ page }) => {
    const chatInput = page.locator('textarea[placeholder*="Ask"]');
    await chatInput.fill('Tell me about artificial intelligence');

    const sendButton = page.locator('button:has-text("Send")');
    await sendButton.click();

    const streamingIndicator = page.locator('[data-testid="streaming-indicator"]');
    await expect(streamingIndicator).toBeVisible({ timeout: 5000 });

    await expect(streamingIndicator).not.toBeVisible({ timeout: 30000 });
  });

  test('should display sources with citations', async ({ page }) => {
    const chatInput = page.locator('textarea[placeholder*="Ask"]');
    await chatInput.fill('What does the document say?');

    const sendButton = page.locator('button:has-text("Send")');
    await sendButton.click();

    const sourcesSection = page.locator('[data-testid="sources-section"]');
    await expect(sourcesSection).toBeVisible({ timeout: 30000 });

    const sourceItem = page.locator('[data-testid="source-item"]');
    await expect(sourceItem.first()).toBeVisible();

    const sourceFilename = sourceItem.locator('.sourceFilename, [class*="sourceFilename"]').first();
    const filenameText = await sourceFilename.textContent();
    expect(filenameText).toContain('ai.txt');
  });

  test('should maintain conversation history', async ({ page }) => {
    const chatInput = page.locator('textarea[placeholder*="Ask"]');
    const sendButton = page.locator('button:has-text("Send")');

    await chatInput.fill('What is artificial intelligence?');
    await sendButton.click();

    const firstResponse = page.locator('[data-testid="chat-response"]').first();
    await expect(firstResponse).toBeVisible({ timeout: 30000 });

    await chatInput.fill('Can you tell me more about it?');
    await sendButton.click();

    const responses = page.locator('[data-testid="chat-response"]');
    await expect(responses).toHaveCount(2, { timeout: 30000 });

    const secondResponse = responses.last();
    await expect(secondResponse).toBeVisible();
  });

  test('should show error for input less than 5 characters', async ({ page }) => {
    const chatInput = page.locator('textarea[placeholder*="Ask"]');
    await chatInput.fill('Hi');

    const sendButton = page.locator('button:has-text("Send")');
    await sendButton.click();

    const inputError = page.locator('[data-testid="input-error"]');
    await expect(inputError).toBeVisible();
    await expect(inputError).toContainText('5 characters');
  });

  test('should disable send button when input is empty', async ({ page }) => {
    const chatInput = page.locator('textarea[placeholder*="Ask"]');
    await chatInput.fill('');

    const sendButton = page.locator('button:has-text("Send")');
    await expect(sendButton).toBeDisabled();
  });

  test('should clear chat with confirmation', async ({ page }) => {
    const chatInput = page.locator('textarea[placeholder*="Ask"]');
    const sendButton = page.locator('button:has-text("Send")');

    await chatInput.fill('What is AI?');
    await sendButton.click();

    const response = page.locator('[data-testid="chat-response"]').first();
    await expect(response).toBeVisible({ timeout: 30000 });

    const clearChatButton = page.locator('[data-testid="clear-chat-button"]');
    await expect(clearChatButton).toBeVisible();
    await clearChatButton.click();

    const confirmButton = page.locator('button:has-text("Clear Chat")').last();
    await expect(confirmButton).toBeVisible();
    await confirmButton.click();

    const messages = page.locator('[data-testid="chat-response"]');
    await expect(messages).toHaveCount(0);
  });

  test('should cancel clear chat', async ({ page }) => {
    const chatInput = page.locator('textarea[placeholder*="Ask"]');
    const sendButton = page.locator('button:has-text("Send")');

    await chatInput.fill('Tell me about AI');
    await sendButton.click();

    const response = page.locator('[data-testid="chat-response"]').first();
    await expect(response).toBeVisible({ timeout: 30000 });

    const clearChatButton = page.locator('[data-testid="clear-chat-button"]');
    await clearChatButton.click();

    const cancelButton = page.locator('button:has-text("Cancel")').last();
    await cancelButton.click();

    const messages = page.locator('[data-testid="chat-response"]');
    await expect(messages).toHaveCount(1);
  });

  test('should send message with Enter key', async ({ page }) => {
    const chatInput = page.locator('textarea[placeholder*="Ask"]');
    await chatInput.fill('What is machine learning?');
    await chatInput.press('Enter');

    const response = page.locator('[data-testid="chat-response"]').last();
    await expect(response).toBeVisible({ timeout: 30000 });
  });

  test('should not send message with Shift+Enter', async ({ page }) => {
    const chatInput = page.locator('textarea[placeholder*="Ask"]');
    await chatInput.fill('Test message');
    await chatInput.press('Shift+Enter');

    const responses = page.locator('[data-testid="chat-response"]');
    await expect(responses).toHaveCount(0);
  });
});

test.describe('Chat - Empty Document State', () => {
  test('should show empty state when no documents uploaded', async ({ page }) => {
    await page.goto('/');

    const emptyState = page.locator('text=No messages yet');
    await expect(emptyState).toBeVisible();
  });

  test('should handle query without documents', async ({ page }) => {
    await page.goto('/');

    const chatInput = page.locator('textarea[placeholder*="Ask"]');
    await chatInput.fill('What is in the documents?');

    const sendButton = page.locator('button:has-text("Send")');
    await sendButton.click();

    const response = page.locator('[data-testid="chat-response"]').last();
    await expect(response).toBeVisible({ timeout: 30000 });
  });
});
