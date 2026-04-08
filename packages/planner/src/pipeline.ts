import { runPipeline } from './service.js';
import { pruneRuns } from './runs.js';

type Provider = 'auto' | 'deepseek' | 'fallback' | 'local';

interface PipelineCliOptions {
  inputPath?: string;
  outputDir?: string;
  runName?: string;
  provider?: Provider;
  runDir?: string;
}

interface PruneCliOptions {
  days?: number;
  keep?: number;
  runsRoot?: string;
}

const parsePipelineArgs = (argv: string[]): PipelineCliOptions => {
  const options: PipelineCliOptions = {};

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

    if ((arg === '--run-dir' || arg === '--workspace-dir') && next) {
      options.runDir = next;
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

const parsePruneArgs = (argv: string[]): PruneCliOptions => {
  const options: PruneCliOptions = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === '--days' && next) {
      const parsed = Number.parseInt(next, 10);
      if (Number.isFinite(parsed) && parsed >= 0) {
        options.days = parsed;
      }
      index += 1;
      continue;
    }

    if (arg === '--keep' && next) {
      const parsed = Number.parseInt(next, 10);
      if (Number.isFinite(parsed) && parsed >= 0) {
        options.keep = parsed;
      }
      index += 1;
      continue;
    }

    if ((arg === '--runs-root' || arg === '--run-dir' || arg === '--workspace-dir') && next) {
      options.runsRoot = next;
      index += 1;
    }
  }

  return options;
};

const [command, subcommand, ...rest] = process.argv.slice(2);

if (command === 'runs' && subcommand === 'prune') {
  const options = parsePruneArgs(rest);
  const result = pruneRuns(options);
  console.log(
    JSON.stringify(
      {
        removed: result.removed,
        kept: result.kept,
        runsRoot: result.runsRoot
      },
      null,
      2
    )
  );
} else {
  const options = parsePipelineArgs(process.argv.slice(2));
  await runPipeline(options);
}
