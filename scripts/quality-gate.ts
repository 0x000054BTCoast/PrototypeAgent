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
  steps: StepResult[];
};

const args = process.argv.slice(2);
const maxRetries = Number.parseInt(readArg('--max-retries') ?? '2', 10);

if (!Number.isFinite(maxRetries) || maxRetries < 0) {
  console.error('Invalid --max-retries value. It must be a non-negative integer.');
  process.exit(1);
}

const steps: StepResult[] = [];
let success = false;
let attemptsUsed = 0;

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

const report: Report = {
  generatedAt: new Date().toISOString(),
  maxRetries,
  attemptsUsed,
  success,
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
