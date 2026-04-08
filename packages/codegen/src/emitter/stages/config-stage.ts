import type { StageEmitter } from '../types';
import {
  globalsTemplate,
  nextConfigTemplate,
  nextEnvTemplate,
  packageJsonTemplate,
  postcssTemplate,
  tailwindConfigTemplate,
  tsconfigTemplate
} from '../templates/config/core-config';

export const configStageEmitter: StageEmitter = {
  name: 'config',
  emit: () => [
    { path: 'app/globals.css', content: globalsTemplate },
    { path: 'next.config.mjs', content: nextConfigTemplate },
    { path: 'tailwind.config.ts', content: tailwindConfigTemplate },
    { path: 'postcss.config.mjs', content: postcssTemplate },
    { path: 'package.json', content: packageJsonTemplate },
    { path: 'tsconfig.json', content: tsconfigTemplate },
    { path: 'next-env.d.ts', content: nextEnvTemplate }
  ]
};
