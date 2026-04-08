import fs from 'node:fs';
import path from 'node:path';

export interface PruneRunsOptions {
  repoRoot?: string;
  runsRoot?: string;
  days?: number;
  keep?: number;
}

export interface PruneRunsResult {
  runsRoot: string;
  removed: string[];
  kept: string[];
}

const resolveRepoRoot = (repoRoot?: string) =>
  path.resolve(repoRoot ?? process.env.INIT_CWD ?? process.cwd());

const resolveRunsRoot = (repoRoot: string, runsRoot?: string) =>
  path.resolve(repoRoot, runsRoot ?? 'runs');

const listRunDirectories = (runsRoot: string): string[] => {
  if (!fs.existsSync(runsRoot)) {
    return [];
  }

  return fs
    .readdirSync(runsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => b.localeCompare(a));
};

const readRunTimestamp = (runDir: string): number => {
  const logPath = path.resolve(runDir, 'logs', 'pipeline-log.json');
  if (fs.existsSync(logPath)) {
    try {
      const log = JSON.parse(fs.readFileSync(logPath, 'utf8')) as { executed_at?: string };
      if (log.executed_at) {
        const parsed = Date.parse(log.executed_at);
        if (Number.isFinite(parsed)) {
          return parsed;
        }
      }
    } catch {
      // noop
    }
  }

  return fs.statSync(runDir).mtimeMs;
};

export const pruneRuns = (options: PruneRunsOptions = {}): PruneRunsResult => {
  const repoRoot = resolveRepoRoot(options.repoRoot);
  const runsRoot = resolveRunsRoot(repoRoot, options.runsRoot);
  const now = Date.now();
  const maxAgeMs =
    typeof options.days === 'number' ? Math.max(0, options.days) * 24 * 60 * 60 * 1000 : null;
  const keep = typeof options.keep === 'number' ? Math.max(0, options.keep) : null;

  const runIdsByTime = listRunDirectories(runsRoot)
    .map((runId) => ({ runId, timestamp: readRunTimestamp(path.resolve(runsRoot, runId)) }))
    .sort((a, b) => b.timestamp - a.timestamp);

  const removed: string[] = [];
  const kept: string[] = [];

  runIdsByTime.forEach((item, index) => {
    const shouldPruneByAge = maxAgeMs !== null && now - item.timestamp > maxAgeMs;
    const shouldPruneByKeep = keep !== null && index >= keep;

    if (shouldPruneByAge || shouldPruneByKeep) {
      fs.rmSync(path.resolve(runsRoot, item.runId), { recursive: true, force: true });
      removed.push(item.runId);
    } else {
      kept.push(item.runId);
    }
  });

  return {
    runsRoot: path.relative(repoRoot, runsRoot),
    removed,
    kept
  };
};
