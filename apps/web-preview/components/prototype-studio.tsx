'use client';

import { useEffect, useState } from 'react';
import type { UIComponent, UISchema } from '@/lib/types';

type RunStatus = 'pending' | 'running' | 'success' | 'failed';
type Provider = 'auto' | 'deepseek' | 'fallback' | 'local';
type CanvasMode = 'prototype' | 'html' | 'structure';

interface RunRecord {
  id: string;
  name: string;
  status: RunStatus;
  provider: Provider;
  runDir: string;
  totalDurationMs?: number;
  updatedAt: string;
  error?: { code: string; message: string };
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
  log: { events: EventItem[] } | null;
}

const samplePrompt = `为 B 端交易后台生成一套完整原型：
1. 桌面端优先，支持运营高频使用
2. 页面包含筛选区、数据表、详情抽屉、批量操作
3. 视觉风格接近现代 SaaS 控制台
4. 输出可直接评审的完整流程，不要只给组件堆叠`;

const flattenComponents = (components: UIComponent[]): UIComponent[] =>
  components.flatMap((component) => [component, ...flattenComponents(component.children)]);

const readLabel = (component: UIComponent): string =>
  String(
    component.props.label ??
      component.props.title ??
      component.props.placeholder ??
      component.props.content ??
      component.id
  );

const readTableModel = (schema: UISchema) => {
  const components = flattenComponents(schema.sections.flatMap((section) => section.components));
  const table = components.find((component) => component.type === 'table');
  const rawColumns = Array.isArray(table?.props.columns) ? table.props.columns : [];
  const rawRows = Array.isArray(table?.props.data) ? table.props.data : [];

  const columns = rawColumns
    .map((column) => {
      if (!column || typeof column !== 'object') {
        return null;
      }
      const key = 'key' in column ? String(column.key) : '';
      const title = 'title' in column ? String(column.title) : key;
      return key ? { key, title } : null;
    })
    .filter((column): column is { key: string; title: string } => Boolean(column));

  const rows = rawRows
    .map((row) => (row && typeof row === 'object' ? (row as Record<string, unknown>) : null))
    .filter((row): row is Record<string, unknown> => Boolean(row));

  return { columns, rows };
};

const formatDuration = (value?: number) => {
  if (!value) {
    return '未完成';
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}s`;
  }
  return `${value}ms`;
};

const formatTime = (value?: string) => {
  if (!value) {
    return '--';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

const statusTone: Record<RunStatus, string> = {
  pending: 'bg-amber-100 text-amber-700 ring-amber-200',
  running: 'bg-sky-100 text-sky-700 ring-sky-200',
  success: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
  failed: 'bg-rose-100 text-rose-700 ring-rose-200'
};

function DesktopCanvas({ schema, previewUrl }: { schema: UISchema; previewUrl: string }) {
  const tableModel = readTableModel(schema);
  const topSection = schema.sections.find((section) => section.position === 'top');
  const centerSection =
    schema.sections.find((section) => section.position === 'center') ?? schema.sections[0];
  const headerTitle = topSection?.name ?? '操作区';
  const actionButtons = flattenComponents(topSection?.components ?? []).filter(
    (component) => component.type === 'button'
  );
  const metrics = [
    { label: 'Sections', value: schema.sections.length },
    {
      label: 'Components',
      value: flattenComponents(schema.sections.flatMap((section) => section.components)).length
    },
    { label: 'Rows', value: tableModel.rows.length || 12 },
    { label: 'Template', value: schema.template ?? 'custom' }
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-[28px] border border-white/70 bg-white/85 p-3 shadow-[0_30px_80px_rgba(15,23,42,0.14)] backdrop-blur">
        <div className="rounded-[22px] border border-slate-200/80 bg-[#f7f8fc] p-5">
          <div className="grid gap-5 xl:grid-cols-[220px_minmax(0,1fr)]">
            <aside className="rounded-[20px] bg-slate-950 p-5 text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Prototype</p>
                  <p className="mt-2 text-xl font-semibold">Agent Studio</p>
                </div>
                <div className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300">
                  {schema.template ?? 'custom'}
                </div>
              </div>
              <div className="mt-8 space-y-2">
                {schema.sections.map((section, index) => (
                  <div
                    key={section.id}
                    className={`rounded-2xl px-4 py-3 text-sm ${
                      index === 1
                        ? 'bg-white text-slate-950 shadow-lg'
                        : 'bg-white/5 text-slate-300'
                    }`}
                  >
                    <p className="font-medium">{section.name}</p>
                    <p className="mt-1 text-xs text-inherit/70">{section.position}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Delivery</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  这块画布现在会把结构化输出重组成更接近真实产品的后台工作界面。
                </p>
              </div>
            </aside>

            <div className="space-y-5">
              <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.26em] text-slate-400">
                      {headerTitle}
                    </p>
                    <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                      {schema.page_name}
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                      不是简单组件堆叠，而是按运营场景组织的可评审原型。
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {actionButtons.slice(0, 3).map((button, index) => (
                      <button
                        key={button.id}
                        type="button"
                        className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                          index === 0
                            ? 'bg-slate-950 text-white shadow-lg shadow-slate-950/20'
                            : 'border border-slate-200 bg-white text-slate-700'
                        }`}
                      >
                        {readLabel(button)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {metrics.map((metric) => (
                    <div key={metric.label} className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        {metric.label}
                      </p>
                      <p className="mt-3 text-2xl font-semibold text-slate-950">{metric.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
                <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {centerSection?.name ?? '主内容区'}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        筛选、批量操作、结果列表和行级动作已经被组织成完整工作流。
                      </p>
                    </div>
                    <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                      Live canvas
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    {schema.sections.map((section) => (
                      <div
                        key={section.id}
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600"
                      >
                        {section.name}
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 overflow-hidden rounded-[20px] border border-slate-200">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-slate-950 text-slate-50">
                        <tr>
                          {(tableModel.columns.length
                            ? tableModel.columns
                            : [
                                { key: 'name', title: '名称' },
                                { key: 'status', title: '状态' },
                                { key: 'actions', title: '操作' }
                              ]
                          ).map((column) => (
                            <th key={column.key} className="px-4 py-3 font-medium">
                              {column.title}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {(tableModel.rows.length
                          ? tableModel.rows.slice(0, 8)
                          : [
                              { name: 'BTC/USDT', status: 'Running', actions: 'Edit' },
                              { name: 'ETH/USDT', status: 'Healthy', actions: 'Review' },
                              { name: 'SOL/USDT', status: 'Pending', actions: 'Approve' }
                            ]
                        ).map((row, index) => (
                          <tr key={`row-${index}`} className="hover:bg-slate-50">
                            {(tableModel.columns.length
                              ? tableModel.columns
                              : [
                                  { key: 'name', title: '名称' },
                                  { key: 'status', title: '状态' },
                                  { key: 'actions', title: '操作' }
                                ]
                            ).map((column, cellIndex) => (
                              <td
                                key={`${column.key}-${cellIndex}`}
                                className="px-4 py-4 align-middle text-slate-600"
                              >
                                {cellIndex === 1 ? (
                                  <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                                    {String(row[column.key] ?? '已开启')}
                                  </span>
                                ) : (
                                  String(row[column.key] ?? '--')
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="rounded-[22px] border border-slate-200 bg-[linear-gradient(135deg,#0f172a,#1e293b)] p-5 text-white shadow-sm">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                      Designer notes
                    </p>
                    <p className="mt-4 text-lg font-semibold">
                      系统会优先推导可操作路径，而不是零散控件。
                    </p>
                    <div className="mt-5 space-y-3 text-sm text-slate-300">
                      <p>1. 先提取筛选与主表的业务骨架</p>
                      <p>2. 再补齐详情、状态、批量动作与空态</p>
                      <p>3. 最后输出可演示的桌面端与移动端镜像</p>
                    </div>
                  </div>

                  <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm font-semibold text-slate-900">HTML 原型</p>
                    <p className="mt-1 text-sm text-slate-500">
                      后端生成的 HTML 预览会直接挂在这里，便于你校验落地结果。
                    </p>
                    {previewUrl ? (
                      <iframe
                        title="latest-generated-preview"
                        src={previewUrl}
                        className="mt-4 h-56 w-full rounded-2xl border border-slate-200 bg-white"
                      />
                    ) : (
                      <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-sm text-slate-400">
                        运行一次生成后，这里会显示最新 HTML 原型。
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-[24px] border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">移动端镜像</p>
              <p className="mt-1 text-sm text-slate-500">
                用于快速确认信息层级和核心操作是否足够清晰。
              </p>
            </div>
            <div className="rounded-full bg-slate-950 px-3 py-1 text-xs font-medium text-white">
              Mobile QA
            </div>
          </div>
          <div className="mt-5 flex justify-center">
            <div className="w-[280px] rounded-[34px] border border-slate-300 bg-slate-950 p-3 shadow-2xl">
              <div className="rounded-[28px] bg-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Preview</p>
                    <p className="mt-1 text-lg font-semibold text-slate-950">{schema.page_name}</p>
                  </div>
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </div>
                <div className="mt-4 space-y-3">
                  {(tableModel.rows.length ? tableModel.rows.slice(0, 4) : []).map((row, index) => (
                    <div
                      key={`mobile-${index}`}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                    >
                      <p className="text-sm font-medium text-slate-900">
                        {String(row[tableModel.columns[0]?.key ?? 'name'] ?? `记录 ${index + 1}`)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {String(row[tableModel.columns[1]?.key ?? 'status'] ?? '状态正常')}
                      </p>
                    </div>
                  ))}
                  {!tableModel.rows.length ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                      生成后会自动填充移动端摘要卡片。
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[24px] border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur">
            <p className="text-sm font-semibold text-slate-900">结构摘要</p>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              {schema.sections.map((section) => (
                <div key={section.id} className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="font-medium text-slate-900">{section.name}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
                    {section.position}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur">
            <p className="text-sm font-semibold text-slate-900">关键动作</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {flattenComponents(schema.sections.flatMap((section) => section.components))
                .filter((component) => component.type === 'button')
                .slice(0, 6)
                .map((component) => (
                  <span
                    key={component.id}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700"
                  >
                    {readLabel(component)}
                  </span>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PrototypeStudio({ initialSchema }: { initialSchema: UISchema }) {
  const [prdText, setPrdText] = useState(samplePrompt);
  const [provider, setProvider] = useState<Provider>('auto');
  const [runName, setRunName] = useState('');
  const [runs, setRuns] = useState<RunRecord[]>([]);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [previewUrl, setPreviewUrl] = useState('');
  const [structureText, setStructureText] = useState(JSON.stringify(initialSchema, null, 2));
  const [activeSchema, setActiveSchema] = useState(initialSchema);
  const [canvasMode, setCanvasMode] = useState<CanvasMode>('prototype');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const loadRuns = async () => {
      const response = await fetch('/api/runs');
      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as { runs: RunRecord[]; latestRunId?: string | null };
      setRuns(data.runs);
      setActiveRunId((current) => current ?? data.latestRunId ?? data.runs[0]?.id ?? null);
    };

    void loadRuns();
  }, []);

  useEffect(() => {
    if (!activeRunId) {
      return;
    }

    const loadRunDetail = async () => {
      const response = await fetch(`/api/runs/${activeRunId}`);
      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as RunDetailResponse;
      setEvents(data.log?.events ?? []);
      setPreviewUrl(`/api/runs/${activeRunId}/artifacts/output/preview.html`);

      const structureResponse = await fetch(
        `/api/runs/${activeRunId}/artifacts/artifacts/structure.json`
      );
      if (!structureResponse.ok) {
        return;
      }

      const nextText = await structureResponse.text();
      setStructureText(nextText);
      try {
        setActiveSchema(JSON.parse(nextText) as UISchema);
      } catch {
        setActiveSchema(initialSchema);
      }
    };

    void loadRunDetail();
  }, [activeRunId, initialSchema]);

  const runPrototype = async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prdText: prdText.trim(),
          provider,
          runName: runName.trim() || undefined
        })
      });

      const payload = (await response.json()) as { run?: RunRecord };
      if (!response.ok || !payload.run) {
        throw new Error(payload.run?.error?.message ?? '生成失败');
      }

      setCanvasMode('prototype');
      const runsResponse = await fetch('/api/runs');
      if (runsResponse.ok) {
        const data = (await runsResponse.json()) as {
          runs: RunRecord[];
          latestRunId?: string | null;
        };
        setRuns(data.runs);
      }
      setActiveRunId(payload.run.id);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  };

  const activeRun = runs.find((run) => run.id === activeRunId) ?? null;
  const latestEvents = events.slice(-5).reverse();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#fff6d8_0%,#f8fafc_38%,#eef2ff_100%)] px-4 py-6 text-slate-950 md:px-8 lg:px-10">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-500">
              AI Product Prototyping
            </p>
            <h1 className="mt-3 max-w-4xl text-4xl font-semibold tracking-[-0.04em] text-slate-950 md:text-6xl">
              把 PRD 直接压成可评审、可演示、可继续迭代的完整原型。
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
              现在的页面不再只是 schema dump。它会把生成结果重组为接近 v0
              的工作台体验，并同步展示最新 run 的 HTML 产物。
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[24px] border border-white/70 bg-white/70 px-5 py-4 shadow-sm backdrop-blur">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Runs</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{runs.length}</p>
            </div>
            <div className="rounded-[24px] border border-white/70 bg-white/70 px-5 py-4 shadow-sm backdrop-blur">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Latest</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {activeRun?.status ?? 'draft'}
              </p>
            </div>
            <div className="rounded-[24px] border border-white/70 bg-white/70 px-5 py-4 shadow-sm backdrop-blur">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Duration</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {formatDuration(activeRun?.totalDurationMs)}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)_320px]">
          <section className="rounded-[32px] border border-white/70 bg-white/75 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">Prompt Studio</p>
                <p className="mt-1 text-sm text-slate-500">输入需求后直接生成完整原型。</p>
              </div>
              <div className="rounded-full bg-slate-950 px-3 py-1 text-xs font-medium text-white">
                v0-style
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">PRD / 指令</label>
                <textarea
                  value={prdText}
                  onChange={(event) => setPrdText(event.target.value)}
                  className="min-h-[240px] w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-900 outline-none transition focus:border-slate-950"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Provider</label>
                  <select
                    value={provider}
                    onChange={(event) => setProvider(event.target.value as Provider)}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-slate-950"
                  >
                    <option value="auto">auto</option>
                    <option value="deepseek">deepseek</option>
                    <option value="fallback">fallback</option>
                    <option value="local">local</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Run 名称</label>
                  <input
                    value={runName}
                    onChange={(event) => setRunName(event.target.value)}
                    placeholder="例如 trading-admin-v2"
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-slate-950"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={runPrototype}
                disabled={loading}
                className="flex h-14 w-full items-center justify-center rounded-[22px] bg-slate-950 text-sm font-semibold text-white shadow-[0_18px_30px_rgba(15,23,42,0.18)] transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-70"
              >
                {loading ? '生成中...' : '生成完整原型'}
              </button>

              {errorMessage ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {errorMessage}
                </div>
              ) : null}

              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">What changed</p>
                <div className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                  <p>1. 从单页组件清单升级成多区域产品工作台。</p>
                  <p>2. 同时展示真实 HTML 生成产物与结构化数据。</p>
                  <p>3. 自动补齐移动端镜像和评审所需摘要。</p>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-white/70 bg-white/75 p-4 shadow-sm backdrop-blur">
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ['prototype', 'Visual Prototype'],
                    ['html', 'Generated HTML'],
                    ['structure', 'Structure JSON']
                  ] as Array<[CanvasMode, string]>
                ).map(([mode, label]) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setCanvasMode(mode)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      canvasMode === mode
                        ? 'bg-slate-950 text-white'
                        : 'border border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {activeRun ? (
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusTone[activeRun.status]}`}
                  >
                    {activeRun.status}
                  </span>
                  <span className="text-sm text-slate-500">{formatTime(activeRun.updatedAt)}</span>
                </div>
              ) : null}
            </div>

            {canvasMode === 'prototype' ? (
              <DesktopCanvas schema={activeSchema} previewUrl={previewUrl} />
            ) : null}

            {canvasMode === 'html' ? (
              <div className="rounded-[32px] border border-white/70 bg-white/75 p-4 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur">
                {previewUrl ? (
                  <iframe
                    title="generated-html-preview"
                    src={previewUrl}
                    className="h-[980px] w-full rounded-[24px] border border-slate-200 bg-white"
                  />
                ) : (
                  <div className="flex h-[980px] items-center justify-center rounded-[24px] border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400">
                    运行后这里会展示真实 HTML 原型。
                  </div>
                )}
              </div>
            ) : null}

            {canvasMode === 'structure' ? (
              <div className="rounded-[32px] border border-white/70 bg-white/75 p-4 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur">
                <pre className="h-[980px] overflow-auto rounded-[24px] border border-slate-200 bg-slate-950 p-5 text-xs leading-6 text-slate-200">
                  {structureText}
                </pre>
              </div>
            ) : null}
          </section>

          <aside className="space-y-4">
            <section className="rounded-[32px] border border-white/70 bg-white/75 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur">
              <p className="text-sm font-semibold text-slate-900">Recent Runs</p>
              <div className="mt-4 space-y-3">
                {runs.slice(0, 6).map((run) => (
                  <button
                    key={run.id}
                    type="button"
                    onClick={() => setActiveRunId(run.id)}
                    className={`w-full rounded-[22px] border px-4 py-4 text-left transition ${
                      run.id === activeRunId
                        ? 'border-slate-950 bg-slate-950 text-white'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-medium">{run.name}</p>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          run.id === activeRunId
                            ? 'bg-white/15 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {run.status}
                      </span>
                    </div>
                    <p
                      className={`mt-2 text-xs ${run.id === activeRunId ? 'text-slate-300' : 'text-slate-400'}`}
                    >
                      {formatTime(run.updatedAt)} · {formatDuration(run.totalDurationMs)}
                    </p>
                  </button>
                ))}
                {!runs.length ? (
                  <div className="rounded-[22px] border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-400">
                    暂无历史运行记录。
                  </div>
                ) : null}
              </div>
            </section>

            <section className="rounded-[32px] border border-white/70 bg-white/75 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur">
              <p className="text-sm font-semibold text-slate-900">Pipeline Events</p>
              <div className="mt-4 space-y-3">
                {latestEvents.map((event, index) => (
                  <div
                    key={`${event.timestamp}-${index}`}
                    className="rounded-[20px] bg-slate-50 px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-slate-900">{event.phase}</p>
                      <span className="text-xs text-slate-400">{event.duration_ms ?? 0}ms</span>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {event.error_code ?? 'OK'} · {event.message}
                    </p>
                  </div>
                ))}
                {!latestEvents.length ? (
                  <div className="rounded-[22px] border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-400">
                    生成后这里会显示最近的 pipeline 事件。
                  </div>
                ) : null}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
