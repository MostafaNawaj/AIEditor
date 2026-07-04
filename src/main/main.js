import { app, BrowserWindow, ipcMain, dialog, clipboard } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { setupMenu, refreshRecentMenu } from './menu.js';
import * as fileSystem from './fileSystem.js';
import * as gitIntegration from './gitIntegration.js';
import * as debugManager from './debugManager.js';
import * as terminalManager from './terminalManager.js';
import * as helpManager from './helpManager.js';
import { CliManager } from '../runtime/cliManager.js';
import { listListeningPorts } from '../runtime/portScanner.js';
import { AiClient } from '../services/aiClient.js';
import { ContextManager } from '../services/contextManager.js';
import { runtimeLog } from './runtimeLog.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const windows = new Set();
/** @type {Map<number, { rootPath: string|null, activeFile: object|null }>} */
const workspaceState = new Map();

let ipcRegistered = false;
const cliManager = new CliManager();
terminalManager.attachCliManager(cliManager);

let aiClient = null;
let contextManager = null;
let isDev = false;

function getAiClient() {
  if (!aiClient) aiClient = new AiClient();
  return aiClient;
}

function getContextManager() {
  if (!contextManager) contextManager = new ContextManager();
  return contextManager;
}

function getRendererHtmlPath() {
  return path.join(app.getAppPath(), 'dist', 'index.html');
}

function getPreloadPath() {
  return path.join(__dirname, 'preload.cjs');
}

function getStateForWindow(win) {
  if (!win) return { rootPath: null, activeFile: null };
  return workspaceState.get(win.webContents.id) || { rootPath: null, activeFile: null };
}

function menuOptions() {
  return {
    onNewWindow: () => createMainWindow(isDev, true),
    getWorkspace: (w) => getStateForWindow(w).rootPath,
    getActiveFile: (w) => getStateForWindow(w).activeFile,
  };
}

function installMenu(win) {
  setupMenu(win, menuOptions());
}

export function createMainWindow(dev = false, forceNew = false) {
  isDev = dev;

  if (!forceNew) {
    const existing = [...windows][0];
    if (existing && !existing.isDestroyed()) {
      existing.focus();
      return existing;
    }
  }

  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 640,
    minHeight: 400,
    title: 'AIEditor',
    frame: false,
    resizable: true,
    maximizable: true,
    minimizable: true,
    // Windows: keep native resize/snap for frameless windows
    thickFrame: process.platform === 'win32',
    backgroundColor: '#181818',
    show: false,
    autoHideMenuBar: false,
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  windows.add(win);
  workspaceState.set(win.webContents.id, { rootPath: null, activeFile: null });

  win.webContents.on('preload-error', (_e, preloadPath, error) => {
    console.error('[AIEditor] Preload failed:', preloadPath, error);
    runtimeLog.error('main', `Preload failed: ${error.message}`);
  });

  win.once('ready-to-show', () => win.show());

  if (isDev) {
    win.loadURL('http://localhost:5173');
  } else {
    win.loadFile(getRendererHtmlPath());
  }

  win.webContents.on('did-fail-load', (_e, code, desc, url) => {
    console.error('Failed to load:', code, desc, url);
    runtimeLog.error('main', `Failed to load: ${desc}`, { code, url });
  });

  installMenu(win);
  registerIpcHandlers();

  // Stream runtime logs to this window for AI context
  const onLog = (entry) => {
    if (!win.isDestroyed()) {
      win.webContents.send('runtime:log', entry);
    }
  };
  runtimeLog.on('entry', onLog);

  win.on('closed', () => {
    runtimeLog.off('entry', onLog);
    workspaceState.delete(win.webContents.id);
    windows.delete(win);
  });

  runtimeLog.info('main', 'window created', { id: win.id });
  return win;
}

createMainWindow.getWindowCount = () => windows.size;

function registerIpcHandlers() {
  if (ipcRegistered) return;
  ipcRegistered = true;

  cliManager.on('data', (id, data) => {
    runtimeLog.info('terminal', data.slice(0, 200));
    for (const win of windows) {
      if (!win.isDestroyed()) win.webContents.send('cli:data', { id, data });
    }
  });

  cliManager.on('exit', (id, code) => {
    runtimeLog.info('terminal', `exit ${code}`, { id });
    for (const win of windows) {
      if (!win.isDestroyed()) win.webContents.send('cli:exit', { id, code });
    }
  });

  ipcMain.on('workspace:state', (event, state) => {
    workspaceState.set(event.sender.id, {
      rootPath: state?.rootPath || null,
      activeFile: state?.activeFile || null,
    });
  });

  ipcMain.on('window:minimize', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.minimize();
  });
  ipcMain.on('window:maximize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return;
    if (win.isMaximized()) win.unmaximize();
    else win.maximize();
  });
  ipcMain.on('window:close', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.close();
  });

  /** @type {{ win: Electron.BrowserWindow, edge: string, startX: number, startY: number, bounds: Electron.Rectangle } | null} */
  let windowResizeState = null;

  ipcMain.on('window:resize-start', (event, { edge, x, y }) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win || win.isMaximized()) return;
    windowResizeState = {
      win,
      edge: edge || 'se',
      startX: x,
      startY: y,
      bounds: win.getBounds(),
    };
  });

  ipcMain.on('window:resize-move', (_event, { x, y }) => {
    if (!windowResizeState) return;
    const { win, edge, startX, startY, bounds } = windowResizeState;
    if (win.isDestroyed()) {
      windowResizeState = null;
      return;
    }

    const dx = x - startX;
    const dy = y - startY;
    const minW = 640;
    const minH = 400;
    let { x: bx, y: by, width, height } = bounds;

    if (edge.includes('e')) width = bounds.width + dx;
    if (edge.includes('s')) height = bounds.height + dy;
    if (edge.includes('w')) {
      width = bounds.width - dx;
      bx = bounds.x + dx;
    }
    if (edge.includes('n')) {
      height = bounds.height - dy;
      by = bounds.y + dy;
    }

    if (width < minW) {
      if (edge.includes('w')) bx = bounds.x + bounds.width - minW;
      width = minW;
    }
    if (height < minH) {
      if (edge.includes('n')) by = bounds.y + bounds.height - minH;
      height = minH;
    }

    win.setBounds({ x: Math.round(bx), y: Math.round(by), width: Math.round(width), height: Math.round(height) });
  });

  ipcMain.on('window:resize-end', () => {
    windowResizeState = null;
  });

  ipcMain.handle('fs:open-folder', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    return fileSystem.openFolderDialog(win);
  });

  ipcMain.handle('fs:open-file-dialog', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    return fileSystem.openFileDialog(win);
  });

  ipcMain.handle('fs:read-file', async (_e, filePath) => fileSystem.readFile(filePath));
  ipcMain.handle('fs:write-file', async (_e, filePath, content) => fileSystem.writeFile(filePath, content));
  ipcMain.handle('fs:create-file', async (_e, dirPath, fileName) => fileSystem.createFile(dirPath, fileName));
  ipcMain.handle('fs:create-folder', async (_e, dirPath, folderName) =>
    fileSystem.createFolder(dirPath, folderName)
  );
  ipcMain.handle('fs:create-untitled', async (_e, dirPath) => fileSystem.createUntitled(dirPath));
  ipcMain.handle('fs:refresh', async (_e, rootPath) => fileSystem.refreshWorkspace(rootPath));
  ipcMain.handle('fs:open-in-browser', async (_e, targetPath) => fileSystem.openInBrowser(targetPath));
  ipcMain.handle('fs:search', async (_e, rootPath, query) => fileSystem.searchInFiles(rootPath, query));
  ipcMain.handle('fs:replace-in-files', async (_e, rootPath, query, replacement) =>
    fileSystem.replaceInFiles(rootPath, query, replacement)
  );
  ipcMain.handle('fs:save-as', async (event, currentPath, content) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    return fileSystem.saveAs(win, currentPath, content);
  });
  ipcMain.handle('fs:recent', async () => fileSystem.getRecentWorkspaces());
  ipcMain.handle('fs:open-recent', async (event, rootPath) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    return fileSystem.openRecent(win, rootPath);
  });

  ipcMain.handle('git:status', async (_e, repoPath) => gitIntegration.getStatus(repoPath));
  ipcMain.handle('git:diff', async (_e, repoPath) => gitIntegration.getDiff(repoPath));

  ipcMain.handle('cli:spawn', async (_e, cwd, shellId) =>
    terminalManager.spawnShell(cwd, shellId || 'powershell')
  );
  ipcMain.on('cli:write', (_e, { id, data }) => cliManager.write(id, data));
  ipcMain.on('cli:resize', (_e, { id, cols, rows }) => cliManager.resize(id, cols, rows));
  ipcMain.on('cli:kill', (_e, id) => cliManager.kill(id));

  ipcMain.handle('ports:list', async () => listListeningPorts());

  ipcMain.handle('runtime:logs', async (_e, limit) => runtimeLog.getRecent(limit || 100));
  ipcMain.handle('runtime:logs-text', async (_e, limit) => runtimeLog.toContextString(limit || 80));

  ipcMain.handle('help:shortcuts', async () => helpManager.getShortcutsList());
  ipcMain.handle('help:release-notes', async () => helpManager.getReleaseNotes());
  ipcMain.handle('help:tips', async () => helpManager.getTips());
  ipcMain.handle('help:license', async () => helpManager.getLicenseText());

  ipcMain.handle('clipboard:read', async () => clipboard.readText());
  ipcMain.handle('clipboard:write', async (_e, text) => {
    clipboard.writeText(text || '');
    return true;
  });

  ipcMain.handle('dialog:prompt', async (event, { title, message, defaultValue }) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    // Electron has no native prompt; use a simple message box + return default for rename flows
    const result = await dialog.showMessageBox(win, {
      type: 'question',
      title: title || 'Input',
      message: message || '',
      detail: defaultValue ? `Current: ${defaultValue}` : undefined,
      buttons: ['OK', 'Cancel'],
      defaultId: 0,
      cancelId: 1,
    });
    if (result.response !== 0) return null;
    return defaultValue || '';
  });

  ipcMain.handle('ai:chat', async (_e, { messages, context }) => {
    const logs = runtimeLog.toContextString(60);
    const enrichedContext = getContextManager().buildContext({
      ...context,
      runtimeLogs: logs,
    });
    return getAiClient().chat(messages, enrichedContext);
  });

  ipcMain.handle('ai:stream', async (event, { messages, context }) => {
    const logs = runtimeLog.toContextString(60);
    const enrichedContext = getContextManager().buildContext({
      ...context,
      runtimeLogs: logs,
    });
    const channel = `ai:stream-chunk-${Date.now()}`;

    getAiClient()
      .streamChat(messages, enrichedContext, (chunk) => {
        event.sender.send(channel, { chunk, done: false });
      })
      .then((full) => {
        event.sender.send(channel, { chunk: full, done: true });
      })
      .catch((err) => {
        event.sender.send(channel, { error: err.message, done: true });
      });

    return channel;
  });

  ipcMain.handle('ai:approve', async (_e, { decision, proposal }) => {
    runtimeLog.info('ai', `approval: ${decision}`, {
      filePath: proposal?.filePath,
    });
    return { ok: true, decision };
  });

  // Allow renderer to invoke menu backend actions directly (custom menu bar)
  ipcMain.handle('menu:invoke', async (event, actionId, payload = {}) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const state = getStateForWindow(win);
    return invokeMenuAction(win, actionId, payload, state);
  });
}

async function invokeMenuAction(win, actionId, payload, state) {
  const root = state.rootPath;
  const file = state.activeFile;
  const { dispatch } = await import('./dispatch.js');
  const editorActions = await import('./editorActions.js');
  const selectionManager = await import('./selectionManager.js');
  const uiManager = await import('./uiManager.js');
  const navigation = await import('./navigation.js');

  const handlers = {
    'file.newFile': () => fileSystem.newFile(win, root),
    'file.newWindow': () => createMainWindow(isDev, true),
    'file.newProject': () => fileSystem.openFolderDialog(win),
    'file.openFile': () => fileSystem.openFileDialog(win),
    'file.openFolder': () => fileSystem.openFolderDialog(win),
    'file.save': () => fileSystem.save(win),
    'file.saveAs': () => fileSystem.saveAs(win, file?.path, file?.content),
    'file.saveAll': () => fileSystem.saveAll(win),
    'file.toggleAutoSave': () => fileSystem.toggleAutoSave(win),
    'file.closeEditor': () => fileSystem.closeEditor(win),
    'file.closeFolder': () => fileSystem.closeFolder(win),
    'file.preferences.settings': () => fileSystem.openPreferences(win, 'settings'),
    'file.preferences.keyboard': () => fileSystem.openPreferences(win, 'keyboard'),
    'file.preferences.extensions': () => fileSystem.openPreferences(win, 'extensions'),
    'file.exit': () => fileSystem.exitApp(),
    'file.openRecent': () => fileSystem.openRecent(win, payload.path),

    'edit.undo': () => editorActions.undo(win),
    'edit.redo': () => editorActions.redo(win),
    'edit.cut': () => editorActions.cut(win),
    'edit.copy': () => editorActions.copy(win),
    'edit.paste': () => editorActions.paste(win),
    'edit.find': () => editorActions.find(win),
    'edit.replace': () => editorActions.replace(win),
    'edit.replaceInFiles': () => editorActions.replaceInFiles(win),
    'edit.findInFiles': () => editorActions.findInFiles(win),
    'edit.selectAll': () => editorActions.selectAll(win),
    'edit.indentLine': () => editorActions.indentLine(win),
    'edit.outdentLine': () => editorActions.outdentLine(win),
    'edit.toggleLineComment': () => editorActions.toggleLineComment(win),
    'edit.toggleBlockComment': () => editorActions.toggleBlockComment(win),
    'edit.formatDocument': () => editorActions.formatDocument(win),
    'edit.formatSelection': () => editorActions.formatSelection(win),
    'edit.renameSymbol': () => editorActions.renameSymbol(win),

    'selection.selectAll': () => selectionManager.selectAll(win),
    'selection.expand': () => selectionManager.expandSelection(win),
    'selection.shrink': () => selectionManager.shrinkSelection(win),
    'selection.copy': () => selectionManager.copySelection(win),
    'selection.columnMode': () => selectionManager.toggleColumnSelection(win),
    'selection.addCursorAbove': () => selectionManager.addCursorAbove(win),
    'selection.addCursorBelow': () => selectionManager.addCursorBelow(win),
    'selection.addCursorToLineEnds': () => selectionManager.addCursorToLineEnds(win),
    'selection.selectWord': () => selectionManager.selectCurrentWord(win),
    'selection.selectLine': () => selectionManager.selectCurrentLine(win),
    'selection.addNextOccurrence': () => selectionManager.addSelectionToNextFindMatch(win),
    'selection.selectHighlights': () => selectionManager.selectHighlights(win),
    'selection.multiCursorUndo': () => selectionManager.multiCursorUndo(win),

    'view.commandPalette': () => uiManager.commandPalette(win),
    'view.explorer': () => uiManager.showExplorer(win),
    'view.search': () => uiManager.showSearch(win),
    'view.sourceControl': () => uiManager.showSourceControl(win),
    'view.runAndDebug': () => uiManager.showRunAndDebug(win),
    'view.extensions': () => uiManager.showExtensions(win),
    'view.toggleSideBar': () => uiManager.toggleSideBar(win),
    'view.toggleStatusBar': () => uiManager.toggleStatusBar(win),
    'view.toggleActivityBar': () => uiManager.toggleActivityBar(win),
    'view.togglePanel': () => uiManager.togglePanel(win),
    'view.toggleFullScreen': () => uiManager.toggleFullScreen(win),
    'view.zenMode': () => uiManager.toggleZenMode(win),
    'view.centeredLayout': () => uiManager.toggleCenteredLayout(win),
    'view.zoomIn': () => uiManager.zoomIn(win),
    'view.zoomOut': () => uiManager.zoomOut(win),
    'view.resetZoom': () => uiManager.resetZoom(win),
    'view.toggleWordWrap': () => uiManager.toggleWordWrap(win),
    'view.toggleMinimap': () => uiManager.toggleMinimap(win),
    'view.toggleBreadcrumbs': () => uiManager.toggleBreadcrumbs(win),

    'go.back': () => navigation.back(win),
    'go.forward': () => navigation.forward(win),
    'go.navigateToFile': () => navigation.navigateToFile(win),
    'go.navigateToSymbol': () => navigation.navigateToSymbol(win),
    'go.navigateToLine': () => navigation.navigateToLine(win),
    'go.definition': () => navigation.goToDefinition(win),
    'go.declaration': () => navigation.goToDeclaration(win),
    'go.implementation': () => navigation.goToImplementation(win),
    'go.references': () => navigation.goToReferences(win),
    'go.typeDefinition': () => navigation.goToTypeDefinition(win),
    'go.nextProblem': () => navigation.nextProblem(win),
    'go.previousProblem': () => navigation.previousProblem(win),
    'go.nextChange': () => navigation.nextChange(win),
    'go.previousChange': () => navigation.previousChange(win),
    'go.switchTab': () => navigation.switchEditorTab(win, payload.direction || 'next'),
    'go.navigateHistory': () => navigation.navigateHistory(win),

    'run.withoutDebug': () => debugManager.runWithoutDebugging(win, file?.path, root),
    'run.startDebug': () => debugManager.startDebugging(win, file?.path, root),
    'run.stopDebug': () => debugManager.stopDebugging(win),
    'run.restartDebug': () => debugManager.restartDebugging(win, file?.path, root),
    'run.stepOver': () => debugManager.stepOver(win),
    'run.stepInto': () => debugManager.stepInto(win),
    'run.stepOut': () => debugManager.stepOut(win),
    'run.continue': () => debugManager.continueExecution(win),
    'run.toggleBreakpoint': () => debugManager.toggleBreakpoint(win, file?.path, file?.line || 1),
    'run.enableBreakpoint': () => debugManager.enableDisableBreakpoint(win, file?.path, file?.line),
    'run.removeBreakpoint': () => debugManager.removeBreakpoint(win, file?.path, file?.line),
    'run.task': () => debugManager.runTask(win, root),
    'run.configureTasks': () => debugManager.configureTasks(win, root),
    'run.build': () => debugManager.runBuildTask(win, root),
    'run.test': () => debugManager.runTestTask(win, root),

    'terminal.new': () => terminalManager.newTerminal(win, root, payload.shellId),
    'terminal.split': () => terminalManager.splitTerminal(win),
    'terminal.kill': () => terminalManager.killTerminal(win),
    'terminal.rename': () => terminalManager.renameTerminal(win, payload.name),
    'terminal.switch': () => terminalManager.switchTerminal(win, payload.shellId),
    'terminal.runActiveFile': () => terminalManager.runActiveFile(win, file?.path, root),
    'terminal.runSelected': () => terminalManager.runSelectedText(win, file?.selection || ''),
    'terminal.clear': () => terminalManager.clearTerminal(win),
    'terminal.copy': () => terminalManager.copyTerminal(win),
    'terminal.paste': () => terminalManager.pasteTerminal(win),
    'terminal.toggle': () => terminalManager.toggleTerminalPanel(win),

    'help.welcome': () => helpManager.welcome(win),
    'help.docs': () => helpManager.documentation(win),
    'help.shortcuts': () => helpManager.keyboardShortcutsReference(win),
    'help.tips': () => helpManager.tipsAndTricks(win),
    'help.releaseNotes': () => helpManager.releaseNotes(win),
    'help.issue': () => helpManager.reportIssue(win),
    'help.license': () => helpManager.viewLicense(win),
    'help.about': () => helpManager.about(win),
  };

  if (handlers[actionId]) return handlers[actionId]();
  return dispatch(win, actionId, payload);
}

export { refreshRecentMenu, runtimeLog };
