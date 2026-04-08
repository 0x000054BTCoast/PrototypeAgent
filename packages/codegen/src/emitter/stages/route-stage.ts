import type { StageEmitter } from '../types.js';
import { layoutTemplate } from '../templates/routes/layout.js';
import { emitPageRoute } from '../templates/routes/page.js';

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
