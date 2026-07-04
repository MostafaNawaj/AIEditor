import React from 'react';

export default function StatusBar({ file, gitStatus, projectRoot, aiReady }) {
  return (
    <footer className="status-bar">
      <div className="status-left">
        {gitStatus?.isRepo && (
          <span className="status-item">
            ⎇ {gitStatus.branch}
            {gitStatus.modified?.length > 0 && ` · ${gitStatus.modified.length} changes`}
          </span>
        )}
      </div>
      <div className="status-center">
        {file && (
          <>
            <span className="status-item">{file.language}</span>
            <span className="status-item">UTF-8</span>
            <span className="status-item">Spaces: 2</span>
          </>
        )}
      </div>
      <div className="status-right">
        <span className={`status-item ${aiReady ? 'ai-ready' : ''}`}>
          {aiReady ? 'AI Ready' : 'AI Demo'}
        </span>
        <span className="status-item">{projectRoot ? projectRoot.split(/[/\\]/).pop() : 'AIEditor'}</span>
      </div>
    </footer>
  );
}
