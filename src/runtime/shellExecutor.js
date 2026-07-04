import { PseudoPty } from './pseudoPty.js';

let nodePty = null;
let nodePtyTried = false;

async function loadNodePty() {
  if (nodePtyTried) return nodePty || null;
  nodePtyTried = true;

  try {
    const mod = await import('node-pty');
    nodePty = mod.default || mod;
    return nodePty;
  } catch (err) {
    console.warn('[AIEditor] node-pty unavailable, using line-buffered PseudoPty:', err.message);
    nodePty = false;
    return null;
  }
}

export class ShellExecutor {
  spawnPty(shell, args, options = {}) {
    const cols = options.cols || 80;
    const rows = options.rows || 24;
    const cwd = options.cwd || process.cwd();
    const env = { ...process.env, ...options.env };

    return loadNodePty().then((pty) => {
      if (pty) {
        try {
          return pty.spawn(shell, args, {
            name: 'xterm-256color',
            cols,
            rows,
            cwd,
            env,
            useConpty: process.platform === 'win32',
          });
        } catch (err) {
          console.warn('[AIEditor] node-pty spawn failed, falling back:', err.message);
        }
      }

      return new PseudoPty(shell, args, { cols, rows, cwd, env });
    });
  }

  async exec(command, options = {}) {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    const shell = process.platform === 'win32' ? 'powershell.exe' : '/bin/bash';

    return execAsync(command, {
      cwd: options.cwd || process.cwd(),
      shell,
      ...options,
    });
  }
}
