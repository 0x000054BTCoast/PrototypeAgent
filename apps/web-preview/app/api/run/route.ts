import path from 'node:path';
import { NextResponse } from 'next/server';
import { runPipeline } from '../../../../../packages/planner/src/service.js';
import { getRunById, upsertRun, type RunRecord } from '@/lib/workbench/store';

interface RunRequestBody {
  prdText?: string;
  prdPath?: string;
  provider?: 'auto' | 'deepseek' | 'fallback' | 'local';
  outputDir?: string;
  runName?: string;
}

const nowIso = () => new Date().toISOString();

export async function POST(request: Request) {
  const body = (await request.json()) as RunRequestBody;

  const runName = body.runName?.trim() || `run-${Date.now()}`;
  const provider = body.provider ?? 'auto';
  const runOutputDir = body.outputDir?.trim()
    ? body.outputDir
    : path.join('output', 'runs', runName);

  const baseRecord: RunRecord = {
    id: runName,
    name: runName,
    status: 'pending',
    provider,
    outputDir: runOutputDir,
    inputMode: body.prdText?.trim() ? 'text' : 'file',
    inputPath: body.prdPath?.trim() || 'input/prd.md',
    createdAt: nowIso(),
    updatedAt: nowIso()
  };

  upsertRun(baseRecord);
  upsertRun({ ...baseRecord, status: 'running', updatedAt: nowIso() });

  try {
    const result = await runPipeline({
      inputText: body.prdText?.trim() ? body.prdText : undefined,
      inputPath: body.prdPath?.trim() || 'input/prd.md',
      outputDir: runOutputDir,
      runName,
      provider
    });

    const finalRecord: RunRecord = {
      ...baseRecord,
      status: 'success',
      totalDurationMs: result.totalDurationMs,
      updatedAt: nowIso(),
      outputDir: result.outputDir
    };
    upsertRun(finalRecord);

    return NextResponse.json({ run: finalRecord, result });
  } catch (error) {
    const maybeResult =
      typeof error === 'object' && error !== null && 'result' in error
        ? ((
            error as {
              result?: { error?: { code: string; message: string }; totalDurationMs?: number };
            }
          ).result ?? null)
        : null;

    const failed = getRunById(runName) ?? baseRecord;
    const finalRecord: RunRecord = {
      ...failed,
      status: 'failed',
      updatedAt: nowIso(),
      totalDurationMs: maybeResult?.totalDurationMs,
      error: maybeResult?.error ?? {
        code: 'QA_PIPELINE_EXECUTION_FAILED',
        message: error instanceof Error ? error.message : String(error)
      }
    };
    upsertRun(finalRecord);

    return NextResponse.json(
      {
        run: finalRecord
      },
      { status: 500 }
    );
  }
}
