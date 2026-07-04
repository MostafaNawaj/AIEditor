import { dialog, shell, app } from 'electron';
import { dispatch } from './dispatch.js';
import { runtimeLog } from './runtimeLog.js';

const DOCS_URL = 'https://github.com/aieditor/aieditor#readme';
const ISSUES_URL = 'https://github.com/aieditor/aieditor/issues';

export function welcome(win) {
  return dispatch(win, 'help.welcome');
}

export function documentation(win) {
  runtimeLog.info('help', 'open documentation');
  shell.openExternal(DOCS_URL);
  return dispatch(win, 'help.documentation', { url: DOCS_URL });
}

export function keyboardShortcutsReference(win) {
  return dispatch(win, 'help.keyboardShortcuts');
}

export function tipsAndTricks(win) {
  return dispatch(win, 'help.tips');
}

export function releaseNotes(win) {
  return dispatch(win, 'help.releaseNotes');
}

export function reportIssue(win) {
  runtimeLog.info('help', 'report issue');
  shell.openExternal(ISSUES_URL);
  return dispatch(win, 'help.reportIssue', { url: ISSUES_URL });
}

export function viewLicense(win) {
  return dispatch(win, 'help.license');
}

export function about(win) {
  const version = app.getVersion();
  runtimeLog.info('help', 'about', { version });
  dialog.showMessageBox(win, {
    type: 'info',
    title: 'About AIEditor',
    message: 'AIEditor',
    detail: [
      `Version: ${version}`,
      'AI-powered code editor built with Electron, React, and Monaco.',
      '',
      'Credits: Electron, Monaco Editor, xterm.js, React',
    ].join('\n'),
    buttons: ['OK'],
  });
  return dispatch(win, 'help.about', { version });
}

export function getShortcutsList() {
  return [
    { keys: 'Ctrl+N', action: 'New File' },
    { keys: 'Ctrl+O', action: 'Open Folder' },
    { keys: 'Ctrl+P', action: 'Navigate to File' },
    { keys: 'Ctrl+S', action: 'Save' },
    { keys: 'Ctrl+Shift+S', action: 'Save As' },
    { keys: 'Ctrl+Shift+P', action: 'Command Palette' },
    { keys: 'Ctrl+`', action: 'Toggle Terminal' },
    { keys: 'Ctrl+B', action: 'Toggle Side Bar' },
    { keys: 'Ctrl+J', action: 'Toggle Panel' },
    { keys: 'Ctrl+F', action: 'Find' },
    { keys: 'Ctrl+H', action: 'Replace' },
    { keys: 'Ctrl+Shift+F', action: 'Find in Files' },
    { keys: 'F5', action: 'Start Debugging' },
    { keys: 'Ctrl+F5', action: 'Run Without Debugging' },
    { keys: 'F9', action: 'Toggle Breakpoint' },
    { keys: 'Ctrl+/', action: 'Toggle Line Comment' },
    { keys: 'Shift+Alt+F', action: 'Format Document' },
    { keys: 'Ctrl+L', action: 'Toggle AI Panel' },
  ];
}

export function getReleaseNotes() {
  return [
    '## AIEditor ' + app.getVersion(),
    '',
    '### Highlights',
    '- Full application menu (File, Edit, Selection, View, Go, Run, Terminal, Help)',
    '- Integrated terminal with line editing and shell switching',
    '- Problems, Output, Debug Console, and Ports panels',
    '- AI assistant with Run / Allow / Undo / Keep All approval workflow',
    '- Runtime logs streamed into AI context for debugging',
  ].join('\n');
}

export function getTips() {
  return [
    'Use Ctrl+Shift+P to open the Command Palette.',
    'Open a folder (Ctrl+O) to enable search, SCM, and tasks.',
    'Ask the AI with @file to include the current buffer.',
    'Use Run → Configure Tasks to create .vscode/tasks.json.',
    'Toggle Zen Mode from View → Appearance for focus.',
    'Terminal supports Backspace, Ctrl+W (delete word), and Ctrl+U (clear line).',
  ];
}

export function getLicenseText() {
  return [
    'MIT License',
    '',
    'Copyright (c) 2026 AIEditor',
    '',
    'Permission is hereby granted, free of charge, to any person obtaining a copy',
    'of this software and associated documentation files (the "Software"), to deal',
    'in the Software without restriction, including without limitation the rights',
    'to use, copy, modify, merge, publish, distribute, sublicense, and/or sell',
    'copies of the Software, and to permit persons to whom the Software is',
    'furnished to do so, subject to the following conditions:',
    '',
    'The above copyright notice and this permission notice shall be included in all',
    'copies or substantial portions of the Software.',
  ].join('\n');
}
