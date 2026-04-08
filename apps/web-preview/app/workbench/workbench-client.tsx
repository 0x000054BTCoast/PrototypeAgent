'use client';

import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { InputField } from '@/components/ui/input-field';
import { SelectField } from '@/components/ui/select-field';
import { TextareaField } from '@/components/ui/textarea-field';

type RunStatus = 'pending' | 'running' | 'success' | 'failed';

interface RunRecord {
  id: string;
  name: string;
  status: RunStatus;
  provider: 'auto' | 'deepseek' | 'fallback' | 'local';
  runDir: string;
  totalDurationMs?: number;
  error?: { code: string; message: string };
  updatedAt: string;
}

interface EventItem {
  phase: string;
  duration_ms: number | null;
  error_code: string | null;
  level: 'INFO' | 'ERROR';
  message: string;
  timestamp: string;
}

interface RunDetailResponse {
  run: RunRecord;
  log: {
    events: EventItem[];
  } | null;
}

export function WorkbenchClient() {
  const [prdText, setPrdText] = useState('');
  const [prdPath, setPrdPath] = useState('input/prd.md');
  const [provider, setProvider] = useState<'auto' | 'deepseek' | 'fallback' | 'local'>('auto');
  const [runDir, setRunDir] = useState('');
  const [runName, setRunName] = useState('');
  const [runs, setRuns] = useState<RunRecord[]>([]);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [structureJson, setStructureJson] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const loadRuns = async () => {
    const res = await fetch('/api/runs');
    const data = (await res.json()) as { runs: RunRecord[]; latestRunId?: string | null };
    setRuns(data.runs);
    if (!activeRunId) {
      setActiveRunId(data.latestRunId ?? data.runs[0]?.id ?? null);
    }
  };

  const loadRunDetail = async (runId: string) => {
    const res = await fetch(`/api/runs/${runId}`);
    if (!res.ok) {
      return;
    }
    const data = (await res.json()) as RunDetailResponse;
    setEvents(data.log?.events ?? []);

    const structureRes = await fetch(`/api/runs/${runId}/artifacts/artifacts/structure.json`);
    if (structureRes.ok) {
      setStructureJson(await structureRes.text());
    } else {
      setStructureJson('');
    }

    setPreviewUrl(`/api/runs/${runId}/artifacts/output/preview.html`);
  };

  useEffect(() => {
    void loadRuns();
  }, []);

  useEffect(() => {
    if (activeRunId) {
      void loadRunDetail(activeRunId);
    }
  }, [activeRunId]);

  const onRun = async () => {
    setLoading(true);
    try {
      const payload = {
        prdText: prdText.trim() || undefined,
        prdPath,
        provider,
        runDir: runDir.trim() || undefined,
        runName: runName.trim() || undefined
      };
      const res = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = (await res.json()) as { run: RunRecord };
      await loadRuns();
      setActiveRunId(data.run.id);
    } finally {
      setLoading(false);
    }
  };

  const activeRun = useMemo(
    () => runs.find((run) => run.id === activeRunId) ?? null,
    [runs, activeRunId]
  );

  return (
    <main className="min-h-screen space-y-md bg-bg p-lg text-text">
      <h1 className="text-2xl font-semibold">工作台</h1>

      <div className="grid gap-md lg:grid-cols-3">
        <Card>
          <h2 className="mb-sm text-lg font-medium">输入区</h2>
          <label className="mb-xs block text-sm text-text-muted">PRD 文本（可选）</label>
          <TextareaField value={prdText} onChange={(event) => setPrdText(event.target.value)} />
          <label className="mb-xs mt-sm block text-sm text-text-muted">或 PRD 文件路径</label>
          <InputField value={prdPath} onChange={(event) => setPrdPath(event.target.value)} />
        </Card>

        <Card>
          <h2 className="mb-sm text-lg font-medium">运行配置区</h2>
          <label className="mb-xs block text-sm text-text-muted">模型 Provider</label>
          <SelectField
            value={provider}
            onChange={(event) => setProvider(event.target.value as typeof provider)}
          >
            <option value="auto">auto</option>
            <option value="deepseek">deepseek</option>
            <option value="fallback">fallback</option>
            <option value="local">local</option>
          </SelectField>
          <label className="mb-xs mt-sm block text-sm text-text-muted">运行目录</label>
          <InputField
            value={runDir}
            onChange={(event) => setRunDir(event.target.value)}
            placeholder="默认 runs/{timestamp}_{traceId}"
          />
          <label className="mb-xs mt-sm block text-sm text-text-muted">Run 名称</label>
          <InputField
            value={runName}
            onChange={(event) => setRunName(event.target.value)}
            placeholder="如 sprint-24-login"
          />
          <Button className="mt-md w-full" onClick={onRun} state={loading ? 'loading' : 'default'}>
            运行 Planner
          </Button>
        </Card>

        <Card>
          <h2 className="mb-sm text-lg font-medium">运行状态机</h2>
          {activeRun ? (
            <div className="space-y-sm text-sm">
              <div className="flex items-center gap-sm">
                <span>状态：</span>
                <Badge
                  variant={
                    activeRun.status === 'success'
                      ? 'success'
                      : activeRun.status === 'failed'
                        ? 'warning'
                        : 'info'
                  }
                >
                  {activeRun.status}
                </Badge>
              </div>
              <p>总耗时：{activeRun.totalDurationMs ?? 0} ms</p>
              {activeRun.error ? (
                <p className="text-red-600">
                  {activeRun.error.code}: {activeRun.error.message}
                </p>
              ) : null}
              <div className="max-h-48 space-y-xs overflow-auto rounded border border-border p-sm">
                {events.map((event, index) => (
                  <div key={`${event.timestamp}-${index}`} className="text-xs">
                    <strong>{event.phase}</strong> · {event.duration_ms ?? 0}ms ·{' '}
                    {event.error_code ?? 'OK'}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-text-muted">暂无运行记录。</p>
          )}
        </Card>
      </div>

      <div className="grid gap-md lg:grid-cols-2">
        <Card>
          <h2 className="mb-sm text-lg font-medium">结果区：结构化 JSON</h2>
          <pre className="max-h-[480px] overflow-auto rounded border border-border bg-surface-muted p-sm text-xs">
            {structureJson || '暂无结构化输出'}
          </pre>
        </Card>

        <Card>
          <h2 className="mb-sm text-lg font-medium">结果区：Prototype 预览</h2>
          {previewUrl ? (
            <iframe
              title="prototype-preview"
              src={previewUrl}
              className="h-[480px] w-full rounded border border-border"
            />
          ) : (
            <p className="text-sm text-text-muted">暂无预览输出</p>
          )}
        </Card>
      </div>

      <Card>
        <h2 className="mb-sm text-lg font-medium">历史运行</h2>
        <div className="flex flex-wrap gap-sm">
          {runs.map((run) => (
            <button
              key={run.id}
              type="button"
              className="rounded border border-border px-sm py-xs text-sm"
              onClick={() => setActiveRunId(run.id)}
            >
              {run.name} ({run.status})
            </button>
          ))}
        </div>
      </Card>
    </main>
  );
}
