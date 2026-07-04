const NODE_BUILTINS = new Set([
  'fs', 'path', 'os', 'http', 'https', 'url', 'util', 'crypto', 'stream',
  'events', 'buffer', 'child_process', 'net', 'dns', 'zlib', 'readline',
  'assert', 'module', 'process', 'querystring', 'timers', 'worker_threads',
]);

const PACKAGE_MANAGERS = {
  js: { file: 'package.json', install: 'npm install' },
  py: { file: 'requirements.txt', install: 'pip install' },
};

const IMPORT_PATTERNS = {
  js: [
    /import\s+.*?\s+from\s+['"]([^./][^'"]*)['"]/g,
    /require\(['"]([^./][^'"]*)['"]\)/g,
  ],
  py: [/^(?:from|import)\s+([a-zA-Z_][\w.]*)/gm],
};

export function detectImports(code, language = 'js') {
  const patterns = IMPORT_PATTERNS[language] || [];
  const found = new Set();

  for (const pattern of patterns) {
    let match;
    const re = new RegExp(pattern.source, pattern.flags);
    while ((match = re.exec(code)) !== null) {
      const pkg = match[1].split('/')[0];
      const name = !pkg.startsWith('@')
        ? pkg
        : match[1].split('/').slice(0, 2).join('/');
      if (!NODE_BUILTINS.has(name.split('/').pop())) {
        found.add(name);
      }
    }
  }

  return [...found];
}

export function suggestInstallCommand(packages, language = 'js') {
  const pm = PACKAGE_MANAGERS[language];
  if (!pm || !packages.length) return null;
  return `${pm.install} ${packages.join(' ')}`;
}
