import { NextResponse } from 'next/server';
import { runPipeline } from '../../../../../packages/planner/src/service.js';
import { getLatestRun, getRunById, upsertRun, type RunRecord } from '@/lib/workbench/store';

interface RunRequestBody {
  prdText?: string;
  prdPath?: string;
  provider?: 'auto' | 'deepseek' | 'fallback' | 'local';
  runDir?: string;
  runName?: string;
}

const nowIso = () => new Date().toISOString();

export async function POST(request: Request) {
  const body = (await request.json()) as RunRequestBody;

  const runName = body.runName?.trim() || `run-${Date.now()}`;
  const provider = body.provider ?? 'auto';

  const baseRecord: RunRecord = {
    id: runName,
    name: runName,
    status: 'pending',
    provider,
    runDir: body.runDir?.trim() || 'runs/pending',
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
      runDir: body.runDir?.trim() || undefined,
      runName,
      provider
    });

    const finalRecord: RunRecord = {
      ...baseRecord,
      status: 'success',
      totalDurationMs: result.totalDurationMs,
      updatedAt: nowIso(),
      runDir: result.runDir,
      id: result.runId,
      name: result.runName
    };
    upsertRun(finalRecord);

    return NextResponse.json({ run: finalRecord, result });
  } catch (error) {
    const maybeResult =
      typeof error === 'object' && error !== null && 'result' in error
        ? ((
            error as {
              result?: {
                runDir?: string;
                runId?: string;
                runName?: string;
                error?: { code: string; message: string };
                totalDurationMs?: number;
              };
            }
          ).result ?? null)
        : null;

    const failed = getRunById(maybeResult?.runId ?? runName) ?? getLatestRun() ?? baseRecord;
    const finalRecord: RunRecord = {
      ...failed,
      status: 'failed',
      updatedAt: nowIso(),
      totalDurationMs: maybeResult?.totalDurationMs,
      runDir: maybeResult?.runDir ?? failed.runDir,
      id: maybeResult?.runId ?? failed.id,
      name: maybeResult?.runName ?? failed.name,
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
