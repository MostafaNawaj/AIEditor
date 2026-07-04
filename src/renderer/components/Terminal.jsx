import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { IconSplit } from './Icons.jsx';
import 'xterm/css/xterm.css';

const SHELL_LABELS = {
  powershell: 'powershell',
  cmd: 'cmd',
  bash: 'bash',
  zsh: 'zsh',
};

let paneSeq = 1;

function createTerminalSession(container, cwd, shellId, onOutputRef) {
  const term = new XTerm({
    cursorBlink: true,
    cursorStyle: 'bar',
    fontSize: 13,
    fontFamily: "'Cascadia Mono', 'Consolas', 'Courier New', monospace",
    theme: {
      background: '#181818',
      foreground: '#cccccc',
      cursor: '#aeafad',
      selectionBackground: '#264f78',
    },
    allowProposedApi: true,
    scrollback: 5000,
  });

  const fitAddon = new FitAddon();
  term.loadAddon(fitAddon);
  term.loadAddon(new WebLinksAddon());
  term.open(container);

  let ptyId = null;
  let cleanupData = () => {};
  let cleanupExit = () => {};
  let disposed = false;

  const fit = () => {
    try {
      fitAddon.fit();
      if (ptyId && window.aieditor) {
        window.aieditor.resizeTerminal(ptyId, term.cols, term.rows);
      }
    } catch {
      /* container may be hidden */
    }
  };

  const start = async () => {
    if (!window.aieditor || disposed) {
      term.writeln('Bridge not available');
      return;
    }

    const id = await window.aieditor.spawnTerminal(cwd, shellId);
    if (disposed) {
      window.aieditor.killTerminal(id);
      return;
    }
    ptyId = id;

    cleanupData = window.aieditor.onTerminalData(({ id: evtId, data }) => {
      if (evtId === id) {
        term.write(data);
        onOutputRef.current?.(data);
      }
    });

    cleanupExit = window.aieditor.onTerminalExit(({ id: evtId, code }) => {
      if (evtId === id) {
        term.writeln(`\r\n[Process exited with code ${code}]`);
        ptyId = null;
      }
    });

    term.onData((data) => {
      if (ptyId) window.aieditor.writeTerminal(ptyId, data);
    });

    requestAnimationFrame(fit);
    term.focus();
  };

  start();

  const ro = new ResizeObserver(() => fit());
  ro.observe(container);

  return {
    term,
    fit,
    write(text) {
      if (ptyId && text) {
        window.aieditor.writeTerminal(
          ptyId,
          text.endsWith('\r') || text.endsWith('\n') ? text : `${text}\r`
        );
      }
    },
    dispose() {
      disposed = true;
      ro.disconnect();
      cleanupData();
      cleanupExit();
      if (ptyId) window.aieditor?.killTerminal(ptyId);
      term.dispose();
    },
    kill() {
      if (ptyId) {
        window.aieditor?.killTerminal(ptyId);
        ptyId = null;
      }
    },
    focus() {
      term.focus();
    },
    getSelection() {
      return term.getSelection();
    },
  };
}

function TerminalPane({
  cwd,
  shellId,
  label,
  active,
  onOutput,
  pendingCommand,
  onCommandConsumed,
  onFocus,
  onKill,
  sessionKey,
}) {
  const containerRef = useRef(null);
  const sessionRef = useRef(null);
  const onOutputRef = useRef(onOutput);
  onOutputRef.current = onOutput;

  useEffect(() => {
    if (!containerRef.current) return undefined;
    sessionRef.current?.dispose();
    containerRef.current.innerHTML = '';
    sessionRef.current = createTerminalSession(
      containerRef.current,
      cwd,
      shellId,
      onOutputRef
    );
    return () => {
      sessionRef.current?.dispose();
      sessionRef.current = null;
    };
  }, [cwd, shellId, sessionKey]);

  useEffect(() => {
    if (active) {
      requestAnimationFrame(() => {
        sessionRef.current?.fit();
        sessionRef.current?.focus();
      });
    }
  }, [active]);

  useEffect(() => {
    if (!pendingCommand || !active) return undefined;
    const timer = setTimeout(() => {
      if (sessionRef.current) {
        sessionRef.current.write(pendingCommand);
        onCommandConsumed?.();
      }
    }, 700);
    return () => clearTimeout(timer);
  }, [pendingCommand, active, sessionKey, onCommandConsumed]);

  return (
    <div
      className={`terminal-pane ${active ? 'active' : ''}`}
      onMouseDown={onFocus}
    >
      <div className="terminal-pane-header">
        <span className="terminal-shell-label">
          <span className="terminal-shell-icon">&gt;_</span>
          {label}
        </span>
        <button type="button" className="terminal-tool-btn" title="Kill this terminal" onClick={onKill}>
          ×
        </button>
      </div>
      <div ref={containerRef} className="terminal-xterm" />
    </div>
  );
}

export default function Terminal({
  cwd,
  onOutput,
  visible,
  active = true,
  sessionKey = 0,
  shellId = 'powershell',
  terminalName,
  pendingCommand,
  onCommandConsumed,
  splitRequest = 0,
  onSplitHandled,
}) {
  const [panes, setPanes] = useState(() => [
    { id: paneSeq++, shellId, key: sessionKey, name: terminalName || SHELL_LABELS[shellId] || shellId },
  ]);
  const [activePaneId, setActivePaneId] = useState(() => panes[0]?.id);
  const lastSplitRef = useRef(0);
  const lastSessionRef = useRef(sessionKey);

  // External sessionKey reset (new terminal / clear / switch shell)
  useEffect(() => {
    if (sessionKey === lastSessionRef.current) return;
    lastSessionRef.current = sessionKey;
    const name = terminalName || SHELL_LABELS[shellId] || shellId;
    const id = paneSeq++;
    setPanes([{ id, shellId, key: sessionKey, name }]);
    setActivePaneId(id);
  }, [sessionKey, shellId, terminalName]);

  // Rename active pane
  useEffect(() => {
    if (!terminalName) return;
    setPanes((prev) =>
      prev.map((p) => (p.id === activePaneId ? { ...p, name: terminalName } : p))
    );
  }, [terminalName]); // eslint-disable-line react-hooks/exhaustive-deps

  // Split request from menu
  useEffect(() => {
    if (!splitRequest || splitRequest === lastSplitRef.current) return;
    lastSplitRef.current = splitRequest;
    setPanes((prev) => {
      if (prev.length >= 4) return prev;
      const id = paneSeq++;
      const name = `${SHELL_LABELS[shellId] || shellId} (${prev.length + 1})`;
      setActivePaneId(id);
      return [...prev, { id, shellId, key: Date.now(), name }];
    });
    onSplitHandled?.();
  }, [splitRequest, shellId, onSplitHandled]);

  const addPane = useCallback(() => {
    setPanes((prev) => {
      if (prev.length >= 4) return prev;
      const id = paneSeq++;
      const name = `${SHELL_LABELS[shellId] || shellId} (${prev.length + 1})`;
      setActivePaneId(id);
      return [...prev, { id, shellId, key: Date.now(), name }];
    });
  }, [shellId]);

  const killPane = useCallback((id) => {
    setPanes((prev) => {
      if (prev.length <= 1) {
        // Restart single pane
        const nextId = paneSeq++;
        setActivePaneId(nextId);
        return [{ id: nextId, shellId, key: Date.now(), name: SHELL_LABELS[shellId] || shellId }];
      }
      const next = prev.filter((p) => p.id !== id);
      setActivePaneId((cur) => (cur === id ? next[next.length - 1].id : cur));
      return next;
    });
  }, [shellId]);

  const killActive = useCallback(() => {
    killPane(activePaneId);
  }, [activePaneId, killPane]);

  if (!visible) return null;

  return (
    <div className="terminal-panel">
      <div className="terminal-toolbar">
        <div className="terminal-tabs-row">
          {panes.map((pane) => (
            <button
              key={pane.id}
              type="button"
              className={`terminal-tab ${pane.id === activePaneId ? 'active' : ''}`}
              onClick={() => setActivePaneId(pane.id)}
            >
              <span className="terminal-shell-icon">&gt;_</span>
              {pane.name}
            </button>
          ))}
        </div>
        <div className="terminal-toolbar-actions">
          <button type="button" className="terminal-tool-btn" title="New Terminal" onClick={addPane}>
            +
          </button>
          <button type="button" className="terminal-tool-btn" title="Split Terminal" onClick={addPane}>
            <IconSplit size={14} />
          </button>
          <button type="button" className="terminal-tool-btn" title="Kill Terminal" onClick={killActive}>
            ⌫
          </button>
        </div>
      </div>
      <div className={`terminal-panes count-${Math.min(panes.length, 4)}`}>
        {panes.map((pane) => (
          <TerminalPane
            key={`${pane.id}-${pane.key}`}
            cwd={cwd}
            shellId={pane.shellId}
            label={pane.name}
            active={active && pane.id === activePaneId}
            onOutput={onOutput}
            pendingCommand={pane.id === activePaneId ? pendingCommand : null}
            onCommandConsumed={onCommandConsumed}
            onFocus={() => setActivePaneId(pane.id)}
            onKill={() => killPane(pane.id)}
            sessionKey={pane.key}
          />
        ))}
      </div>
    </div>
  );
}
