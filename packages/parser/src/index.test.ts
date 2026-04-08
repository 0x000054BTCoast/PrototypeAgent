import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parsePrdToAst, parsePrdToSchema } from './index.js';

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

  it('infers component types with bilingual dictionary and rules', () => {
    const schema = parsePrdToSchema(`# Analytics Dashboard

## 数据看板
收入趋势图（最近30天）

## 用户列表
客户明细表

## Actions
- 点击导出报表
`);

    const allComponents = schema.sections.flatMap((section) => section.components);
    assert.ok(allComponents.some((component) => component.type === 'chart'));
    assert.ok(allComponents.some((component) => component.type === 'table'));
    assert.ok(allComponents.some((component) => component.type === 'button'));
  });

  it('uses section context to improve ambiguous text recognition', () => {
    const schema = parsePrdToSchema(`# Report

## Trend
Revenue overview

## Table Area
Orders overview
`);

    const trendSection = schema.sections.find((section) => section.name === 'trend');
    const tableSection = schema.sections.find((section) => section.name === 'table_area');

    assert.equal(trendSection?.components[0]?.type, 'chart');
    assert.equal(tableSection?.components[0]?.type, 'table');
  });
});
