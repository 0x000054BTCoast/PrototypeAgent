import fs from 'node:fs';
import path from 'node:path';
import { UISchema } from '@prd2prototype/schema';
import { inferSchemaIntent, type TemplateSelectionConfig } from './template-strategy';
import { runEmitterPipeline } from './emitter/pipeline';

const ensureDir = (dirPath: string): void => {
  fs.mkdirSync(dirPath, { recursive: true });
};

export interface FrontendGenerationPaths {
  targetRoot?: string;
}

export interface JsonToUiCliOptions {
  runDir?: string;
  schemaPath?: string;
  targetDir?: string;
}

const resolveTargetRoot = (targetRoot?: string): string => {
  const repoRoot = process.env.INIT_CWD ?? process.cwd();
  return path.resolve(repoRoot, targetRoot ?? 'apps/web-preview');
};

const writeArtifact = (root: string, relativePath: string, content: string): void => {
  const target = path.resolve(root, relativePath);
  ensureDir(path.dirname(target));
  fs.writeFileSync(target, content);
};

export const generateFrontend = (
  schema: UISchema,
  config: TemplateSelectionConfig = {},
  paths: FrontendGenerationPaths = {}
): void => {
  const template = inferSchemaIntent(schema, config);
  const artifacts = runEmitterPipeline({ schema, template });
  const targetRoot = resolveTargetRoot(paths.targetRoot);

  for (const artifact of artifacts) {
    writeArtifact(targetRoot, artifact.path, artifact.content);
  }
};

const parseCliOptions = (argv: string[]): JsonToUiCliOptions => {
  const options: JsonToUiCliOptions = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === '--run-dir' && next) {
      options.runDir = next;
      index += 1;
      continue;
    }

    if (arg === '--schema' && next) {
      options.schemaPath = next;
      index += 1;
      continue;
    }

    if ((arg === '--target-dir' || arg === '--output-dir') && next) {
      options.targetDir = next;
      index += 1;
    }
  }

  return options;
};

if (process.argv[1]?.endsWith('json-to-ui.ts')) {
  const repoRoot = process.env.INIT_CWD ?? process.cwd();
  const options = parseCliOptions(process.argv.slice(2));
  const runDir = options.runDir ? path.resolve(repoRoot, options.runDir) : null;
  const schemaPath = options.schemaPath
    ? path.resolve(repoRoot, options.schemaPath)
    : runDir
      ? path.resolve(runDir, 'artifacts', 'structure.json')
      : path.resolve(repoRoot, 'output/structure.json');

  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8')) as UISchema;
  generateFrontend(schema, {}, { targetRoot: options.targetDir });
}
