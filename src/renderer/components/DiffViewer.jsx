import React from 'react';
import { DiffEditor } from '@monaco-editor/react';

/**
 * AI assistant approval workflow: Run / Allow / Undo / Keep All
 */
export default function DiffViewer({
  diff,
  onRun,
  onAllow,
  onUndo,
  onKeepAll,
  onDismiss,
}) {
  const language = diff.language || 'javascript';

  return (
    <div className="diff-viewer">
      <div className="diff-toolbar">
        <span className="diff-title">
          AI Changes — {diff.filePath.split(/[/\\]/).pop()}
        </span>
        <div className="diff-actions ai-approval">
          <button type="button" className="btn-run" onClick={onRun} title="Apply and run related checks">
            Run
          </button>
          <button type="button" className="btn-accept" onClick={onAllow} title="Allow this change">
            Allow
          </button>
          <button type="button" className="btn-undo" onClick={onUndo} title="Undo last AI change">
            Undo
          </button>
          <button type="button" className="btn-keep-all" onClick={onKeepAll} title="Keep all pending AI changes">
            Keep All
          </button>
          <button type="button" className="btn-reject" onClick={onDismiss}>
            Dismiss
          </button>
        </div>
      </div>
      <div className="diff-editor-wrap">
        <DiffEditor
          height="100%"
          language={language}
          original={diff.oldContent}
          modified={diff.newContent}
          theme="vs-dark"
          options={{
            readOnly: true,
            renderSideBySide: true,
            automaticLayout: true,
            scrollBeyondLastLine: false,
          }}
        />
      </div>
    </div>
  );
}
