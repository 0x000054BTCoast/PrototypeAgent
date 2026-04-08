import { runPipeline } from './service.js';

const parseArgs = (argv: string[]) => {
  const options: {
    inputPath?: string;
    outputDir?: string;
    runName?: string;
    provider?: 'auto' | 'deepseek' | 'fallback' | 'local';
  } = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === '--input' && next) {
      options.inputPath = next;
      index += 1;
      continue;
    }

    if (arg === '--output' && next) {
      options.outputDir = next;
      index += 1;
      continue;
    }

    if (arg === '--run-name' && next) {
      options.runName = next;
      index += 1;
      continue;
    }

    if (arg === '--provider' && next) {
      if (next === 'auto' || next === 'deepseek' || next === 'fallback' || next === 'local') {
        options.provider = next;
      }
      index += 1;
    }
  }

  return options;
};

const options = parseArgs(process.argv.slice(2));

await runPipeline(options);
