import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateDiff, applyDiff } from '../src/services/diffGenerator.js';
import { validate, validateJson } from '../src/services/validation.js';
import { parseOutput } from '../src/runtime/outputParser.js';
import { chunkCode } from '../src/db/indexer.js';

describe('diffGenerator', () => {
  it('generates diff hunks for changed lines', () => {
    const old = 'line1\nline2\nline3';
    const neu = 'line1\nchanged\nline3';
    const result = generateDiff(old, neu, 'test.js');
    assert.ok(result.hunks.length > 0);
    assert.ok(result.full.includes('---'));
  });

  it('applies diff hunks back to content', () => {
    const old = 'a\nb\nc';
    const neu = 'a\nB\nc';
    const { hunks } = generateDiff(old, neu);
    const applied = applyDiff(old, hunks);
    assert.equal(applied, neu);
  });
});

describe('validation', () => {
  it('validates correct JSON', () => {
    assert.equal(validateJson('{"a":1}').valid, true);
  });

  it('rejects invalid JSON', () => {
    assert.equal(validateJson('{bad}').valid, false);
  });

  it('validates JavaScript syntax', () => {
    assert.equal(validate('const x = 1;', 'javascript').valid, true);
    assert.equal(validate('const x = ;', 'javascript').valid, false);
  });
});

describe('outputParser', () => {
  it('detects errors in terminal output', () => {
    const result = parseOutput('Error: something went wrong\nAll good');
    assert.equal(result.hasErrors, true);
    assert.ok(result.errors.length > 0);
  });
});

describe('indexer', () => {
  it('chunks code into manageable pieces', () => {
    const content = Array.from({ length: 80 }, () => 'x'.repeat(20)).join('\n');
    const chunks = chunkCode(content, '/test/file.js');
    assert.ok(chunks.length >= 2);
    assert.equal(chunks[0].filePath, '/test/file.js');
  });
});
