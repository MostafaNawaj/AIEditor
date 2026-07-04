import React, { useRef, useEffect } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { setEditorInstance, clearEditorInstance } from '../editorBridge.js';

const SEVERITY = {
  8: 'error',
  4: 'warning',
  2: 'info',
  1: 'hint',
};

export default function Editor({
  file,
  onChange,
  onProblems,
  wordWrap = 'off',
  minimap = true,
  showBreadcrumbs = true,
  onCursorChange,
}) {
  const pathRef = useRef(file?.path);
  pathRef.current = file?.path;

  useEffect(() => () => clearEditorInstance(), []);

  if (!file) return null;

  const publishMarkers = (monaco, resource) => {
    if (!onProblems || !monaco) return;
    const markers = monaco.editor.getModelMarkers({ resource });
    onProblems(
      markers.map((m) => ({
        severity: SEVERITY[m.severity] || 'info',
        message: m.message,
        file: pathRef.current,
        line: m.startLineNumber,
        column: m.startColumn,
      }))
    );
  };

  return (
    <div className="editor-container">
      {showBreadcrumbs && <div className="editor-breadcrumb">{file.path}</div>}
      <MonacoEditor
        height="100%"
        path={file.path}
        language={file.language}
        value={file.content}
        theme="vs-dark"
        onChange={(value) => onChange(value ?? '')}
        onMount={(editor, monaco) => {
          setEditorInstance(editor, monaco);
          const model = editor.getModel();
          if (!model) return;

          publishMarkers(monaco, model.uri);
          monaco.editor.onDidChangeMarkers((uris) => {
            if (uris.some((u) => u.toString() === model.uri.toString())) {
              publishMarkers(monaco, model.uri);
            }
          });

          editor.onDidChangeCursorPosition((e) => {
            onCursorChange?.({
              line: e.position.lineNumber,
              column: e.position.column,
              selection: model.getValueInRange(editor.getSelection()),
            });
          });
        }}
        options={{
          fontSize: 14,
          fontFamily: "'JetBrains Mono', 'Cascadia Code', Consolas, monospace",
          minimap: { enabled: minimap },
          wordWrap,
          automaticLayout: true,
          tabSize: 2,
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          padding: { top: 8 },
          lineNumbers: 'on',
          renderLineHighlight: 'all',
          bracketPairColorization: { enabled: true },
          quickSuggestions: true,
          suggestOnTriggerCharacters: true,
          formatOnPaste: true,
          formatOnType: true,
          glyphMargin: true,
        }}
      />
    </div>
  );
}
