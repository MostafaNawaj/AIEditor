import React, { useState, useEffect, useCallback } from 'react';

function TreeNode({
  node,
  depth,
  onOpenFile,
  onOpenFilePin,
  activePath,
  expandedMap,
  onToggle,
  selectedDir,
  onSelectDir,
}) {
  const isDir = node.type === 'directory';
  const isExpanded = isDir && expandedMap[node.path] === true;

  if (!isDir) {
    const ext = node.name.split('.').pop();
    return (
      <div
        className={`tree-file ${node.path === activePath ? 'active' : ''}`}
        style={{ paddingLeft: depth * 14 + 20 }}
        onClick={() => onOpenFile(node.path)}
        onDoubleClick={() => onOpenFilePin(node.path)}
        title={node.path}
      >
        <span className={`file-icon ext-${ext}`} />
        <span className="file-name">{node.name}</span>
      </div>
    );
  }

  return (
    <div className="tree-dir">
      <div
        className={`tree-dir-label ${selectedDir === node.path ? 'selected' : ''}`}
        style={{ paddingLeft: depth * 14 + 8 }}
        onClick={() => {
          onSelectDir(node.path);
          onToggle(node.path);
        }}
        title={node.path}
      >
        <span className="tree-chevron">{isExpanded ? '▼' : '▶'}</span>
        <span className="folder-icon" />
        <span>{node.name}</span>
      </div>
      {isExpanded &&
        node.children?.map((child) => (
          <TreeNode
            key={child.path}
            node={child}
            depth={depth + 1}
            onOpenFile={onOpenFile}
            onOpenFilePin={onOpenFilePin}
            activePath={activePath}
            expandedMap={expandedMap}
            onToggle={onToggle}
            selectedDir={selectedDir}
            onSelectDir={onSelectDir}
          />
        ))}
    </div>
  );
}

function collectDirPaths(node, acc = []) {
  if (!node || node.type !== 'directory') return acc;
  acc.push(node.path);
  node.children?.forEach((c) => collectDirPaths(c, acc));
  return acc;
}

function defaultExpanded(tree) {
  const map = {};
  if (tree?.path) map[tree.path] = true;
  tree?.children?.forEach((child) => {
    if (child.type === 'directory') map[child.path] = true;
  });
  return map;
}

export default function FileExplorer({
  tree,
  rootPath,
  onOpenFile,
  onOpenFilePin,
  activePath,
  onRefresh,
  onNewFile,
  onNewFolder,
  refreshing,
}) {
  const [expandedMap, setExpandedMap] = useState(() => defaultExpanded(tree));
  const [selectedDir, setSelectedDir] = useState(rootPath || null);

  useEffect(() => {
    setExpandedMap(defaultExpanded(tree));
    setSelectedDir(rootPath || tree?.path || null);
  }, [rootPath, tree?.path]);

  const onToggle = useCallback((dirPath) => {
    setExpandedMap((prev) => ({
      ...prev,
      [dirPath]: !prev[dirPath],
    }));
  }, []);

  const collapseAll = useCallback(() => {
    const paths = collectDirPaths(tree);
    const next = {};
    paths.forEach((p) => {
      next[p] = false;
    });
    // Keep root visible label but collapsed children
    if (tree?.path) next[tree.path] = false;
    setExpandedMap(next);
  }, [tree]);

  const expandRoot = useCallback(() => {
    setExpandedMap(defaultExpanded(tree));
  }, [tree]);

  if (!tree) {
    return (
      <div className="panel-empty">
        <p>No folder opened</p>
        <p className="hint">Open a folder to start editing</p>
      </div>
    );
  }

  const targetDir = selectedDir || rootPath || tree.path;

  return (
    <div className="file-explorer">
      <div className="explorer-header">
        <div className="panel-section-title" style={{ padding: '10px 8px 6px 12px', flex: 1 }}>
          EXPLORER
        </div>
        <div className="explorer-actions">
          <button
            type="button"
            className="explorer-action-btn"
            title="New File"
            onClick={() => onNewFile?.(targetDir)}
          >
            📄+
          </button>
          <button
            type="button"
            className="explorer-action-btn"
            title="New Folder"
            onClick={() => onNewFolder?.(targetDir)}
          >
            📁+
          </button>
          <button
            type="button"
            className="explorer-action-btn"
            title="Refresh Explorer"
            disabled={refreshing}
            onClick={() => onRefresh?.()}
          >
            ↻
          </button>
          <button
            type="button"
            className="explorer-action-btn"
            title="Collapse Folders"
            onClick={collapseAll}
          >
            ⋀
          </button>
        </div>
      </div>
      <div
        className="explorer-root-name"
        onClick={expandRoot}
        title="Click to expand top-level folders"
      >
        {rootPath?.split(/[/\\]/).pop()}
      </div>
      <div className="explorer-tree">
        <TreeNode
          node={tree}
          depth={0}
          onOpenFile={onOpenFile}
          onOpenFilePin={onOpenFilePin || onOpenFile}
          activePath={activePath}
          expandedMap={expandedMap}
          onToggle={onToggle}
          selectedDir={selectedDir}
          onSelectDir={setSelectedDir}
        />
      </div>
    </div>
  );
}
