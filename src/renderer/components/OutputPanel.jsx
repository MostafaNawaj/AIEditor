import React, { useEffect, useRef } from 'react';

export default function OutputPanel({
  channels = {},
  activeChannel = 'Terminal',
  onChannelChange,
  onClear,
}) {
  const preRef = useRef(null);
  const names = Object.keys(channels);
  const text = channels[activeChannel] || '';

  useEffect(() => {
    if (preRef.current) {
      preRef.current.scrollTop = preRef.current.scrollHeight;
    }
  }, [text, activeChannel]);

  return (
    <div className="panel-view output-panel">
      <div className="panel-view-toolbar">
        <label className="output-channel-label">
          <span>Output</span>
          <select
            value={activeChannel}
            onChange={(e) => onChannelChange?.(e.target.value)}
          >
            {(names.length ? names : ['Terminal']).map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="panel-action-btn"
          title="Clear Output"
          onClick={() => onClear?.(activeChannel)}
        >
          Clear
        </button>
      </div>
      <pre ref={preRef} className="panel-pre">{text || 'No output yet.'}</pre>
    </div>
  );
}
