'use client';

import { useEffect, useMemo, useState } from 'react';
import { RenderSchema } from '@/components/render-schema';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { InputField } from '@/components/ui/input-field';
import { SelectField } from '@/components/ui/select-field';
import { TextareaField } from '@/components/ui/textarea-field';
import fallbackSchema from '@/lib/structure.json';
import type { UISchema } from '@/lib/types';

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

const defaultPrompt = `请生成一个可直接评审的产品原型，不要只输出组件清单。

目标：
1. 先给出完整页面层级和关键业务流
2. 列表、表单、详情、状态反馈都要覆盖
3. 优先保证真实业务可用，而不是炫技
4. 输出适合管理后台/工作台继续迭代的结构`;

const promptIdeas = [
  '把现货交易对管理升级成支持批量上下线、审核记录、权限控制的后台。',
  '生成一个 AI CRM 工作台，包含线索列表、客户详情、跟进时间轴和提醒。',
  '生成一个数据分析看板，支持筛选、钻取、异常告警和导出。'
];

const safeParseSchema = (raw: string): UISchema | null => {
  try {
    return JSON.parse(raw) as UISchema;
  } catch {
    return null;
  }
};

const statusTone: Record<RunStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  running: 'bg-cyan-100 text-cyan-800',
  success: 'bg-emerald-100 text-emerald-800',
  failed: 'bg-rose-100 text-rose-800'
};

export function WorkbenchClient() {
  const [prdText, setPrdText] = useState(defaultPrompt);
  const [prdPath, setPrdPath] = useState('input/prd.md');
  const [provider, setProvider] = useState<'auto' | 'deepseek' | 'fallback' | 'local'>('auto');
  const [runDir, setRunDir] = useState('');
  const [runName, setRunName] = useState('');
  const [runs, setRuns] = useState<RunRecord[]>([]);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [structureJson, setStructureJson] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadRuns = async () => {
    const res = await fetch('/api/runs');
    const data = (await res.json()) as { runs: RunRecord[]; latestRunId?: string | null };
    setRuns(data.runs);
    setActiveRunId((current) => current ?? data.latestRunId ?? data.runs[0]?.id ?? null);
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
    setErrorMessage(null);

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

      const data = (await res.json()) as { run?: RunRecord };
      if (!res.ok) {
        setErrorMessage(data.run?.error?.message ?? '生成失败，请检查 pipeline 日志。');
      }

      await loadRuns();
      if (data.run?.id) {
        setActiveRunId(data.run.id);
      }
    } finally {
      setLoading(false);
    }
  };

  const activeRun = useMemo(
    () => runs.find((run) => run.id === activeRunId) ?? null,
    [runs, activeRunId]
  );

  const activeSchema = useMemo(
    () => safeParseSchema(structureJson) ?? (fallbackSchema as UISchema),
    [structureJson]
  );

  const summary = useMemo(() => {
    const sectionCount = activeSchema.sections.length;
    const componentCount = activeSchema.sections.reduce(
      (count, section) => count + section.components.length,
      0
    );
    const interactionCount = activeSchema.interactions.length;

    return { sectionCount, componentCount, interactionCount };
  }, [activeSchema]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.18),transparent_28%),linear-gradient(180deg,#f8fbff_0%,#eef4f7_100%)] text-slate-950">
      <div className="mx-auto max-w-[1560px] px-4 py-6 md:px-8 xl:px-10">
        <section className="rounded-[36px] border border-white/60 bg-white/75 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur md:p-7">
          <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
            <div className="space-y-5">
              <div className="rounded-[32px] bg-slate-950 p-6 text-white">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.32em] text-cyan-300">
                      Prototype Agent
                    </p>
                    <h1 className="mt-3 text-3xl font-semibold leading-tight">
                      把 PRD 直接推成
                      <br />
                      可评审原型
                    </h1>
                  </div>
                  <Badge className="bg-white/10 text-white">v0-style studio</Badge>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-300">
                  我们保留现有 pipeline，把输出层升级成真正可用的产品工作台，不再只是组件拼盘。
                </p>
              </div>

              <Card className="border-white/70 bg-white/80 shadow-sm" size="lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-semibold text-slate-950">生成输入</p>
                    <p className="mt-1 text-sm text-slate-500">描述页面、数据、流程和异常态。</p>
                  </div>
                  <Badge className="bg-cyan-50 text-cyan-700">Prompt first</Badge>
                </div>

                <div className="mt-5">
                  <label className="mb-2 block text-sm font-medium text-slate-700">需求描述</label>
                  <TextareaField
                    value={prdText}
                    onChange={(event) => setPrdText(event.target.value)}
                    className="min-h-56 rounded-3xl border-slate-200 bg-slate-50 px-4 py-4 leading-6"
                  />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {promptIdeas.map((idea) => (
                    <button
                      key={idea}
                      type="button"
                      onClick={() => setPrdText(idea)}
                      className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                    >
                      {idea}
                    </button>
                  ))}
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Provider
                    </label>
                    <SelectField
                      value={provider}
                      onChange={(event) => setProvider(event.target.value as typeof provider)}
                      className="rounded-2xl border-slate-200 bg-white"
                    >
                      <option value="auto">auto</option>
                      <option value="deepseek">deepseek</option>
                      <option value="fallback">fallback</option>
                      <option value="local">local</option>
                    </SelectField>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      PRD 文件路径
                    </label>
                    <InputField
                      value={prdPath}
                      onChange={(event) => setPrdPath(event.target.value)}
                      className="rounded-2xl border-slate-200 bg-white"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      运行目录
                    </label>
                    <InputField
                      value={runDir}
                      onChange={(event) => setRunDir(event.target.value)}
                      placeholder="默认 runs/{timestamp}_{traceId}"
                      className="rounded-2xl border-slate-200 bg-white"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Run 名称
                    </label>
                    <InputField
                      value={runName}
                      onChange={(event) => setRunName(event.target.value)}
                      placeholder="如 admin-trading-pairs"
                      className="rounded-2xl border-slate-200 bg-white"
                    />
                  </div>
                </div>

                <div className="mt-5 flex items-center gap-3">
                  <Button
                    className="rounded-2xl px-5 py-3 shadow-lg shadow-slate-950/10"
                    onClick={onRun}
                    state={loading ? 'loading' : 'default'}
                  >
                    生成完整原型
                  </Button>
                  <p className="text-sm text-slate-500">
                    当前会自动读取最新 run，并把 `structure.json` 直接变成产品级画布。
                  </p>
                </div>

                {errorMessage ? (
                  <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {errorMessage}
                  </p>
                ) : null}
              </Card>

              <Card className="border-white/70 bg-white/80 shadow-sm" size="lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-semibold text-slate-950">运行状态</p>
                    <p className="mt-1 text-sm text-slate-500">
                      保留 pipeline 可观测性，方便判断哪里出了问题。
                    </p>
                  </div>
                  {activeRun ? (
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${statusTone[activeRun.status]}`}
                    >
                      {activeRun.status}
                    </span>
                  ) : null}
                </div>

                {activeRun ? (
                  <div className="mt-5 space-y-4">
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Run</p>
                        <p className="mt-2 text-sm font-medium text-slate-900">{activeRun.name}</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          Provider
                        </p>
                        <p className="mt-2 text-sm font-medium text-slate-900">
                          {activeRun.provider}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          Duration
                        </p>
                        <p className="mt-2 text-sm font-medium text-slate-900">
                          {activeRun.totalDurationMs ?? 0} ms
                        </p>
                      </div>
                    </div>

                    <div className="max-h-56 space-y-2 overflow-auto rounded-3xl border border-slate-200 bg-slate-50 p-3">
                      {events.length ? (
                        events.map((event, index) => (
                          <div
                            key={`${event.timestamp}-${index}`}
                            className="rounded-2xl bg-white px-3 py-3"
                          >
                            <div className="flex items-center justify-between gap-4">
                              <p className="text-sm font-medium text-slate-900">{event.phase}</p>
                              <p className="text-xs text-slate-400">{event.duration_ms ?? 0} ms</p>
                            </div>
                            <p className="mt-1 text-xs text-slate-500">
                              {event.message || event.error_code || 'OK'}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="px-2 py-1 text-sm text-slate-500">暂无日志事件。</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-500">暂无运行记录，先生成一次即可。</p>
                )}
              </Card>
            </div>

            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-4">
                <Card className="border-white/70 bg-white/80" size="lg">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Page</p>
                  <p className="mt-3 text-xl font-semibold text-slate-950">
                    {activeSchema.page_name}
                  </p>
                </Card>
                <Card className="border-white/70 bg-white/80" size="lg">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Sections</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-950">
                    {summary.sectionCount}
                  </p>
                </Card>
                <Card className="border-white/70 bg-white/80" size="lg">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Components</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-950">
                    {summary.componentCount}
                  </p>
                </Card>
                <Card className="border-white/70 bg-white/80" size="lg">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Interactions</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-950">
                    {summary.interactionCount}
                  </p>
                </Card>
              </div>

              <Card className="overflow-hidden border-white/70 bg-white/70 p-0 shadow-sm" size="lg">
                <div className="flex items-center justify-between border-b border-slate-200/80 px-6 py-5">
                  <div>
                    <p className="text-lg font-semibold text-slate-950">实时原型画布</p>
                    <p className="mt-1 text-sm text-slate-500">
                      从最新 `structure.json` 自动生成的完整产品原型。
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge className="bg-slate-100 text-slate-700">
                      {activeSchema.template ?? 'workspace'}
                    </Badge>
                    <Badge className="bg-cyan-50 text-cyan-700">live render</Badge>
                  </div>
                </div>
                <div className="max-h-[1280px] overflow-auto p-6">
                  <RenderSchema schema={activeSchema} />
                </div>
              </Card>

              <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
                <Card className="border-white/70 bg-white/80 shadow-sm" size="lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-semibold text-slate-950">历史运行</p>
                      <p className="mt-1 text-sm text-slate-500">
                        切换不同 run，直接比对输出质量。
                      </p>
                    </div>
                    <Badge className="bg-slate-100 text-slate-700">{runs.length} runs</Badge>
                  </div>

                  <div className="mt-5 space-y-3">
                    {runs.length ? (
                      runs.map((run) => (
                        <button
                          key={run.id}
                          type="button"
                          onClick={() => setActiveRunId(run.id)}
                          className={`w-full rounded-3xl border px-4 py-4 text-left transition ${
                            activeRunId === run.id
                              ? 'border-slate-950 bg-slate-950 text-white'
                              : 'border-slate-200 bg-white text-slate-900 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <p className="text-sm font-medium">{run.name}</p>
                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                                activeRunId === run.id
                                  ? 'bg-white/10 text-white'
                                  : statusTone[run.status]
                              }`}
                            >
                              {run.status}
                            </span>
                          </div>
                          <p
                            className={`mt-2 text-xs ${activeRunId === run.id ? 'text-slate-300' : 'text-slate-500'}`}
                          >
                            {run.updatedAt}
                          </p>
                        </button>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">暂无历史运行。</p>
                    )}
                  </div>
                </Card>

                <Card className="border-white/70 bg-white/80 shadow-sm" size="lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-semibold text-slate-950">结构化输出</p>
                      <p className="mt-1 text-sm text-slate-500">
                        保留原始 JSON，便于继续调 schema 设计。
                      </p>
                    </div>
                    <Badge className="bg-slate-100 text-slate-700">debuggable</Badge>
                  </div>

                  <pre className="mt-5 max-h-[420px] overflow-auto rounded-[28px] border border-slate-200 bg-slate-950 p-5 text-xs leading-6 text-slate-200">
                    {structureJson || JSON.stringify(activeSchema, null, 2)}
                  </pre>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
