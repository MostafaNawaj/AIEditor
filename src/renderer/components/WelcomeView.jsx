import React from 'react';

export default function WelcomeView({ onOpenFolder, recentProjects = [] }) {
  return (
    <div className="welcome-view">
      <div className="welcome-content">
        <div className="welcome-logo">AIEditor</div>
        <p className="welcome-subtitle">The AI-powered code editor</p>

        <div className="welcome-actions">
          <button className="welcome-btn primary" onClick={onOpenFolder}>
            Open Folder
          </button>
          <button className="welcome-btn" onClick={onOpenFolder}>
            Clone Repository
          </button>
        </div>

        <div className="welcome-recent">
          <div className="welcome-section-title">Recent</div>
          {recentProjects.length === 0 ? (
            <p className="hint">No recent folders</p>
          ) : (
            recentProjects.map((p) => (
              <button key={p} className="recent-item" onClick={onOpenFolder}>
                {p}
              </button>
            ))
          )}
        </div>

        <div className="welcome-shortcuts">
          <div className="welcome-section-title">Shortcuts</div>
          <div className="shortcut-row"><kbd>Ctrl+O</kbd> Open Folder</div>
          <div className="shortcut-row"><kbd>Ctrl+S</kbd> Save</div>
          <div className="shortcut-row"><kbd>Ctrl+L</kbd> AI Chat</div>
          <div className="shortcut-row"><kbd>Ctrl+`</kbd> Terminal</div>
          <div className="shortcut-row"><kbd>Ctrl+Shift+P</kbd> Command Palette</div>
        </div>
      </div>
    </div>
  );
}
