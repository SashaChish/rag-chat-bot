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

  test('should have all engine options available', async ({ page }) => {
    const engineSelector = page.locator('[data-testid="engine-selector"]');

    await expect(engineSelector.locator('option[value="condense"]')).toHaveText('Condense Question');
    await expect(engineSelector.locator('option[value="context"]')).toHaveText('Context Engine');
    await expect(engineSelector.locator('option[value="react"]')).toHaveText('ReAct Agent');
    await expect(engineSelector.locator('option[value="openai"]')).toHaveText('OpenAI Agent');
  });

  test('should select Condense Question engine by default', async ({ page }) => {
    const engineSelector = page.locator('[data-testid="engine-selector"]');
    await expect(engineSelector).toHaveValue('condense');
  });

  test('should switch to Context Engine', async ({ page }) => {
    const engineSelector = page.locator('[data-testid="engine-selector"]');
    await engineSelector.selectOption('context');

    await expect(engineSelector).toHaveValue('context');

    const description = page.locator('text=Retrieves relevant documents');
    await expect(description).toBeVisible();
  });

  test('should switch to ReAct Agent', async ({ page }) => {
    const engineSelector = page.locator('[data-testid="engine-selector"]');
    await engineSelector.selectOption('react');

    await expect(engineSelector).toHaveValue('react');

    const description = page.locator('text=ReAct Agent uses reasoning');
    await expect(description).toBeVisible();
  });

  test('should switch to OpenAI Agent', async ({ page }) => {
    const engineSelector = page.locator('[data-testid="engine-selector"]');
    await engineSelector.selectOption('openai');

    await expect(engineSelector).toHaveValue('openai');

    const description = page.locator('text=OpenAI Agent uses function calling');
    await expect(description).toBeVisible();
  });

  test('should send query with Condense Question engine', async ({ page }) => {
    const engineSelector = page.locator('[data-testid="engine-selector"]');
    await expect(engineSelector).toHaveValue('condense');

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
    await engineSelector.selectOption('context');

    const chatInput = page.locator('textarea[placeholder*="Ask"]');
    await chatInput.fill('Summarize the content');

    const sendButton = page.locator('button:has-text("Send")');
    await sendButton.click();

    const response = page.locator('[data-testid="chat-response"]').last();
    await expect(response).toBeVisible({ timeout: 30000 });
  });

  test('should send query with ReAct Agent', async ({ page }) => {
    const engineSelector = page.locator('[data-testid="engine-selector"]');
    await engineSelector.selectOption('react');

    const chatInput = page.locator('textarea[placeholder*="Ask"]');
    await chatInput.fill('Tell me about AI');

    const sendButton = page.locator('button:has-text("Send")');
    await sendButton.click();

    const response = page.locator('[data-testid="chat-response"]').last();
    await expect(response).toBeVisible({ timeout: 30000 });
  });

  test('should send query with OpenAI Agent', async ({ page }) => {
    const engineSelector = page.locator('[data-testid="engine-selector"]');
    await engineSelector.selectOption('openai');

    const chatInput = page.locator('textarea[placeholder*="Ask"]');
    await chatInput.fill('What is artificial intelligence?');

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
    const engineSelector = page.locator('[data-testid="engine-selector"]');

    const chatInput = page.locator('textarea[placeholder*="Ask"]');
    await chatInput.fill('What is this about?');

    const sendButton = page.locator('button:has-text("Send")');
    await sendButton.click();

    const response = page.locator('[data-testid="chat-response"]').last();
    await expect(response).toBeVisible({ timeout: 30000 });

    await engineSelector.selectOption('context');
    await expect(engineSelector).toHaveValue('context');

    await chatInput.fill('Can you elaborate?');
    await sendButton.click();

    const secondResponse = page.locator('[data-testid="chat-response"]').last();
    await expect(secondResponse).toBeVisible({ timeout: 30000 });
  });
});
