import type { StageEmitter } from '../types';
import { layoutTemplate } from '../templates/routes/layout';
import { emitPageRoute } from '../templates/routes/page';

export const routeStageEmitter: StageEmitter = {
  name: 'route',
  emit: ({ schema, template }) => [
    {
      path: 'app/page.tsx',
      content: emitPageRoute(schema, template)
    },
    {
      path: 'app/layout.tsx',
      content: layoutTemplate
    }
  ]
};
