export function parseExports(code) {
  const exports = [];
  const patterns = [
    /export\s+(?:default\s+)?(?:function|class|const|let|var)\s+(\w+)/g,
    /export\s*\{\s*([^}]+)\s*\}/g,
    /module\.exports\s*=\s*(\w+)/g,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(code)) !== null) {
      if (match[1].includes(',')) {
        match[1].split(',').forEach((e) => exports.push(e.trim().split(' as ')[0]));
      } else {
        exports.push(match[1]);
      }
    }
  }

  return [...new Set(exports)];
}

export function parseFunctions(code) {
  const functions = [];
  const pattern = /(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>)/g;
  let match;
  while ((match = pattern.exec(code)) !== null) {
    functions.push(match[1] || match[2]);
  }
  return functions;
}
