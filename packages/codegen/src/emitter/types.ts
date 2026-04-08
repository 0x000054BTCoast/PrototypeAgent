import type { UISchema } from '@prd2prototype/schema';
import type { EngineeringTemplate } from '../template-strategy.js';

export interface EmitArtifact {
  path: string;
  content: string;
}

export interface EmitContext {
  schema: UISchema;
  template: EngineeringTemplate;
}

export interface StageEmitter {
  name: 'route' | 'component' | 'data' | 'config' | 'test';
  emit: (context: EmitContext) => EmitArtifact[];
}
