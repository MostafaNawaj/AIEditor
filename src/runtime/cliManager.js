import { EventEmitter } from 'events';
import { ShellExecutor } from './shellExecutor.js';
import { ProcessManager } from './processManager.js';

export class CliManager extends EventEmitter {
  constructor() {
    super();
    this.executor = new ShellExecutor();
    this.processes = new ProcessManager();
    /** @type {Map<string, string[]>} */
    this._pendingWrites = new Map();
  }

  spawn(shell, args = [], options = {}) {
    const id = this.processes.createId();
    this._pendingWrites.set(id, []);

    this.executor.spawnPty(shell, args, options).then((pty) => {
      this.processes.register(id, pty);

      const pending = this._pendingWrites.get(id) || [];
      this._pendingWrites.delete(id);
      for (const chunk of pending) {
        pty.write(chunk);
      }

      pty.onData((data) => this.emit('data', id, data));
      pty.onExit(({ exitCode }) => {
        this.processes.unregister(id);
        this._pendingWrites.delete(id);
        this.emit('exit', id, exitCode);
      });
    }).catch((err) => {
      this._pendingWrites.delete(id);
      this.emit('data', id, `\r\n[Failed to start terminal: ${err.message}]\r\n`);
      this.emit('exit', id, 1);
    });

    return id;
  }

  write(id, data) {
    const pty = this.processes.get(id);
    if (pty) {
      pty.write(data);
      return;
    }
    const pending = this._pendingWrites.get(id);
    if (pending) pending.push(data);
  }

  resize(id, cols, rows) {
    const pty = this.processes.get(id);
    if (pty) pty.resize(cols, rows);
  }

  kill(id) {
    const pty = this.processes.get(id);
    this._pendingWrites.delete(id);
    if (pty) {
      pty.kill();
      this.processes.unregister(id);
    }
  }

  killAll() {
    for (const id of this.processes.ids()) {
      this.kill(id);
    }
    this._pendingWrites.clear();
  }
}
