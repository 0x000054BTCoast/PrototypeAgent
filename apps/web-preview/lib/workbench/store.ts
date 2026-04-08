import fs from 'node:fs';
import path from 'node:path';

export type RunStatus = 'pending' | 'running' | 'success' | 'failed';

export interface RunRecord {
  id: string;
  name: string;
  status: RunStatus;
  provider: 'auto' | 'deepseek' | 'fallback' | 'local';
  outputDir: string;
  inputMode: 'text' | 'file';
  inputPath?: string;
  createdAt: string;
  updatedAt: string;
  totalDurationMs?: number;
  error?: {
    code: string;
    message: string;
  };
}

const repoRoot = process.cwd();
const runsRoot = path.resolve(repoRoot, 'output', 'runs');

const getManifestPath = () => path.resolve(runsRoot, 'manifest.json');

export const ensureRunsStore = (): void => {
  fs.mkdirSync(runsRoot, { recursive: true });
  const manifestPath = getManifestPath();
  if (!fs.existsSync(manifestPath)) {
    fs.writeFileSync(manifestPath, '[]\n');
  }
};

export const readRuns = (): RunRecord[] => {
  ensureRunsStore();
  const raw = fs.readFileSync(getManifestPath(), 'utf8');
  const records = JSON.parse(raw) as RunRecord[];
  return records.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};

export const writeRuns = (runs: RunRecord[]): void => {
  ensureRunsStore();
  fs.writeFileSync(getManifestPath(), `${JSON.stringify(runs, null, 2)}\n`);
};

export const upsertRun = (run: RunRecord): void => {
  const runs = readRuns();
  const index = runs.findIndex((item) => item.id === run.id);
  if (index >= 0) {
    runs[index] = run;
  } else {
    runs.push(run);
  }
  writeRuns(runs);
};

export const getRunById = (id: string): RunRecord | null => {
  const runs = readRuns();
  return runs.find((run) => run.id === id) ?? null;
};

export const getRunsRoot = (): string => runsRoot;
