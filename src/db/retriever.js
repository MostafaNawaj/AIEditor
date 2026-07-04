import { generateEmbedding, cosineSimilarity } from './embeddings.js';

export class Retriever {
  constructor() {
    this.store = [];
  }

  async index(chunks) {
    for (const chunk of chunks) {
      const embedding = await generateEmbedding(chunk.content);
      this.store.push({ ...chunk, embedding });
    }
  }

  async search(query, topK = 5) {
    const queryEmb = await generateEmbedding(query);
    const scored = this.store.map((item) => ({
      ...item,
      score: cosineSimilarity(queryEmb, item.embedding),
    }));

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(({ embedding, ...rest }) => rest);
  }

  clear() {
    this.store = [];
  }
}
