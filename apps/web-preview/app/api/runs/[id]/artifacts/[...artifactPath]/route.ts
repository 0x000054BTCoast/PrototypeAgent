import fs from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { getRepoRoot, getRunById } from '@/lib/workbench/store';

export async function GET(
  _: Request,
  context: { params: Promise<{ id: string; artifactPath: string[] }> }
) {
  const { id, artifactPath } = await context.params;
  const run = getRunById(id);

  if (!run) {
    return NextResponse.json({ error: 'run_not_found' }, { status: 404 });
  }

  const runDir = path.resolve(getRepoRoot(), run.runDir);
  const relativeArtifactPath = artifactPath.join('/');
  const absolutePath = path.resolve(runDir, relativeArtifactPath);

  if (!absolutePath.startsWith(runDir)) {
    return NextResponse.json({ error: 'invalid_artifact_path' }, { status: 400 });
  }

  if (!fs.existsSync(absolutePath)) {
    return NextResponse.json({ error: 'artifact_not_found' }, { status: 404 });
  }

  const ext = path.extname(absolutePath);
  const contentType =
    ext === '.json'
      ? 'application/json; charset=utf-8'
      : ext === '.html'
        ? 'text/html; charset=utf-8'
        : ext === '.svg'
          ? 'image/svg+xml'
          : 'text/plain; charset=utf-8';

  const data = fs.readFileSync(absolutePath, 'utf8');
  return new NextResponse(data, { headers: { 'Content-Type': contentType } });
}
