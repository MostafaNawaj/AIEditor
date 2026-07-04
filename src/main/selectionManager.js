import { dispatch } from './dispatch.js';

export function selectAll(win) {
  return dispatch(win, 'selection.selectAll');
}

export function expandSelection(win) {
  return dispatch(win, 'selection.expand');
}

export function shrinkSelection(win) {
  return dispatch(win, 'selection.shrink');
}

export function copySelection(win) {
  return dispatch(win, 'selection.copy');
}

export function toggleColumnSelection(win) {
  return dispatch(win, 'selection.columnMode');
}

export function addCursorAbove(win) {
  return dispatch(win, 'selection.addCursorAbove');
}

export function addCursorBelow(win) {
  return dispatch(win, 'selection.addCursorBelow');
}

export function addCursorToLineEnds(win) {
  return dispatch(win, 'selection.addCursorToLineEnds');
}

export function selectCurrentWord(win) {
  return dispatch(win, 'selection.selectWord');
}

export function selectCurrentLine(win) {
  return dispatch(win, 'selection.selectLine');
}

export function addSelectionToNextFindMatch(win) {
  return dispatch(win, 'selection.addNextOccurrence');
}

export function selectHighlights(win) {
  return dispatch(win, 'selection.selectHighlights');
}

export function multiCursorUndo(win) {
  return dispatch(win, 'selection.multiCursorUndo');
}
