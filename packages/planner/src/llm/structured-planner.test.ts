import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { LLMPlannerClient } from './client';
import { cleanJsonPayload, parseRawStructuredPlan, validateStructuredPlan } from './schema';
import { runStructuredPlanner } from './structured-planner';
import { PipelineError, PIPELINE_ERROR_CODES } from '../error-codes';

const fixturePrdPath = path.resolve(process.cwd(), 'fixtures/prd/sample-06-llm-stability.md');
const fixtureExpectedPath = path.resolve(
  process.cwd(),
  'fixtures/expected/sample-06-llm-stability.json'
);

describe('llm structured planner', () => {
  it('strips markdown code fences before JSON parsing', () => {
    const raw =
      '```json\n{"schemaVersion":2,"page_name":"x","layout":{"type":"grid","columns":24},"sections":[],"interactions":[]}\n```';
    const cleaned = cleanJsonPayload(raw);
    assert.equal(cleaned.startsWith('```'), false);
    const parsed = parseRawStructuredPlan(raw) as { page_name: string };
    assert.equal(parsed.page_name, 'x');
  });

  it('reports missing required fields', () => {
    const result = validateStructuredPlan({
      schemaVersion: 2,
      layout: { type: 'grid', columns: 24 },
      sections: [],
      interactions: []
    });
    assert.equal(result.success, false);
    assert.ok(result.issues.some((issue) => issue.path === '$.page_name'));
  });

  it('reports invalid field type', () => {
    const result = validateStructuredPlan({
      schemaVersion: 2,
      page_name: 'demo',
      layout: { type: 'grid', columns: 12 },
      sections: [],
      interactions: []
    });
    assert.equal(result.success, false);
    assert.ok(result.issues.some((issue) => issue.path === '$.layout.columns'));
  });

  it('falls back to fallback provider when deepseek fails', async () => {
    let callCount = 0;
    const transport: typeof fetch = async (url) => {
      callCount += 1;
      if (String(url).includes('api.deepseek.com')) {
        return new Response('upstream down', { status: 500 });
      }

      return new Response(
        JSON.stringify({
          usage: { total_tokens: 11 },
          choices: [
            {
              message: {
                content: JSON.stringify({
                  schemaVersion: 2,
                  page_name: 'fallback_demo',
                  layout: { type: 'grid', columns: 24 },
                  sections: [],
                  interactions: []
                })
              }
            }
          ]
        }),
        { status: 200 }
      );
    };

    const client = new LLMPlannerClient({
      transport,
      deepseekApiKey: 'deepseek-key',
      fallbackApiKey: 'fallback-key',
      allowLocalFallback: false
    });

    const result = await client.planWithFallback('# title');
    assert.equal(result.response.provider, 'fallback');
    assert.equal(result.failures[0]?.provider, 'deepseek');
    assert.equal(callCount, 2);
  });

  it('returns explicit error code when all providers fail', async () => {
    await assert.rejects(
      () =>
        runStructuredPlanner('# broken', {
          transport: async () => new Response('down', { status: 500 }),
          deepseekApiKey: 'x',
          fallbackApiKey: 'y',
          allowLocalFallback: false
        }),
      (error: unknown) => {
        assert.ok(error instanceof PipelineError);
        assert.equal(error.code, PIPELINE_ERROR_CODES.llm.allProvidersFailed);
        return true;
      }
    );
  });

  it('keeps fixture PRD output stable in local fallback path', async () => {
    const fixture = fs.readFileSync(fixturePrdPath, 'utf8');
    const expected = JSON.parse(fs.readFileSync(fixtureExpectedPath, 'utf8'));

    const result = await runStructuredPlanner(fixture, {
      allowLocalFallback: true
    });

    assert.deepEqual(result.schema, expected);
  });
});
