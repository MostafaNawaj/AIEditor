import { spawn } from 'child_process';
import { EventEmitter } from 'events';

/**
 * Fallback terminal backend when node-pty is unavailable.
 * Pipes are not real TTYs, so shells do not handle line editing.
 * We implement local line editing (echo, backspace, clear-line) and
 * only forward complete lines to the child process.
 */
export class PseudoPty extends EventEmitter {
  constructor(shell, args, options = {}) {
    super();
    this._cols = options.cols || 80;
    this._rows = options.rows || 24;
    this._lineBuffer = '';
    this._closed = false;

    this.process = spawn(shell, args, {
      cwd: options.cwd || process.cwd(),
      env: {
        ...process.env,
        ...options.env,
        TERM: 'xterm-256color',
        FORCE_COLOR: '1',
      },
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
    });

    this.process.stdout.on('data', (data) => this.emit('data', data.toString()));
    this.process.stderr.on('data', (data) => this.emit('data', data.toString()));
    this.process.on('exit', (code) => {
      this._closed = true;
      this.emit('exit', { exitCode: code ?? 0 });
    });
    this.process.on('error', (err) => {
      this.emit('data', `\r\n[Terminal error: ${err.message}]\r\n`);
      this._closed = true;
      this.emit('exit', { exitCode: 1 });
    });
  }

  onData(callback) {
    this.on('data', callback);
    return { dispose: () => this.off('data', callback) };
  }

  onExit(callback) {
    this.on('exit', callback);
    return { dispose: () => this.off('exit', callback) };
  }

  write(data) {
    if (this._closed || typeof data !== 'string') return;

    let i = 0;
    while (i < data.length) {
      const ch = data[i];
      const code = data.charCodeAt(i);

      // CSI / escape sequences (arrows, home/end, etc.) — skip for line mode
      if (ch === '\x1b') {
        i += 1;
        if (i < data.length && data[i] === '[') {
          i += 1;
          while (i < data.length && !/[A-Za-z~]/.test(data[i])) i += 1;
          if (i < data.length) i += 1;
        } else if (i < data.length && (data[i] === 'O' || data[i] === ']')) {
          i += 1;
          while (i < data.length && data[i] !== '\x07' && data.charCodeAt(i) >= 32) i += 1;
          if (i < data.length) i += 1;
        }
        continue;
      }

      // Backspace / Delete
      if (ch === '\x7f' || ch === '\b') {
        if (this._lineBuffer.length > 0) {
          this._lineBuffer = this._lineBuffer.slice(0, -1);
          this.emit('data', '\b \b');
        }
        i += 1;
        continue;
      }

      // Enter — submit line to the shell
      if (ch === '\r' || ch === '\n') {
        this.emit('data', '\r\n');
        const line = this._lineBuffer;
        this._lineBuffer = '';
        if (this.process.stdin?.writable) {
          this.process.stdin.write(`${line}\n`);
        }
        i += 1;
        if (ch === '\r' && data[i] === '\n') i += 1;
        continue;
      }

      // Ctrl+C — cancel current line
      if (ch === '\x03') {
        this._lineBuffer = '';
        this.emit('data', '^C\r\n');
        if (process.platform !== 'win32' && this.process.pid) {
          try {
            process.kill(this.process.pid, 'SIGINT');
          } catch {
            /* ignore */
          }
        }
        i += 1;
        continue;
      }

      // Ctrl+D — EOF when line is empty
      if (ch === '\x04') {
        if (this._lineBuffer.length === 0) {
          this.process.stdin?.end();
        }
        i += 1;
        continue;
      }

      // Ctrl+U — clear line
      if (ch === '\x15') {
        this._clearLine();
        i += 1;
        continue;
      }

      // Ctrl+W — delete previous word
      if (ch === '\x17') {
        this._deleteWord();
        i += 1;
        continue;
      }

      // Printable characters and tab
      if (code >= 32 || ch === '\t') {
        this._lineBuffer += ch;
        this.emit('data', ch);
      }

      i += 1;
    }
  }

  _clearLine() {
    const len = this._lineBuffer.length;
    if (len === 0) return;
    this.emit('data', `\x1b[${len}D\x1b[K`);
    this._lineBuffer = '';
  }

  _deleteWord() {
    if (this._lineBuffer.length === 0) return;
    const trimmed = this._lineBuffer.replace(/\s+$/, '');
    const idx = trimmed.lastIndexOf(' ');
    const next = idx === -1 ? '' : `${trimmed.slice(0, idx + 1)}`;
    const removed = this._lineBuffer.length - next.length;
    if (removed > 0) {
      this.emit('data', `\x1b[${removed}D\x1b[K`);
      this._lineBuffer = next;
    }
  }

  resize(cols, rows) {
    this._cols = cols;
    this._rows = rows;
  }

  kill() {
    if (this._closed) return;
    this._closed = true;
    if (!this.process.killed) {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', String(this.process.pid), '/f', '/t'], {
          windowsHide: true,
          stdio: 'ignore',
        });
      } else {
        this.process.kill('SIGTERM');
      }
    }
  }
}
