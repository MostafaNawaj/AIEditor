import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ContextManager } from '../src/services/contextManager.js';
import { buildSystemPrompt } from '../src/services/promptBuilder.js';
import { AiClient } from '../src/services/aiClient.js';

describe('contextManager', () => {
  it('builds context from open file', () => {
    const cm = new ContextManager();
    const ctx = cm.buildContext({
      openFile: { path: '/app/main.js', content: 'console.log("hi")', language: 'javascript' },
      projectRoot: '/app',
    });
    assert.ok(ctx.includes('main.js'));
    assert.ok(ctx.includes('console.log'));
  });
});

describe('promptBuilder', () => {
  it('includes context in system prompt', () => {
    const prompt = buildSystemPrompt('file: test.js');
    assert.ok(prompt.includes('test.js'));
    assert.ok(prompt.includes('AIEditor'));
  });
});

describe('aiClient', () => {
  it('returns mock response without API key', async () => {
    const client = new AiClient();
    client.apiKey = '';
    const response = await client.chat([{ role: 'user', content: 'Hello' }]);
    assert.ok(response.includes('demo mode'));
  });
});
