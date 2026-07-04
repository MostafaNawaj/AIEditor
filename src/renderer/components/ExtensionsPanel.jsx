import React, { useState } from 'react';

const BUILTIN = [
  { id: 'monaco', name: 'Monaco Languages', desc: 'Syntax highlighting for 50+ languages', enabled: true },
  { id: 'terminal', name: 'Integrated Terminal', desc: 'PowerShell, CMD, Bash, Zsh', enabled: true },
  { id: 'git', name: 'Git', desc: 'Source control status and diffs', enabled: true },
  { id: 'ai', name: 'AI Assistant', desc: 'Chat, diffs, and approval workflow', enabled: true },
];

export default function ExtensionsPanel() {
  const [items, setItems] = useState(BUILTIN);
  const [query, setQuery] = useState('');

  const filtered = items.filter(
    (i) =>
      i.name.toLowerCase().includes(query.toLowerCase()) ||
      i.desc.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="panel-section extensions-panel">
      <div className="panel-section-title">EXTENSIONS</div>
      <div style={{ padding: '8px 12px' }}>
        <input
          className="remote-input"
          placeholder="Search extensions"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <ul className="ext-list">
        {filtered.map((ext) => (
          <li key={ext.id} className="ext-item">
            <div>
              <div className="ext-name">{ext.name}</div>
              <div className="ext-desc">{ext.desc}</div>
            </div>
            <button
              type="button"
              className={`ext-toggle ${ext.enabled ? 'on' : ''}`}
              onClick={() =>
                setItems((prev) =>
                  prev.map((p) => (p.id === ext.id ? { ...p, enabled: !p.enabled } : p))
                )
              }
            >
              {ext.enabled ? 'Enabled' : 'Enable'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
