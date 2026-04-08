import type { EmitContext, StageEmitter } from './types.js';
import { componentStageEmitter } from './stages/component-stage.js';
import { configStageEmitter } from './stages/config-stage.js';
import { dataStageEmitter } from './stages/data-stage.js';
import { routeStageEmitter } from './stages/route-stage.js';
import { testStageEmitter } from './stages/test-stage.js';

export const DEFAULT_EMITTER_PIPELINE: StageEmitter[] = [
  routeStageEmitter,
  componentStageEmitter,
  dataStageEmitter,
  configStageEmitter,
  testStageEmitter
];

export const runEmitterPipeline = (
  context: EmitContext,
  pipeline: StageEmitter[] = DEFAULT_EMITTER_PIPELINE
) => pipeline.flatMap((stage) => stage.emit(context));
