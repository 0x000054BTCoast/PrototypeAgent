import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { astToSchema, parsePrdToAst, parsePrdToSchema } from './index.js';

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

  it('extracts interactions with event/condition/target action', () => {
    const schema = parsePrdToSchema(`# 用户列表

## 操作区
- 点击提交按钮后跳转详情页
- 当选择筛选条件后，过滤列表
`);

    assert.ok(schema.interactions.length > 0);
    assert.ok(schema.interactions.some((item) => item.event === 'click'));
    assert.ok(schema.interactions.some((item) => item.targetAction === 'navigate'));
    assert.ok(schema.interactions.some((item) => item.targetAction === 'filter'));
    assert.ok(
      schema.interactions.some(
        (item) => typeof item.triggerCondition === 'string' && item.triggerCondition.length > 0
      )
    );
  });

  it('builds trace entries from source lines to schema paths', () => {
    const ast = parsePrdToAst(`# 报表页

## 操作区
- 点击导出
`);
    const { schema, trace } = astToSchema(ast);

    assert.ok(trace.length > 0);
    assert.ok(trace.some((entry) => entry.schemaPath === '$.page_name' && entry.sourceLine === 1));
    assert.ok(
      trace.some(
        (entry) =>
          entry.schemaPath === '$.sections[1].components[0].type' &&
          entry.sourceLine === 4 &&
          entry.detail === schema.sections[1]?.components[0]?.type
      )
    );
    assert.ok(
      schema.interactions.every((_, index) =>
        trace.some((entry) => entry.schemaPath === `$.interactions[${index}].event`)
      )
    );
  });
});
