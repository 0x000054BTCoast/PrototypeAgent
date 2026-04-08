import type { StageEmitter } from '../types.js';
import { renderSchemaSmokeTest } from '../templates/tests/smoke-test.js';

export const testStageEmitter: StageEmitter = {
  name: 'test',
  emit: () => [
    {
      path: 'tests/render-schema.smoke.ts',
      content: renderSchemaSmokeTest
    }
  ]
};
