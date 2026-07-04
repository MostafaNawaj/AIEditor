const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('aieditor', {
  openFolder: () => ipcRenderer.invoke('fs:open-folder'),
  openFileDialog: () => ipcRenderer.invoke('fs:open-file-dialog'),
  readFile: (filePath) => ipcRenderer.invoke('fs:read-file', filePath),
  writeFile: (filePath, content) => ipcRenderer.invoke('fs:write-file', filePath, content),
  createFile: (dirPath, fileName) => ipcRenderer.invoke('fs:create-file', dirPath, fileName),
  createFolder: (dirPath, folderName) => ipcRenderer.invoke('fs:create-folder', dirPath, folderName),
  createUntitled: (dirPath) => ipcRenderer.invoke('fs:create-untitled', dirPath),
  refreshWorkspace: (rootPath) => ipcRenderer.invoke('fs:refresh', rootPath),
  openInBrowser: (targetPath) => ipcRenderer.invoke('fs:open-in-browser', targetPath),
  searchFiles: (rootPath, query) => ipcRenderer.invoke('fs:search', rootPath, query),
  replaceInFiles: (rootPath, query, replacement) =>
    ipcRenderer.invoke('fs:replace-in-files', rootPath, query, replacement),
  saveAs: (currentPath, content) => ipcRenderer.invoke('fs:save-as', currentPath, content),
  getRecent: () => ipcRenderer.invoke('fs:recent'),
  openRecent: (rootPath) => ipcRenderer.invoke('fs:open-recent', rootPath),

  gitStatus: (repoPath) => ipcRenderer.invoke('git:status', repoPath),
  gitDiff: (repoPath) => ipcRenderer.invoke('git:diff', repoPath),

  spawnTerminal: (cwd, shellId) => ipcRenderer.invoke('cli:spawn', cwd, shellId),
  writeTerminal: (id, data) => ipcRenderer.send('cli:write', { id, data }),
  resizeTerminal: (id, cols, rows) => ipcRenderer.send('cli:resize', { id, cols, rows }),
  killTerminal: (id) => ipcRenderer.send('cli:kill', id),
  listPorts: () => ipcRenderer.invoke('ports:list'),
  onTerminalData: (callback) => {
    const handler = (_e, payload) => callback(payload);
    ipcRenderer.on('cli:data', handler);
    return () => ipcRenderer.removeListener('cli:data', handler);
  },
  onTerminalExit: (callback) => {
    const handler = (_e, payload) => callback(payload);
    ipcRenderer.on('cli:exit', handler);
    return () => ipcRenderer.removeListener('cli:exit', handler);
  },

  setWorkspaceState: (state) => ipcRenderer.send('workspace:state', state),

  invokeMenuAction: (actionId, payload) => ipcRenderer.invoke('menu:invoke', actionId, payload || {}),

  onMenuAction: (callback) => {
    const handler = (_e, payload) => callback(payload.action, payload.payload || {});
    ipcRenderer.on('menu:action', handler);
    return () => ipcRenderer.removeListener('menu:action', handler);
  },

  onRuntimeLog: (callback) => {
    const handler = (_e, entry) => callback(entry);
    ipcRenderer.on('runtime:log', handler);
    return () => ipcRenderer.removeListener('runtime:log', handler);
  },
  getRuntimeLogs: (limit) => ipcRenderer.invoke('runtime:logs', limit),
  getRuntimeLogsText: (limit) => ipcRenderer.invoke('runtime:logs-text', limit),

  getShortcuts: () => ipcRenderer.invoke('help:shortcuts'),
  getReleaseNotes: () => ipcRenderer.invoke('help:release-notes'),
  getTips: () => ipcRenderer.invoke('help:tips'),
  getLicense: () => ipcRenderer.invoke('help:license'),

  readClipboard: () => ipcRenderer.invoke('clipboard:read'),
  writeClipboard: (text) => ipcRenderer.invoke('clipboard:write', text),
  prompt: (opts) => ipcRenderer.invoke('dialog:prompt', opts),

  aiChat: (messages, context) => ipcRenderer.invoke('ai:chat', { messages, context }),
  aiStream: (messages, context, onChunk) => {
    return new Promise((resolve, reject) => {
      ipcRenderer
        .invoke('ai:stream', { messages, context })
        .then((channel) => {
          const handler = (_e, payload) => {
            if (payload.error) {
              ipcRenderer.removeListener(channel, handler);
              reject(new Error(payload.error));
              return;
            }
            if (payload.chunk) onChunk(payload.chunk);
            if (payload.done) {
              ipcRenderer.removeListener(channel, handler);
              resolve(payload.chunk);
            }
          };
          ipcRenderer.on(channel, handler);
        })
        .catch(reject);
    });
  },
  aiApprove: (decision, proposal) =>
    ipcRenderer.invoke('ai:approve', { decision, proposal }),

  windowMinimize: () => ipcRenderer.send('window:minimize'),
  windowMaximize: () => ipcRenderer.send('window:maximize'),
  windowClose: () => ipcRenderer.send('window:close'),
  windowResizeStart: (edge, x, y) => ipcRenderer.send('window:resize-start', { edge, x, y }),
  windowResizeMove: (x, y) => ipcRenderer.send('window:resize-move', { x, y }),
  windowResizeEnd: () => ipcRenderer.send('window:resize-end'),

  isElectron: true,
});
