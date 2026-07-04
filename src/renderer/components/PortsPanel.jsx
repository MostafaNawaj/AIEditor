import React from 'react';

export default function PortsPanel({ ports = [], onRefresh }) {
  return (
    <div className="panel-view ports-panel">
      <div className="panel-view-toolbar">
        <span className="panel-view-summary">
          {ports.length === 0
            ? 'No forwarded ports. Running apps may appear here.'
            : `${ports.length} port${ports.length === 1 ? '' : 's'}`}
        </span>
        <button type="button" className="panel-action-btn" onClick={onRefresh}>
          Refresh
        </button>
      </div>
      {ports.length > 0 && (
        <table className="ports-table">
          <thead>
            <tr>
              <th>Port</th>
              <th>Process</th>
              <th>Address</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {ports.map((port) => (
              <tr key={`${port.port}-${port.pid || port.process}`}>
                <td>{port.port}</td>
                <td>{port.process || '—'}</td>
                <td>{port.address || '127.0.0.1'}</td>
                <td>
                  <span className={`port-status port-${port.status || 'open'}`}>
                    {port.status || 'open'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
