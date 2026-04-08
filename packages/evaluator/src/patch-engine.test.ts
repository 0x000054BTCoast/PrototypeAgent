import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { applyPatchInstruction } from './patch-engine.js';
import type { UISchema } from '@prd2prototype/schema';

const createBaseSchema = (): UISchema => ({
  schemaVersion: 2,
  page_name: 'test_page',
  layout: { type: 'grid', columns: 24 },
  sections: [
    {
      id: 'section_1',
      name: 'main',
      position: 'center',
      components: []
    }
  ],
  interactions: []
});

describe('applyPatchInstruction', () => {
  it('logs requirement conflict decisions instead of silently overriding', () => {
    const schema = createBaseSchema();
    const updated = applyPatchInstruction(schema, 'Use minimal design and high density layout');
    const decision = updated.interactions.find(
      (entry) => (entry as { type?: string }).type === 'decision_log'
    ) as { category?: string; details?: Record<string, unknown> } | undefined;

    assert.ok(decision);
    assert.equal(decision?.category, 'requirement_conflict');
    assert.equal(decision?.details?.selected, 'minimalism');
  });

  it('supports configurable priorities when resolving conflicts', () => {
    const schema = createBaseSchema();
    const updated = applyPatchInstruction(schema, 'Need 极简 and 高密度 at the same time', {
      priorities: { minimalism: 1, density: 3 }
    });
    const decision = updated.interactions.find(
      (entry) =>
        (entry as { type?: string; category?: string }).type === 'decision_log' &&
        (entry as { category?: string }).category === 'requirement_conflict'
    ) as { details?: Record<string, unknown> } | undefined;

    assert.equal(decision?.details?.selected, 'high_density');
  });

  it('records normalization decisions for layout columns', () => {
    const schema = createBaseSchema();
    const updated = applyPatchInstruction(schema, 'change layout to 12 columns');
    const decision = updated.interactions.find(
      (entry) =>
        (entry as { type?: string; category?: string }).type === 'decision_log' &&
        (entry as { category?: string }).category === 'normalization'
    ) as { details?: Record<string, unknown> } | undefined;

    assert.equal(updated.layout.columns, 24);
    assert.equal(decision?.details?.requested_columns, 12);
    assert.equal(decision?.details?.applied_columns, 24);
  });
});
