import type { StageEmitter } from '../types';
import { renderSchemaSmokeTest } from '../templates/tests/smoke-test';

export const testStageEmitter: StageEmitter = {
  name: 'test',
  emit: () => [
    {
      path: 'tests/render-schema.smoke.ts',
      content: renderSchemaSmokeTest
    }
  ]
};
