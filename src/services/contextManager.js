export class ContextManager {
  buildContext({ openFile, projectRoot, terminalOutput, runtimeLogs } = {}) {
    const parts = [];

    if (projectRoot) {
      parts.push(`Project root: ${projectRoot}`);
    }

    if (openFile?.path) {
      parts.push(
        `Currently open file: ${openFile.path}`,
        '```' + (openFile.language || '') + '\n' + (openFile.content || '') + '\n```'
      );
    }

    if (terminalOutput) {
      const trimmed =
        terminalOutput.length > 4000
          ? '...(truncated)\n' + terminalOutput.slice(-4000)
          : terminalOutput;
      parts.push('Recent terminal output:\n```\n' + trimmed + '\n```');
    }

    if (runtimeLogs) {
      const trimmed =
        runtimeLogs.length > 3000
          ? '...(truncated)\n' + runtimeLogs.slice(-3000)
          : runtimeLogs;
      parts.push('Runtime logs (for debugging):\n```\n' + trimmed + '\n```');
    }

    return parts.join('\n\n');
  }
}
