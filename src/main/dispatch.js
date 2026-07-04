import { runtimeLog } from './runtimeLog.js';

/**
 * Send a menu/command action to the renderer and record it for AI context.
 */
export function dispatch(win, action, payload = {}) {
  runtimeLog.info('menu', action, payload);
  if (win && !win.isDestroyed()) {
    win.webContents.send('menu:action', { action, payload });
  }
  return { ok: true, action, payload };
}
