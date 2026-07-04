/**
 * Generates unified-diff style patches from old/new content.
 */
export function generateDiff(oldContent, newContent, filePath = 'file') {
  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');
  const hunks = [];
  let i = 0;
  let j = 0;

  while (i < oldLines.length || j < newLines.length) {
    if (i < oldLines.length && j < newLines.length && oldLines[i] === newLines[j]) {
      i++;
      j++;
      continue;
    }

    const hunkStartOld = i + 1;
    const hunkStartNew = j + 1;
    const removed = [];
    const added = [];

    while (i < oldLines.length && (j >= newLines.length || oldLines[i] !== newLines[j])) {
      removed.push(oldLines[i]);
      i++;
      if (removed.length > 20) break;
    }

    while (j < newLines.length && (i >= oldLines.length || oldLines[i] !== newLines[j])) {
      added.push(newLines[j]);
      j++;
      if (added.length > 20) break;
    }

    if (removed.length || added.length) {
      hunks.push({
        oldStart: hunkStartOld,
        newStart: hunkStartNew,
        removed,
        added,
      });
    }

    if (!removed.length && !added.length) break;
  }

  const header = `--- a/${filePath}\n+++ b/${filePath}`;
  const body = hunks
    .map((h) => {
      const oldCount = h.removed.length || 0;
      const newCount = h.added.length || 0;
      let text = `@@ -${h.oldStart},${oldCount} +${h.newStart},${newCount} @@\n`;
      text += h.removed.map((l) => `-${l}`).join('\n');
      if (h.removed.length && h.added.length) text += '\n';
      text += h.added.map((l) => `+${l}`).join('\n');
      return text;
    })
    .join('\n');

  return { header, body, full: header + '\n' + body, hunks };
}

export function applyDiff(oldContent, hunks) {
  const lines = oldContent.split('\n');
  let offset = 0;

  for (const hunk of hunks) {
    const start = hunk.oldStart - 1 + offset;
    lines.splice(start, hunk.removed.length, ...hunk.added);
    offset += hunk.added.length - hunk.removed.length;
  }

  return lines.join('\n');
}
