const levels = { debug: 0, info: 1, warn: 2, error: 3 };
let currentLevel = 'info';

export function setLevel(level) {
  currentLevel = level;
}

function log(level, ...args) {
  if (levels[level] >= levels[currentLevel]) {
    const prefix = `[AIEditor:${level.toUpperCase()}]`;
    console[level === 'debug' ? 'log' : level](prefix, ...args);
  }
}

export const logger = {
  debug: (...args) => log('debug', ...args),
  info: (...args) => log('info', ...args),
  warn: (...args) => log('warn', ...args),
  error: (...args) => log('error', ...args),
};
