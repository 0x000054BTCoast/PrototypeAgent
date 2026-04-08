import fs from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { parsePrdToSchema } from "../packages/parser/src/index.js";
import { generateFrontend } from "../packages/codegen/src/json-to-ui.js";
import { createStructuredLogger } from "../packages/planner/src/logger.js";

const repoRoot = process.env.INIT_CWD ?? process.cwd();
const inputPath = path.resolve(repoRoot, "input/prd.md");
const outputDir = path.resolve(repoRoot, "output");
const structurePath = path.resolve(outputDir, "structure.json");
const frontendSchemaPath = path.resolve(repoRoot, "apps/web-preview/lib/structure.json");
const totalStart = performance.now();
const logger = createStructuredLogger();

const runStage = <T>(phase: string, task: () => T): T => {
  const context = logger.startPhase(phase);
  try {
    const result = task();
    logger.endPhase(context);
    return result;
  } catch (error) {
    logger.failPhase(context, "BASELINE_STAGE_FAILED", error);
    throw error;
  }
};

if (!fs.existsSync(inputPath)) {
  logger.error("baseline", `Missing PRD file: ${path.relative(repoRoot, inputPath)}`, "BASELINE_INPUT_MISSING");
  throw new Error(`Missing PRD file: ${path.relative(repoRoot, inputPath)}`);
}

fs.mkdirSync(outputDir, { recursive: true });
logger.info("baseline", "baseline_started", { input: path.relative(repoRoot, inputPath) });

const schema = runStage("prd_parser", () => {
  const markdown = fs.readFileSync(inputPath, "utf8");
  const parsedSchema = parsePrdToSchema(markdown);
  fs.writeFileSync(structurePath, `${JSON.stringify(parsedSchema, null, 2)}\n`);
  return parsedSchema;
});

runStage("ui_generator", () => {
  generateFrontend(schema);
});

if (!fs.existsSync(structurePath)) {
  logger.error(
    "baseline",
    `Baseline failed: missing ${path.relative(repoRoot, structurePath)}`,
    "BASELINE_STRUCTURE_MISSING"
  );
  throw new Error(`Baseline failed: missing ${path.relative(repoRoot, structurePath)}`);
}

if (!fs.existsSync(frontendSchemaPath)) {
  logger.error(
    "baseline",
    `Baseline failed: missing ${path.relative(repoRoot, frontendSchemaPath)}`,
    "BASELINE_FRONTEND_SCHEMA_MISSING"
  );
  throw new Error(`Baseline failed: missing ${path.relative(repoRoot, frontendSchemaPath)}`);
}

const totalMs = Number((performance.now() - totalStart).toFixed(2));
logger.info("baseline", "baseline_completed", {
  outputs: [path.relative(repoRoot, structurePath), "apps/web-preview/*"],
  total_duration_ms: totalMs
});

const report = {
  executed_at: new Date().toISOString(),
  trace_id: logger.traceId,
  input: path.relative(repoRoot, inputPath),
  outputs: [path.relative(repoRoot, structurePath), "apps/web-preview/*"],
  total_duration_ms: totalMs,
  events: logger.events
};

fs.writeFileSync(path.resolve(outputDir, "baseline-run-stats.json"), `${JSON.stringify(report, null, 2)}\n`);
