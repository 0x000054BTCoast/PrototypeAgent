import fs from 'node:fs';
import path from 'node:path';
import { UISchema } from '@prd2prototype/schema';
import { inferSchemaIntent, type TemplateSelectionConfig } from './template-strategy.js';
import { runEmitterPipeline } from './emitter/pipeline.js';

const ensureDir = (dirPath: string): void => {
  fs.mkdirSync(dirPath, { recursive: true });
};

const write = (relativePath: string, content: string): void => {
  const repoRoot = process.env.INIT_CWD ?? process.cwd();
  const target = path.resolve(repoRoot, 'apps/web-preview', relativePath);
  ensureDir(path.dirname(target));
  fs.writeFileSync(target, content);
};

export const generateFrontend = (schema: UISchema, config: TemplateSelectionConfig = {}): void => {
  const template = inferSchemaIntent(schema, config);
  const artifacts = runEmitterPipeline({ schema, template });

  for (const artifact of artifacts) {
    write(artifact.path, artifact.content);
  }
};

if (process.argv[1]?.endsWith('json-to-ui.ts')) {
  const repoRoot = process.env.INIT_CWD ?? process.cwd();
  const schema = JSON.parse(
    fs.readFileSync(path.resolve(repoRoot, 'output/structure.json'), 'utf8')
  ) as UISchema;
  generateFrontend(schema);
}
