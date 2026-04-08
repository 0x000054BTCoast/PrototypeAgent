import fs from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";
import type { UISchema } from "../../schema/src/index.js";
import { parsePrdToSchema } from "../../parser/src/index.js";
import { generateFrontend } from "../../codegen/src/json-to-ui.js";
import { exportHtml, exportSvg } from "../../codegen/src/exporters.js";
import { createStructuredLogger } from "./logger.js";
import { PIPELINE_ERROR_CODES, PipelineError, type PipelineErrorCode, asPipelineError } from "./error-codes.js";

const logger = createStructuredLogger();

const runWithRetry = <T>(phase: string, errorCode: PipelineErrorCode, fn: () => T): T => {
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

  throw new PipelineError(PIPELINE_ERROR_CODES.qa.executionFailed, "Pipeline failed unexpectedly");
};

const assertOutputExists = (targetPath: string, errorCode: PipelineErrorCode, repoRoot: string): void => {
  if (fs.existsSync(targetPath)) {
    return;
  }

  const missingPath = path.relative(repoRoot, targetPath);
  throw new PipelineError(errorCode, `[${errorCode}] Missing output: ${missingPath}`);
};

const totalStart = performance.now();
const repoRoot = process.env.INIT_CWD ?? process.cwd();
const inputPath = path.resolve(repoRoot, "input/prd.md");
const outputDir = path.resolve(repoRoot, "output");

fs.mkdirSync(outputDir, { recursive: true });

let pipelineError: unknown;

try {
  logger.info("pipeline", "pipeline_started", {
    input: path.relative(repoRoot, inputPath)
  });

  runWithRetry("prd_parser", PIPELINE_ERROR_CODES.parser.parseFailed, () => {
    let markdown = "";
    try {
      markdown = fs.readFileSync(inputPath, "utf8");
    } catch (error) {
      throw asPipelineError(
        PIPELINE_ERROR_CODES.parser.readInputFailed,
        `[${PIPELINE_ERROR_CODES.parser.readInputFailed}] Unable to read PRD input: ${path.relative(repoRoot, inputPath)}`,
        error
      );
    }

    const schema = parsePrdToSchema(markdown);

    try {
      fs.writeFileSync(path.resolve(outputDir, "structure.json"), `${JSON.stringify(schema, null, 2)}\n`);
    } catch (error) {
      throw asPipelineError(
        PIPELINE_ERROR_CODES.schema.serializeFailed,
        `[${PIPELINE_ERROR_CODES.schema.serializeFailed}] Unable to write output/structure.json`,
        error
      );
    }
  });

  const schema = runWithRetry("schema_loader", PIPELINE_ERROR_CODES.schema.deserializeFailed, () => {
    const raw = fs.readFileSync(path.resolve(outputDir, "structure.json"), "utf8");
    const parsed = JSON.parse(raw) as Partial<UISchema>;

    const hasSections = Array.isArray(parsed.sections);
    if (!hasSections) {
      throw new PipelineError(
        PIPELINE_ERROR_CODES.schema.validateFailed,
        `[${PIPELINE_ERROR_CODES.schema.validateFailed}] structure.json missing 'sections' array`
      );
    }

    return parsed as UISchema;
  });

  runWithRetry("ui_generator", PIPELINE_ERROR_CODES.codegen.uiGenerationFailed, () => {
    generateFrontend(schema);
  });

  runWithRetry("svg_exporter", PIPELINE_ERROR_CODES.codegen.svgExportFailed, () => {
    fs.writeFileSync(path.resolve(outputDir, "prototype.svg"), `${exportSvg(schema)}\n`);
  });

  runWithRetry("html_exporter", PIPELINE_ERROR_CODES.codegen.htmlExportFailed, () => {
    fs.writeFileSync(path.resolve(outputDir, "preview.html"), `${exportHtml(schema)}\n`);
  });

  runWithRetry("qa_output_check", PIPELINE_ERROR_CODES.qa.outputMissing, () => {
    assertOutputExists(path.resolve(outputDir, "structure.json"), PIPELINE_ERROR_CODES.qa.outputMissing, repoRoot);
    assertOutputExists(path.resolve(outputDir, "prototype.svg"), PIPELINE_ERROR_CODES.qa.outputMissing, repoRoot);
    assertOutputExists(path.resolve(outputDir, "preview.html"), PIPELINE_ERROR_CODES.qa.outputMissing, repoRoot);
    assertOutputExists(
      path.resolve(repoRoot, "apps/web-preview/lib/structure.json"),
      PIPELINE_ERROR_CODES.qa.outputMissing,
      repoRoot
    );
  });

  logger.info("pipeline", "pipeline_completed", {
    output: ["output/structure.json", "apps/web-preview/*", "output/prototype.svg", "output/preview.html"]
  });
} catch (error) {
  pipelineError = error;
  if (error instanceof PipelineError) {
    logger.error("pipeline", error.message, error.code);
  } else {
    logger.error(
      "pipeline",
      error instanceof Error ? error.message : String(error),
      PIPELINE_ERROR_CODES.qa.executionFailed
    );
  }
}

const totalDurationMs = Number((performance.now() - totalStart).toFixed(2));
const log = {
  executed_at: new Date().toISOString(),
  trace_id: logger.traceId,
  total_duration_ms: totalDurationMs,
  events: logger.events,
  output: ["output/structure.json", "apps/web-preview/*", "output/prototype.svg", "output/preview.html"]
};
fs.writeFileSync(path.resolve(outputDir, "pipeline-log.json"), `${JSON.stringify(log, null, 2)}\n`);

if (pipelineError) {
  throw pipelineError;
}
