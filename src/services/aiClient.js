import { buildSystemPrompt } from './promptBuilder.js';

export class AiClient {
  constructor() {
    this.apiUrl = process.env.AI_API_URL || 'https://api.openai.com/v1/chat/completions';
    this.apiKey = process.env.AI_API_KEY || '';
    this.model = process.env.AI_MODEL || 'gpt-4o-mini';
  }

  async chat(messages, context = '') {
    if (!this.apiKey || this.apiKey === 'your-api-key-here') {
      return this.mockResponse(messages);
    }

    const systemPrompt = buildSystemPrompt(context);
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`AI API error (${response.status}): ${err}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }

  async streamChat(messages, context, onChunk) {
    if (!this.apiKey || this.apiKey === 'your-api-key-here') {
      const mock = this.mockResponse(messages);
      onChunk(mock);
      return mock;
    }

    const systemPrompt = buildSystemPrompt(context);
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        temperature: 0.3,
        stream: true,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`AI API error (${response.status}): ${err}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let full = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = decoder.decode(value);
      const lines = text.split('\n').filter((l) => l.startsWith('data: '));

      for (const line of lines) {
        const payload = line.slice(6);
        if (payload === '[DONE]') continue;
        try {
          const json = JSON.parse(payload);
          const delta = json.choices?.[0]?.delta?.content || '';
          if (delta) {
            full += delta;
            onChunk(delta);
          }
        } catch {
          // skip malformed chunks
        }
      }
    }

    return full;
  }

  mockResponse(messages) {
    const last = messages[messages.length - 1]?.content || '';
    return (
      `**AIEditor (demo mode)**\n\n` +
      `No API key configured. Copy \`.env.example\` to \`.env\` and set \`AI_API_KEY\`.\n\n` +
      `You asked: "${last.slice(0, 200)}${last.length > 200 ? '...' : ''}"\n\n` +
      `Once configured, I'll help you write, debug, and refactor code with full project context.`
    );
  }
}
