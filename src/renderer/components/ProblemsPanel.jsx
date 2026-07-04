import React from 'react';

export default function ProblemsPanel({ problems = [], onOpenProblem }) {
  const errors = problems.filter((p) => p.severity === 'error').length;
  const warnings = problems.filter((p) => p.severity === 'warning').length;

  return (
    <div className="panel-view problems-panel">
      <div className="panel-view-summary">
        {problems.length === 0
          ? 'No problems have been detected in the workspace.'
          : `${errors} error${errors === 1 ? '' : 's'}, ${warnings} warning${warnings === 1 ? '' : 's'}`}
      </div>
      {problems.length > 0 && (
        <ul className="panel-list">
          {problems.map((problem, index) => (
            <li key={`${problem.file}-${problem.line}-${index}`}>
              <button
                type="button"
                className={`problem-row severity-${problem.severity || 'info'}`}
                onClick={() => onOpenProblem?.(problem)}
              >
                <span className="problem-severity">{problem.severity === 'error' ? '✕' : problem.severity === 'warning' ? '⚠' : 'ℹ'}</span>
                <span className="problem-message">{problem.message}</span>
                <span className="problem-location">
                  {problem.file?.split(/[/\\]/).pop()}
                  {problem.line != null ? `:${problem.line}` : ''}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
