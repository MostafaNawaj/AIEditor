import React, { useCallback } from 'react';

/**
 * Drag handle for resizing panels.
 * onResize(startSize, deltaFromStart) — startSize is the size when drag began.
 */
export default function ResizeHandle({
  direction = 'horizontal',
  getSize,
  onResize,
  title,
}) {
  const onPointerDown = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();

      const startPos = direction === 'horizontal' ? e.clientX : e.clientY;
      const startSize = typeof getSize === 'function' ? getSize() : 0;
      const target = e.currentTarget;

      try {
        target.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }

      document.body.classList.add(
        'is-resizing',
        direction === 'horizontal' ? 'resize-col' : 'resize-row'
      );

      const onPointerMove = (ev) => {
        const current = direction === 'horizontal' ? ev.clientX : ev.clientY;
        const delta = current - startPos;
        onResize?.(startSize, delta);
      };

      const onPointerUp = (ev) => {
        try {
          target.releasePointerCapture(ev.pointerId);
        } catch {
          /* ignore */
        }
        document.body.classList.remove('is-resizing', 'resize-col', 'resize-row');
        target.removeEventListener('pointermove', onPointerMove);
        target.removeEventListener('pointerup', onPointerUp);
        target.removeEventListener('pointercancel', onPointerUp);
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
      };

      target.addEventListener('pointermove', onPointerMove);
      target.addEventListener('pointerup', onPointerUp);
      target.addEventListener('pointercancel', onPointerUp);
      // Fallback if pointer leaves the handle before capture sticks
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
    },
    [direction, getSize, onResize]
  );

  return (
    <div
      className={`resize-handle resize-${direction}`}
      onPointerDown={onPointerDown}
      title={title || 'Drag to resize'}
      role="separator"
      aria-orientation={direction === 'horizontal' ? 'vertical' : 'horizontal'}
    >
      <span className="resize-handle-grip" />
    </div>
  );
}
