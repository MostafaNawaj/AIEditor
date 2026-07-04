import React, { useState } from 'react';

export default function RemoteExplorer({
  recentProjects = [],
  onOpenFolder,
  onOpenRecent,
  onConnectRemote,
}) {
  const [target, setTarget] = useState('');

  return (
    <div className="panel-section remote-explorer">
      <div className="panel-section-title">REMOTE EXPLORER</div>
      <div className="remote-section">
        <p className="hint" style={{ padding: '8px 12px' }}>
          Connect to a remote host over SSH, or reopen a recent workspace.
        </p>
        <div className="remote-form">
          <input
            className="remote-input"
            placeholder="user@host or hostname"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && target.trim()) {
                onConnectRemote?.(target.trim());
              }
            }}
          />
          <button
            type="button"
            className="panel-action-btn"
            onClick={() => target.trim() && onConnectRemote?.(target.trim())}
          >
            Connect
          </button>
        </div>
        <button type="button" className="remote-open-local" onClick={onOpenFolder}>
          Open Local Folder…
        </button>
      </div>

      <div className="panel-section-title" style={{ marginTop: 12 }}>RECENT</div>
      <ul className="remote-recent">
        {(recentProjects || []).length === 0 && (
          <li className="hint" style={{ padding: '4px 12px' }}>No recent workspaces</li>
        )}
        {(recentProjects || []).map((path) => (
          <li key={path}>
            <button type="button" className="remote-recent-btn" onClick={() => onOpenRecent?.(path)}>
              {path}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
