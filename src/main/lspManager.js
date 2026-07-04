/**
 * LSP manager stub — full integration planned for advanced phase.
 */
export class LspManager {
  constructor() {
    this.servers = new Map();
  }

  async startServer(language, rootPath) {
    // Placeholder: wire up language servers per language
    this.servers.set(language, { rootPath, status: 'stub' });
    return { language, status: 'stub' };
  }

  async stopServer(language) {
    this.servers.delete(language);
  }

  getStatus(language) {
    return this.servers.get(language) || null;
  }
}

export const lspManager = new LspManager();
