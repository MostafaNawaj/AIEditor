import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { dispatch } from './dispatch.js';
import { runtimeLog } from './runtimeLog.js';

const sessions = new Map();

function session(win) {
  const id = win?.id ?? 0;
  if (!sessions.has(id)) {
    sessions.set(id, {
      running: false,
      process: null,
      breakpoints: new Map(),
      breakpointsEnabled: true,
    });
  }
  return sessions.get(id);
}

function detectRunCommand(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.js':
    case '.mjs':
    case '.cjs':
      return { cmd: 'node', args: [filePath] };
    case '.ts':
      return { cmd: 'npx', args: ['tsx', filePath] };
    case '.py':
      return { cmd: 'python', args: [filePath] };
    case '.go':
      return { cmd: 'go', args: ['run', filePath] };
    case '.rs':
      return { cmd: 'cargo', args: ['run'] };
    case '.java':
      return { cmd: 'java', args: [filePath] };
    case '.rb':
      return { cmd: 'ruby', args: [filePath] };
    case '.php':
      return { cmd: 'php', args: [filePath] };
    case '.ps1':
      return { cmd: 'powershell', args: ['-File', filePath] };
    case '.sh':
      return { cmd: 'bash', args: [filePath] };
    default:
      return { cmd: 'node', args: [filePath] };
  }
}

function startProcess(win, filePath, cwd, debug) {
  const s = session(win);
  if (s.process) {
    try { s.process.kill(); } catch { /* ignore */ }
  }

  const { cmd, args } = detectRunCommand(filePath);
  const env = { ...process.env };
  if (debug) env.AIEDITOR_DEBUG = '1';

  runtimeLog.info('debug', debug ? 'start debugging' : 'run without debugging', {
    cmd, args, cwd,
  });

  const child = spawn(cmd, args, {
    cwd: cwd || path.dirname(filePath),
    env,
    shell: true,
    windowsHide: true,
  });

  s.process = child;
  s.running = true;
  dispatch(win, 'debug.started', { filePath, debug });

  child.stdout?.on('data', (buf) => {
    const text = buf.toString();
    runtimeLog.info('debug.stdout', text.trim());
    dispatch(win, 'debug.output', { text, stream: 'stdout' });
  });

  child.stderr?.on('data', (buf) => {
    const text = buf.toString();
    runtimeLog.error('debug.stderr', text.trim());
    dispatch(win, 'debug.output', { text, stream: 'stderr' });
  });

  child.on('exit', (code) => {
    s.running = false;
    s.process = null;
    runtimeLog.info('debug', 'process exited', { code });
    dispatch(win, 'debug.stopped', { code });
  });

  child.on('error', (err) => {
    s.running = false;
    s.process = null;
    runtimeLog.error('debug', err.message);
    dispatch(win, 'debug.output', { text: `${err.message}\n`, stream: 'stderr' });
    dispatch(win, 'debug.stopped', { code: 1 });
  });

  return { ok: true, cmd, args };
}

export function runWithoutDebugging(win, filePath, cwd) {
  if (!filePath) {
    return dispatch(win, 'debug.output', {
      text: 'No active file to run.\n',
      stream: 'stderr',
    });
  }
  return startProcess(win, filePath, cwd, false);
}

export function startDebugging(win, filePath, cwd) {
  if (!filePath) {
    return dispatch(win, 'debug.output', {
      text: 'No active file to debug.\n',
      stream: 'stderr',
    });
  }
  dispatch(win, 'debug.console', { text: 'Debug session started (runtime instrumentation).' });
  return startProcess(win, filePath, cwd, true);
}

export function stopDebugging(win) {
  const s = session(win);
  if (s.process) {
    try { s.process.kill(); } catch { /* ignore */ }
    s.process = null;
  }
  s.running = false;
  runtimeLog.info('debug', 'stop');
  return dispatch(win, 'debug.stopped', { code: null });
}

export function restartDebugging(win, filePath, cwd) {
  stopDebugging(win);
  return startDebugging(win, filePath, cwd);
}

export function stepOver(win) {
  return dispatch(win, 'debug.stepOver');
}

export function stepInto(win) {
  return dispatch(win, 'debug.stepInto');
}

export function stepOut(win) {
  return dispatch(win, 'debug.stepOut');
}

export function continueExecution(win) {
  return dispatch(win, 'debug.continue');
}

export function toggleBreakpoint(win, filePath, line) {
  const s = session(win);
  const key = `${filePath}:${line}`;
  if (s.breakpoints.has(key)) {
    s.breakpoints.delete(key);
    runtimeLog.info('debug', 'remove breakpoint', { filePath, line });
  } else {
    s.breakpoints.set(key, { filePath, line, enabled: true });
    runtimeLog.info('debug', 'add breakpoint', { filePath, line });
  }
  return dispatch(win, 'debug.breakpoints', {
    breakpoints: [...s.breakpoints.values()],
  });
}

export function enableDisableBreakpoint(win, filePath, line) {
  const s = session(win);
  const key = `${filePath}:${line}`;
  const bp = s.breakpoints.get(key);
  if (bp) {
    bp.enabled = !bp.enabled;
  } else {
    s.breakpointsEnabled = !s.breakpointsEnabled;
  }
  return dispatch(win, 'debug.breakpoints', {
    breakpoints: [...s.breakpoints.values()],
    enabled: s.breakpointsEnabled,
  });
}

export function removeBreakpoint(win, filePath, line) {
  const s = session(win);
  if (filePath && line != null) {
    s.breakpoints.delete(`${filePath}:${line}`);
  } else {
    s.breakpoints.clear();
  }
  return dispatch(win, 'debug.breakpoints', {
    breakpoints: [...s.breakpoints.values()],
  });
}

export async function runTask(win, workspaceRoot, taskName = 'build') {
  const tasks = await loadTasks(workspaceRoot);
  const task = tasks.find((t) => t.label === taskName) || tasks[0];
  if (!task) {
    return dispatch(win, 'debug.output', {
      text: 'No tasks configured. Use Run → Configure Tasks.\n',
      stream: 'stderr',
    });
  }
  runtimeLog.info('debug', 'run task', task);
  const child = spawn(task.command, task.args || [], {
    cwd: workspaceRoot || process.cwd(),
    shell: true,
    windowsHide: true,
  });
  child.stdout?.on('data', (b) => dispatch(win, 'debug.output', { text: b.toString(), stream: 'stdout' }));
  child.stderr?.on('data', (b) => dispatch(win, 'debug.output', { text: b.toString(), stream: 'stderr' }));
  child.on('exit', (code) => dispatch(win, 'debug.taskDone', { task: task.label, code }));
  return { ok: true, task };
}

export async function configureTasks(win, workspaceRoot) {
  if (!workspaceRoot) {
    return dispatch(win, 'debug.output', { text: 'Open a folder first.\n', stream: 'stderr' });
  }
  const vscodeDir = path.join(workspaceRoot, '.vscode');
  const tasksPath = path.join(vscodeDir, 'tasks.json');
  await fs.mkdir(vscodeDir, { recursive: true });
  try {
    await fs.access(tasksPath);
  } catch {
    const template = {
      version: '2.0.0',
      tasks: [
        {
          label: 'build',
          type: 'shell',
          command: 'npm',
          args: ['run', 'build'],
          group: 'build',
        },
        {
          label: 'test',
          type: 'shell',
          command: 'npm',
          args: ['test'],
          group: 'test',
        },
      ],
    };
    await fs.writeFile(tasksPath, JSON.stringify(template, null, 2), 'utf-8');
  }
  runtimeLog.info('debug', 'configure tasks', { tasksPath });
  return dispatch(win, 'file.openFile', await import('./fileSystem.js').then((m) => m.readFile(tasksPath)));
}

export function runBuildTask(win, workspaceRoot) {
  return runTask(win, workspaceRoot, 'build');
}

export function runTestTask(win, workspaceRoot) {
  return runTask(win, workspaceRoot, 'test');
}

async function loadTasks(workspaceRoot) {
  if (!workspaceRoot) return [];
  try {
    const raw = await fs.readFile(path.join(workspaceRoot, '.vscode', 'tasks.json'), 'utf-8');
    const json = JSON.parse(raw);
    return (json.tasks || []).map((t) => ({
      label: t.label,
      command: t.command,
      args: t.args || [],
    }));
  } catch {
    return [
      { label: 'build', command: 'npm', args: ['run', 'build'] },
      { label: 'test', command: 'npm', args: ['test'] },
    ];
  }
}
