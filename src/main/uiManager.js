import { dispatch } from './dispatch.js';

export function commandPalette(win) {
  return dispatch(win, 'view.commandPalette');
}

export function showExplorer(win) {
  return dispatch(win, 'view.explorer');
}

export function showSearch(win) {
  return dispatch(win, 'view.search');
}

export function showSourceControl(win) {
  return dispatch(win, 'view.sourceControl');
}

export function showRunAndDebug(win) {
  return dispatch(win, 'view.runAndDebug');
}

export function showExtensions(win) {
  return dispatch(win, 'view.extensions');
}

export function toggleSideBar(win) {
  return dispatch(win, 'view.toggleSideBar');
}

export function toggleStatusBar(win) {
  return dispatch(win, 'view.toggleStatusBar');
}

export function toggleActivityBar(win) {
  return dispatch(win, 'view.toggleActivityBar');
}

export function togglePanel(win) {
  return dispatch(win, 'view.togglePanel');
}

export function toggleFullScreen(win) {
  if (win && !win.isDestroyed()) {
    win.setFullScreen(!win.isFullScreen());
  }
  return dispatch(win, 'view.toggleFullScreen');
}

export function toggleZenMode(win) {
  return dispatch(win, 'view.zenMode');
}

export function toggleCenteredLayout(win) {
  return dispatch(win, 'view.centeredLayout');
}

export function zoomIn(win) {
  if (win && !win.isDestroyed()) {
    const level = win.webContents.getZoomLevel();
    win.webContents.setZoomLevel(level + 0.5);
  }
  return dispatch(win, 'view.zoomIn');
}

export function zoomOut(win) {
  if (win && !win.isDestroyed()) {
    const level = win.webContents.getZoomLevel();
    win.webContents.setZoomLevel(level - 0.5);
  }
  return dispatch(win, 'view.zoomOut');
}

export function resetZoom(win) {
  if (win && !win.isDestroyed()) {
    win.webContents.setZoomLevel(0);
  }
  return dispatch(win, 'view.resetZoom');
}

export function toggleWordWrap(win) {
  return dispatch(win, 'view.toggleWordWrap');
}

export function toggleMinimap(win) {
  return dispatch(win, 'view.toggleMinimap');
}

export function toggleBreadcrumbs(win) {
  return dispatch(win, 'view.toggleBreadcrumbs');
}
