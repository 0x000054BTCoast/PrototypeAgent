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

export function Button({ className = "", variant = "primary", size = "md", state = "default", slots, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger"; size?: "sm" | "md" | "lg"; state?: "default" | "active" | "disabled" | "loading" | "error" | "success"; slots?: { leading?: React.ReactNode; trailing?: React.ReactNode } }) {
  const variantClasses = {
    primary: "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900",
    secondary: "border border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100",
    ghost: "bg-transparent text-slate-900 dark:text-slate-100",
    danger: "bg-red-600 text-white"
  };
  const sizeClasses = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm", lg: "px-5 py-3 text-base" };
  const stateClasses = { default: "", active: "ring-2 ring-blue-500", disabled: "opacity-50 cursor-not-allowed", loading: "opacity-80 cursor-wait", error: "ring-2 ring-red-500", success: "ring-2 ring-emerald-500" };

  return (
    <button className={\`inline-flex items-center gap-2 rounded-xl font-medium shadow-sm transition ${'${variantClasses[variant]}'} ${'${sizeClasses[size]}'} ${'${stateClasses[state]}'} ${'${className}'}\`} disabled={state === "disabled" || state === "loading"} {...props}>
      {slots?.leading}
      <span>{state === "loading" ? "Loading…" : children}</span>
      {slots?.trailing}
    </button>
  );
}
`,
  render:
    '  if (component.type === "button") {\n    return <Button variant={component.props.variant as "primary" | "secondary" | "ghost" | "danger"} size={component.props.size as "sm" | "md" | "lg"} state={component.props.state as "default" | "active" | "disabled" | "loading" | "error" | "success"} slots={{ leading: component.props.leadingSlot ? <span>{String(component.props.leadingSlot)}</span> : undefined, trailing: component.props.trailingSlot ? <span>{String(component.props.trailingSlot)}</span> : undefined }}>{String(component.props.label ?? "Action")}</Button>;\n  }\n'
};

export const cardComponentTemplate: ComponentTemplate = {
  type: 'card',
  importName: 'Card',
  importPath: '@/components/ui/card',
  source: `import * as React from "react";

export function Card({ className = "", variant = "elevated", size = "md", state = "default", slots, children, ...props }: React.HTMLAttributes<HTMLDivElement> & { variant?: "elevated" | "outline" | "filled"; size?: "sm" | "md" | "lg"; state?: "default" | "active" | "disabled" | "loading" | "error" | "success"; slots?: { header?: React.ReactNode; footer?: React.ReactNode } }) {
  const variantClasses = { elevated: "border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900", outline: "border border-slate-200 bg-transparent dark:border-slate-800", filled: "border border-transparent bg-slate-100 dark:bg-slate-800" };
  const sizeClasses = { sm: "p-3 rounded-lg", md: "p-4 rounded-xl", lg: "p-6 rounded-2xl" };
  const stateClasses = { default: "", active: "ring-2 ring-blue-500", disabled: "opacity-50", loading: "animate-pulse", error: "ring-2 ring-red-500", success: "ring-2 ring-emerald-500" };

  return <div className={\`space-y-2 ${'${variantClasses[variant]}'} ${'${sizeClasses[size]}'} ${'${stateClasses[state]}'} ${'${className}'}\`} {...props}>{slots?.header}<div>{children}</div>{slots?.footer}</div>;
}
`,
  render: `  if (component.type === "card") {
    return (
      <Card
        variant={component.props.variant as "elevated" | "outline" | "filled"}
        size={component.props.size as "sm" | "md" | "lg"}
        state={component.props.state as "default" | "active" | "disabled" | "loading" | "error" | "success"}
        slots={{
          header: component.props.headerSlot ? <p className="text-xs text-slate-500">{String(component.props.headerSlot)}</p> : undefined,
          footer: component.props.footerSlot ? <p className="text-xs text-slate-500">{String(component.props.footerSlot)}</p> : undefined
        }}
      >
        <p className="text-base font-medium">{String(component.props.title ?? component.id)}</p>
      </Card>
    );
  }
`
};

const simpleTemplates: ComponentTemplate[] = [
  {
    type: 'badge',
    importName: 'Badge',
    importPath: '@/components/ui/badge',
    source: `export function Badge({ children, className = "" }: { children: React.ReactNode; className?: string }) { return <span className={\`inline-flex rounded-full bg-slate-100 px-3 py-1 text-sm dark:bg-slate-800 ${'${className}'}\`}>{children}</span>; }\n`,
    render:
      '  if (component.type === "badge") {\n    return <Badge>{String(component.props.label ?? component.id)}</Badge>;\n  }\n'
  },
  {
    type: 'alert',
    importName: 'Alert',
    importPath: '@/components/ui/alert',
    source: `export function Alert({ title, children }: { title: string; children: React.ReactNode }) { return <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-900"><p className="font-semibold">{title}</p><div>{children}</div></div>; }\n`,
    render:
      '  if (component.type === "alert") {\n    return <Alert title={String(component.props.title ?? "Notice")}>{String(component.props.content ?? component.id)}</Alert>;\n  }\n'
  },
  {
    type: 'input',
    importName: 'InputField',
    importPath: '@/components/ui/input-field',
    source: `export function InputField(props: React.InputHTMLAttributes<HTMLInputElement>) { return <input className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" {...props} />; }\n`,
    render:
      '  if (component.type === "input") {\n    return <InputField placeholder={String(component.props.placeholder ?? "Type here...")} />;\n  }\n'
  },
  {
    type: 'textarea',
    importName: 'TextareaField',
    importPath: '@/components/ui/textarea-field',
    source: `export function TextareaField(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) { return <textarea className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" {...props} />; }\n`,
    render:
      '  if (component.type === "textarea") {\n    return <TextareaField placeholder={String(component.props.placeholder ?? "Describe details...")} />;\n  }\n'
  },
  {
    type: 'select',
    importName: 'SelectField',
    importPath: '@/components/ui/select-field',
    source: `export function SelectField({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) { return <select className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" {...props}>{children}</select>; }\n`,
    render:
      '  if (component.type === "select") {\n    return <SelectField><option>Option A</option><option>Option B</option></SelectField>;\n  }\n'
  },
  {
    type: 'tabs',
    importName: 'Tabs',
    importPath: '@/components/ui/tabs',
    source: `export function Tabs({ labels }: { labels: string[] }) { return <div className="flex gap-2">{labels.map((label, idx) => <button key={label} className={idx === 0 ? "rounded-md bg-slate-900 px-3 py-1.5 text-white dark:bg-slate-100 dark:text-slate-900" : "rounded-md bg-slate-100 px-3 py-1.5 text-slate-700 dark:bg-slate-800 dark:text-slate-200"}>{label}</button>)}</div>; }\n`,
    render:
      '  if (component.type === "tabs") {\n    return <Tabs labels={["Overview", "Details", "Metrics"]} />;\n  }\n'
  }
];

export const defaultComponentTemplates: ComponentTemplate[] = [
  buttonComponentTemplate,
  cardComponentTemplate,
  ...simpleTemplates,
  chartComponentTemplate,
  tableComponentTemplate
];
