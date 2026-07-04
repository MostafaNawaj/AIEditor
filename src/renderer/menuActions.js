import * as editorBridge from './editorBridge.js';

/**
 * Create a menu action handler bound to app state setters.
 */
export function createMenuActionHandler(ctx) {
  const {
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
    setQuickOpen,
    setReplaceDialog,
    setNavHistory,
    setTerminalSessionKey,
    setTerminalSplitRequest,
    setTerminalShell,
    setTerminalName,
    setPendingTerminalCommand,
    setDebugEntries,
    setOutputChannels,
    setOutputChannel,
    setBottomTabDebug,
    problems,
    setPendingDiff,
    pendingDiff,
    applyDiff,
    undoDiff,
    keepAllDiffs,
    setGitStatus,
    recentProjects,
    setRecentProjects,
  } = ctx;

  async function loadFileData(data) {
    if (!data?.path) return;
    const existing = openFiles.find((f) => f.path === data.path);
    if (existing) {
      setActiveFileId(existing.id);
      return;
    }
    const file = {
      id: `file-${Date.now()}`,
      path: data.path,
      name: data.path.split(/[/\\]/).pop(),
      content: data.content,
      language: data.language,
      dirty: false,
    };
    setOpenFiles((prev) => [...prev, file]);
    setActiveFileId(file.id);
  }

  async function openWorkspace(tree) {
    if (!tree) return;
    setProject(tree);
    if (window.aieditor?.gitStatus) {
      const status = await window.aieditor.gitStatus(tree.rootPath);
      setGitStatus?.(status);
    }
    setRecentProjects?.((prev) => {
      const next = [tree.rootPath, ...prev.filter((p) => p !== tree.rootPath)].slice(0, 8);
      localStorage.setItem('aieditor-recent', JSON.stringify(next));
      return next;
    });
  }

  return async function handleMenuAction(action, payload = {}) {
    // Editor-native commands
    if (editorBridge.runEditorAction(action)) return;

    switch (action) {
      case 'file.newFile': {
        const data = await window.aieditor.createUntitled(project?.rootPath);
        await loadFileData(data);
        break;
      }
      case 'file.openFile':
        if (payload?.path) await loadFileData(payload);
        break;
      case 'file.openFolder':
        if (payload?.rootPath) await openWorkspace(payload);
        break;
      case 'file.save':
        await saveFile();
        break;
      case 'file.saveAs':
        if (payload?.path) {
          setOpenFiles((prev) =>
            prev.map((f) =>
              f.id === activeFileId
                ? { ...f, path: payload.path, name: payload.path.split(/[/\\]/).pop(), content: payload.content, dirty: false, language: payload.language }
                : f
            )
          );
        } else if (activeFile) {
          const data = await window.aieditor.saveAs(activeFile.path, activeFile.content);
          if (data) {
            setOpenFiles((prev) =>
              prev.map((f) =>
                f.id === activeFileId
                  ? { ...f, path: data.path, name: data.path.split(/[/\\]/).pop(), content: data.content, dirty: false, language: data.language }
                  : f
              )
            );
          }
        }
        break;
      case 'file.saveAll':
        await saveAllFiles();
        break;
      case 'file.toggleAutoSave':
        setAutoSave((v) => !v);
        break;
      case 'file.closeEditor':
        if (activeFileId) closeFile(activeFileId);
        break;
      case 'file.closeFolder':
        setProject(null);
        setOpenFiles([]);
        setActiveFileId(null);
        setGitStatus?.(null);
        break;
      case 'file.preferences':
        setShowSideBar(true);
        if (payload.section === 'extensions') {
          setShowSettings(false);
          setActiveView('extensions');
        } else {
          setShowSettings(true);
          setSettingsSection?.(payload.section || 'settings');
        }
        break;

      case 'edit.findInFiles':
        setActiveView('search');
        setShowSideBar(true);
        break;
      case 'edit.replaceInFiles': {
        setActiveView('search');
        setShowSideBar(true);
        if (!project?.rootPath) break;
        const query = window.prompt('Find in files:');
        if (!query) break;
        const replacement = window.prompt('Replace with:', '');
        if (replacement == null) break;
        const result = await window.aieditor.replaceInFiles(project.rootPath, query, replacement);
        setOutputChannels((prev) => ({
          ...prev,
          AIEditor: ((prev.AIEditor || '') + `Replaced in ${result.changed} file(s)\n`).slice(-20000),
        }));
        setShowTerminal(true);
        setBottomTab('output');
        setOutputChannel('AIEditor');
        break;
      }

      case 'view.commandPalette':
        setCommandPaletteOpen(true);
        break;
      case 'view.explorer':
        setActiveView('explorer');
        setShowSideBar(true);
        setShowSettings(false);
        break;
      case 'view.search':
        setActiveView('search');
        setShowSideBar(true);
        setShowSettings(false);
        break;
      case 'view.sourceControl':
        setActiveView('scm');
        setShowSideBar(true);
        setShowSettings(false);
        break;
      case 'view.runAndDebug':
        setShowSideBar(true);
        setShowTerminal(true);
        setBottomTab('debug');
        setActiveView('debug');
        break;
      case 'view.extensions':
        setShowSideBar(true);
        setShowSettings(false);
        setActiveView('extensions');
        break;
      case 'view.toggleSideBar':
        setShowSideBar((v) => !v);
        break;
      case 'view.toggleStatusBar':
        setShowStatusBar((v) => !v);
        break;
      case 'view.toggleActivityBar':
        setShowActivityBar((v) => !v);
        break;
      case 'view.togglePanel':
        setShowTerminal((v) => !v);
        break;
      case 'view.zenMode':
        setZenMode((v) => {
          const next = !v;
          if (next) {
            setShowSideBar(false);
            setShowActivityBar(false);
            setShowTerminal(false);
            setShowAIPanel(false);
          } else {
            setShowSideBar(true);
            setShowActivityBar(true);
            setShowTerminal(true);
          }
          return next;
        });
        break;
      case 'view.centeredLayout':
        setCenteredLayout((v) => !v);
        break;
      case 'view.toggleWordWrap':
        setWordWrap((v) => {
          const next = v === 'on' ? 'off' : 'on';
          editorBridge.applyEditorOptions({ wordWrap: next });
          return next;
        });
        break;
      case 'view.toggleMinimap':
        setMinimap((v) => {
          const next = !v;
          editorBridge.applyEditorOptions({ minimap: { enabled: next } });
          return next;
        });
        break;
      case 'view.toggleBreadcrumbs':
        setShowBreadcrumbs((v) => !v);
        break;

      case 'go.back':
      case 'go.forward':
        if (payload?.entry?.path) openFile(payload.entry.path);
        break;
      case 'go.navigateToFile':
        setQuickOpen?.(true);
        setCommandPaletteOpen(true);
        break;
      case 'go.navigateToSymbol':
        editorBridge.trigger('editor.action.quickOutline');
        break;
      case 'go.nextChange':
      case 'go.previousChange':
        setActiveView('scm');
        break;
      case 'go.switchTab': {
        if (!openFiles.length) break;
        const idx = openFiles.findIndex((f) => f.id === activeFileId);
        const next =
          payload.direction === 'prev'
            ? (idx - 1 + openFiles.length) % openFiles.length
            : (idx + 1) % openFiles.length;
        setActiveFileId(openFiles[next].id);
        break;
      }
      case 'go.navigateHistory':
        setNavHistory?.(payload);
        setCommandPaletteOpen(true);
        break;

      case 'debug.started':
      case 'debug.stopped':
        setShowTerminal(true);
        setBottomTab('debug');
        setDebugEntries((prev) => [
          ...prev,
          { type: 'log', text: action === 'debug.started' ? 'Debug session started' : `Stopped (code ${payload.code})` },
        ].slice(-200));
        break;
      case 'debug.output':
        setShowTerminal(true);
        setBottomTab('debug');
        setOutputChannels((prev) => ({
          ...prev,
          Debug: ((prev.Debug || '') + (payload.text || '')).slice(-20000),
        }));
        setOutputChannel('Debug');
        setDebugEntries((prev) => [
          ...prev,
          { type: payload.stream === 'stderr' ? 'error' : 'log', text: payload.text },
        ].slice(-200));
        break;
      case 'debug.console':
        setDebugEntries((prev) => [...prev, { type: 'log', text: payload.text }].slice(-200));
        break;
      case 'debug.breakpoints':
        setDebugEntries((prev) => [
          ...prev,
          { type: 'log', text: `Breakpoints: ${(payload.breakpoints || []).length}` },
        ].slice(-200));
        break;
      case 'debug.stepOver':
      case 'debug.stepInto':
      case 'debug.stepOut':
      case 'debug.continue':
        setDebugEntries((prev) => [...prev, { type: 'log', text: action.replace('debug.', '') }].slice(-200));
        break;

      case 'terminal.new':
        setShowTerminal(true);
        setBottomTab('terminal');
        if (payload.shellId) setTerminalShell?.(payload.shellId);
        setTerminalSessionKey((k) => k + 1);
        break;
      case 'terminal.split':
        setShowTerminal(true);
        setBottomTab('terminal');
        setTerminalSplitRequest?.((k) => k + 1);
        break;
      case 'terminal.kill':
        setTerminalSessionKey((k) => k + 1);
        break;
      case 'terminal.rename': {
        const name = window.prompt('Terminal name', payload.name || 'powershell');
        if (name) setTerminalName?.(name);
        break;
      }
      case 'terminal.switch':
        setShowTerminal(true);
        setBottomTab('terminal');
        setTerminalShell?.(payload.shellId || 'powershell');
        setTerminalSessionKey((k) => k + 1);
        break;
      case 'terminal.runCommand':
        setShowTerminal(true);
        setBottomTab('terminal');
        setPendingTerminalCommand?.(payload.command);
        break;
      case 'terminal.clear':
        setTerminalSessionKey((k) => k + 1);
        break;
      case 'terminal.copy': {
        const text = editorBridge.getSelectionText();
        if (text) await window.aieditor.writeClipboard(text);
        break;
      }
      case 'terminal.paste':
        setPendingTerminalCommand?.(await window.aieditor.readClipboard());
        break;
      case 'terminal.togglePanel':
        setShowTerminal((v) => !v);
        setBottomTab('terminal');
        break;
      case 'terminal.write':
        setOutputChannels((prev) => ({
          ...prev,
          Terminal: ((prev.Terminal || '') + (payload.text || '')).slice(-20000),
        }));
        break;

      case 'help.welcome':
        setHelpDialog?.({ type: 'welcome' });
        break;
      case 'help.keyboardShortcuts':
        setHelpDialog?.({ type: 'shortcuts', content: await window.aieditor.getShortcuts() });
        break;
      case 'help.tips':
        setHelpDialog?.({ type: 'tips', content: await window.aieditor.getTips() });
        break;
      case 'help.releaseNotes':
        setHelpDialog?.({ type: 'releaseNotes', content: await window.aieditor.getReleaseNotes() });
        break;
      case 'help.license':
        setHelpDialog?.({ type: 'license', content: await window.aieditor.getLicense() });
        break;
      case 'help.about':
      case 'help.documentation':
      case 'help.reportIssue':
        break;

      case 'ai.run':
        if (pendingDiff) applyDiff?.();
        break;
      case 'ai.allow':
        if (pendingDiff) {
          await window.aieditor.aiApprove('allow', pendingDiff);
          applyDiff?.();
        }
        break;
      case 'ai.undo':
        undoDiff?.();
        break;
      case 'ai.keepAll':
        keepAllDiffs?.();
        break;

      default:
        break;
    }
  };
}
