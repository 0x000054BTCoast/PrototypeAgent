import fs from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { parsePrdToSchema } from "../packages/parser/src/index.js";
import { generateFrontend } from "../packages/codegen/src/json-to-ui.js";

const repoRoot = process.env.INIT_CWD ?? process.cwd();
const inputPath = path.resolve(repoRoot, "input/prd.md");
const outputDir = path.resolve(repoRoot, "output");
const structurePath = path.resolve(outputDir, "structure.json");
const frontendSchemaPath = path.resolve(repoRoot, "apps/web-preview/lib/structure.json");

interface StageMetric {
  name: string;
  duration_ms: number;
}

const metrics: StageMetric[] = [];

const runStage = <T>(name: string, task: () => T): T => {
  const stageStart = performance.now();
  const result = task();
  const duration = performance.now() - stageStart;
  metrics.push({ name, duration_ms: Number(duration.toFixed(2)) });
  return result;
};

const totalStart = performance.now();

if (!fs.existsSync(inputPath)) {
  throw new Error(`Missing PRD file: ${path.relative(repoRoot, inputPath)}`);
}

fs.mkdirSync(outputDir, { recursive: true });

const schema = runStage("prd_parser", () => {
  const markdown = fs.readFileSync(inputPath, "utf8");
  const parsedSchema = parsePrdToSchema(markdown);
  fs.writeFileSync(structurePath, `${JSON.stringify(parsedSchema, null, 2)}\n`);
  return parsedSchema;
});

runStage("ui_generator", () => {
  generateFrontend(schema);
});

const totalMs = Number((performance.now() - totalStart).toFixed(2));
const report = {
  executed_at: new Date().toISOString(),
  input: path.relative(repoRoot, inputPath),
  outputs: [path.relative(repoRoot, structurePath), "apps/web-preview/*"],
  stages: metrics,
  total_duration_ms: totalMs
};

fs.writeFileSync(path.resolve(outputDir, "baseline-run-stats.json"), `${JSON.stringify(report, null, 2)}\n`);

if (!fs.existsSync(structurePath)) {
  throw new Error(`Baseline failed: missing ${path.relative(repoRoot, structurePath)}`);
}

if (!fs.existsSync(frontendSchemaPath)) {
  throw new Error(`Baseline failed: missing ${path.relative(repoRoot, frontendSchemaPath)}`);
}

console.log("✅ Baseline run completed");
console.log(`- input: ${path.relative(repoRoot, inputPath)}`);
console.log(`- structure: ${path.relative(repoRoot, structurePath)}`);
console.log("- frontend: apps/web-preview/*");
console.log("- stage durations (ms):");
for (const metric of metrics) {
  console.log(`  • ${metric.name}: ${metric.duration_ms}`);
}
console.log(`- total: ${totalMs} ms`);
