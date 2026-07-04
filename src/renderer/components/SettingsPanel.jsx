import React from 'react';

export default function SettingsPanel({ onClose, section = 'settings' }) {
  const title =
    section === 'keyboard'
      ? 'Keyboard Shortcuts'
      : section === 'extensions'
        ? 'Extensions'
        : 'Settings';

  return (
    <div className="settings-panel">
      <div className="settings-header">
        <span>{title}</span>
        <button type="button" onClick={onClose}>×</button>
      </div>
      <div className="settings-body">
        {section === 'keyboard' && (
          <>
            <p className="hint">Common shortcuts:</p>
            <ul className="settings-list">
              <li><kbd>Ctrl+Shift+P</kbd> Command Palette</li>
              <li><kbd>Ctrl+O</kbd> Open Folder</li>
              <li><kbd>Ctrl+S</kbd> Save</li>
              <li><kbd>Ctrl+`</kbd> Toggle Terminal</li>
              <li><kbd>F5</kbd> Start Debugging</li>
              <li><kbd>Ctrl+B</kbd> Toggle Side Bar</li>
            </ul>
            <p className="hint">Open Help → Keyboard Shortcuts Reference for the full list.</p>
          </>
        )}
        {section === 'extensions' && (
          <>
            <p className="hint">Extension marketplace is not bundled yet.</p>
            <p className="hint">Language support uses Monaco built-in grammars for common languages.</p>
          </>
        )}
        {section === 'settings' && (
          <>
            <p className="settings-label">AI API Key</p>
            <p className="hint">Edit your API key in the config file after install:</p>
            <code className="settings-path">%APPDATA%\aieditor\.env</code>
            <p className="hint" style={{ marginTop: 16 }}>
              Set <code>AI_API_KEY</code> and restart the app.
            </p>
            <p className="settings-label" style={{ marginTop: 20 }}>Editor</p>
            <p className="hint">Use View menu for word wrap, minimap, breadcrumbs, zoom, and layout.</p>
          </>
        )}
      </div>
    </div>
  );
}
