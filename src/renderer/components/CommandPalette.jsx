import React, { useState, useEffect, useRef } from 'react';

export default function CommandPalette({ open, onClose, commands }) {
  const [filter, setFilter] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setFilter('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  if (!open) return null;

  const filtered = commands.filter(
    (c) =>
      c.label.toLowerCase().includes(filter.toLowerCase()) ||
      c.category?.toLowerCase().includes(filter.toLowerCase())
  );

  const run = (cmd) => {
    cmd.action();
    onClose();
  };

  return (
    <div className="command-palette-overlay" onClick={onClose}>
      <div className="command-palette" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          className="command-palette-input"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'Enter' && filtered[0]) run(filtered[0]);
          }}
          placeholder="Type a command..."
        />
        <div className="command-palette-list">
          {filtered.map((cmd) => (
            <div key={cmd.id} className="command-item" onClick={() => run(cmd)}>
              <span className="command-label">{cmd.label}</span>
              {cmd.shortcut && <span className="command-shortcut">{cmd.shortcut}</span>}
            </div>
          ))}
          {filtered.length === 0 && <div className="command-empty">No matching commands</div>}
        </div>
      </div>
    </div>
  );
}
