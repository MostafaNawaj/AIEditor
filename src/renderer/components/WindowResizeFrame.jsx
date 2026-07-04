import React, { useRef } from 'react';

const EDGES = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];

/**
 * Invisible edge/corner hit targets so a frameless Electron window
 * can be resized by dragging the outer border (like a normal app).
 */
export default function WindowResizeFrame() {
  const dragRef = useRef(null);

  const onPointerDown = (edge) => async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!window.aieditor?.getWindowBounds || !window.aieditor?.setWindowBounds) return;

    const startBounds = await window.aieditor.getWindowBounds();
    const startX = e.screenX;
    const startY = e.screenY;
    dragRef.current = { edge, startBounds, startX, startY };

    document.body.classList.add('is-window-resizing');

    const onMove = (ev) => {
      const drag = dragRef.current;
      if (!drag) return;
      const dx = ev.screenX - drag.startX;
      const dy = ev.screenY - drag.startY;
      const b = { ...drag.startBounds };
      const minW = 640;
      const minH = 400;

      if (drag.edge.includes('e')) {
        b.width = Math.max(minW, drag.startBounds.width + dx);
      }
      if (drag.edge.includes('s')) {
        b.height = Math.max(minH, drag.startBounds.height + dy);
      }
      if (drag.edge.includes('w')) {
        const width = Math.max(minW, drag.startBounds.width - dx);
        b.x = drag.startBounds.x + (drag.startBounds.width - width);
        b.width = width;
      }
      if (drag.edge.includes('n')) {
        const height = Math.max(minH, drag.startBounds.height - dy);
        b.y = drag.startBounds.y + (drag.startBounds.height - height);
        b.height = height;
      }

      window.aieditor.setWindowBounds(b);
    };

    const onUp = () => {
      dragRef.current = null;
      document.body.classList.remove('is-window-resizing');
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  return (
    <div className="window-resize-frame" aria-hidden="true">
      {EDGES.map((edge) => (
        <div
          key={edge}
          className={`window-resize-edge edge-${edge}`}
          onPointerDown={onPointerDown(edge)}
        />
      ))}
    </div>
  );
}
