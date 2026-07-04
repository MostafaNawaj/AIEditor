import React from 'react';
import MenuBar from './MenuBar.jsx';

export default function TitleBar({ projectName, recent, autoSave }) {
  return (
    <header className="title-bar">
      <div className="title-bar-left">
        <span className="title-bar-app">AIEditor</span>
        {projectName && <span className="title-bar-project">— {projectName}</span>}
        <MenuBar recent={recent} autoSave={autoSave} />
      </div>
      <div className="title-bar-controls">
        <button className="win-btn" onClick={() => window.aieditor?.windowMinimize()} title="Minimize">─</button>
        <button className="win-btn" onClick={() => window.aieditor?.windowMaximize()} title="Maximize">□</button>
        <button className="win-btn close" onClick={() => window.aieditor?.windowClose()} title="Close">×</button>
      </div>
    </header>
  );
}
