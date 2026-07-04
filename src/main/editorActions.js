import { dispatch } from './dispatch.js';

export function undo(win) {
  return dispatch(win, 'edit.undo');
}

export function redo(win) {
  return dispatch(win, 'edit.redo');
}

export function cut(win) {
  return dispatch(win, 'edit.cut');
}

export function copy(win) {
  return dispatch(win, 'edit.copy');
}

export function paste(win) {
  return dispatch(win, 'edit.paste');
}

export function find(win) {
  return dispatch(win, 'edit.find');
}

export function replace(win) {
  return dispatch(win, 'edit.replace');
}

export function replaceInFiles(win) {
  return dispatch(win, 'edit.replaceInFiles');
}

export function findInFiles(win) {
  return dispatch(win, 'edit.findInFiles');
}

export function selectAll(win) {
  return dispatch(win, 'edit.selectAll');
}

export function indentLine(win) {
  return dispatch(win, 'edit.indentLine');
}

export function outdentLine(win) {
  return dispatch(win, 'edit.outdentLine');
}

export function toggleLineComment(win) {
  return dispatch(win, 'edit.toggleLineComment');
}

export function toggleBlockComment(win) {
  return dispatch(win, 'edit.toggleBlockComment');
}

export function formatDocument(win) {
  return dispatch(win, 'edit.formatDocument');
}

export function formatSelection(win) {
  return dispatch(win, 'edit.formatSelection');
}

export function renameSymbol(win) {
  return dispatch(win, 'edit.renameSymbol');
}
