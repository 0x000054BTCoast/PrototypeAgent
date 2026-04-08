import { NextResponse } from 'next/server';
import { getLatestRunId, readRuns } from '@/lib/workbench/store';

export async function GET() {
  return NextResponse.json({ runs: readRuns(), latestRunId: getLatestRunId() });
}
