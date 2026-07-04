import { Menu, app } from 'electron';
import * as fileSystem from './fileSystem.js';
import * as editorActions from './editorActions.js';
import * as selectionManager from './selectionManager.js';
import * as uiManager from './uiManager.js';
import * as navigation from './navigation.js';
import * as debugManager from './debugManager.js';
import * as terminalManager from './terminalManager.js';
import * as helpManager from './helpManager.js';

function winOf(focused, fallback) {
  return focused || fallback;
}

/**
 * Build and install the application menu. Every item calls a real backend module.
 */
export async function setupMenu(mainWindow, options = {}) {
  const { onNewWindow, getWorkspace, getActiveFile } = options;

  const w = (focused) => winOf(focused, mainWindow);
  const workspace = () => getWorkspace?.(mainWindow) || null;
  const activeFile = () => getActiveFile?.(mainWindow) || null;
  const recent = await fileSystem.getRecentWorkspaces();

  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New File',
          accelerator: 'CmdOrCtrl+N',
          click: (_i, fw) => fileSystem.newFile(w(fw), workspace()),
        },
        {
          label: 'New Window',
          accelerator: 'CmdOrCtrl+Shift+N',
          click: () => {
            fileSystem.newWindow();
            onNewWindow?.();
          },
        },
        {
          label: 'New Project',
          click: (_i, fw) => fileSystem.openFolderDialog(w(fw)),
        },
        { type: 'separator' },
        {
          label: 'Open File…',
          accelerator: 'CmdOrCtrl+Alt+O',
          click: (_i, fw) => fileSystem.openFileDialog(w(fw)),
        },
        {
          label: 'Open Folder / Workspace…',
          accelerator: 'CmdOrCtrl+O',
          click: (_i, fw) => fileSystem.openFolderDialog(w(fw)),
        },
        {
          label: 'Open Recent',
          id: 'open-recent',
          submenu: recent.length
            ? recent.map((rootPath) => ({
                label: rootPath,
                click: (_i, fw) => fileSystem.openRecent(w(fw), rootPath),
              }))
            : [{ label: 'No Recent Workspaces', enabled: false }],
        },
        { type: 'separator' },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: (_i, fw) => fileSystem.save(w(fw)),
        },
        {
          label: 'Save As…',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: async (_i, fw) => {
            const file = activeFile();
            await fileSystem.saveAs(w(fw), file?.path, file?.content);
          },
        },
        {
          label: 'Save All',
          accelerator: 'CmdOrCtrl+Alt+S',
          click: (_i, fw) => fileSystem.saveAll(w(fw)),
        },
        {
          label: 'Auto Save',
          type: 'checkbox',
          checked: false,
          click: (_i, fw) => fileSystem.toggleAutoSave(w(fw)),
        },
        { type: 'separator' },
        {
          label: 'Close Editor',
          accelerator: 'CmdOrCtrl+W',
          click: (_i, fw) => fileSystem.closeEditor(w(fw)),
        },
        {
          label: 'Close Folder / Workspace',
          click: (_i, fw) => fileSystem.closeFolder(w(fw)),
        },
        { type: 'separator' },
        {
          label: 'Preferences',
          submenu: [
            {
              label: 'Settings',
              accelerator: 'CmdOrCtrl+,',
              click: (_i, fw) => fileSystem.openPreferences(w(fw), 'settings'),
            },
            {
              label: 'Keyboard Shortcuts',
              accelerator: 'CmdOrCtrl+K CmdOrCtrl+S',
              click: (_i, fw) => fileSystem.openPreferences(w(fw), 'keyboard'),
            },
            {
              label: 'Extensions',
              accelerator: 'CmdOrCtrl+Shift+X',
              click: (_i, fw) => fileSystem.openPreferences(w(fw), 'extensions'),
            },
          ],
        },
        { type: 'separator' },
        {
          label: process.platform === 'darwin' ? 'Quit' : 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Alt+F4',
          click: () => fileSystem.exitApp(),
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'CmdOrCtrl+Z', click: (_i, fw) => editorActions.undo(w(fw)) },
        { label: 'Redo', accelerator: 'CmdOrCtrl+Y', click: (_i, fw) => editorActions.redo(w(fw)) },
        { type: 'separator' },
        { label: 'Cut', accelerator: 'CmdOrCtrl+X', click: (_i, fw) => editorActions.cut(w(fw)) },
        { label: 'Copy', accelerator: 'CmdOrCtrl+C', click: (_i, fw) => editorActions.copy(w(fw)) },
        { label: 'Paste', accelerator: 'CmdOrCtrl+V', click: (_i, fw) => editorActions.paste(w(fw)) },
        { type: 'separator' },
        { label: 'Find', accelerator: 'CmdOrCtrl+F', click: (_i, fw) => editorActions.find(w(fw)) },
        { label: 'Replace', accelerator: 'CmdOrCtrl+H', click: (_i, fw) => editorActions.replace(w(fw)) },
        {
          label: 'Replace in Files',
          accelerator: 'CmdOrCtrl+Shift+H',
          click: (_i, fw) => editorActions.replaceInFiles(w(fw)),
        },
        {
          label: 'Find in Files',
          accelerator: 'CmdOrCtrl+Shift+F',
          click: (_i, fw) => editorActions.findInFiles(w(fw)),
        },
        { type: 'separator' },
        { label: 'Select All', accelerator: 'CmdOrCtrl+A', click: (_i, fw) => editorActions.selectAll(w(fw)) },
        {
          label: 'Indentation',
          submenu: [
            { label: 'Indent Line', accelerator: 'CmdOrCtrl+]', click: (_i, fw) => editorActions.indentLine(w(fw)) },
            { label: 'Outdent Line', accelerator: 'CmdOrCtrl+[', click: (_i, fw) => editorActions.outdentLine(w(fw)) },
          ],
        },
        {
          label: 'Toggle Line Comment',
          accelerator: 'CmdOrCtrl+/',
          click: (_i, fw) => editorActions.toggleLineComment(w(fw)),
        },
        {
          label: 'Toggle Block Comment',
          accelerator: 'Shift+Alt+A',
          click: (_i, fw) => editorActions.toggleBlockComment(w(fw)),
        },
        {
          label: 'Format Document',
          accelerator: 'Shift+Alt+F',
          click: (_i, fw) => editorActions.formatDocument(w(fw)),
        },
        {
          label: 'Format Selection',
          accelerator: 'CmdOrCtrl+K CmdOrCtrl+F',
          click: (_i, fw) => editorActions.formatSelection(w(fw)),
        },
        {
          label: 'Rename Symbol',
          accelerator: 'F2',
          click: (_i, fw) => editorActions.renameSymbol(w(fw)),
        },
      ],
    },
    {
      label: 'Selection',
      submenu: [
        { label: 'Select All', accelerator: 'CmdOrCtrl+A', click: (_i, fw) => selectionManager.selectAll(w(fw)) },
        {
          label: 'Expand Selection',
          accelerator: 'Shift+Alt+Right',
          click: (_i, fw) => selectionManager.expandSelection(w(fw)),
        },
        {
          label: 'Shrink Selection',
          accelerator: 'Shift+Alt+Left',
          click: (_i, fw) => selectionManager.shrinkSelection(w(fw)),
        },
        { label: 'Copy Selection', click: (_i, fw) => selectionManager.copySelection(w(fw)) },
        {
          label: 'Column Selection Mode',
          accelerator: 'CmdOrCtrl+Shift+Alt+Insert',
          type: 'checkbox',
          click: (_i, fw) => selectionManager.toggleColumnSelection(w(fw)),
        },
        { type: 'separator' },
        {
          label: 'Add Cursor Above',
          accelerator: 'CmdOrCtrl+Alt+Up',
          click: (_i, fw) => selectionManager.addCursorAbove(w(fw)),
        },
        {
          label: 'Add Cursor Below',
          accelerator: 'CmdOrCtrl+Alt+Down',
          click: (_i, fw) => selectionManager.addCursorBelow(w(fw)),
        },
        {
          label: 'Add Cursor to Line Ends',
          accelerator: 'Shift+Alt+I',
          click: (_i, fw) => selectionManager.addCursorToLineEnds(w(fw)),
        },
        { type: 'separator' },
        { label: 'Select Current Word', click: (_i, fw) => selectionManager.selectCurrentWord(w(fw)) },
        {
          label: 'Select Current Line',
          accelerator: 'CmdOrCtrl+L',
          click: (_i, fw) => selectionManager.selectCurrentLine(w(fw)),
        },
        { type: 'separator' },
        {
          label: 'Multi-cursor editing',
          submenu: [
            {
              label: 'Add Selection to Next Find Match',
              accelerator: 'CmdOrCtrl+D',
              click: (_i, fw) => selectionManager.addSelectionToNextFindMatch(w(fw)),
            },
            {
              label: 'Select All Occurrences',
              accelerator: 'CmdOrCtrl+Shift+L',
              click: (_i, fw) => selectionManager.selectHighlights(w(fw)),
            },
            {
              label: 'Undo Last Cursor Operation',
              click: (_i, fw) => selectionManager.multiCursorUndo(w(fw)),
            },
          ],
        },
      ],
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Command Palette…',
          accelerator: 'CmdOrCtrl+Shift+P',
          click: (_i, fw) => uiManager.commandPalette(w(fw)),
        },
        { type: 'separator' },
        { label: 'Explorer', accelerator: 'CmdOrCtrl+Shift+E', click: (_i, fw) => uiManager.showExplorer(w(fw)) },
        { label: 'Search', accelerator: 'CmdOrCtrl+Shift+F', click: (_i, fw) => uiManager.showSearch(w(fw)) },
        {
          label: 'Source Control (Git)',
          accelerator: 'CmdOrCtrl+Shift+G',
          click: (_i, fw) => uiManager.showSourceControl(w(fw)),
        },
        {
          label: 'Run & Debug',
          accelerator: 'CmdOrCtrl+Shift+D',
          click: (_i, fw) => uiManager.showRunAndDebug(w(fw)),
        },
        {
          label: 'Extensions',
          accelerator: 'CmdOrCtrl+Shift+X',
          click: (_i, fw) => uiManager.showExtensions(w(fw)),
        },
        { type: 'separator' },
        {
          label: 'Appearance',
          submenu: [
            { label: 'Show Side Bar', accelerator: 'CmdOrCtrl+B', click: (_i, fw) => uiManager.toggleSideBar(w(fw)) },
            { label: 'Show Status Bar', click: (_i, fw) => uiManager.toggleStatusBar(w(fw)) },
            { label: 'Show Activity Bar', click: (_i, fw) => uiManager.toggleActivityBar(w(fw)) },
            { label: 'Show Panel', accelerator: 'CmdOrCtrl+J', click: (_i, fw) => uiManager.togglePanel(w(fw)) },
            {
              label: 'Toggle Full Screen',
              accelerator: 'F11',
              click: (_i, fw) => uiManager.toggleFullScreen(w(fw)),
            },
            { label: 'Zen Mode', accelerator: 'CmdOrCtrl+K Z', click: (_i, fw) => uiManager.toggleZenMode(w(fw)) },
            { label: 'Centered Layout', click: (_i, fw) => uiManager.toggleCenteredLayout(w(fw)) },
          ],
        },
        { type: 'separator' },
        { label: 'Zoom In', accelerator: 'CmdOrCtrl+=', click: (_i, fw) => uiManager.zoomIn(w(fw)) },
        { label: 'Zoom Out', accelerator: 'CmdOrCtrl+-', click: (_i, fw) => uiManager.zoomOut(w(fw)) },
        { label: 'Reset Zoom', accelerator: 'CmdOrCtrl+0', click: (_i, fw) => uiManager.resetZoom(w(fw)) },
        { type: 'separator' },
        { label: 'Toggle Word Wrap', accelerator: 'Alt+Z', click: (_i, fw) => uiManager.toggleWordWrap(w(fw)) },
        { label: 'Toggle Minimap', click: (_i, fw) => uiManager.toggleMinimap(w(fw)) },
        { label: 'Toggle Breadcrumbs', click: (_i, fw) => uiManager.toggleBreadcrumbs(w(fw)) },
        { type: 'separator' },
        { role: 'toggleDevTools' },
        { role: 'reload' },
      ],
    },
    {
      label: 'Go',
      submenu: [
        { label: 'Back', accelerator: 'Alt+Left', click: (_i, fw) => navigation.back(w(fw)) },
        { label: 'Forward', accelerator: 'Alt+Right', click: (_i, fw) => navigation.forward(w(fw)) },
        { type: 'separator' },
        {
          label: 'Navigate to File…',
          accelerator: 'CmdOrCtrl+P',
          click: (_i, fw) => navigation.navigateToFile(w(fw)),
        },
        {
          label: 'Navigate to Symbol…',
          accelerator: 'CmdOrCtrl+Shift+O',
          click: (_i, fw) => navigation.navigateToSymbol(w(fw)),
        },
        {
          label: 'Navigate to Line / Column…',
          accelerator: 'CmdOrCtrl+G',
          click: (_i, fw) => navigation.navigateToLine(w(fw)),
        },
        { type: 'separator' },
        { label: 'Go to Definition', accelerator: 'F12', click: (_i, fw) => navigation.goToDefinition(w(fw)) },
        { label: 'Go to Declaration', click: (_i, fw) => navigation.goToDeclaration(w(fw)) },
        {
          label: 'Go to Implementation',
          accelerator: 'CmdOrCtrl+F12',
          click: (_i, fw) => navigation.goToImplementation(w(fw)),
        },
        {
          label: 'Go to References',
          accelerator: 'Shift+F12',
          click: (_i, fw) => navigation.goToReferences(w(fw)),
        },
        { label: 'Go to Type Definition', click: (_i, fw) => navigation.goToTypeDefinition(w(fw)) },
        { type: 'separator' },
        { label: 'Next Problem', accelerator: 'F8', click: (_i, fw) => navigation.nextProblem(w(fw)) },
        {
          label: 'Previous Problem',
          accelerator: 'Shift+F8',
          click: (_i, fw) => navigation.previousProblem(w(fw)),
        },
        { label: 'Next Change', accelerator: 'Alt+F3', click: (_i, fw) => navigation.nextChange(w(fw)) },
        {
          label: 'Previous Change',
          accelerator: 'Shift+Alt+F3',
          click: (_i, fw) => navigation.previousChange(w(fw)),
        },
        { type: 'separator' },
        {
          label: 'Switch Editor Tab',
          submenu: [
            {
              label: 'Next Tab',
              accelerator: 'CmdOrCtrl+Tab',
              click: (_i, fw) => navigation.switchEditorTab(w(fw), 'next'),
            },
            {
              label: 'Previous Tab',
              accelerator: 'CmdOrCtrl+Shift+Tab',
              click: (_i, fw) => navigation.switchEditorTab(w(fw), 'prev'),
            },
          ],
        },
        { label: 'Navigate History', click: (_i, fw) => navigation.navigateHistory(w(fw)) },
      ],
    },
    {
      label: 'Run',
      submenu: [
        {
          label: 'Run Without Debugging',
          accelerator: 'Ctrl+F5',
          click: (_i, fw) => {
            const file = activeFile();
            debugManager.runWithoutDebugging(w(fw), file?.path, workspace());
          },
        },
        {
          label: 'Start Debugging',
          accelerator: 'F5',
          click: (_i, fw) => {
            const file = activeFile();
            debugManager.startDebugging(w(fw), file?.path, workspace());
          },
        },
        {
          label: 'Stop Debugging',
          accelerator: 'Shift+F5',
          click: (_i, fw) => debugManager.stopDebugging(w(fw)),
        },
        {
          label: 'Restart Debugging',
          accelerator: 'Ctrl+Shift+F5',
          click: (_i, fw) => {
            const file = activeFile();
            debugManager.restartDebugging(w(fw), file?.path, workspace());
          },
        },
        { type: 'separator' },
        { label: 'Step Over', accelerator: 'F10', click: (_i, fw) => debugManager.stepOver(w(fw)) },
        { label: 'Step Into', click: (_i, fw) => debugManager.stepInto(w(fw)) },
        { label: 'Step Out', accelerator: 'Shift+F11', click: (_i, fw) => debugManager.stepOut(w(fw)) },
        { label: 'Continue', click: (_i, fw) => debugManager.continueExecution(w(fw)) },
        { type: 'separator' },
        {
          label: 'Toggle Breakpoint',
          accelerator: 'F9',
          click: (_i, fw) => {
            const file = activeFile();
            debugManager.toggleBreakpoint(w(fw), file?.path, file?.line || 1);
          },
        },
        {
          label: 'Enable/Disable Breakpoint',
          click: (_i, fw) => {
            const file = activeFile();
            debugManager.enableDisableBreakpoint(w(fw), file?.path, file?.line);
          },
        },
        {
          label: 'Remove Breakpoint',
          click: (_i, fw) => {
            const file = activeFile();
            debugManager.removeBreakpoint(w(fw), file?.path, file?.line);
          },
        },
        { type: 'separator' },
        {
          label: 'Run Task…',
          click: (_i, fw) => debugManager.runTask(w(fw), workspace()),
        },
        {
          label: 'Configure Tasks…',
          click: (_i, fw) => debugManager.configureTasks(w(fw), workspace()),
        },
        {
          label: 'Run Build Task',
          accelerator: 'CmdOrCtrl+Shift+B',
          click: (_i, fw) => debugManager.runBuildTask(w(fw), workspace()),
        },
        {
          label: 'Run Test Task',
          click: (_i, fw) => debugManager.runTestTask(w(fw), workspace()),
        },
      ],
    },
    {
      label: 'Terminal',
      submenu: [
        {
          label: 'New Terminal',
          accelerator: 'Ctrl+Shift+`',
          click: (_i, fw) => terminalManager.newTerminal(w(fw), workspace()),
        },
        { label: 'Split Terminal', click: (_i, fw) => terminalManager.splitTerminal(w(fw)) },
        { label: 'Kill Terminal', click: (_i, fw) => terminalManager.killTerminal(w(fw)) },
        { label: 'Rename Terminal…', click: (_i, fw) => terminalManager.renameTerminal(w(fw)) },
        {
          label: 'Switch Terminal',
          submenu: [
            {
              label: 'PowerShell',
              click: (_i, fw) => terminalManager.switchTerminal(w(fw), 'powershell'),
            },
            { label: 'CMD', click: (_i, fw) => terminalManager.switchTerminal(w(fw), 'cmd') },
            { label: 'Bash', click: (_i, fw) => terminalManager.switchTerminal(w(fw), 'bash') },
            { label: 'Zsh', click: (_i, fw) => terminalManager.switchTerminal(w(fw), 'zsh') },
          ],
        },
        { type: 'separator' },
        {
          label: 'Run Active File',
          click: (_i, fw) => {
            const file = activeFile();
            terminalManager.runActiveFile(w(fw), file?.path, workspace());
          },
        },
        {
          label: 'Run Selected Text',
          click: (_i, fw) => {
            const file = activeFile();
            terminalManager.runSelectedText(w(fw), file?.selection || '');
          },
        },
        { label: 'Clear Terminal', click: (_i, fw) => terminalManager.clearTerminal(w(fw)) },
        {
          label: 'Copy/Paste in Terminal',
          submenu: [
            { label: 'Copy', click: (_i, fw) => terminalManager.copyTerminal(w(fw)) },
            { label: 'Paste', click: (_i, fw) => terminalManager.pasteTerminal(w(fw)) },
          ],
        },
        { type: 'separator' },
        {
          label: 'Toggle Terminal Panel',
          accelerator: 'Ctrl+`',
          click: (_i, fw) => terminalManager.toggleTerminalPanel(w(fw)),
        },
      ],
    },
    {
      label: 'Help',
      submenu: [
        { label: 'Welcome / Getting Started', click: (_i, fw) => helpManager.welcome(w(fw)) },
        { label: 'Documentation', click: (_i, fw) => helpManager.documentation(w(fw)) },
        {
          label: 'Keyboard Shortcuts Reference',
          click: (_i, fw) => helpManager.keyboardShortcutsReference(w(fw)),
        },
        { label: 'Tips and Tricks', click: (_i, fw) => helpManager.tipsAndTricks(w(fw)) },
        { label: 'Release Notes', click: (_i, fw) => helpManager.releaseNotes(w(fw)) },
        { type: 'separator' },
        { label: 'Report Issue', click: (_i, fw) => helpManager.reportIssue(w(fw)) },
        { label: 'View License', click: (_i, fw) => helpManager.viewLicense(w(fw)) },
        { type: 'separator' },
        { label: 'About', click: (_i, fw) => helpManager.about(w(fw)) },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
  return menu;
}

export async function refreshRecentMenu(mainWindow, options = {}) {
  return setupMenu(mainWindow, options);
}

export function getMenuTemplateSummary() {
  return [
    'File', 'Edit', 'Selection', 'View', 'Go', 'Run', 'Terminal', 'Help',
  ];
}
