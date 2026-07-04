export class ProcessManager {
  constructor() {
    this.processes = new Map();
    this.counter = 0;
  }

  createId() {
    return `pty-${++this.counter}`;
  }

  register(id, pty) {
    this.processes.set(id, pty);
  }

  unregister(id) {
    this.processes.delete(id);
  }

  get(id) {
    return this.processes.get(id);
  }

  ids() {
    return [...this.processes.keys()];
  }
}
