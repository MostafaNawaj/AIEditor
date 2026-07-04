import 'dotenv/config';

export const config = {
  ai: {
    apiUrl: process.env.AI_API_URL || 'https://api.openai.com/v1/chat/completions',
    apiKey: process.env.AI_API_KEY || '',
    model: process.env.AI_MODEL || 'gpt-4o-mini',
  },
  embedding: {
    apiUrl: process.env.EMBEDDING_API_URL || 'https://api.openai.com/v1/embeddings',
    model: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
  },
  editor: {
    fontSize: 14,
    tabSize: 2,
    theme: 'vs-dark',
  },
};
