import { EventEmitter } from 'events';

const MAX_ENTRIES = 500;

class RuntimeLog extends EventEmitter {
  constructor() {
    super();
    this.entries = [];
  }

  append(entry) {
    const record = {
      ts: Date.now(),
      level: entry.level || 'info',
      source: entry.source || 'app',
      message: entry.message || '',
      data: entry.data ?? null,
    };
    this.entries.push(record);
    if (this.entries.length > MAX_ENTRIES) {
      this.entries.splice(0, this.entries.length - MAX_ENTRIES);
    }
    this.emit('entry', record);
    return record;
  }

  info(source, message, data) {
    return this.append({ level: 'info', source, message, data });
  }

  warn(source, message, data) {
    return this.append({ level: 'warn', source, message, data });
  }

  error(source, message, data) {
    return this.append({ level: 'error', source, message, data });
  }

  getRecent(limit = 100) {
    return this.entries.slice(-limit);
  }

  toContextString(limit = 80) {
    const lines = this.getRecent(limit).map((e) => {
      const time = new Date(e.ts).toISOString().slice(11, 19);
      const extra = e.data ? ` ${JSON.stringify(e.data)}` : '';
      return `[${time}] ${e.level.toUpperCase()} ${e.source}: ${e.message}${extra}`;
    });
    return lines.join('\n');
  }

  clear() {
    this.entries = [];
  }
}

export const runtimeLog = new RuntimeLog();
