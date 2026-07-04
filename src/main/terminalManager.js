import { app } from 'electron';
import { dispatch } from './dispatch.js';
import { runtimeLog } from './runtimeLog.js';

const SHELLS = {
  powershell: {
    label: 'PowerShell',
    shell: process.platform === 'win32' ? 'powershell.exe' : 'pwsh',
    args: process.platform === 'win32' ? ['-NoLogo'] : [],
  },
  cmd: {
    label: 'CMD',
    shell: process.platform === 'win32' ? 'cmd.exe' : 'bash',
    args: [],
  },
  bash: {
    label: 'Bash',
    shell: process.platform === 'win32' ? 'bash.exe' : 'bash',
    args: [],
  },
  zsh: {
    label: 'Zsh',
    shell: 'zsh',
    args: [],
  },
};

/** @type {import('../runtime/cliManager.js').CliManager | null} */
let cliManager = null;

export function attachCliManager(manager) {
  cliManager = manager;
}

export function getShellConfig(shellId = 'powershell') {
  return SHELLS[shellId] || SHELLS.powershell;
}

export function listShells() {
  return Object.entries(SHELLS).map(([id, cfg]) => ({ id, label: cfg.label }));
}

export function newTerminal(win, cwd, shellId = 'powershell') {
  runtimeLog.info('terminal', 'new terminal', { shellId, cwd });
  return dispatch(win, 'terminal.new', { cwd, shellId, ...getShellConfig(shellId) });
}

export function splitTerminal(win) {
  return dispatch(win, 'terminal.split');
}

export function killTerminal(win) {
  return dispatch(win, 'terminal.kill');
}

export function renameTerminal(win, name) {
  return dispatch(win, 'terminal.rename', { name: name || 'Terminal' });
}

export function switchTerminal(win, shellId) {
  runtimeLog.info('terminal', 'switch shell', { shellId });
  return dispatch(win, 'terminal.switch', { shellId, ...getShellConfig(shellId) });
}

export function runActiveFile(win, filePath, cwd) {
  if (!filePath) {
    return dispatch(win, 'terminal.write', { text: 'No active file.\r\n' });
  }
  const command = buildRunCommand(filePath);
  runtimeLog.info('terminal', 'run active file', { filePath, command });
  return dispatch(win, 'terminal.runCommand', { command, cwd });
}

export function runSelectedText(win, text) {
  if (!text?.trim()) {
    return dispatch(win, 'terminal.write', { text: 'No selection.\r\n' });
  }
  runtimeLog.info('terminal', 'run selected text');
  return dispatch(win, 'terminal.runCommand', { command: text.trim() });
}

export function clearTerminal(win) {
  return dispatch(win, 'terminal.clear');
}

export function copyTerminal(win) {
  return dispatch(win, 'terminal.copy');
}

export function pasteTerminal(win) {
  return dispatch(win, 'terminal.paste');
}

export function toggleTerminalPanel(win) {
  return dispatch(win, 'terminal.togglePanel');
}

export function spawnShell(cwd, shellId = 'powershell') {
  if (!cliManager) throw new Error('CLI manager not attached');
  const cfg = getShellConfig(shellId);
  const id = cliManager.spawn(cfg.shell, cfg.args, {
    cwd: cwd || app.getPath('home'),
  });
  runtimeLog.info('terminal', 'spawned', { id, shell: cfg.shell });
  return id;
}

function buildRunCommand(filePath) {
  const ext = filePath.split('.').pop()?.toLowerCase();
  const quoted = `"${filePath}"`;
  switch (ext) {
    case 'js':
    case 'mjs':
    case 'cjs':
      return `node ${quoted}`;
    case 'ts':
      return `npx tsx ${quoted}`;
    case 'py':
      return `python ${quoted}`;
    case 'go':
      return `go run ${quoted}`;
    case 'rb':
      return `ruby ${quoted}`;
    case 'php':
      return `php ${quoted}`;
    case 'ps1':
      return `powershell -File ${quoted}`;
    case 'sh':
      return `bash ${quoted}`;
    default:
      return quoted;
  }
}
