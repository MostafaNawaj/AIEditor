/**
 * Holds the active Monaco editor instance so menu actions can drive it.
 */

let editor = null;
let monaco = null;
let columnSelection = false;

const listeners = new Set();

export function setEditorInstance(ed, mon) {
  editor = ed;
  monaco = mon;
  listeners.forEach((fn) => fn(ed, mon));
}

export function clearEditorInstance() {
  editor = null;
}

export function getEditor() {
  return editor;
}

export function getMonaco() {
  return monaco;
}

export function onEditorReady(fn) {
  listeners.add(fn);
  if (editor) fn(editor, monaco);
  return () => listeners.delete(fn);
}

export function trigger(commandId, args) {
  if (!editor) return false;
  editor.focus();
  editor.trigger('menu', commandId, args);
  return true;
}

export function runEditorAction(action) {
  const map = {
    'edit.undo': () => trigger('undo'),
    'edit.redo': () => trigger('redo'),
    'edit.cut': () => {
      const sel = editor?.getModel()?.getValueInRange(editor.getSelection());
      if (sel != null) window.aieditor?.writeClipboard(sel);
      trigger('editor.action.clipboardCutAction');
    },
    'edit.copy': () => {
      const sel = editor?.getModel()?.getValueInRange(editor.getSelection());
      if (sel != null) window.aieditor?.writeClipboard(sel);
      trigger('editor.action.clipboardCopyAction');
    },
    'edit.paste': async () => {
      const text = await window.aieditor?.readClipboard();
      if (text != null && editor) {
        editor.trigger('keyboard', 'type', { text });
      }
    },
    'edit.find': () => trigger('actions.find'),
    'edit.replace': () => trigger('editor.action.startFindReplaceAction'),
    'edit.selectAll': () => trigger('editor.action.selectAll'),
    'edit.indentLine': () => trigger('editor.action.indentLines'),
    'edit.outdentLine': () => trigger('editor.action.outdentLines'),
    'edit.toggleLineComment': () => trigger('editor.action.commentLine'),
    'edit.toggleBlockComment': () => trigger('editor.action.blockComment'),
    'edit.formatDocument': () => trigger('editor.action.formatDocument'),
    'edit.formatSelection': () => trigger('editor.action.formatSelection'),
    'edit.renameSymbol': () => trigger('editor.action.rename'),

    'selection.selectAll': () => trigger('editor.action.selectAll'),
    'selection.expand': () => trigger('editor.action.smartSelect.expand'),
    'selection.shrink': () => trigger('editor.action.smartSelect.shrink'),
    'selection.copy': () => {
      const sel = editor?.getModel()?.getValueInRange(editor.getSelection());
      if (sel != null) window.aieditor?.writeClipboard(sel);
    },
    'selection.columnMode': () => {
      columnSelection = !columnSelection;
      editor?.updateOptions({ columnSelection });
    },
    'selection.addCursorAbove': () => trigger('editor.action.insertCursorAbove'),
    'selection.addCursorBelow': () => trigger('editor.action.insertCursorBelow'),
    'selection.addCursorToLineEnds': () => trigger('editor.action.insertCursorAtEndOfEachLineSelected'),
    'selection.selectWord': () => {
      if (!editor) return;
      const pos = editor.getPosition();
      const word = editor.getModel()?.getWordAtPosition(pos);
      if (word) {
        editor.setSelection({
          startLineNumber: pos.lineNumber,
          startColumn: word.startColumn,
          endLineNumber: pos.lineNumber,
          endColumn: word.endColumn,
        });
      }
    },
    'selection.selectLine': () => {
      if (!editor) return;
      const pos = editor.getPosition();
      const line = editor.getModel()?.getLineMaxColumn(pos.lineNumber) || 1;
      editor.setSelection({
        startLineNumber: pos.lineNumber,
        startColumn: 1,
        endLineNumber: pos.lineNumber,
        endColumn: line,
      });
    },
    'selection.addNextOccurrence': () => trigger('editor.action.addSelectionToNextFindMatch'),
    'selection.selectHighlights': () => trigger('editor.action.selectHighlights'),
    'selection.multiCursorUndo': () => trigger('cursorUndo'),

    'go.navigateToLine': () => trigger('editor.action.gotoLine'),
    'go.definition': () => trigger('editor.action.revealDefinition'),
    'go.declaration': () => trigger('editor.action.revealDeclaration'),
    'go.implementation': () => trigger('editor.action.goToImplementation'),
    'go.references': () => trigger('editor.action.goToReferences'),
    'go.typeDefinition': () => trigger('editor.action.goToTypeDefinition'),
    'go.nextProblem': () => trigger('editor.action.marker.next'),
    'go.previousProblem': () => trigger('editor.action.marker.prev'),
  };

  const fn = map[action];
  if (fn) {
    fn();
    return true;
  }
  return false;
}

export function getSelectionText() {
  if (!editor) return '';
  return editor.getModel()?.getValueInRange(editor.getSelection()) || '';
}

export function getCursorLine() {
  return editor?.getPosition()?.lineNumber || 1;
}

export function revealLine(line) {
  if (!editor || !line) return;
  editor.revealLineInCenter(line);
  editor.setPosition({ lineNumber: line, column: 1 });
  editor.focus();
}

export function applyEditorOptions(options) {
  editor?.updateOptions(options);
}

export function getEditorOptions() {
  return {
    wordWrap: editor?.getOption?.(monaco?.editor?.EditorOption?.wordWrap) ?? 'off',
  };
}
