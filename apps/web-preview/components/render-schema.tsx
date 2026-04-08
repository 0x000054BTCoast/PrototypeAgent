'use client';

import type { UISchema, UIComponent, UISection } from '@/lib/types';

type TableColumn = { key: string; title: string };
type TableRow = Record<string, string>;

const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

const asText = (value: unknown, fallback = '') =>
  typeof value === 'string' && value.trim() ? value : fallback;

const collectComponents = (sections: UISection[]) =>
  sections.flatMap((section) => section.components);

const findComponent = (components: UIComponent[], type: UIComponent['type']) =>
  components.find((component) => component.type === type);

const getTableData = (component?: UIComponent) => {
  const columns = Array.isArray(component?.props.columns)
    ? (component?.props.columns as TableColumn[]).filter(
        (column) => typeof column?.key === 'string' && typeof column?.title === 'string'
      )
    : [];
  const rows = Array.isArray(component?.props.data)
    ? (component?.props.data as TableRow[]).filter((row) => typeof row === 'object' && row !== null)
    : [];

  return { columns, rows };
};

const summarizeActions = (rows: TableRow[], actionKey?: string) => {
  const bucket = new Map<string, number>();
  for (const row of rows) {
    const raw = actionKey ? row[actionKey] : '';
    for (const action of String(raw || '')
      .split(/[,+/，]/)
      .map((item) => item.trim())
      .filter(Boolean)) {
      bucket.set(action, (bucket.get(action) ?? 0) + 1);
    }
  }
  return [...bucket.entries()].slice(0, 4);
};

const formatSectionLabel = (value: string) => value.replaceAll('_', ' ').trim();

function ScreenFrame({
  title,
  subtitle,
  tone,
  children
}: {
  title: string;
  subtitle: string;
  tone: 'desktop' | 'detail' | 'mobile';
  children: React.ReactNode;
}) {
  const toneClasses = {
    desktop: 'border-slate-200/80 bg-white/95',
    detail: 'border-cyan-200/70 bg-cyan-50/70',
    mobile: 'border-emerald-200/70 bg-white/90'
  };

  return (
    <article
      className={cn(
        'overflow-hidden rounded-[28px] border shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur',
        toneClasses[tone]
      )}
    >
      <div className="flex items-center justify-between border-b border-black/5 px-5 py-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
        <div className="flex gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
        </div>
      </div>
      {children}
    </article>
  );
}

export function RenderSchema({ schema }: { schema: UISchema }) {
  const components = collectComponents(schema.sections);
  const table = findComponent(components, 'table');
  const searchButton = findComponent(components, 'button');
  const textComponent = findComponent(components, 'text');
  const chart = findComponent(components, 'chart');

  const { columns, rows } = getTableData(table);
  const mainRows = rows.slice(0, 8);
  const totalRecords = rows.length || 24;
  const statusKey = columns.find(
    (column) => /status|状态/i.test(column.key) || /状态/i.test(column.title)
  )?.key;
  const nameKey = columns.find(
    (column) => /name|名称|pair/i.test(column.key) || /名/i.test(column.title)
  )?.key;
  const actionKey = columns.find(
    (column) => /action|操作/i.test(column.key) || /操作/i.test(column.title)
  )?.key;
  const searchPlaceholder = asText(
    textComponent?.props.placeholder,
    '描述你想生成的页面、数据和行为'
  );
  const actions = summarizeActions(rows, actionKey);

  const statusCount = rows.reduce<Record<string, number>>((acc, row) => {
    const key = String((statusKey && row[statusKey]) || '待处理');
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const topStatuses = Object.entries(statusCount).slice(0, 3);
  const sections = schema.sections.map((section) => ({
    id: section.id,
    name: formatSectionLabel(section.name),
    count: section.components.length
  }));

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <ScreenFrame
          title={`${schema.page_name} · Desktop Workspace`}
          subtitle="系统自动整理为可以直接评审的高保真工作台"
          tone="desktop"
        >
          <div className="grid min-h-[760px] grid-cols-[248px_1fr_300px] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.92))]">
            <aside className="border-r border-slate-200/80 bg-slate-950 px-5 py-6 text-slate-50">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-400/20 text-sm font-semibold text-cyan-200">
                  AI
                </div>
                <div>
                  <p className="text-sm font-semibold">Prototype Studio</p>
                  <p className="text-xs text-slate-400">Generated from schema</p>
                </div>
              </div>

              <div className="mt-8 space-y-2">
                {sections.map((section, index) => (
                  <div
                    key={section.id}
                    className={cn(
                      'rounded-2xl px-4 py-3',
                      index === 1 ? 'bg-white text-slate-950' : 'bg-white/5 text-slate-300'
                    )}
                  >
                    <p className="text-sm font-medium">{section.name}</p>
                    <p className="mt-1 text-xs opacity-70">{section.count} blocks</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Intent</p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {schema.template ?? 'workspace'}
                </p>
                <p className="mt-2 text-sm text-slate-300">
                  把结构化输出变成可讨论、可验收、可继续迭代的完整界面。
                </p>
              </div>
            </aside>

            <div className="space-y-6 px-6 py-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-950">{schema.page_name}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    支持从 prompt 到页面结构、状态流和结果预览的一体化生成。
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">
                    Share draft
                  </button>
                  <button className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-slate-950/15">
                    {asText(searchButton?.props.label, 'Generate')}
                  </button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-3xl border border-slate-200 bg-white p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Records</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-950">{totalRecords}</p>
                  <p className="mt-2 text-sm text-slate-500">已映射进真实业务列表与交互动作</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">States</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-950">
                    {topStatuses.length || 1}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    自动抽出关键状态，便于做边界场景评审
                  </p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Sections</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-950">
                    {schema.sections.length}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">页面被组织成信息层次明确的模块</p>
                </div>
              </div>

              <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="min-w-[260px] flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                    {searchPlaceholder}
                  </div>
                  <div className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600">
                    搜索范围: 全部
                  </div>
                  <div className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600">
                    状态筛选: 实时
                  </div>
                  <div className="rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-medium text-white">
                    生成新版本
                  </div>
                </div>
              </div>

              <div className="rounded-[32px] border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                  <div>
                    <p className="text-base font-semibold text-slate-950">Primary data view</p>
                    <p className="text-sm text-slate-500">
                      不是控件列表，而是可以直接评审的数据工作区
                    </p>
                  </div>
                  <div className="flex gap-2 text-xs text-slate-500">
                    <span className="rounded-full bg-slate-100 px-3 py-1">Bulk edit</span>
                    <span className="rounded-full bg-slate-100 px-3 py-1">Filters</span>
                    <span className="rounded-full bg-slate-100 px-3 py-1">Audit trail</span>
                  </div>
                </div>

                <div className="overflow-x-auto px-2 pb-2">
                  <table className="min-w-full text-left text-sm">
                    <thead>
                      <tr className="text-slate-400">
                        {columns.map((column) => (
                          <th key={column.key} className="px-4 py-4 font-medium">
                            {column.title}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {mainRows.map((row, index) => (
                        <tr
                          key={`${index}-${row[nameKey ?? columns[0]?.key ?? 'row']}`}
                          className="border-t border-slate-100"
                        >
                          {columns.map((column) => {
                            const value = String(row[column.key] ?? '-');
                            const isStatus = column.key === statusKey;
                            const isAction = column.key === actionKey;
                            return (
                              <td key={column.key} className="px-4 py-4 text-slate-700">
                                {isStatus ? (
                                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                                    {value}
                                  </span>
                                ) : isAction ? (
                                  <div className="flex flex-wrap gap-2">
                                    {value
                                      .split(/[,+/，]/)
                                      .map((item) => item.trim())
                                      .filter(Boolean)
                                      .slice(0, 3)
                                      .map((item) => (
                                        <span
                                          key={item}
                                          className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600"
                                        >
                                          {item}
                                        </span>
                                      ))}
                                  </div>
                                ) : (
                                  <span className="font-medium text-slate-900">{value}</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <aside className="border-l border-slate-200/80 bg-slate-50/70 px-5 py-6">
              <div className="rounded-[28px] bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">State map</p>
                <div className="mt-4 space-y-3">
                  {topStatuses.length ? (
                    topStatuses.map(([label, count]) => (
                      <div key={label} className="rounded-2xl border border-slate-100 p-4">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-slate-900">{label}</p>
                          <span className="text-xs text-slate-400">{count}</span>
                        </div>
                        <div className="mt-3 h-2 rounded-full bg-slate-100">
                          <div
                            className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
                            style={{ width: `${Math.max(20, (count / totalRecords) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-slate-100 p-4 text-sm text-slate-500">
                      当前 schema 还没有显式状态字段。
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 rounded-[28px] bg-slate-950 p-5 text-white shadow-sm">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Action cluster</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {actions.length ? (
                    actions.map(([label, count]) => (
                      <span key={label} className="rounded-full bg-white/10 px-3 py-2 text-xs">
                        {label} × {count}
                      </span>
                    ))
                  ) : (
                    <span className="rounded-full bg-white/10 px-3 py-2 text-xs">Generate</span>
                  )}
                </div>
                <p className="mt-4 text-sm text-slate-300">
                  自动提炼高频动作，方便继续扩展批量操作、弹窗和审批流。
                </p>
              </div>

              <div className="mt-5 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Next screens</p>
                <div className="mt-4 space-y-3">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm font-medium text-slate-900">Create / edit drawer</p>
                    <p className="mt-1 text-xs text-slate-500">从表格动作自动延展成表单流程</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm font-medium text-slate-900">Audit history</p>
                    <p className="mt-1 text-xs text-slate-500">围绕关键状态生成留痕与变更说明</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm font-medium text-slate-900">Permission matrix</p>
                    <p className="mt-1 text-xs text-slate-500">为管理后台补足角色与权限视图</p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </ScreenFrame>

        <div className="space-y-6">
          <ScreenFrame title="Detail Flow" subtitle="自动补齐编辑抽屉和关键字段" tone="detail">
            <div className="space-y-5 p-5">
              <div className="rounded-[28px] bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-semibold text-slate-950">
                      编辑 {asText(schema.page_name, '当前对象')}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      生成器把列表页延展为可执行的编辑流程
                    </p>
                  </div>
                  <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-medium text-cyan-700">
                    Draft saved
                  </span>
                </div>
                <div className="mt-5 grid gap-4">
                  {(columns.slice(0, 4).length
                    ? columns.slice(0, 4)
                    : [{ key: 'name', title: '名称' }]
                  ).map((column) => (
                    <div key={column.key}>
                      <p className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                        {column.title}
                      </p>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        {(mainRows[0] && String(mainRows[0][column.key] ?? '')) ||
                          `配置 ${column.title}`}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                  {chart
                    ? '检测到图表组件，可继续生成趋势对比与告警配置。'
                    : '可继续添加校验、联动规则和审批备注。'}
                </div>
              </div>
            </div>
          </ScreenFrame>

          <ScreenFrame
            title="Mobile Snapshot"
            subtitle="给产品和业务快速过一遍核心信息密度"
            tone="mobile"
          >
            <div className="mx-auto w-[340px] bg-white px-4 pb-5 pt-4">
              <div className="rounded-[28px] bg-slate-950 p-4 text-white">
                <p className="text-sm text-slate-300">Today</p>
                <p className="mt-1 text-xl font-semibold">{schema.page_name}</p>
                <p className="mt-2 text-sm text-slate-400">移动端保留关键数据与高频操作</p>
              </div>
              <div className="mt-4 space-y-3">
                {mainRows.slice(0, 3).map((row, index) => (
                  <div
                    key={`${index}-mobile`}
                    className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-950">
                        {String(row[nameKey ?? columns[0]?.key ?? 'item'] ?? `Item ${index + 1}`)}
                      </p>
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
                        {String((statusKey && row[statusKey]) || '正常')}
                      </span>
                    </div>
                    <p className="mt-3 text-xs leading-5 text-slate-500">
                      高频动作被压缩到卡片层，适合业务快速扫读与确认。
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </ScreenFrame>
        </div>
      </section>
    </div>
  );
}
