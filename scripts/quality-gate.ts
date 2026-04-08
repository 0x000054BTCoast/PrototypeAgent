import { spawnSync } from 'node:child_process';
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, relative } from 'node:path';

type StepStatus = 'pass' | 'fail' | 'warning';

type StepResult = {
  name: string;
  status: StepStatus;
  command: string;
  attempt: number;
  durationMs: number;
  details?: string;
};

type Report = {
  generatedAt: string;
  maxRetries: number;
  attemptsUsed: number;
  success: boolean;
  gate: GateEvaluation;
  attemptMetrics: AttemptMetrics[];
  steps: StepResult[];
};

type AttemptMetrics = {
  attempt: number;
  successRate: number;
  durationMs: number;
  errorDistribution: Record<string, number>;
  editableStabilityRate: number;
  baselineScore: number;
};

type GateThresholds = {
  minSuccessRate: number;
  minEditableStabilityRate: number;
  minBaselineScore: number;
  maxDurationMs: number;
};

type GateEvaluation = {
  pass: boolean;
  thresholds: GateThresholds;
  measuredOnAttempt: number;
  measured: {
    successRate: number;
    editableStabilityRate: number;
    baselineScore: number;
    durationMs: number;
  };
};

const args = process.argv.slice(2);
const maxRetries = Number.parseInt(readArg('--max-retries') ?? '2', 10);
const thresholds: GateThresholds = {
  minSuccessRate: parseRatio('--min-success-rate', 0.95),
  minEditableStabilityRate: parseRatio('--min-editable-stability-rate', 0.95),
  minBaselineScore: parseRatio('--min-baseline-score', 0.9),
  maxDurationMs: parsePositiveInt('--max-duration-ms', 180_000)
};

if (!Number.isFinite(maxRetries) || maxRetries < 0) {
  console.error('Invalid --max-retries value. It must be a non-negative integer.');
  process.exit(1);
}

const steps: StepResult[] = [];
let success = false;
let attemptsUsed = 0;
const attemptMetrics: AttemptMetrics[] = [];

for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
  attemptsUsed = attempt + 1;

  const generation = runStep({
    name: 'generate',
    command: 'pnpm pipeline',
    attempt
  });
  steps.push(generation);

  const typecheck = runStep({
    name: 'typecheck',
    command: 'pnpm typecheck',
    attempt
  });
  steps.push(typecheck);

  const lint = runStep({
    name: 'lint',
    command: 'pnpm lint',
    attempt
  });
  steps.push(lint);

  const build = runStep({
    name: 'build',
    command: 'pnpm build',
    attempt
  });
  steps.push(build);

  const smoke = runStep({
    name: 'e2e_smoke',
    command: 'pnpm --filter web-preview test',
    attempt
  });
  steps.push(smoke);

  const screenshotDiff = runScreenshotDiff(attempt);
  steps.push(screenshotDiff);

  const metrics = computeAttemptMetrics(
    attempt,
    [generation, typecheck, lint, build, smoke, screenshotDiff],
    thresholds.maxDurationMs
  );
  attemptMetrics.push(metrics);
  printAttemptMetrics(metrics);

  const blockingFailed =
    [generation, typecheck, lint, build, smoke].some((it) => it.status === 'fail') ||
    screenshotDiff.status === 'fail';

  if (!blockingFailed) {
    success = true;
    break;
  }

  if (attempt >= maxRetries) {
    break;
  }

  console.log(`\n[quality-gate] attempt ${attempt + 1} failed, running auto-fix before retry...`);
  runBestEffort('pnpm exec eslint . --fix');
  runBestEffort('pnpm format');
}

const gate = evaluateGate(attemptMetrics, thresholds);
success = success && gate.pass;

const report: Report = {
  generatedAt: new Date().toISOString(),
  maxRetries,
  attemptsUsed,
  success,
  gate,
  attemptMetrics,
  steps
};

mkdirSync('output', { recursive: true });
writeFileSync('output/quality-gate-report.json', `${JSON.stringify(report, null, 2)}\n`, 'utf-8');
writeFileSync('output/quality-gate-report.md', renderMarkdown(report), 'utf-8');

console.log(
  `\n[quality-gate] report saved:\n- output/quality-gate-report.json\n- output/quality-gate-report.md`
);
if (!success) {
  process.exit(1);
}

function readArg(flag: string): string | undefined {
  const idx = args.indexOf(flag);
  if (idx === -1) {
    return undefined;
  }
  return args[idx + 1];
}

function parseRatio(flag: string, fallback: number): number {
  const raw = readArg(flag);
  if (raw === undefined) {
    return fallback;
  }
  const parsed = Number.parseFloat(raw);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
    console.error(`Invalid ${flag} value. It must be between 0 and 1.`);
    process.exit(1);
  }
  return parsed;
}

function parsePositiveInt(flag: string, fallback: number): number {
  const raw = readArg(flag);
  if (raw === undefined) {
    return fallback;
  }
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    console.error(`Invalid ${flag} value. It must be a positive integer.`);
    process.exit(1);
  }
  return parsed;
}

function runStep(input: { name: string; command: string; attempt: number }): StepResult {
  const startedAt = Date.now();
  const result = spawnSync(input.command, { shell: true, stdio: 'inherit' });
  const durationMs = Date.now() - startedAt;

  return {
    name: input.name,
    command: input.command,
    attempt: input.attempt,
    durationMs,
    status: result.status === 0 ? 'pass' : 'fail',
    details: result.status === 0 ? undefined : `exit code ${result.status ?? 'unknown'}`
  };
}

function computeAttemptMetrics(
  attempt: number,
  stepResults: StepResult[],
  maxDurationMs: number
): AttemptMetrics {
  const blockingSteps = stepResults.filter((step) => step.status !== 'warning');
  const blockingPassCount = blockingSteps.filter((step) => step.status === 'pass').length;
  const successRate = blockingSteps.length ? blockingPassCount / blockingSteps.length : 0;

  const editableStepNames = ['typecheck', 'lint', 'build'];
  const editableSteps = stepResults.filter((step) => editableStepNames.includes(step.name));
  const editablePassCount = editableSteps.filter((step) => step.status === 'pass').length;
  const editableStabilityRate = editableSteps.length ? editablePassCount / editableSteps.length : 0;

  const durationMs = stepResults.reduce((sum, step) => sum + step.durationMs, 0);
  const durationScore = maxDurationMs > 0 ? Math.max(0, 1 - durationMs / maxDurationMs) : 0;
  const baselineScore = Number(
    (successRate * 0.4 + editableStabilityRate * 0.4 + durationScore * 0.2).toFixed(4)
  );

  const errorDistribution: Record<string, number> = {};
  for (const step of stepResults) {
    if (step.status === 'fail') {
      errorDistribution[step.name] = (errorDistribution[step.name] ?? 0) + 1;
    }
  }

  return {
    attempt: attempt + 1,
    successRate: Number(successRate.toFixed(4)),
    durationMs,
    errorDistribution,
    editableStabilityRate: Number(editableStabilityRate.toFixed(4)),
    baselineScore
  };
}

function evaluateGate(metrics: AttemptMetrics[], thresholds: GateThresholds): GateEvaluation {
  if (metrics.length === 0) {
    return {
      pass: false,
      thresholds,
      measuredOnAttempt: 0,
      measured: { successRate: 0, editableStabilityRate: 0, baselineScore: 0, durationMs: 0 }
    };
  }

  const best = metrics.reduce((prev, current) =>
    current.baselineScore > prev.baselineScore ? current : prev
  );
  const pass =
    best.successRate >= thresholds.minSuccessRate &&
    best.editableStabilityRate >= thresholds.minEditableStabilityRate &&
    best.baselineScore >= thresholds.minBaselineScore &&
    best.durationMs <= thresholds.maxDurationMs;

  return {
    pass,
    thresholds,
    measuredOnAttempt: best.attempt,
    measured: {
      successRate: best.successRate,
      editableStabilityRate: best.editableStabilityRate,
      baselineScore: best.baselineScore,
      durationMs: best.durationMs
    }
  };
}

function printAttemptMetrics(metrics: AttemptMetrics): void {
  console.log(
    `[quality-gate][attempt ${metrics.attempt}] success_rate=${metrics.successRate.toFixed(2)} ` +
      `duration_ms=${metrics.durationMs} editable_stability_rate=${metrics.editableStabilityRate.toFixed(2)} ` +
      `baseline_score=${metrics.baselineScore.toFixed(2)} ` +
      `errors=${JSON.stringify(metrics.errorDistribution)}`
  );
}

function runBestEffort(command: string): void {
  spawnSync(command, { shell: true, stdio: 'inherit' });
}

function runScreenshotDiff(attempt: number): StepResult {
  const command = 'screenshot diff (fixtures/screenshots vs output/screenshots)';
  const startedAt = Date.now();

  const baselineDir = 'fixtures/screenshots';
  const actualDir = 'output/screenshots';

  if (!existsSync(baselineDir) || !statSync(baselineDir).isDirectory()) {
    return {
      name: 'screenshot_diff',
      command,
      attempt,
      durationMs: Date.now() - startedAt,
      status: 'warning',
      details: `baseline directory missing: ${baselineDir}`
    };
  }

  if (!existsSync(actualDir) || !statSync(actualDir).isDirectory()) {
    return {
      name: 'screenshot_diff',
      command,
      attempt,
      durationMs: Date.now() - startedAt,
      status: 'warning',
      details: `actual directory missing: ${actualDir}`
    };
  }

  const baselineFiles = listFiles(baselineDir);
  const actualFiles = new Set(listFiles(actualDir).map((p) => relative(actualDir, p)));

  const missing: string[] = [];
  const changed: string[] = [];

  for (const baselineFile of baselineFiles) {
    const rel = relative(baselineDir, baselineFile);
    const actualFile = join(actualDir, rel);
    if (!actualFiles.has(rel) || !existsSync(actualFile)) {
      missing.push(rel);
      continue;
    }

    const baseHash = sha256File(baselineFile);
    const actualHash = sha256File(actualFile);
    if (baseHash !== actualHash) {
      changed.push(rel);
    }
  }

  if (missing.length || changed.length) {
    const details = [
      missing.length ? `missing: ${missing.join(', ')}` : '',
      changed.length ? `changed: ${changed.join(', ')}` : ''
    ]
      .filter(Boolean)
      .join(' | ');

    return {
      name: 'screenshot_diff',
      command,
      attempt,
      durationMs: Date.now() - startedAt,
      status: 'fail',
      details
    };
  }

  return {
    name: 'screenshot_diff',
    command,
    attempt,
    durationMs: Date.now() - startedAt,
    status: 'pass'
  };
}

function listFiles(dir: string): string[] {
  const output: string[] = [];
  const queue = [dir];

  while (queue.length) {
    const current = queue.pop() as string;
    const entries = readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const abs = join(current, entry.name);
      if (entry.isDirectory()) {
        queue.push(abs);
      } else if (entry.isFile()) {
        output.push(abs);
      }
    }
  }

  return output.sort();
}

function sha256File(filePath: string): string {
  const hash = createHash('sha256');
  hash.update(readFileSync(filePath));
  return hash.digest('hex');
}

function renderMarkdown(report: Report): string {
  const lines = [
    '# Quality Gate Report',
    '',
    `- generatedAt: ${report.generatedAt}`,
    `- maxRetries: ${report.maxRetries}`,
    `- attemptsUsed: ${report.attemptsUsed}`,
    `- success: ${report.success ? 'PASS' : 'FAIL'}`,
    `- gate: ${report.gate.pass ? 'PASS' : 'FAIL'} (attempt ${report.gate.measuredOnAttempt})`,
    '',
    '## Gate Thresholds',
    '',
    `- minSuccessRate: ${report.gate.thresholds.minSuccessRate}`,
    `- minEditableStabilityRate: ${report.gate.thresholds.minEditableStabilityRate}`,
    `- minBaselineScore: ${report.gate.thresholds.minBaselineScore}`,
    `- maxDurationMs: ${report.gate.thresholds.maxDurationMs}`,
    '',
    '## Attempt Metrics',
    '',
    '| attempt | success_rate | duration(ms) | editable_stability_rate | baseline_score | error_distribution |',
    '|---:|---:|---:|---:|---:|---|',
    ...report.attemptMetrics.map(
      (metric) =>
        `| ${metric.attempt} | ${metric.successRate.toFixed(4)} | ${metric.durationMs} | ${metric.editableStabilityRate.toFixed(4)} | ${metric.baselineScore.toFixed(4)} | \`${JSON.stringify(metric.errorDistribution)}\` |`
    ),
    '',
    '## Step Results',
    '',
    '| step | attempt | status | duration(ms) | command | details |',
    '|---|---:|---|---:|---|---|'
  ];

  for (const step of report.steps) {
    lines.push(
      `| ${step.name} | ${step.attempt + 1} | ${step.status.toUpperCase()} | ${step.durationMs} | \`${step.command}\` | ${step.details ?? ''} |`
    );
  }

  lines.push('');
  return `${lines.join('\n')}\n`;
}
