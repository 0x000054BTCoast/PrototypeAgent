import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parsePrdToAst } from './index.js';

describe('parsePrdToAst', () => {
  const markdown = `# Dashboard\n\n## Header\n- Primary button\n- Secondary button\n\nRevenue chart in hero\n\n> Focus metric\n\n\
\`\`\`ts\nconst value = 42;\n\`\`\``;

  it('parses heading/list/narrative/block into a stable AST', () => {
    const first = parsePrdToAst(markdown);
    const second = parsePrdToAst(markdown);

    assert.deepEqual(first, second);
    assert.equal(first.document.type, 'document');
    assert.ok(first.document.nodes.some((node) => node.type === 'heading'));
    assert.ok(first.document.nodes.some((node) => node.type === 'list'));
    assert.ok(first.document.nodes.some((node) => node.type === 'narrative'));
    assert.ok(first.document.nodes.some((node) => node.type === 'block'));
    assert.equal(first.sections[0]?.name, 'dashboard');
    assert.equal(first.sections[1]?.name, 'header');
  });
});
