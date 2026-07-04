import React, { useState } from 'react';
import Terminal from './Terminal.jsx';
import ProblemsPanel from './ProblemsPanel.jsx';
import OutputPanel from './OutputPanel.jsx';
import DebugConsole from './DebugConsole.jsx';
import PortsPanel from './PortsPanel.jsx';

const TABS = [
  { id: 'problems', label: 'Problems' },
  { id: 'output', label: 'Output' },
  { id: 'debug', label: 'Debug Console' },
  { id: 'terminal', label: 'Terminal' },
  { id: 'ports', label: 'Ports' },
];

export default function BottomPanel({
  visible,
  activeTab,
  onTabChange,
  cwd,
  onOutput,
  onToggle,
  onMaximize,
  maximized,
  problems,
  onOpenProblem,
  outputChannels,
  outputChannel,
  onOutputChannelChange,
  onClearOutput,
  debugEntries,
  onDebugEvaluate,
  ports,
  onRefreshPorts,
  terminalSessionKey,
  terminalSplitRequest,
  onTerminalSplitHandled,
  terminalShell,
  terminalName,
  pendingTerminalCommand,
  onTerminalCommandConsumed,
  height,
}) {
  const [localTab, setLocalTab] = useState('terminal');
  const tab = activeTab || localTab;
  const setTab = (id) => {
    setLocalTab(id);
    onTabChange?.(id);
  };

  if (!visible) return null;

  const problemCount = problems?.length || 0;
  const style = height
    ? { height, flex: `0 0 ${height}px`, minHeight: 120, maxHeight: '80vh' }
    : undefined;

  return (
    <div className={`bottom-panel ${maximized ? 'maximized' : ''}`} style={style}>
      <div className="bottom-panel-header">
        <div className="bottom-panel-tabs">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`bottom-tab ${tab === item.id ? 'active' : ''}`}
              onClick={() => setTab(item.id)}
            >
              {item.label}
              {item.id === 'problems' && problemCount > 0 && (
                <span className="tab-badge">{problemCount}</span>
              )}
            </button>
          ))}
        </div>
        <div className="bottom-panel-actions">
          <button
            type="button"
            className="bottom-panel-icon-btn"
            title={maximized ? 'Restore Panel' : 'Maximize Panel'}
            onClick={onMaximize}
          >
            {maximized ? '⌄' : '⌃'}
          </button>
          <button
            type="button"
            className="bottom-panel-icon-btn"
            title="Close Panel"
            onClick={onToggle}
          >
            ×
          </button>
        </div>
      </div>

      <div className="bottom-panel-body">
        <div className={tab === 'problems' ? 'panel-pane active' : 'panel-pane'}>
          <ProblemsPanel problems={problems} onOpenProblem={onOpenProblem} />
        </div>
        <div className={tab === 'output' ? 'panel-pane active' : 'panel-pane'}>
          <OutputPanel
            channels={outputChannels}
            activeChannel={outputChannel}
            onChannelChange={onOutputChannelChange}
            onClear={onClearOutput}
          />
        </div>
        <div className={tab === 'debug' ? 'panel-pane active' : 'panel-pane'}>
          <DebugConsole entries={debugEntries} onEvaluate={onDebugEvaluate} />
        </div>
        <div className={tab === 'terminal' ? 'panel-pane active' : 'panel-pane'}>
          <Terminal
            cwd={cwd}
            onOutput={onOutput}
            visible={visible}
            active={tab === 'terminal'}
            sessionKey={terminalSessionKey}
            splitRequest={terminalSplitRequest}
            onSplitHandled={onTerminalSplitHandled}
            shellId={terminalShell}
            terminalName={terminalName}
            pendingCommand={pendingTerminalCommand}
            onCommandConsumed={onTerminalCommandConsumed}
          />
        </div>
        <div className={tab === 'ports' ? 'panel-pane active' : 'panel-pane'}>
          <PortsPanel ports={ports} onRefresh={onRefreshPorts} />
        </div>
      </div>
    </div>
  );
}
