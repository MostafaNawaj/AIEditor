import React, { useState } from 'react';

export default function SearchPanel({ rootPath, onOpenFile }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const runSearch = async () => {
    if (!rootPath || !query.trim()) return;
    setSearching(true);
    try {
      const hits = await window.aieditor.searchFiles(rootPath, query);
      setResults(hits);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="search-panel">
      <div className="panel-section-title">SEARCH</div>
      <div className="search-input-wrap">
        <input
          className="search-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && runSearch()}
          placeholder="Search in files..."
        />
        <button className="search-btn" onClick={runSearch} disabled={searching}>
          {searching ? '...' : 'Go'}
        </button>
      </div>
      <div className="search-results">
        {!rootPath && <p className="hint">Open a folder first</p>}
        {results.length === 0 && query && rootPath && !searching && (
          <p className="hint">No results found</p>
        )}
        {results.map((r, i) => (
          <div
            key={`${r.file}-${r.line}-${i}`}
            className="search-result"
            onClick={() => onOpenFile(r.file)}
          >
            <div className="search-result-file">{r.file.split(/[/\\]/).pop()}</div>
            <div className="search-result-line">:{r.line}</div>
            <div className="search-result-text">{r.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
