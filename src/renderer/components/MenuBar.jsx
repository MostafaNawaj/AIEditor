import React, { useState, useEffect, useRef } from 'react';

const MENUS = [
  {
    label: 'File',
    items: [
      { label: 'New File', action: 'file.newFile', shortcut: 'Ctrl+N' },
      { label: 'New Window', action: 'file.newWindow', shortcut: 'Ctrl+Shift+N' },
      { label: 'New Project', action: 'file.newProject' },
      { type: 'separator' },
      { label: 'Open File…', action: 'file.openFile', shortcut: 'Ctrl+Alt+O' },
      { label: 'Open Folder / Workspace…', action: 'file.openFolder', shortcut: 'Ctrl+O' },
      {
        label: 'Open Recent',
        submenu: 'recent',
      },
      { type: 'separator' },
      { label: 'Save', action: 'file.save', shortcut: 'Ctrl+S' },
      { label: 'Save As…', action: 'file.saveAs', shortcut: 'Ctrl+Shift+S' },
      { label: 'Save All', action: 'file.saveAll' },
      { label: 'Auto Save', action: 'file.toggleAutoSave', checkbox: true },
      { type: 'separator' },
      { label: 'Close Editor', action: 'file.closeEditor', shortcut: 'Ctrl+W' },
      { label: 'Close Folder / Workspace', action: 'file.closeFolder' },
      { type: 'separator' },
      {
        label: 'Preferences',
        submenu: [
          { label: 'Settings', action: 'file.preferences.settings', shortcut: 'Ctrl+,' },
          { label: 'Keyboard Shortcuts', action: 'file.preferences.keyboard' },
          { label: 'Extensions', action: 'file.preferences.extensions' },
        ],
      },
      { type: 'separator' },
      { label: 'Exit', action: 'file.exit' },
    ],
  },
  {
    label: 'Edit',
    items: [
      { label: 'Undo', action: 'edit.undo', shortcut: 'Ctrl+Z' },
      { label: 'Redo', action: 'edit.redo', shortcut: 'Ctrl+Y' },
      { type: 'separator' },
      { label: 'Cut', action: 'edit.cut', shortcut: 'Ctrl+X' },
      { label: 'Copy', action: 'edit.copy', shortcut: 'Ctrl+C' },
      { label: 'Paste', action: 'edit.paste', shortcut: 'Ctrl+V' },
      { type: 'separator' },
      { label: 'Find', action: 'edit.find', shortcut: 'Ctrl+F' },
      { label: 'Replace', action: 'edit.replace', shortcut: 'Ctrl+H' },
      { label: 'Replace in Files', action: 'edit.replaceInFiles' },
      { label: 'Find in Files', action: 'edit.findInFiles', shortcut: 'Ctrl+Shift+F' },
      { type: 'separator' },
      { label: 'Select All', action: 'edit.selectAll', shortcut: 'Ctrl+A' },
      {
        label: 'Indentation',
        submenu: [
          { label: 'Indent Line', action: 'edit.indentLine' },
          { label: 'Outdent Line', action: 'edit.outdentLine' },
        ],
      },
      { label: 'Toggle Line Comment', action: 'edit.toggleLineComment', shortcut: 'Ctrl+/' },
      { label: 'Toggle Block Comment', action: 'edit.toggleBlockComment' },
      { label: 'Format Document', action: 'edit.formatDocument', shortcut: 'Shift+Alt+F' },
      { label: 'Format Selection', action: 'edit.formatSelection' },
      { label: 'Rename Symbol', action: 'edit.renameSymbol', shortcut: 'F2' },
    ],
  },
  {
    label: 'Selection',
    items: [
      { label: 'Select All', action: 'selection.selectAll' },
      { label: 'Expand Selection', action: 'selection.expand' },
      { label: 'Shrink Selection', action: 'selection.shrink' },
      { label: 'Copy Selection', action: 'selection.copy' },
      { label: 'Column Selection Mode', action: 'selection.columnMode' },
      { type: 'separator' },
      { label: 'Add Cursor Above', action: 'selection.addCursorAbove' },
      { label: 'Add Cursor Below', action: 'selection.addCursorBelow' },
      { label: 'Add Cursor to Line Ends', action: 'selection.addCursorToLineEnds' },
      { type: 'separator' },
      { label: 'Select Current Word', action: 'selection.selectWord' },
      { label: 'Select Current Line', action: 'selection.selectLine' },
      { type: 'separator' },
      {
        label: 'Multi-cursor editing',
        submenu: [
          { label: 'Add Selection to Next Find Match', action: 'selection.addNextOccurrence', shortcut: 'Ctrl+D' },
          { label: 'Select All Occurrences', action: 'selection.selectHighlights' },
          { label: 'Undo Last Cursor Operation', action: 'selection.multiCursorUndo' },
        ],
      },
    ],
  },
  {
    label: 'View',
    items: [
      { label: 'Command Palette…', action: 'view.commandPalette', shortcut: 'Ctrl+Shift+P' },
      { type: 'separator' },
      { label: 'Explorer', action: 'view.explorer' },
      { label: 'Search', action: 'view.search' },
      { label: 'Source Control (Git)', action: 'view.sourceControl' },
      { label: 'Run & Debug', action: 'view.runAndDebug' },
      { label: 'Extensions', action: 'view.extensions' },
      { type: 'separator' },
      {
        label: 'Appearance',
        submenu: [
          { label: 'Show Side Bar', action: 'view.toggleSideBar', shortcut: 'Ctrl+B' },
          { label: 'Show Status Bar', action: 'view.toggleStatusBar' },
          { label: 'Show Activity Bar', action: 'view.toggleActivityBar' },
          { label: 'Show Panel', action: 'view.togglePanel', shortcut: 'Ctrl+J' },
          { label: 'Toggle Full Screen', action: 'view.toggleFullScreen', shortcut: 'F11' },
          { label: 'Zen Mode', action: 'view.zenMode' },
          { label: 'Centered Layout', action: 'view.centeredLayout' },
        ],
      },
      { type: 'separator' },
      { label: 'Zoom In', action: 'view.zoomIn' },
      { label: 'Zoom Out', action: 'view.zoomOut' },
      { label: 'Reset Zoom', action: 'view.resetZoom' },
      { type: 'separator' },
      { label: 'Toggle Word Wrap', action: 'view.toggleWordWrap' },
      { label: 'Toggle Minimap', action: 'view.toggleMinimap' },
      { label: 'Toggle Breadcrumbs', action: 'view.toggleBreadcrumbs' },
    ],
  },
  {
    label: 'Go',
    items: [
      { label: 'Back', action: 'go.back' },
      { label: 'Forward', action: 'go.forward' },
      { type: 'separator' },
      { label: 'Navigate to File…', action: 'go.navigateToFile', shortcut: 'Ctrl+P' },
      { label: 'Navigate to Symbol…', action: 'go.navigateToSymbol' },
      { label: 'Navigate to Line / Column…', action: 'go.navigateToLine', shortcut: 'Ctrl+G' },
      { type: 'separator' },
      { label: 'Go to Definition', action: 'go.definition', shortcut: 'F12' },
      { label: 'Go to Declaration', action: 'go.declaration' },
      { label: 'Go to Implementation', action: 'go.implementation' },
      { label: 'Go to References', action: 'go.references' },
      { label: 'Go to Type Definition', action: 'go.typeDefinition' },
      { type: 'separator' },
      { label: 'Next Problem', action: 'go.nextProblem', shortcut: 'F8' },
      { label: 'Previous Problem', action: 'go.previousProblem' },
      { label: 'Next Change', action: 'go.nextChange' },
      { label: 'Previous Change', action: 'go.previousChange' },
      { type: 'separator' },
      {
        label: 'Switch Editor Tab',
        submenu: [
          { label: 'Next Tab', action: 'go.switchTab', payload: { direction: 'next' } },
          { label: 'Previous Tab', action: 'go.switchTab', payload: { direction: 'prev' } },
        ],
      },
      { label: 'Navigate History', action: 'go.navigateHistory' },
    ],
  },
  {
    label: 'Run',
    items: [
      { label: 'Run Without Debugging', action: 'run.withoutDebug', shortcut: 'Ctrl+F5' },
      { label: 'Start Debugging', action: 'run.startDebug', shortcut: 'F5' },
      { label: 'Stop Debugging', action: 'run.stopDebug', shortcut: 'Shift+F5' },
      { label: 'Restart Debugging', action: 'run.restartDebug' },
      { type: 'separator' },
      { label: 'Step Over', action: 'run.stepOver', shortcut: 'F10' },
      { label: 'Step Into', action: 'run.stepInto' },
      { label: 'Step Out', action: 'run.stepOut' },
      { label: 'Continue', action: 'run.continue' },
      { type: 'separator' },
      { label: 'Toggle Breakpoint', action: 'run.toggleBreakpoint', shortcut: 'F9' },
      { label: 'Enable/Disable Breakpoint', action: 'run.enableBreakpoint' },
      { label: 'Remove Breakpoint', action: 'run.removeBreakpoint' },
      { type: 'separator' },
      { label: 'Run Task…', action: 'run.task' },
      { label: 'Configure Tasks…', action: 'run.configureTasks' },
      { label: 'Run Build Task', action: 'run.build', shortcut: 'Ctrl+Shift+B' },
      { label: 'Run Test Task', action: 'run.test' },
    ],
  },
  {
    label: 'Terminal',
    items: [
      { label: 'New Terminal', action: 'terminal.new' },
      { label: 'Split Terminal', action: 'terminal.split' },
      { label: 'Kill Terminal', action: 'terminal.kill' },
      { label: 'Rename Terminal…', action: 'terminal.rename' },
      {
        label: 'Switch Terminal',
        submenu: [
          { label: 'PowerShell', action: 'terminal.switch', payload: { shellId: 'powershell' } },
          { label: 'CMD', action: 'terminal.switch', payload: { shellId: 'cmd' } },
          { label: 'Bash', action: 'terminal.switch', payload: { shellId: 'bash' } },
          { label: 'Zsh', action: 'terminal.switch', payload: { shellId: 'zsh' } },
        ],
      },
      { type: 'separator' },
      { label: 'Run Active File', action: 'terminal.runActiveFile' },
      { label: 'Run Selected Text', action: 'terminal.runSelected' },
      { label: 'Clear Terminal', action: 'terminal.clear' },
      {
        label: 'Copy/Paste in Terminal',
        submenu: [
          { label: 'Copy', action: 'terminal.copy' },
          { label: 'Paste', action: 'terminal.paste' },
        ],
      },
      { type: 'separator' },
      { label: 'Toggle Terminal Panel', action: 'terminal.toggle', shortcut: 'Ctrl+`' },
    ],
  },
  {
    label: 'Help',
    items: [
      { label: 'Welcome / Getting Started', action: 'help.welcome' },
      { label: 'Documentation', action: 'help.docs' },
      { label: 'Keyboard Shortcuts Reference', action: 'help.shortcuts' },
      { label: 'Tips and Tricks', action: 'help.tips' },
      { label: 'Release Notes', action: 'help.releaseNotes' },
      { type: 'separator' },
      { label: 'Report Issue', action: 'help.issue' },
      { label: 'View License', action: 'help.license' },
      { type: 'separator' },
      { label: 'About', action: 'help.about' },
    ],
  },
];

function MenuItems({ items, recent, autoSave, onAction, onClose }) {
  return (
    <ul className="menu-dropdown">
      {items.map((item, i) => {
        if (item.type === 'separator') {
          return <li key={`sep-${i}`} className="menu-separator" />;
        }

        if (item.submenu === 'recent') {
          const recentItems = (recent || []).map((path) => ({
            label: path,
            action: 'file.openRecent',
            payload: { path },
          }));
          return (
            <li key={item.label} className="menu-item has-submenu">
              <span>{item.label}</span>
              <span className="menu-arrow">▸</span>
              <MenuItems
                items={recentItems.length ? recentItems : [{ label: 'No Recent Workspaces', action: null }]}
                onAction={onAction}
                onClose={onClose}
              />
            </li>
          );
        }

        if (Array.isArray(item.submenu)) {
          return (
            <li key={item.label} className="menu-item has-submenu">
              <span>{item.label}</span>
              <span className="menu-arrow">▸</span>
              <MenuItems items={item.submenu} onAction={onAction} onClose={onClose} />
            </li>
          );
        }

        return (
          <li key={`${item.label}-${i}`}>
            <button
              type="button"
              className="menu-item-btn"
              disabled={!item.action}
              onClick={() => {
                if (!item.action) return;
                onAction(item.action, item.payload);
                onClose();
              }}
            >
              <span>
                {item.checkbox ? (autoSave ? '✓ ' : '  ') : ''}
                {item.label}
              </span>
              {item.shortcut && <span className="menu-shortcut">{item.shortcut}</span>}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export default function MenuBar({ onAction, recent = [], autoSave = false }) {
  const [openMenu, setOpenMenu] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    const onDoc = (e) => {
      if (!ref.current?.contains(e.target)) setOpenMenu(null);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const run = (action, payload) => {
    if (window.aieditor?.invokeMenuAction) {
      window.aieditor.invokeMenuAction(action, payload || {});
    } else {
      onAction?.(action, payload || {});
    }
  };

  return (
    <nav className="menu-bar" ref={ref}>
      {MENUS.map((menu) => (
        <div
          key={menu.label}
          className={`menu-bar-item ${openMenu === menu.label ? 'open' : ''}`}
          onMouseEnter={() => openMenu && setOpenMenu(menu.label)}
        >
          <button
            type="button"
            className="menu-bar-label"
            onClick={() => setOpenMenu(openMenu === menu.label ? null : menu.label)}
          >
            {menu.label}
          </button>
          {openMenu === menu.label && (
            <MenuItems
              items={menu.items}
              recent={recent}
              autoSave={autoSave}
              onAction={run}
              onClose={() => setOpenMenu(null)}
            />
          )}
        </div>
      ))}
    </nav>
  );
}
