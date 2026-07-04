import React, { useState } from 'react';

export default function DebugConsole({ entries = [], onEvaluate }) {
  const [input, setInput] = useState('');

  const submit = () => {
    const value = input.trim();
    if (!value) return;
    onEvaluate?.(value);
    setInput('');
  };

  return (
    <div className="panel-view debug-console">
      {entries.length === 0 ? (
        <div className="panel-view-summary">
          Debug Console is ready. Start a debug session or evaluate an expression below.
        </div>
      ) : (
        <ul className="panel-list debug-entries">
          {entries.map((entry, index) => (
            <li key={index} className={`debug-entry debug-${entry.type || 'log'}`}>
              <span className="debug-prefix">{entry.type === 'input' ? '>' : entry.type === 'error' ? '×' : '·'}</span>
              <span>{entry.text}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="debug-input-row">
        <span className="debug-prompt">›</span>
        <input
          className="debug-input"
          value={input}
          placeholder="Evaluate expression"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
          }}
        />
      </div>
    </div>
  );
}
