import fs from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import {
  migrateUISchemaToAppSchemaV2,
  normalizeAndValidateUISchemaVersion,
  type UISchema
} from '../../schema/src/index.js';
import { generateFrontend } from '../../codegen/src/json-to-ui.js';
import { exportHtml, exportSvg } from '../../codegen/src/exporters.js';
import { createStructuredLogger, type StructuredLogEvent } from './logger.js';
import {
  PIPELINE_ERROR_CODES,
  PipelineError,
  type PipelineErrorCode,
  asPipelineError
} from './error-codes.js';
import { runStructuredPlanner } from './llm/structured-planner.js';

export interface RunPipelineOptions {
  repoRoot?: string;
  inputPath?: string;
  inputText?: string;
  outputDir?: string;
  runName?: string;
  provider?: 'auto' | 'deepseek' | 'fallback' | 'local';
}

export interface RunPipelineResult {
  runId: string;
  runName: string;
  input: string;
  outputDir: string;
  status: 'success' | 'failed';
  traceId: string;
  totalDurationMs: number;
  events: StructuredLogEvent[];
  output: string[];
  error?: {
    code: string;
    message: string;
  };
}

const runWithRetry = <T>(
  logger: ReturnType<typeof createStructuredLogger>,
  phase: string,
  errorCode: PipelineErrorCode,
  fn: () => T
): T => {
  let attempt = 0;
  let lastError: unknown;

  while (attempt < 3) {
    attempt += 1;
    const context = logger.startPhase(phase, { attempt, max_attempts: 3, error_code: errorCode });

    try {
      const result = fn();
      logger.endPhase(context, { attempt, error_code: null });
      return result;
    } catch (error) {
      lastError = error;
      logger.failPhase(context, errorCode, error, { attempt, max_attempts: 3 });
      if (attempt >= 3) {
        throw new PipelineError(
          PIPELINE_ERROR_CODES.qa.stageRetryExhausted,
          `[${PIPELINE_ERROR_CODES.qa.stageRetryExhausted}] ${phase} failed after 3 attempts (${errorCode})`,
          asPipelineError(errorCode, `[${errorCode}] ${phase} execution failed`, lastError)
        );
      }
    }
  }

  throw new PipelineError(PIPELINE_ERROR_CODES.qa.executionFailed, 'Pipeline failed unexpectedly');
};

const assertOutputExists = (
  targetPath: string,
  errorCode: PipelineErrorCode,
  repoRoot: string
): void => {
  if (fs.existsSync(targetPath)) {
    return;
  }

  const missingPath = path.relative(repoRoot, targetPath);
  throw new PipelineError(errorCode, `[${errorCode}] Missing output: ${missingPath}`);
};

const resolveOutputFiles = (repoRoot: string, outputDir: string): string[] => [
  path.relative(repoRoot, path.resolve(outputDir, 'llm-structured.json')),
  path.relative(repoRoot, path.resolve(outputDir, 'structure.json')),
  path.relative(repoRoot, path.resolve(outputDir, 'app-schema-v2.json')),
  path.relative(repoRoot, path.resolve(outputDir, 'compatibility-report.json')),
  path.relative(repoRoot, path.resolve(repoRoot, 'apps/web-preview/lib/structure.json')),
  path.relative(repoRoot, path.resolve(outputDir, 'prototype.svg')),
  path.relative(repoRoot, path.resolve(outputDir, 'preview.html'))
];

export const runPipeline = async (options: RunPipelineOptions = {}): Promise<RunPipelineResult> => {
  const logger = createStructuredLogger();
  const totalStart = performance.now();

  const repoRoot = path.resolve(options.repoRoot ?? process.env.INIT_CWD ?? process.cwd());
  const runName = options.runName?.trim() || `run-${Date.now()}`;
  const runId = runName.replace(/[^a-zA-Z0-9-_]/g, '-');

  const inputPath = options.inputPath
    ? path.resolve(repoRoot, options.inputPath)
    : path.resolve(repoRoot, 'input/prd.md');
  const outputDir = options.outputDir
    ? path.resolve(repoRoot, options.outputDir)
    : path.resolve(repoRoot, 'output', 'runs', runId);

  fs.mkdirSync(outputDir, { recursive: true });

  const output = resolveOutputFiles(repoRoot, outputDir);

  let pipelineError: unknown;

  try {
    logger.info('pipeline', 'pipeline_started', {
      input: options.inputText ? 'inline_text' : path.relative(repoRoot, inputPath),
      output_dir: path.relative(repoRoot, outputDir),
      provider: options.provider ?? 'auto'
    });

    const llmContext = logger.startPhase('llm_structured_planner', {
      input: options.inputText ? 'inline_text' : path.relative(repoRoot, inputPath)
    });

    let markdown = options.inputText ?? '';
    if (!options.inputText) {
      try {
        markdown = fs.readFileSync(inputPath, 'utf8');
      } catch (error) {
        throw asPipelineError(
          PIPELINE_ERROR_CODES.parser.readInputFailed,
          `[${PIPELINE_ERROR_CODES.parser.readInputFailed}] Unable to read PRD input: ${path.relative(repoRoot, inputPath)}`,
          error
        );
      }
    }

    try {
      const { schema, artifact } = await runStructuredPlanner(markdown, {
        preferredProvider: options.provider
      });

      fs.writeFileSync(
        path.resolve(outputDir, 'llm-structured.json'),
        `${JSON.stringify(artifact, null, 2)}\n`
      );
      fs.writeFileSync(
        path.resolve(outputDir, 'structure.json'),
        `${JSON.stringify(schema, null, 2)}\n`
      );

      logger.endPhase(llmContext, {
        provider: artifact.provider,
        model: artifact.model,
        token_usage: artifact.token_usage,
        retries: artifact.retries,
        failed_reason: artifact.failures.length > 0 ? artifact.failures : null
      });
    } catch (error) {
      const code =
        error instanceof PipelineError ? error.code : PIPELINE_ERROR_CODES.llm.providerFailed;
      logger.failPhase(llmContext, code, error, {
        failed_reason: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }

    runWithRetry(logger, 'prd_parser', PIPELINE_ERROR_CODES.parser.parseFailed, () => {
      assertOutputExists(
        path.resolve(outputDir, 'llm-structured.json'),
        PIPELINE_ERROR_CODES.qa.outputMissing,
        repoRoot
      );
    });

    const schema = runWithRetry(
      logger,
      'schema_loader',
      PIPELINE_ERROR_CODES.schema.deserializeFailed,
      () => {
        const raw = fs.readFileSync(path.resolve(outputDir, 'structure.json'), 'utf8');
        const parsed = JSON.parse(raw) as Partial<UISchema>;

        let versionChecked: UISchema;
        try {
          versionChecked = normalizeAndValidateUISchemaVersion(parsed).schema;
        } catch (error) {
          throw new PipelineError(
            PIPELINE_ERROR_CODES.schema.versionUnsupported,
            `[${PIPELINE_ERROR_CODES.schema.versionUnsupported}] ${
              error instanceof Error ? error.message : String(error)
            }`,
            error
          );
        }

        const hasSections = Array.isArray(versionChecked.sections);
        if (!hasSections) {
          throw new PipelineError(
            PIPELINE_ERROR_CODES.schema.validateFailed,
            `[${PIPELINE_ERROR_CODES.schema.validateFailed}] structure.json missing 'sections' array`
          );
        }

        return versionChecked;
      }
    );

    runWithRetry(logger, 'ui_generator', PIPELINE_ERROR_CODES.codegen.uiGenerationFailed, () => {
      generateFrontend(schema);
    });

    runWithRetry(logger, 'schema_migration_v2', PIPELINE_ERROR_CODES.schema.serializeFailed, () => {
      const { appSchema, compatibilityReport } = migrateUISchemaToAppSchemaV2(schema);
      fs.writeFileSync(
        path.resolve(outputDir, 'app-schema-v2.json'),
        `${JSON.stringify(appSchema, null, 2)}\n`
      );
      fs.writeFileSync(
        path.resolve(outputDir, 'compatibility-report.json'),
        `${JSON.stringify(compatibilityReport, null, 2)}\n`
      );
    });

    runWithRetry(logger, 'svg_exporter', PIPELINE_ERROR_CODES.codegen.svgExportFailed, () => {
      fs.writeFileSync(path.resolve(outputDir, 'prototype.svg'), `${exportSvg(schema)}\n`);
    });

    runWithRetry(logger, 'html_exporter', PIPELINE_ERROR_CODES.codegen.htmlExportFailed, () => {
      fs.writeFileSync(path.resolve(outputDir, 'preview.html'), `${exportHtml(schema)}\n`);
    });

    runWithRetry(logger, 'qa_output_check', PIPELINE_ERROR_CODES.qa.outputMissing, () => {
      assertOutputExists(
        path.resolve(outputDir, 'llm-structured.json'),
        PIPELINE_ERROR_CODES.qa.outputMissing,
        repoRoot
      );
      assertOutputExists(
        path.resolve(outputDir, 'structure.json'),
        PIPELINE_ERROR_CODES.qa.outputMissing,
        repoRoot
      );
      assertOutputExists(
        path.resolve(outputDir, 'app-schema-v2.json'),
        PIPELINE_ERROR_CODES.qa.outputMissing,
        repoRoot
      );
      assertOutputExists(
        path.resolve(outputDir, 'compatibility-report.json'),
        PIPELINE_ERROR_CODES.qa.outputMissing,
        repoRoot
      );
      assertOutputExists(
        path.resolve(outputDir, 'prototype.svg'),
        PIPELINE_ERROR_CODES.qa.outputMissing,
        repoRoot
      );
      assertOutputExists(
        path.resolve(outputDir, 'preview.html'),
        PIPELINE_ERROR_CODES.qa.outputMissing,
        repoRoot
      );
      assertOutputExists(
        path.resolve(repoRoot, 'apps/web-preview/lib/structure.json'),
        PIPELINE_ERROR_CODES.qa.outputMissing,
        repoRoot
      );
    });

    logger.info('pipeline', 'pipeline_completed', { output });
  } catch (error) {
    pipelineError = error;
    if (error instanceof PipelineError) {
      logger.error('pipeline', error.message, error.code);
    } else {
      logger.error(
        'pipeline',
        error instanceof Error ? error.message : String(error),
        PIPELINE_ERROR_CODES.qa.executionFailed
      );
    }
  }

  const totalDurationMs = Number((performance.now() - totalStart).toFixed(2));
  const status = pipelineError ? 'failed' : 'success';
  const pipelineLog = {
    run_id: runId,
    run_name: runName,
    status,
    executed_at: new Date().toISOString(),
    trace_id: logger.traceId,
    total_duration_ms: totalDurationMs,
    events: logger.events,
    output
  };

  fs.writeFileSync(
    path.resolve(outputDir, 'pipeline-log.json'),
    `${JSON.stringify(pipelineLog, null, 2)}\n`
  );

  const result: RunPipelineResult = {
    runId,
    runName,
    input: options.inputText ? 'inline_text' : path.relative(repoRoot, inputPath),
    outputDir: path.relative(repoRoot, outputDir),
    status,
    traceId: logger.traceId,
    totalDurationMs,
    events: logger.events,
    output
  };

  if (pipelineError) {
    if (pipelineError instanceof PipelineError) {
      result.error = { code: pipelineError.code, message: pipelineError.message };
    } else {
      result.error = {
        code: PIPELINE_ERROR_CODES.qa.executionFailed,
        message: pipelineError instanceof Error ? pipelineError.message : String(pipelineError)
      };
    }
    throw Object.assign(new Error(result.error.message), { result });
  }

  return result;
};
