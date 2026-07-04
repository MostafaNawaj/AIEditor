import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ProcessManager } from '../src/runtime/processManager.js';
import { detectImports, suggestInstallCommand } from '../src/services/dependencyManager.js';

describe('processManager', () => {
  it('creates unique process IDs', () => {
    const pm = new ProcessManager();
    const id1 = pm.createId();
    const id2 = pm.createId();
    assert.notEqual(id1, id2);
  });

  it('registers and retrieves processes', () => {
    const pm = new ProcessManager();
    const id = pm.createId();
    const mock = { write: () => {} };
    pm.register(id, mock);
    assert.equal(pm.get(id), mock);
    pm.unregister(id);
    assert.equal(pm.get(id), undefined);
  });
});

describe('dependencyManager', () => {
  it('detects JS imports', () => {
    const code = `import React from 'react';\nimport fs from 'fs';`;
    const imports = detectImports(code, 'js');
    assert.ok(imports.includes('react'));
    assert.ok(!imports.includes('fs'));
  });

  it('suggests install command', () => {
    const cmd = suggestInstallCommand(['lodash', 'axios'], 'js');
    assert.equal(cmd, 'npm install lodash axios');
  });
});
