import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import TitleBar from './components/TitleBar.jsx';
import ActivityBar from './components/ActivityBar.jsx';
import FileExplorer from './components/FileExplorer.jsx';
import SearchPanel from './components/SearchPanel.jsx';
import ScmPanel from './components/ScmPanel.jsx';
import ChatPanel from './components/ChatPanel.jsx';
import Editor from './components/Editor.jsx';
import Tabs from './components/Tabs.jsx';
import BottomPanel from './components/BottomPanel.jsx';
import StatusBar from './components/StatusBar.jsx';
import DiffViewer from './components/DiffViewer.jsx';
import WelcomeView from './components/WelcomeView.jsx';
import CommandPalette from './components/CommandPalette.jsx';
import SettingsPanel from './components/SettingsPanel.jsx';
import HelpDialog from './components/HelpDialog.jsx';
import ResizeHandle from './components/ResizeHandle.jsx';
import WindowResizeEdges from './components/WindowResizeEdges.jsx';
import ExtensionsPanel from './components/ExtensionsPanel.jsx';
import DebugPanel from './components/DebugPanel.jsx';
import RemoteExplorer from './components/RemoteExplorer.jsx';
import { createMenuActionHandler } from './menuActions.js';
import * as editorBridge from './editorBridge.js';

const RECENT_KEY = 'aieditor-recent';
const LAYOUT_KEY = 'aieditor-layout';

function loadLayout() {
  try {
    return JSON.parse(localStorage.getItem(LAYOUT_KEY) || '{}');
  } catch {
    return {};
  }
}

export default function App() {
  const [bridgeOk, setBridgeOk] = useState(false);
  const [bridgeError, setBridgeError] = useState('');
  const [project, setProject] = useState(null);
  const [openFiles, setOpenFiles] = useState([]);
  const [activeFileId, setActiveFileId] = useState(null);
  const [activeView, setActiveView] = useState('explorer');
  const [showAIPanel, setShowAIPanel] = useState(true);
  const [showTerminal, setShowTerminal] = useState(true);
  const [showSideBar, setShowSideBar] = useState(true);
  const [showStatusBar, setShowStatusBar] = useState(true);
  const [showActivityBar, setShowActivityBar] = useState(true);
  const [zenMode, setZenMode] = useState(false);
  const [centeredLayout, setCenteredLayout] = useState(false);
  const [wordWrap, setWordWrap] = useState('off');
  const [minimap, setMinimap] = useState(true);
  const [showBreadcrumbs, setShowBreadcrumbs] = useState(true);
  const [autoSave, setAutoSave] = useState(false);
  const [bottomTab, setBottomTab] = useState('terminal');
  const [panelMaximized, setPanelMaximized] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsSection, setSettingsSection] = useState('settings');
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [pendingDiff, setPendingDiff] = useState(null);
  const [diffHistory, setDiffHistory] = useState([]);
  const [gitStatus, setGitStatus] = useState(null);
  const [terminalOutput, setTerminalOutput] = useState('');
  const [runtimeLogs, setRuntimeLogs] = useState('');
  const [outputChannels, setOutputChannels] = useState({ Terminal: '', AIEditor: '', Debug: '' });
  const [outputChannel, setOutputChannel] = useState('Terminal');
  const [problems, setProblems] = useState([]);
  const [debugEntries, setDebugEntries] = useState([]);
  const [ports, setPorts] = useState([]);
  const [terminalSessionKey, setTerminalSessionKey] = useState(0);
  const [terminalSplitRequest, setTerminalSplitRequest] = useState(0);
  const [terminalShell, setTerminalShell] = useState('powershell');
  const [terminalName, setTerminalName] = useState('');
  const [pendingTerminalCommand, setPendingTerminalCommand] = useState(null);
  const [recentProjects, setRecentProjects] = useState([]);
  const [helpDialog, setHelpDialog] = useState(null);
  const [cursorInfo, setCursorInfo] = useState({ line: 1, column: 1, selection: '' });
  const [previewEnabled, setPreviewEnabled] = useState(true);
  const [groupLocked, setGroupLocked] = useState(false);
  const [showTabIcons, setShowTabIcons] = useState(true);
  const [editorSplit, setEditorSplit] = useState(false);
  const [secondaryFileId, setSecondaryFileId] = useState(null);
  const [showOpenedEditors, setShowOpenedEditors] = useState(false);
  const [explorerRefreshing, setExplorerRefreshing] = useState(false);
  const chordRef = useRef(null);
  const [previewEnabled, setPreviewEnabled] = useState(true);
  const [groupLocked, setGroupLocked] = useState(false);
  const [showTabIcons, setShowTabIcons] = useState(true);
  const [editorSplit, setEditorSplit] = useState(false);
  const [secondaryFileId, setSecondaryFileId] = useState(null);
  const [showOpenedEditors, setShowOpenedEditors] = useState(false);
  const [explorerRefreshing, setExplorerRefreshing] = useState(false);
  const chordRef = useRef(null);

  const initialLayout = loadLayout();
  const [sideWidth, setSideWidth] = useState(initialLayout.sideWidth || 260);
  const [aiWidth, setAiWidth] = useState(initialLayout.aiWidth || 380);
  const [bottomHeight, setBottomHeight] = useState(initialLayout.bottomHeight || 220);
  const sideWidthRef = useRef(sideWidth);
  const aiWidthRef = useRef(aiWidth);
  const bottomHeightRef = useRef(bottomHeight);
  sideWidthRef.current = sideWidth;
  aiWidthRef.current = aiWidth;
  bottomHeightRef.current = bottomHeight;

  const activeFile = openFiles.find((f) => f.id === activeFileId) || null;
  const handlerRef = useRef(null);

  const aiContext = useMemo(
    () => ({
      openFile: activeFile
        ? { path: activeFile.path, content: activeFile.content, language: activeFile.language }
        : null,
      projectRoot: project?.rootPath,
      terminalOutput,
      runtimeLogs,
    }),
    [activeFile, project?.rootPath, terminalOutput, runtimeLogs]
  );

  const openFile = useCallback(async (filePath, options = {}) => {
    if (!window.aieditor) return;
    const { preview = previewEnabled, pin = false } = options;

    const existing = openFiles.find((f) => f.path === filePath);
    if (existing) {
      setOpenFiles((prev) =>
        prev.map((f) =>
          f.id === existing.id
            ? { ...f, preview: pin ? false : f.preview }
            : f
        )
      );
      setActiveFileId(existing.id);
      return;
    }

    if (groupLocked) {
      window.alert('Editor group is locked. Unlock it from the tabs menu to open more files.');
      return;
    }

    const data = await window.aieditor.readFile(filePath);
    const file = {
      id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      path: data.path,
      name: data.path.split(/[/\\]/).pop(),
      content: data.content,
      language: data.language,
      dirty: false,
      preview: preview && !pin,
    };

    setOpenFiles((prev) => {
      if (file.preview) {
        const withoutPreview = prev.filter((f) => !f.preview || f.dirty);
        return [...withoutPreview, file];
      }
      return [...prev, file];
    });
    setActiveFileId(file.id);
  }, [openFiles, previewEnabled, groupLocked]);

  const refreshExplorer = useCallback(async () => {
    if (!project?.rootPath || !window.aieditor?.refreshWorkspace) return;
    setExplorerRefreshing(true);
    try {
      const result = await window.aieditor.refreshWorkspace(project.rootPath);
      if (result) setProject(result);
    } finally {
      setExplorerRefreshing(false);
    }
  }, [project?.rootPath]);

  const createNewFileInExplorer = useCallback(async (dirPath) => {
    if (!project?.rootPath || !window.aieditor) return;
    const name = window.prompt('File name:', 'untitled.txt');
    if (!name?.trim()) return;
    const target = dirPath || project.rootPath;
    const created = await window.aieditor.createFile(target, name.trim());
    await refreshExplorer();
    if (created?.path) await openFile(created.path, { pin: true, preview: false });
  }, [project?.rootPath, refreshExplorer, openFile]);

  const createNewFolderInExplorer = useCallback(async (dirPath) => {
    if (!project?.rootPath || !window.aieditor) return;
    const name = window.prompt('Folder name:', 'new-folder');
    if (!name?.trim()) return;
    const target = dirPath || project.rootPath;
    await window.aieditor.createFolder(target, name.trim());
    await refreshExplorer();
  }, [project?.rootPath, refreshExplorer]);

  const closeAllFiles = useCallback(() => {
    const dirty = openFiles.filter((f) => f.dirty);
    if (dirty.length) {
      const ok = window.confirm(`${dirty.length} unsaved file(s). Close all anyway?`);
      if (!ok) return;
    }
    setOpenFiles([]);
    setActiveFileId(null);
    setSecondaryFileId(null);
  }, [openFiles]);

  const closeSavedFiles = useCallback(() => {
    setOpenFiles((prev) => {
      const next = prev.filter((f) => f.dirty);
      if (!next.find((f) => f.id === activeFileId)) {
        setActiveFileId(next.length ? next[next.length - 1].id : null);
      }
      return next;
    });
  }, [activeFileId]);

  const openActiveInBrowser = useCallback(async () => {
    const target = activeFile?.path || project?.rootPath;
    if (!target) {
      window.alert('Open a file or folder first.');
      return;
    }
    await window.aieditor?.openInBrowser(target);
  }, [activeFile?.path, project?.rootPath]);

  const toggleSplitEditor = useCallback(() => {
    setEditorSplit((v) => {
      const next = !v;
      if (next) {
        const other = openFiles.find((f) => f.id !== activeFileId);
        setSecondaryFileId(other?.id || activeFileId);
      } else {
        setSecondaryFileId(null);
      }
      return next;
    });
  }, [openFiles, activeFileId]);

  const updateFileContent = useCallback((id, content) => {
    setOpenFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, content, dirty: true } : f))
    );
  }, []);

  const closeFile = useCallback((id) => {
    setOpenFiles((prev) => {
      const next = prev.filter((f) => f.id !== id);
      if (activeFileId === id) {
        setActiveFileId(next.length ? next[next.length - 1].id : null);
      }
      return next;
    });
  }, [activeFileId]);

  const saveFile = useCallback(async () => {
    if (!activeFile || !window.aieditor) return;
    await window.aieditor.writeFile(activeFile.path, activeFile.content);
    setOpenFiles((prev) =>
      prev.map((f) => (f.id === activeFile.id ? { ...f, dirty: false } : f))
    );
  }, [activeFile]);

  const saveAllFiles = useCallback(async () => {
    if (!window.aieditor) return;
    const dirty = openFiles.filter((f) => f.dirty);
    await Promise.all(dirty.map((f) => window.aieditor.writeFile(f.path, f.content)));
    setOpenFiles((prev) => prev.map((f) => ({ ...f, dirty: false })));
  }, [openFiles]);

  const handleOpenFolder = useCallback(async () => {
    if (!window.aieditor) return;
    const result = await window.aieditor.openFolder();
    if (result) {
      setProject(result);
      const status = await window.aieditor.gitStatus(result.rootPath);
      setGitStatus(status);
      setRecentProjects((prev) => {
        const next = [result.rootPath, ...prev.filter((p) => p !== result.rootPath)].slice(0, 8);
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
        return next;
      });
    }
  }, []);

  const applyDiff = useCallback(async () => {
    if (!pendingDiff || !activeFile) return;
    setDiffHistory((h) => [
      ...h,
      { fileId: activeFile.id, oldContent: activeFile.content, newContent: pendingDiff.newContent },
    ]);
    updateFileContent(activeFile.id, pendingDiff.newContent);
    await window.aieditor?.aiApprove?.('allow', pendingDiff);
    setPendingDiff(null);
  }, [pendingDiff, activeFile, updateFileContent]);

  const undoDiff = useCallback(async () => {
    const last = diffHistory[diffHistory.length - 1];
    if (!last) {
      setPendingDiff(null);
      return;
    }
    updateFileContent(last.fileId, last.oldContent);
    setDiffHistory((h) => h.slice(0, -1));
    await window.aieditor?.aiApprove?.('undo', last);
    setPendingDiff(null);
  }, [diffHistory, updateFileContent]);

  const keepAllDiffs = useCallback(async () => {
    if (pendingDiff && activeFile) {
      updateFileContent(activeFile.id, pendingDiff.newContent);
      await window.aieditor?.aiApprove?.('keepAll', pendingDiff);
    }
    setPendingDiff(null);
    setDiffHistory([]);
  }, [pendingDiff, activeFile, updateFileContent]);

  const runDiff = useCallback(async () => {
    await applyDiff();
    if (activeFile?.path) {
      await window.aieditor?.invokeMenuAction?.('terminal.runActiveFile');
    }
  }, [applyDiff, activeFile]);

  // Sync workspace state to main process for menu backends
  useEffect(() => {
    if (!window.aieditor?.setWorkspaceState) return;
    window.aieditor.setWorkspaceState({
      rootPath: project?.rootPath || null,
      activeFile: activeFile
        ? {
            path: activeFile.path,
            content: activeFile.content,
            language: activeFile.language,
            line: cursorInfo.line,
            selection: cursorInfo.selection,
          }
        : null,
    });
  }, [project?.rootPath, activeFile, cursorInfo]);

  // Auto-save
  useEffect(() => {
    if (!autoSave || !activeFile?.dirty) return undefined;
    const t = setTimeout(() => saveFile(), 1200);
    return () => clearTimeout(t);
  }, [autoSave, activeFile?.content, activeFile?.dirty, saveFile]);

  handlerRef.current = createMenuActionHandler({
    project,
    openFiles,
    activeFile,
    activeFileId,
    setProject,
    setOpenFiles,
    setActiveFileId,
    setActiveView,
    setShowAIPanel,
    setShowTerminal,
    setBottomTab,
    setShowSettings,
    setSettingsSection,
    setCommandPaletteOpen,
    setShowSideBar,
    setShowStatusBar,
    setShowActivityBar,
    setZenMode,
    setCenteredLayout,
    setWordWrap,
    setMinimap,
    setShowBreadcrumbs,
    setAutoSave,
    autoSave,
    wordWrap,
    minimap,
    showBreadcrumbs,
    showSideBar,
    showStatusBar,
    showActivityBar,
    showTerminal,
    zenMode,
    centeredLayout,
    openFile,
    closeFile,
    saveFile,
    saveAllFiles,
    handleOpenFolder,
    setHelpDialog,
    setGitStatus,
    setRecentProjects,
    setTerminalSessionKey,
    setTerminalSplitRequest,
    setTerminalShell,
    setTerminalName,
    setPendingTerminalCommand,
    setDebugEntries,
    setOutputChannels,
    setOutputChannel,
    problems,
    setPendingDiff,
    pendingDiff,
    applyDiff,
    undoDiff,
    keepAllDiffs,
  });

  const commands = useMemo(
    () => [
      { id: 'open', label: 'Open Folder', category: 'File', shortcut: 'Ctrl+O', action: handleOpenFolder },
      { id: 'save', label: 'Save File', category: 'File', shortcut: 'Ctrl+S', action: saveFile },
      { id: 'saveAll', label: 'Save All', category: 'File', action: saveAllFiles },
      { id: 'palette', label: 'Command Palette', category: 'View', shortcut: 'Ctrl+Shift+P', action: () => setCommandPaletteOpen(true) },
      { id: 'ai', label: 'Toggle AI Panel', category: 'AI', action: () => setShowAIPanel((v) => !v) },
      { id: 'term', label: 'Toggle Terminal', category: 'View', shortcut: 'Ctrl+`', action: () => { setShowTerminal((v) => !v); setBottomTab('terminal'); } },
      { id: 'problems', label: 'Show Problems', category: 'View', action: () => { setShowTerminal(true); setBottomTab('problems'); } },
      { id: 'explorer', label: 'Show Explorer', category: 'View', action: () => setActiveView('explorer') },
      { id: 'search', label: 'Show Search', category: 'View', action: () => setActiveView('search') },
      { id: 'scm', label: 'Show Source Control', category: 'View', action: () => setActiveView('scm') },
      { id: 'format', label: 'Format Document', category: 'Edit', action: () => editorBridge.runEditorAction('edit.formatDocument') },
    ],
    [handleOpenFolder, saveFile, saveAllFiles]
  );

  const refreshPorts = useCallback(async () => {
    if (!window.aieditor?.listPorts) return;
    try {
      setPorts((await window.aieditor.listPorts()) || []);
    } catch {
      setPorts([]);
    }
  }, []);

  const handleTerminalOutput = useCallback((text) => {
    setTerminalOutput((prev) => (prev + text).slice(-8000));
    setOutputChannels((prev) => ({
      ...prev,
      Terminal: ((prev.Terminal || '') + text).slice(-20000),
    }));
  }, []);

  const handleDebugEvaluate = useCallback((expression) => {
    setDebugEntries((prev) => [
      ...prev,
      { type: 'input', text: expression },
      { type: 'log', text: `Result: ${expression}` },
    ].slice(-200));
  }, []);

  const handleOpenProblem = useCallback((problem) => {
    if (problem?.file) {
      openFile(problem.file).then(() => {
        if (problem.line) editorBridge.revealLine(problem.line);
      });
    }
  }, [openFile]);

  useEffect(() => {
    let attempts = 0;
    const check = () => {
      if (window.aieditor?.isElectron) {
        setBridgeOk(true);
        return;
      }
      attempts += 1;
      if (attempts < 20) setTimeout(check, 100);
      else {
        const inBrowser = !navigator.userAgent.toLowerCase().includes('electron');
        setBridgeError(
          inBrowser
            ? 'You opened the web dev server in a browser. Run "npm run dev" to launch the Electron app.'
            : 'The preload bridge failed to load.'
        );
      }
    };
    check();

    try {
      setRecentProjects(JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'));
    } catch { /* ignore */ }
  }, []);

  // Menu actions from Electron Menu API (via backend managers)
  useEffect(() => {
    if (!window.aieditor?.onMenuAction) return undefined;
    return window.aieditor.onMenuAction((action, payload) => {
      handlerRef.current?.(action, payload);
    });
  }, []);

  // Runtime logs → AI context
  useEffect(() => {
    if (!window.aieditor?.onRuntimeLog) return undefined;
    return window.aieditor.onRuntimeLog((entry) => {
      const line = `[${entry.level}] ${entry.source}: ${entry.message}`;
      setRuntimeLogs((prev) => (prev + '\n' + line).slice(-8000));
      setOutputChannels((prev) => ({
        ...prev,
        AIEditor: ((prev.AIEditor || '') + line + '\n').slice(-20000),
      }));
    });
  }, []);

  useEffect(() => {
    localStorage.setItem(
      LAYOUT_KEY,
      JSON.stringify({ sideWidth, aiWidth, bottomHeight })
    );
  }, [sideWidth, aiWidth, bottomHeight]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's' && !e.shiftKey) {
        e.preventDefault();
        saveFile();
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setShowSideBar(true);
        setShowSettings(false);
        setActiveView('explorer');
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setShowSideBar(true);
        setShowSettings(false);
        setActiveView('search');
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        setShowSideBar(true);
        setShowSettings(false);
        setActiveView('scm');
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'x') {
        e.preventDefault();
        setShowSideBar(true);
        setShowSettings(false);
        setActiveView('extensions');
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        setShowSideBar(true);
        setShowSettings(false);
        setActiveView('debug');
        setShowTerminal(true);
        setBottomTab('debug');
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l' && !e.shiftKey) {
        e.preventDefault();
        setShowAIPanel((v) => !v);
      }
      if (e.key === 'Escape') {
        setCommandPaletteOpen(false);
        setHelpDialog(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [saveFile]);

  const openRecentWorkspace = useCallback(async (rootPath) => {
    if (!window.aieditor?.openRecent) return;
    const result = await window.aieditor.openRecent(rootPath);
    if (result) {
      setProject(result);
      const status = await window.aieditor.gitStatus(result.rootPath);
      setGitStatus(status);
    }
  }, []);

  if (!bridgeOk) {
    return (
      <div className="bridge-error">
        <h2>AIEditor failed to start</h2>
        <p>{bridgeError || 'Connecting to Electron bridge...'}</p>
      </div>
    );
  }

  const projectName = project?.rootPath?.split(/[/\\]/).pop();

  const renderSidePanel = () => {
    if (activeView === 'ai') {
      return (
        <ChatPanel context={aiContext} onProposeDiff={setPendingDiff} mode="panel" />
      );
    }
    if (activeView === 'search') {
      return <SearchPanel rootPath={project?.rootPath} onOpenFile={openFile} />;
    }
    if (activeView === 'scm') {
      return <ScmPanel rootPath={project?.rootPath} gitStatus={gitStatus} />;
    }
    if (activeView === 'extensions') {
      return <ExtensionsPanel />;
    }
    if (activeView === 'debug') {
      return (
        <DebugPanel
          activeFile={activeFile}
          onRun={() => window.aieditor?.invokeMenuAction('run.withoutDebug')}
          onDebug={() => window.aieditor?.invokeMenuAction('run.startDebug')}
          onStop={() => window.aieditor?.invokeMenuAction('run.stopDebug')}
          onToggleBreakpoint={() => window.aieditor?.invokeMenuAction('run.toggleBreakpoint')}
        />
      );
    }
    if (activeView === 'remote') {
      return (
        <RemoteExplorer
          recentProjects={recentProjects}
          onOpenFolder={handleOpenFolder}
          onOpenRecent={openRecentWorkspace}
          onConnectRemote={(host) => {
            setShowTerminal(true);
            setBottomTab('terminal');
            setTerminalSessionKey((k) => k + 1);
            setPendingTerminalCommand(host.startsWith('ssh ') ? host : `ssh ${host}`);
          }}
        />
      );
    }
    return (
      <FileExplorer
        tree={project?.tree}
        rootPath={project?.rootPath}
        onOpenFile={openFile}
        activePath={activeFile?.path}
      />
    );
  };

  return (
    <div className={`app cursor-theme ${zenMode ? 'zen-mode' : ''} ${centeredLayout ? 'centered-layout' : ''}`}>
      <WindowResizeEdges />
      <TitleBar projectName={projectName} recent={recentProjects} autoSave={autoSave} />

      <div className="workbench">
        {showActivityBar && (
          <ActivityBar
            active={activeView}
            onChange={(view) => {
              setShowSideBar(true);
              setShowSettings(false);
              setActiveView(view);
              if (view === 'debug') {
                setShowTerminal(true);
                setBottomTab('debug');
              }
            }}
            onToggleAI={() => setShowAIPanel((v) => !v)}
            onSettings={() => {
              setShowSideBar(true);
              setShowSettings((v) => !v);
              setSettingsSection('settings');
            }}
          />
        )}

        {showSideBar && (
          <>
            <aside
              className="side-panel"
              style={{
                width: sideWidth,
                flex: `0 0 ${sideWidth}px`,
                minWidth: 160,
                maxWidth: 640,
              }}
            >
              {showSettings ? (
                <SettingsPanel
                  section={settingsSection}
                  onClose={() => setShowSettings(false)}
                />
              ) : (
                renderSidePanel()
              )}
            </aside>
            <ResizeHandle
              direction="horizontal"
              title="Drag to resize side bar"
              getSize={() => sideWidthRef.current}
              onResize={(start, delta) => {
                setSideWidth(Math.min(640, Math.max(160, start + delta)));
              }}
            />
          </>
        )}

        <main className={`editor-workspace ${centeredLayout ? 'centered' : ''}`}>
          <Tabs
            files={openFiles}
            activeId={activeFileId}
            onSelect={setActiveFileId}
            onClose={closeFile}
          />

          <div className="editor-main">
            {pendingDiff ? (
              <DiffViewer
                diff={pendingDiff}
                onRun={runDiff}
                onAllow={applyDiff}
                onUndo={undoDiff}
                onKeepAll={keepAllDiffs}
                onDismiss={() => setPendingDiff(null)}
              />
            ) : !activeFile ? (
              <WelcomeView onOpenFolder={handleOpenFolder} recentProjects={recentProjects} />
            ) : (
              <Editor
                file={activeFile}
                onChange={(content) => updateFileContent(activeFile.id, content)}
                onProblems={setProblems}
                wordWrap={wordWrap}
                minimap={minimap}
                showBreadcrumbs={showBreadcrumbs}
                onCursorChange={setCursorInfo}
              />
            )}
          </div>

          {showTerminal && (
            <ResizeHandle
              direction="vertical"
              title="Drag to resize terminal panel"
              getSize={() => bottomHeightRef.current}
              onResize={(start, delta) => {
                // Drag up (negative delta) grows the panel
                setBottomHeight(Math.min(700, Math.max(120, start - delta)));
                if (panelMaximized) setPanelMaximized(false);
              }}
            />
          )}

          <BottomPanel
            visible={showTerminal}
            activeTab={bottomTab}
            onTabChange={(tab) => {
              setBottomTab(tab);
              if (tab === 'ports') refreshPorts();
            }}
            cwd={project?.rootPath}
            onOutput={handleTerminalOutput}
            onToggle={() => setShowTerminal(false)}
            onMaximize={() => {
              if (panelMaximized) {
                setPanelMaximized(false);
              } else {
                setBottomHeight(Math.max(bottomHeight, Math.floor(window.innerHeight * 0.55)));
                setPanelMaximized(true);
              }
            }}
            maximized={panelMaximized}
            height={bottomHeight}
            problems={problems}
            onOpenProblem={handleOpenProblem}
            outputChannels={outputChannels}
            outputChannel={outputChannel}
            onOutputChannelChange={setOutputChannel}
            onClearOutput={(channel) => {
              setOutputChannels((prev) => ({ ...prev, [channel]: '' }));
              if (channel === 'Terminal') setTerminalOutput('');
            }}
            debugEntries={debugEntries}
            onDebugEvaluate={handleDebugEvaluate}
            ports={ports}
            onRefreshPorts={refreshPorts}
            terminalSessionKey={terminalSessionKey}
            terminalSplitRequest={terminalSplitRequest}
            onTerminalSplitHandled={() => {}}
            terminalShell={terminalShell}
            terminalName={terminalName}
            pendingTerminalCommand={pendingTerminalCommand}
            onTerminalCommandConsumed={() => setPendingTerminalCommand(null)}
          />
        </main>

        {showAIPanel && activeView !== 'ai' && !zenMode && (
          <>
            <ResizeHandle
              direction="horizontal"
              title="Drag to resize chat panel"
              getSize={() => aiWidthRef.current}
              onResize={(start, delta) => {
                // Handle is on the left of the chat panel; drag right shrinks it
                setAiWidth(Math.min(720, Math.max(240, start - delta)));
              }}
            />
            <aside
              className="ai-panel"
              style={{
                width: aiWidth,
                flex: `0 0 ${aiWidth}px`,
                minWidth: 240,
                maxWidth: 720,
              }}
            >
              <ChatPanel
                context={aiContext}
                onProposeDiff={(diff) =>
                  setPendingDiff({
                    ...diff,
                    language: activeFile?.language,
                  })
                }
                mode="sidebar"
              />
            </aside>
          </>
        )}
      </div>

      {showStatusBar && (
        <StatusBar
          file={activeFile}
          gitStatus={gitStatus}
          projectRoot={project?.rootPath}
          aiReady={Boolean(runtimeLogs)}
        />
      )}

      <CommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        commands={commands}
      />

      <HelpDialog dialog={helpDialog} onClose={() => setHelpDialog(null)} />
    </div>
  );
}
