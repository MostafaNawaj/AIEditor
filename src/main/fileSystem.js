import fs from 'fs/promises';
import path from 'path';
import { dialog, BrowserWindow, app, shell } from 'electron';
import { dispatch } from './dispatch.js';
import { runtimeLog } from './runtimeLog.js';

const IGNORED = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  'release',
  '.next',
  '__pycache__',
  '.DS_Store',
]);

const RECENT_FILE = 'recent-workspaces.json';

function recentPath() {
  return path.join(app.getPath('userData'), RECENT_FILE);
}

export async function getRecentWorkspaces() {
  try {
    const raw = await fs.readFile(recentPath(), 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function addRecentWorkspace(rootPath) {
  const list = await getRecentWorkspaces();
  const next = [rootPath, ...list.filter((p) => p !== rootPath)].slice(0, 12);
  await fs.writeFile(recentPath(), JSON.stringify(next, null, 2), 'utf-8');
  return next;
}

export async function readDirectoryTree(rootPath) {
  const name = path.basename(rootPath);
  const tree = await buildTree(rootPath, name);
  runtimeLog.info('fileSystem', 'opened workspace', { rootPath });
  await addRecentWorkspace(rootPath);
  return { rootPath, tree };
}

async function buildTree(dirPath, name) {
  const entry = { name, path: dirPath, type: 'directory', children: [] };

  let items;
  try {
    items = await fs.readdir(dirPath, { withFileTypes: true });
  } catch {
    return entry;
  }

  const sorted = items
    .filter((item) => !IGNORED.has(item.name) && !item.name.startsWith('.'))
    .sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });

  for (const item of sorted) {
    const fullPath = path.join(dirPath, item.name);
    if (item.isDirectory()) {
      entry.children.push(await buildTree(fullPath, item.name));
    } else {
      entry.children.push({ name: item.name, path: fullPath, type: 'file' });
    }
  }

  return entry;
}

export async function readFile(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');
  const base = path.basename(filePath);
  const ext = path.extname(filePath).slice(1);
  const specialNames = {
    Dockerfile: 'dockerfile',
    Makefile: 'makefile',
    Jenkinsfile: 'groovy',
    Gemfile: 'ruby',
    Rakefile: 'ruby',
    CMakeLists: 'cmake',
  };
  const language = ext
    ? extToLanguage(ext)
    : specialNames[base] || specialNames[base.replace(/\..*$/, '')] || 'plaintext';
  runtimeLog.info('fileSystem', 'read file', { filePath, language });
  return { content, language, path: filePath };
}

export async function writeFile(filePath, content) {
  await fs.writeFile(filePath, content, 'utf-8');
  runtimeLog.info('fileSystem', 'wrote file', { filePath, bytes: content?.length ?? 0 });
  return { success: true, path: filePath };
}

export async function createFile(dirPath, fileName) {
  const filePath = path.join(dirPath, fileName);
  await fs.writeFile(filePath, '', 'utf-8');
  runtimeLog.info('fileSystem', 'created file', { filePath });
  return { path: filePath, name: fileName };
}

export async function createFolder(dirPath, folderName) {
  const folderPath = path.join(dirPath, folderName);
  await fs.mkdir(folderPath, { recursive: true });
  runtimeLog.info('fileSystem', 'created folder', { folderPath });
  return { path: folderPath, name: folderName };
}

export async function openInBrowser(targetPath) {
  if (!targetPath) {
    await shell.openExternal('https://');
    return { ok: true };
  }
  const ext = path.extname(targetPath).toLowerCase();
  if (['.html', '.htm'].includes(ext)) {
    const url = `file:///${targetPath.replace(/\\/g, '/')}`;
    await shell.openExternal(url);
    runtimeLog.info('fileSystem', 'open in browser', { targetPath });
    return { ok: true, url };
  }
  // Open with the default OS application
  await shell.openPath(targetPath);
  runtimeLog.info('fileSystem', 'open path', { targetPath });
  return { ok: true };
}

export async function refreshWorkspace(rootPath) {
  if (!rootPath) return null;
  return readDirectoryTree(rootPath);
}

export async function createUntitled(dirPath) {
  const base = dirPath || app.getPath('documents');
  let index = 1;
  let filePath = path.join(base, `Untitled-${index}.txt`);
  while (true) {
    try {
      await fs.access(filePath);
      index += 1;
      filePath = path.join(base, `Untitled-${index}.txt`);
    } catch {
      break;
    }
  }
  await fs.writeFile(filePath, '', 'utf-8');
  return readFile(filePath);
}

export async function searchInFiles(rootPath, query, maxResults = 150) {
  if (!query?.trim()) return [];
  const results = [];
  const lower = query.toLowerCase();

  async function walk(dirPath) {
    if (results.length >= maxResults) return;

    let items;
    try {
      items = await fs.readdir(dirPath, { withFileTypes: true });
    } catch {
      return;
    }

    for (const item of items) {
      if (results.length >= maxResults) return;
      if (IGNORED.has(item.name) || item.name.startsWith('.')) continue;

      const fullPath = path.join(dirPath, item.name);
      if (item.isDirectory()) {
        await walk(fullPath);
        continue;
      }

      try {
        const content = await fs.readFile(fullPath, 'utf-8');
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (results.length >= maxResults) return;
          if (lines[i].toLowerCase().includes(lower)) {
            results.push({
              file: fullPath,
              line: i + 1,
              text: lines[i].trim(),
            });
          }
        }
      } catch {
        // skip binary or unreadable files
      }
    }
  }

  await walk(rootPath);
  runtimeLog.info('fileSystem', 'search', { query, count: results.length });
  return results;
}

export async function replaceInFiles(rootPath, query, replacement) {
  if (!query) return { changed: 0, files: [] };
  const matches = await searchInFiles(rootPath, query, 500);
  const byFile = new Map();
  for (const m of matches) {
    if (!byFile.has(m.file)) byFile.set(m.file, []);
    byFile.get(m.file).push(m);
  }

  const files = [];
  for (const [filePath] of byFile) {
    const content = await fs.readFile(filePath, 'utf-8');
    if (!content.includes(query)) continue;
    const next = content.split(query).join(replacement);
    await fs.writeFile(filePath, next, 'utf-8');
    files.push(filePath);
  }

  runtimeLog.info('fileSystem', 'replace in files', {
    query,
    replacement,
    files: files.length,
  });
  return { changed: files.length, files };
}

/* ── Menu-facing actions ─────────────────────────────────────────── */

export function newFile(win, workspaceRoot) {
  return dispatch(win, 'file.newFile', { workspaceRoot: workspaceRoot || null });
}

export function newWindow() {
  runtimeLog.info('fileSystem', 'new window');
  // Handled by main process createMainWindow(forceNew)
  return { action: 'file.newWindow' };
}

export async function openFileDialog(win) {
  const result = await dialog.showOpenDialog(win, {
    properties: ['openFile'],
    filters: [{ name: 'All Files', extensions: ['*'] }],
  });
  if (result.canceled || !result.filePaths[0]) return null;
  const data = await readFile(result.filePaths[0]);
  dispatch(win, 'file.openFile', data);
  return data;
}

export async function openFolderDialog(win) {
  const result = await dialog.showOpenDialog(win, {
    properties: ['openDirectory'],
  });
  if (result.canceled || !result.filePaths[0]) return null;
  const tree = await readDirectoryTree(result.filePaths[0]);
  dispatch(win, 'file.openFolder', tree);
  return tree;
}

export async function openRecent(win, rootPath) {
  const tree = await readDirectoryTree(rootPath);
  dispatch(win, 'file.openFolder', tree);
  return tree;
}

export function save(win) {
  return dispatch(win, 'file.save');
}

export async function saveAs(win, currentPath, content) {
  const result = await dialog.showSaveDialog(win, {
    defaultPath: currentPath || undefined,
  });
  if (result.canceled || !result.filePath) return null;
  await writeFile(result.filePath, content ?? '');
  const data = await readFile(result.filePath);
  dispatch(win, 'file.saveAs', data);
  return data;
}

export function saveAll(win) {
  return dispatch(win, 'file.saveAll');
}

export function toggleAutoSave(win) {
  return dispatch(win, 'file.toggleAutoSave');
}

export function closeEditor(win) {
  return dispatch(win, 'file.closeEditor');
}

export function closeFolder(win) {
  return dispatch(win, 'file.closeFolder');
}

export function openPreferences(win, section = 'settings') {
  return dispatch(win, 'file.preferences', { section });
}

export function exitApp() {
  runtimeLog.info('fileSystem', 'exit');
  app.quit();
}

function extToLanguage(ext) {
  const map = {
    js: 'javascript',
    mjs: 'javascript',
    cjs: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    py: 'python',
    pyw: 'python',
    json: 'json',
    jsonc: 'json',
    html: 'html',
    htm: 'html',
    css: 'css',
    scss: 'scss',
    less: 'less',
    md: 'markdown',
    markdown: 'markdown',
    sql: 'sql',
    sh: 'shell',
    bash: 'shell',
    zsh: 'shell',
    ps1: 'powershell',
    yml: 'yaml',
    yaml: 'yaml',
    xml: 'xml',
    svg: 'xml',
    go: 'go',
    rs: 'rust',
    java: 'java',
    kt: 'kotlin',
    kts: 'kotlin',
    cpp: 'cpp',
    cc: 'cpp',
    cxx: 'cpp',
    h: 'c',
    hpp: 'cpp',
    c: 'c',
    cs: 'csharp',
    php: 'php',
    rb: 'ruby',
    swift: 'swift',
    r: 'r',
    lua: 'lua',
    pl: 'perl',
    pm: 'perl',
    scala: 'scala',
    dart: 'dart',
    vue: 'html',
    svelte: 'html',
    graphql: 'graphql',
    gql: 'graphql',
    dockerfile: 'dockerfile',
    toml: 'ini',
    ini: 'ini',
    conf: 'ini',
    env: 'ini',
    bat: 'bat',
    cmd: 'bat',
    groovy: 'groovy',
    gradle: 'groovy',
    clj: 'clojure',
    cljs: 'clojure',
    fs: 'fsharp',
    fsx: 'fsharp',
    vb: 'vb',
    coffee: 'coffeescript',
    proto: 'protobuf',
    tf: 'hcl',
    hcl: 'hcl',
    ex: 'elixir',
    exs: 'elixir',
    erl: 'erlang',
    hs: 'haskell',
    ml: 'ocaml',
    mli: 'ocaml',
    nim: 'nim',
    zig: 'zig',
    v: 'verilog',
    sv: 'systemverilog',
    asm: 'asm',
    s: 'asm',
    txt: 'plaintext',
    log: 'plaintext',
  };
  const key = (ext || '').toLowerCase();
  return map[key] || 'plaintext';
}

export function getFocusedWindow(fallback) {
  return BrowserWindow.getFocusedWindow() || fallback;
}
