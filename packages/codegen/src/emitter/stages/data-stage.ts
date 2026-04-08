import type { StageEmitter } from '../types';
import { mockDataTemplate, typesTemplate } from '../templates/data/core-data';

export const dataStageEmitter: StageEmitter = {
  name: 'data',
  emit: ({ schema, template }) => {
    const schemaWithTemplate = { ...schema, template };

    return [
      {
        path: 'lib/mock-data.ts',
        content: mockDataTemplate
      },
      {
        path: 'lib/types.ts',
        content: typesTemplate
      },
      {
        path: 'lib/structure.json',
        content: `${JSON.stringify(schemaWithTemplate, null, 2)}\n`
      }
    ];
  }
};
