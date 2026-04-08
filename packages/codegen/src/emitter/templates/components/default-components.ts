import type { ComponentTemplate } from './component-contract.js';

export const chartComponentTemplate: ComponentTemplate = {
  type: 'chart',
  importName: 'ChartPlaceholder',
  importPath: '@/components/ui/chart-placeholder',
  source: `export function ChartPlaceholder({ title }: { title: string }) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">{title}</p>
      <div className="flex h-40 items-end gap-2">
        {[28, 62, 46, 80, 58, 70].map((height, index) => (
          <div key={index} className="flex-1 rounded-t-md bg-gradient-to-t from-blue-500 to-cyan-400" style={{ height: \`${'${height}%'}\` }} />
        ))}
      </div>
    </div>
  );
}
`,
  render:
    '  if (component.type === "chart") {\n    return <ChartPlaceholder title={String(component.props.title ?? component.id)} />;\n  }\n'
};

export const tableComponentTemplate: ComponentTemplate = {
  type: 'table',
  importName: 'DataTable',
  importPath: '@/components/ui/data-table',
  source: `import { mockRows } from "@/lib/mock-data";

export function DataTable({ title }: { title: string }) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">{title}</p>
      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-100 dark:bg-slate-800">
            <tr>
              <th className="px-3 py-2 font-medium">Metric</th>
              <th className="px-3 py-2 font-medium">Value</th>
              <th className="px-3 py-2 font-medium">Trend</th>
            </tr>
          </thead>
          <tbody>
            {mockRows.map((row) => (
              <tr key={row.metric} className="border-t border-slate-200 dark:border-slate-700">
                <td className="px-3 py-2">{row.metric}</td>
                <td className="px-3 py-2">{row.value}</td>
                <td className="px-3 py-2">{row.trend}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
`,
  render:
    '  if (component.type === "table") {\n    return <DataTable title={String(component.props.title ?? component.id)} />;\n  }\n'
};

export const buttonComponentTemplate: ComponentTemplate = {
  type: 'button',
  importName: 'Button',
  importPath: '@/components/ui/button',
  source: `import * as React from "react";

export function Button({ className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={\`inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 \${className}\`}
      {...props}
    />
  );
}
`,
  render:
    '  if (component.type === "button") {\n    return <Button>{String(component.props.label ?? "Action")}</Button>;\n  }\n'
};

export const cardComponentTemplate: ComponentTemplate = {
  type: 'card',
  importName: 'Card',
  importPath: '@/components/ui/card',
  source: `import * as React from "react";

export function Card({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={\`rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 \${className}\`} {...props} />;
}
`,
  render: `  if (component.type === "card") {
    return (
      <Card className="p-4">
        <p className="text-base font-medium">{String(component.props.title ?? component.id)}</p>
      </Card>
    );
  }
`
};

export const defaultComponentTemplates: ComponentTemplate[] = [
  buttonComponentTemplate,
  cardComponentTemplate,
  chartComponentTemplate,
  tableComponentTemplate
];
