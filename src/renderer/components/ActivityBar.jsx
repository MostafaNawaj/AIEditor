import React, { useState, useEffect } from 'react';
import {
  IconFiles,
  IconSearch,
  IconGit,
  IconExtensions,
  IconDebug,
  IconRemote,
  IconAI,
  IconSettings,
  IconPin,
} from './Icons.jsx';

const ALL_ITEMS = [
  { id: 'explorer', icon: IconFiles, title: 'Explorer', shortcut: 'Ctrl+Shift+E', defaultPinned: true },
  { id: 'search', icon: IconSearch, title: 'Search', shortcut: 'Ctrl+Shift+F', defaultPinned: true },
  { id: 'scm', icon: IconGit, title: 'Source Control', shortcut: 'Ctrl+Shift+G', defaultPinned: true },
  { id: 'extensions', icon: IconExtensions, title: 'Extensions', shortcut: 'Ctrl+Shift+X', defaultPinned: true },
  { id: 'debug', icon: IconDebug, title: 'Run and Debug', shortcut: 'Ctrl+Shift+D', defaultPinned: false },
  { id: 'remote', icon: IconRemote, title: 'Remote Explorer', shortcut: '', defaultPinned: false },
];

const PIN_KEY = 'aieditor-activity-pins';

function loadPins() {
  try {
    const stored = JSON.parse(localStorage.getItem(PIN_KEY) || 'null');
    if (stored && typeof stored === 'object') return stored;
  } catch { /* ignore */ }
  return Object.fromEntries(ALL_ITEMS.map((i) => [i.id, i.defaultPinned]));
}

export default function ActivityBar({ active, onChange, onSettings, onToggleAI }) {
  const [pins, setPins] = useState(loadPins);
  const [hoverId, setHoverId] = useState(null);

  useEffect(() => {
    localStorage.setItem(PIN_KEY, JSON.stringify(pins));
  }, [pins]);

  const togglePin = (id, e) => {
    e.stopPropagation();
    setPins((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Show pinned items always; unpinned still shown (like Cursor) but pin state is interactive
  const items = ALL_ITEMS;

  return (
    <nav className="activity-bar">
      <div className="activity-bar-top">
        {items.map(({ id, icon: Icon, title, shortcut }) => (
          <div
            key={id}
            className={`activity-item-wrap ${active === id ? 'active' : ''}`}
            onMouseEnter={() => setHoverId(id)}
            onMouseLeave={() => setHoverId(null)}
          >
            <button
              type="button"
              className={`activity-btn ${active === id ? 'active' : ''}`}
              onClick={() => onChange(id)}
              title={shortcut ? `${title} (${shortcut})` : title}
            >
              <Icon size={22} />
            </button>
            {(hoverId === id || pins[id]) && (
              <button
                type="button"
                className={`activity-pin ${pins[id] ? 'pinned' : ''}`}
                title={pins[id] ? 'Unpin from Activity Bar' : 'Pin to Activity Bar'}
                onClick={(e) => togglePin(id, e)}
              >
                <IconPin size={10} />
              </button>
            )}
          </div>
        ))}
      </div>
      <div className="activity-bar-bottom">
        <button
          type="button"
          className="activity-btn"
          onClick={onToggleAI}
          title="AI Chat (Ctrl+L)"
        >
          <IconAI size={22} />
        </button>
        <button type="button" className="activity-btn" onClick={onSettings} title="Settings">
          <IconSettings size={22} />
        </button>
      </div>
    </nav>
  );
}
