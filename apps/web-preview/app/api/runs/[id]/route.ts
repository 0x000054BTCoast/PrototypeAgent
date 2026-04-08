import fs from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { getRepoRoot, getRunById } from '@/lib/workbench/store';

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const run = getRunById(id);

  if (!run) {
    return NextResponse.json({ error: 'run_not_found' }, { status: 404 });
  }

  const runDir = path.resolve(getRepoRoot(), run.runDir);
  const logPath = path.resolve(runDir, 'logs', 'pipeline-log.json');
  const log = fs.existsSync(logPath) ? JSON.parse(fs.readFileSync(logPath, 'utf8')) : null;

  return NextResponse.json({ run, log });
}
