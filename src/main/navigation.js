import { dispatch } from './dispatch.js';

const history = new Map();

function hist(win) {
  const id = win?.id ?? 0;
  if (!history.has(id)) history.set(id, { stack: [], index: -1 });
  return history.get(id);
}

export function pushHistory(win, entry) {
  const h = hist(win);
  h.stack = h.stack.slice(0, h.index + 1);
  h.stack.push(entry);
  h.index = h.stack.length - 1;
  if (h.stack.length > 100) {
    h.stack.shift();
    h.index -= 1;
  }
}

export function back(win) {
  const h = hist(win);
  if (h.index > 0) {
    h.index -= 1;
    return dispatch(win, 'go.back', { entry: h.stack[h.index] });
  }
  return dispatch(win, 'go.back', { entry: null });
}

export function forward(win) {
  const h = hist(win);
  if (h.index < h.stack.length - 1) {
    h.index += 1;
    return dispatch(win, 'go.forward', { entry: h.stack[h.index] });
  }
  return dispatch(win, 'go.forward', { entry: null });
}

export function navigateToFile(win) {
  return dispatch(win, 'go.navigateToFile');
}

export function navigateToSymbol(win) {
  return dispatch(win, 'go.navigateToSymbol');
}

export function navigateToLine(win) {
  return dispatch(win, 'go.navigateToLine');
}

export function goToDefinition(win) {
  return dispatch(win, 'go.definition');
}

export function goToDeclaration(win) {
  return dispatch(win, 'go.declaration');
}

export function goToImplementation(win) {
  return dispatch(win, 'go.implementation');
}

export function goToReferences(win) {
  return dispatch(win, 'go.references');
}

export function goToTypeDefinition(win) {
  return dispatch(win, 'go.typeDefinition');
}

export function nextProblem(win) {
  return dispatch(win, 'go.nextProblem');
}

export function previousProblem(win) {
  return dispatch(win, 'go.previousProblem');
}

export function nextChange(win) {
  return dispatch(win, 'go.nextChange');
}

export function previousChange(win) {
  return dispatch(win, 'go.previousChange');
}

export function switchEditorTab(win, direction = 'next') {
  return dispatch(win, 'go.switchTab', { direction });
}

export function navigateHistory(win) {
  const h = hist(win);
  return dispatch(win, 'go.navigateHistory', { stack: h.stack, index: h.index });
}
