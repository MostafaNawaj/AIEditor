const ERROR_PATTERNS = [
  /error[:\s]+(.+)/i,
  /exception[:\s]+(.+)/i,
  /failed[:\s]+(.+)/i,
  /cannot find module ['"](.+?)['"]/i,
  /syntaxerror[:\s]+(.+)/i,
  /typeerror[:\s]+(.+)/i,
  /referenceerror[:\s]+(.+)/i,
];

export function parseOutput(output) {
  const lines = output.split('\n').filter(Boolean);
  const errors = [];
  const warnings = [];

  for (const line of lines) {
    if (/warn/i.test(line)) {
      warnings.push(line.trim());
      continue;
    }

    for (const pattern of ERROR_PATTERNS) {
      const match = line.match(pattern);
      if (match) {
        errors.push({ line: line.trim(), detail: match[1] || line.trim() });
        break;
      }
    }
  }

  return {
    lineCount: lines.length,
    errors,
    warnings,
    hasErrors: errors.length > 0,
    summary: errors.length
      ? `Found ${errors.length} error(s) and ${warnings.length} warning(s)`
      : `No errors detected (${lines.length} lines)`,
  };
}

export function extractStackTraces(output) {
  const traces = [];
  const blocks = output.split(/\n(?=\s+at\s)/);

  for (const block of blocks) {
    if (/^\s*at\s/m.test(block)) {
      traces.push(block.trim());
    }
  }

  return traces;
}
