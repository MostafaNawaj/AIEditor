import React, { useEffect, useState } from 'react';

export default function ScmPanel({ rootPath, gitStatus }) {
  const [diff, setDiff] = useState('');

  useEffect(() => {
    if (rootPath && gitStatus?.isRepo) {
      window.aieditor.gitDiff(rootPath).then((r) => {
        if (r.isRepo) setDiff(r.diff || 'No changes');
      });
    } else {
      setDiff('');
    }
  }, [rootPath, gitStatus]);

  if (!rootPath) {
    return (
      <div className="panel-empty">
        <p>No folder opened</p>
      </div>
    );
  }

  if (!gitStatus?.isRepo) {
    return (
      <div className="scm-panel">
        <div className="panel-section-title">SOURCE CONTROL</div>
        <p className="hint">Not a git repository</p>
      </div>
    );
  }

  return (
    <div className="scm-panel">
      <div className="panel-section-title">SOURCE CONTROL</div>
      <div className="scm-branch">
        <span className="branch-icon">⎇</span> {gitStatus.branch}
      </div>
      {gitStatus.modified?.length > 0 && (
        <div className="scm-changes">
          <div className="scm-subtitle">Modified ({gitStatus.modified.length})</div>
          {gitStatus.modified.map((f) => (
            <div key={f} className="scm-file">M {f}</div>
          ))}
        </div>
      )}
      {gitStatus.notAdded?.length > 0 && (
        <div className="scm-changes">
          <div className="scm-subtitle">Untracked ({gitStatus.notAdded.length})</div>
          {gitStatus.notAdded.map((f) => (
            <div key={f} className="scm-file">U {f}</div>
          ))}
        </div>
      )}
      {diff && (
        <div className="scm-diff">
          <div className="scm-subtitle">Diff</div>
          <pre className="scm-diff-content">{diff.slice(0, 3000)}</pre>
        </div>
      )}
    </div>
  );
}
