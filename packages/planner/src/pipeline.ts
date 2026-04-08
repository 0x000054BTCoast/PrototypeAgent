import fs from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { parsePrdToSchema } from "../../parser/src/index.js";
import { generateFrontend } from "../../codegen/src/json-to-ui.js";
import { exportHtml, exportSvg } from "../../codegen/src/exporters.js";
import { createStructuredLogger } from "./logger.js";

const logger = createStructuredLogger();

const runWithRetry = <T>(phase: string, fn: () => T): T => {
  let attempt = 0;
  let lastError: unknown;

  while (attempt < 3) {
    attempt += 1;
    const context = logger.startPhase(phase, { attempt, max_attempts: 3 });

    try {
      const result = fn();
      logger.endPhase(context, { attempt });
      return result;
    } catch (error) {
      lastError = error;
      logger.failPhase(context, "PIPELINE_STAGE_FAILED", error, { attempt });
      if (attempt >= 3) {
        throw new Error(`${phase} failed after 3 attempts: ${String(lastError)}`);
      }
    }
  }

  throw new Error(`${phase} failed unexpectedly`);
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

  runWithRetry("prd_parser", () => {
    const markdown = fs.readFileSync(inputPath, "utf8");
    const schema = parsePrdToSchema(markdown);
    fs.writeFileSync(path.resolve(outputDir, "structure.json"), `${JSON.stringify(schema, null, 2)}\n`);
  });

  const schema = JSON.parse(fs.readFileSync(path.resolve(outputDir, "structure.json"), "utf8"));

  runWithRetry("ui_generator", () => {
    generateFrontend(schema);
  });

  runWithRetry("svg_exporter", () => {
    fs.writeFileSync(path.resolve(outputDir, "prototype.svg"), `${exportSvg(schema)}\n`);
  });

  runWithRetry("html_exporter", () => {
    fs.writeFileSync(path.resolve(outputDir, "preview.html"), `${exportHtml(schema)}\n`);
  });

  logger.info("pipeline", "pipeline_completed", {
    output: ["output/structure.json", "apps/web-preview/*", "output/prototype.svg", "output/preview.html"]
  });
} catch (error) {
  pipelineError = error;
  logger.error(
    "pipeline",
    error instanceof Error ? error.message : String(error),
    "PIPELINE_EXECUTION_FAILED"
  );
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
