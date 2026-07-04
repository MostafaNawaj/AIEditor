import React from 'react';

export default function HelpDialog({ dialog, onClose }) {
  if (!dialog) return null;

  let title = 'Help';
  let body = null;

  switch (dialog.type) {
    case 'welcome':
      title = 'Welcome / Getting Started';
      body = (
        <div>
          <p>Welcome to AIEditor — an AI-powered code editor.</p>
          <ol>
            <li>Open a folder with <kbd>Ctrl+O</kbd></li>
            <li>Edit files with Monaco (syntax highlighting for many languages)</li>
            <li>Use the Terminal panel for shells and tasks</li>
            <li>Ask the AI assistant for refactors — approve with Run / Allow / Undo / Keep All</li>
            <li>Open the Command Palette with <kbd>Ctrl+Shift+P</kbd></li>
          </ol>
        </div>
      );
      break;
    case 'shortcuts':
      title = 'Keyboard Shortcuts';
      body = (
        <table className="help-table">
          <tbody>
            {(dialog.content || []).map((row) => (
              <tr key={row.keys}>
                <td><kbd>{row.keys}</kbd></td>
                <td>{row.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
      break;
    case 'tips':
      title = 'Tips and Tricks';
      body = (
        <ul>
          {(dialog.content || []).map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      );
      break;
    case 'releaseNotes':
      title = 'Release Notes';
      body = <pre className="help-pre">{dialog.content}</pre>;
      break;
    case 'license':
      title = 'License';
      body = <pre className="help-pre">{dialog.content}</pre>;
      break;
    default:
      body = <p>No content.</p>;
  }

  return (
    <div className="help-overlay" onClick={onClose}>
      <div className="help-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="help-dialog-header">
          <h3>{title}</h3>
          <button type="button" onClick={onClose}>×</button>
        </div>
        <div className="help-dialog-body">{body}</div>
      </div>
    </div>
  );
}
