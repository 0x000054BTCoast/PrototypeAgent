import fs from "node:fs";
import path from "node:path";
import { parsePrdToSchema } from "./prd-to-json.js";
import { generateFrontend } from "./json-to-ui.js";
import { exportHtml, exportSvg } from "./exporters.js";

const runWithRetry = (name: string, fn: () => void): void => {
  let attempt = 0;
  let lastError: unknown;
  while (attempt < 3) {
    try {
      fn();
      return;
    } catch (error) {
      lastError = error;
      attempt += 1;
      if (attempt >= 3) {
        throw new Error(`${name} failed after 3 attempts: ${String(lastError)}`);
      }
    }
  }
};

const inputPath = path.resolve("input/prd.md");
const outputDir = path.resolve("output");
fs.mkdirSync(outputDir, { recursive: true });

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

const log = {
  executed_at: new Date().toISOString(),
  output: ["output/structure.json", "frontend/*", "output/prototype.svg", "output/preview.html"]
};
fs.writeFileSync(path.resolve(outputDir, "pipeline-log.json"), `${JSON.stringify(log, null, 2)}\n`);
