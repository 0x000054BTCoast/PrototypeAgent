import type { EmitContext, StageEmitter } from './types';
import { componentStageEmitter } from './stages/component-stage';
import { configStageEmitter } from './stages/config-stage';
import { dataStageEmitter } from './stages/data-stage';
import { routeStageEmitter } from './stages/route-stage';
import { testStageEmitter } from './stages/test-stage';

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
