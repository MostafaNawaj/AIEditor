const CHUNK_SIZE = 500;
const CHUNK_OVERLAP = 50;

export function chunkCode(content, filePath) {
  const lines = content.split('\n');
  const chunks = [];
  let buffer = [];
  let startLine = 1;

  for (let i = 0; i < lines.length; i++) {
    buffer.push(lines[i]);

    if (buffer.join('\n').length >= CHUNK_SIZE || i === lines.length - 1) {
      chunks.push({
        id: `${filePath}:${startLine}`,
        filePath,
        startLine,
        endLine: i + 1,
        content: buffer.join('\n'),
      });

      const overlap = buffer.slice(-CHUNK_OVERLAP);
      buffer = overlap;
      startLine = i + 1 - overlap.length;
    }
  }

  return chunks;
}

export function indexFiles(files) {
  const index = [];
  for (const file of files) {
    index.push(...chunkCode(file.content, file.path));
  }
  return index;
}
