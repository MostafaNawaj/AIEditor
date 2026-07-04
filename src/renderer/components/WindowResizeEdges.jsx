import React, { useCallback } from 'react';

const EDGES = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];

/**
 * Invisible edge/corner hit targets so a frameless Electron window can be resized by drag.
 */
export default function WindowResizeEdges() {
  const onPointerDown = useCallback((edge) => (e) => {
    if (!window.aieditor?.windowResizeStart) return;
    e.preventDefault();
    e.stopPropagation();

    window.aieditor.windowResizeStart(edge, e.screenX, e.screenY);

    const onMove = (ev) => {
      window.aieditor.windowResizeMove(ev.screenX, ev.screenY);
    };
    const onUp = () => {
      window.aieditor.windowResizeEnd();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      document.body.classList.remove('is-window-resizing');
    };

    document.body.classList.add('is-window-resizing');
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }, []);

  return (
    <div className="window-resize-edges" aria-hidden="true">
      {EDGES.map((edge) => (
        <div
          key={edge}
          className={`window-edge window-edge-${edge}`}
          onPointerDown={onPointerDown(edge)}
        />
      ))}
    </div>
  );
}
