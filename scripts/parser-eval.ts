import fs from 'node:fs';
import path from 'node:path';
import { parsePrdToSchema } from '../packages/parser/src/index.js';

type ExpectedFixture = {
  name: string;
  components: Array<{
    id: string;
    type: string;
    props?: Record<string, unknown>;
  }>;
};

type SampleMetrics = {
  sample: string;
  page: string;
  precision: number;
  recall: number;
  f1: number;
  tp: number;
  fp: number;
  fn: number;
  expectedCount: number;
  predictedCount: number;
  expectedTypes: string[];
  predictedTypes: string[];
};

type EvalReport = {
  generatedAt: string;
  summary: {
    sampleCount: number;
    micro: {
      precision: number;
      recall: number;
      f1: number;
      tp: number;
      fp: number;
      fn: number;
    };
    macro: {
      precision: number;
      recall: number;
      f1: number;
    };
  };
  samples: SampleMetrics[];
  confusion: {
    labels: string[];
    matrix: number[][];
  };
};

const repoRoot = process.env.INIT_CWD ?? process.cwd();
const prdDir = path.resolve(repoRoot, 'fixtures/prd');
const expectedDir = path.resolve(repoRoot, 'fixtures/expected');
const outputDir = path.resolve(repoRoot, 'output');

const round4 = (value: number): number => Number(value.toFixed(4));

const safeDivide = (num: number, den: number): number => (den === 0 ? 0 : num / den);

const countByType = (types: string[]): Map<string, number> => {
  const map = new Map<string, number>();
  for (const type of types) {
    map.set(type, (map.get(type) ?? 0) + 1);
  }
  return map;
};

const pairwiseConfusion = (
  expectedTypes: string[],
  predictedTypes: string[],
  confusionPairs: Array<{ expected: string; predicted: string }>
): void => {
  const minLen = Math.min(expectedTypes.length, predictedTypes.length);

  for (let i = 0; i < minLen; i += 1) {
    confusionPairs.push({
      expected: expectedTypes[i],
      predicted: predictedTypes[i]
    });
  }

  for (let i = minLen; i < expectedTypes.length; i += 1) {
    confusionPairs.push({
      expected: expectedTypes[i],
      predicted: '__missing__'
    });
  }

  for (let i = minLen; i < predictedTypes.length; i += 1) {
    confusionPairs.push({
      expected: '__spurious__',
      predicted: predictedTypes[i]
    });
  }
};

const renderMarkdown = (report: EvalReport): string => {
  const { summary, samples, confusion } = report;
  const lines: string[] = [];

  lines.push('# Parser Evaluation Report');
  lines.push('');
  lines.push(`Generated at: ${report.generatedAt}`);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push('| Scope | Precision | Recall | F1 | TP | FP | FN |');
  lines.push('| --- | ---: | ---: | ---: | ---: | ---: | ---: |');
  lines.push(
    `| Micro | ${summary.micro.precision.toFixed(4)} | ${summary.micro.recall.toFixed(4)} | ${summary.micro.f1.toFixed(4)} | ${summary.micro.tp} | ${summary.micro.fp} | ${summary.micro.fn} |`
  );
  lines.push(
    `| Macro | ${summary.macro.precision.toFixed(4)} | ${summary.macro.recall.toFixed(4)} | ${summary.macro.f1.toFixed(4)} | - | - | - |`
  );
  lines.push('');
  lines.push('## Per-sample Metrics');
  lines.push('');
  lines.push('| Sample | Precision | Recall | F1 | Expected | Predicted | TP | FP | FN |');
  lines.push('| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |');

  for (const sample of samples) {
    lines.push(
      `| ${sample.sample} | ${sample.precision.toFixed(4)} | ${sample.recall.toFixed(4)} | ${sample.f1.toFixed(4)} | ${sample.expectedCount} | ${sample.predictedCount} | ${sample.tp} | ${sample.fp} | ${sample.fn} |`
    );
  }

  lines.push('');
  lines.push('## Confusion Matrix (Expected × Predicted)');
  lines.push('');

  lines.push(`Labels: ${confusion.labels.join(', ')}`);
  lines.push('');
  lines.push('| Expected \\ Predicted | ' + confusion.labels.join(' | ') + ' |');
  lines.push('| --- | ' + confusion.labels.map(() => '---:').join(' | ') + ' |');

  for (let rowIndex = 0; rowIndex < confusion.labels.length; rowIndex += 1) {
    const rowLabel = confusion.labels[rowIndex];
    const row = confusion.matrix[rowIndex];
    lines.push(`| ${rowLabel} | ${row.join(' | ')} |`);
  }

  lines.push('');
  lines.push(
    '> Notes: `__missing__` means expected component not produced; `__spurious__` means extra predicted component.'
  );

  return `${lines.join('\n')}\n`;
};

const prdFiles = fs
  .readdirSync(prdDir)
  .filter((file) => file.endsWith('.md'))
  .sort((a, b) => a.localeCompare(b));

if (prdFiles.length === 0) {
  throw new Error(`No PRD fixtures found in ${path.relative(repoRoot, prdDir)}`);
}

const samples: SampleMetrics[] = [];
const confusionPairs: Array<{ expected: string; predicted: string }> = [];

let totalTp = 0;
let totalFp = 0;
let totalFn = 0;

for (const prdFile of prdFiles) {
  const sample = prdFile.replace(/\.md$/i, '');
  const expectedPath = path.resolve(expectedDir, `${sample}.json`);

  if (!fs.existsSync(expectedPath)) {
    throw new Error(
      `Missing expected fixture for ${sample}: ${path.relative(repoRoot, expectedPath)}`
    );
  }

  const markdown = fs.readFileSync(path.resolve(prdDir, prdFile), 'utf8');
  const expected = JSON.parse(fs.readFileSync(expectedPath, 'utf8')) as ExpectedFixture;
  const parsed = parsePrdToSchema(markdown);

  const expectedTypes = expected.components.map((component) => component.type);
  const predictedTypes = parsed.sections.flatMap((section) =>
    section.components.map((component) => component.type)
  );

  const expectedCountMap = countByType(expectedTypes);
  const predictedCountMap = countByType(predictedTypes);

  const typeUniverse = new Set<string>([...expectedCountMap.keys(), ...predictedCountMap.keys()]);

  let tp = 0;
  for (const type of typeUniverse) {
    tp += Math.min(expectedCountMap.get(type) ?? 0, predictedCountMap.get(type) ?? 0);
  }

  const fp = Math.max(0, predictedTypes.length - tp);
  const fn = Math.max(0, expectedTypes.length - tp);

  const precision = safeDivide(tp, tp + fp);
  const recall = safeDivide(tp, tp + fn);
  const f1 = safeDivide(2 * precision * recall, precision + recall);

  totalTp += tp;
  totalFp += fp;
  totalFn += fn;

  pairwiseConfusion(expectedTypes, predictedTypes, confusionPairs);

  samples.push({
    sample,
    page: expected.name,
    precision: round4(precision),
    recall: round4(recall),
    f1: round4(f1),
    tp,
    fp,
    fn,
    expectedCount: expectedTypes.length,
    predictedCount: predictedTypes.length,
    expectedTypes,
    predictedTypes
  });
}

const microPrecision = safeDivide(totalTp, totalTp + totalFp);
const microRecall = safeDivide(totalTp, totalTp + totalFn);
const microF1 = safeDivide(2 * microPrecision * microRecall, microPrecision + microRecall);

const macroPrecision = safeDivide(
  samples.reduce((sum, sample) => sum + sample.precision, 0),
  samples.length
);
const macroRecall = safeDivide(
  samples.reduce((sum, sample) => sum + sample.recall, 0),
  samples.length
);
const macroF1 = safeDivide(
  samples.reduce((sum, sample) => sum + sample.f1, 0),
  samples.length
);

const labels = Array.from(
  new Set<string>([
    ...confusionPairs.map((pair) => pair.expected),
    ...confusionPairs.map((pair) => pair.predicted)
  ])
).sort((a, b) => a.localeCompare(b));

const labelIndex = new Map<string, number>(labels.map((label, index) => [label, index]));
const matrix = labels.map(() => labels.map(() => 0));

for (const pair of confusionPairs) {
  const row = labelIndex.get(pair.expected);
  const col = labelIndex.get(pair.predicted);
  if (row !== undefined && col !== undefined) {
    matrix[row][col] += 1;
  }
}

const report: EvalReport = {
  generatedAt: new Date().toISOString(),
  summary: {
    sampleCount: samples.length,
    micro: {
      precision: round4(microPrecision),
      recall: round4(microRecall),
      f1: round4(microF1),
      tp: totalTp,
      fp: totalFp,
      fn: totalFn
    },
    macro: {
      precision: round4(macroPrecision),
      recall: round4(macroRecall),
      f1: round4(macroF1)
    }
  },
  samples,
  confusion: {
    labels,
    matrix
  }
};

fs.mkdirSync(outputDir, { recursive: true });
const reportJsonPath = path.resolve(outputDir, 'parser-eval-report.json');
const reportMdPath = path.resolve(outputDir, 'parser-eval-report.md');

fs.writeFileSync(reportJsonPath, `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(reportMdPath, renderMarkdown(report));

console.log(`Parser evaluation completed for ${samples.length} samples.`);
console.log(`- JSON report: ${path.relative(repoRoot, reportJsonPath)}`);
console.log(`- Markdown report: ${path.relative(repoRoot, reportMdPath)}`);
console.log(
  `- Micro scores => precision=${report.summary.micro.precision.toFixed(4)}, recall=${report.summary.micro.recall.toFixed(4)}, f1=${report.summary.micro.f1.toFixed(4)}`
);
