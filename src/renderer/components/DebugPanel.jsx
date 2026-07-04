import React from 'react';

export default function DebugPanel({ activeFile, onRun, onDebug, onStop, onToggleBreakpoint }) {
  return (
    <div className="panel-section debug-side-panel">
      <div className="panel-section-title">RUN AND DEBUG</div>
      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <p className="hint">
          {activeFile
            ? `Active: ${activeFile.name || activeFile.path?.split(/[/\\]/).pop()}`
            : 'Open a file to run or debug.'}
        </p>
        <button type="button" className="debug-action-btn primary" onClick={onDebug} disabled={!activeFile}>
          Start Debugging (F5)
        </button>
        <button type="button" className="debug-action-btn" onClick={onRun} disabled={!activeFile}>
          Run Without Debugging (Ctrl+F5)
        </button>
        <button type="button" className="debug-action-btn" onClick={onStop}>
          Stop
        </button>
        <button type="button" className="debug-action-btn" onClick={onToggleBreakpoint} disabled={!activeFile}>
          Toggle Breakpoint (F9)
        </button>
        <p className="hint" style={{ marginTop: 8 }}>
          Output appears in the Debug Console panel below.
        </p>
      </div>
    </div>
  );
}
