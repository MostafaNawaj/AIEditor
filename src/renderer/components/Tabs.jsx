import React, { useState, useEffect, useRef } from 'react';

export default function Tabs({
  files,
  activeId,
  onSelect,
  onClose,
  showIcons = true,
  previewEnabled = true,
  groupLocked = false,
  onOpenBrowser,
  onShowOpenedEditors,
  onCloseAll,
  onCloseSaved,
  onTogglePreview,
  onToggleLockGroup,
  onConfigureEditors,
  onToggleIconVisibility,
  onSplitEditor,
  splitActive = false,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onDoc = (e) => {
      if (!menuRef.current?.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [menuOpen]);

  const run = (fn) => {
    fn?.();
    setMenuOpen(false);
  };

  return (
    <div className="tabs-bar">
      <div className="tabs-list">
        {files.map((file) => (
          <div
            key={file.id}
            className={`tab ${file.id === activeId ? 'active' : ''} ${file.preview ? 'preview' : ''}`}
            onClick={() => onSelect(file.id)}
            title={file.path}
          >
            {showIcons && <span className={`tab-icon ext-${file.name.split('.').pop()}`} />}
            <span className="tab-name">
              {file.dirty && <span className="dirty-dot">●</span>}
              <span className={file.preview ? 'tab-preview-name' : ''}>{file.name}</span>
            </span>
            <button
              type="button"
              className="tab-close"
              onClick={(e) => {
                e.stopPropagation();
                onClose(file.id);
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="tabs-actions" ref={menuRef}>
        <button
          type="button"
          className={`tabs-action-btn ${splitActive ? 'active' : ''}`}
          title="Split Editor"
          onClick={() => onSplitEditor?.()}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path d="M12 4v16" />
          </svg>
        </button>
        <button
          type="button"
          className={`tabs-action-btn ${menuOpen ? 'active' : ''}`}
          title="More Actions"
          onClick={() => setMenuOpen((v) => !v)}
        >
          ···
        </button>

        {menuOpen && (
          <ul className="tabs-overflow-menu">
            <li>
              <button type="button" onClick={() => run(onOpenBrowser)}>Open Browser</button>
            </li>
            <li>
              <button type="button" onClick={() => run(onShowOpenedEditors)}>Show Opened Editors</button>
            </li>
            <li className="menu-separator" />
            <li>
              <button type="button" onClick={() => run(onCloseAll)}>
                <span>Close All</span>
                <span className="menu-shortcut">Ctrl+M W</span>
              </button>
            </li>
            <li>
              <button type="button" onClick={() => run(onCloseSaved)}>
                <span>Close Saved</span>
                <span className="menu-shortcut">Ctrl+M U</span>
              </button>
            </li>
            <li className="menu-separator" />
            <li>
              <button type="button" onClick={() => run(onTogglePreview)}>
                <span>{previewEnabled ? '✓ ' : '  '}Enable Preview Editors</span>
              </button>
            </li>
            <li className="menu-separator" />
            <li>
              <button type="button" onClick={() => run(onToggleLockGroup)}>
                <span>{groupLocked ? '✓ ' : '  '}Lock Group</span>
              </button>
            </li>
            <li className="menu-separator" />
            <li>
              <button type="button" onClick={() => run(onConfigureEditors)}>Configure Editors</button>
            </li>
            <li className="menu-separator" />
            <li>
              <button type="button" onClick={() => run(onToggleIconVisibility)}>
                <span>{showIcons ? '✓ ' : '  '}Configure Icon Visibility</span>
              </button>
            </li>
          </ul>
        )}
      </div>
    </div>
  );
}
