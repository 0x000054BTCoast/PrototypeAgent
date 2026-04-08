import type { StageEmitter } from '../types';
import { defaultComponentTemplates } from '../templates/components/default-components';
import { emitRenderSchemaComponent } from '../templates/components/render-schema';

export const componentStageEmitter: StageEmitter = {
  name: 'component',
  emit: () => {
    const componentArtifacts = defaultComponentTemplates.map((component) => ({
      path: `components/ui/${component.type === 'chart' ? 'chart-placeholder' : component.type === 'table' ? 'data-table' : component.type}.tsx`,
      content: component.source
    }));

    return [
      {
        path: 'components/render-schema.tsx',
        content: emitRenderSchemaComponent(defaultComponentTemplates)
      },
      ...componentArtifacts
    ];
  }
};
