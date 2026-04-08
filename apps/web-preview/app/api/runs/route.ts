import { NextResponse } from 'next/server';
import { readRuns } from '@/lib/workbench/store';

export async function GET() {
  return NextResponse.json({ runs: readRuns() });
}
