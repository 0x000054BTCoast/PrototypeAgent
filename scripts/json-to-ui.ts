import fs from "node:fs";
import path from "node:path";
import { UISchema } from "./types.js";

const ensureDir = (dirPath: string): void => {
  fs.mkdirSync(dirPath, { recursive: true });
};

const write = (relativePath: string, content: string): void => {
  const target = path.resolve("frontend", relativePath);
  ensureDir(path.dirname(target));
  fs.writeFileSync(target, content);
};

const templatePage = (schema: UISchema): string => `import { RenderSchema } from "@/components/render-schema";
import schema from "@/lib/structure.json";

export default function Page() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100 md:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-6 text-2xl font-semibold capitalize">${schema.page_name.replace(/_/g, " ")}</h1>
        <RenderSchema schema={schema} />
      </div>
    </main>
  );
}
`;

const renderer = `"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChartPlaceholder } from "@/components/ui/chart-placeholder";
import { DataTable } from "@/components/ui/data-table";
import type { UISchema, UIComponent } from "@/lib/types";

const renderComponent = (component: UIComponent) => {
  if (component.type === "chart") {
    return <ChartPlaceholder title={String(component.props.title ?? component.id)} />;
  }

  if (component.type === "table") {
    return <DataTable title={String(component.props.title ?? component.id)} />;
  }

  if (component.type === "button") {
    return <Button>{String(component.props.label ?? "Action")}</Button>;
  }

  if (component.type === "card") {
    return (
      <Card className="p-4">
        <p className="text-base font-medium">{String(component.props.title ?? component.id)}</p>
      </Card>
    );
  }

  return <p className="text-sm text-slate-600 dark:text-slate-300">{String(component.props.content ?? component.id)}</p>;
};

export function RenderSchema({ schema }: { schema: UISchema }) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {schema.sections.map((section) => (
        <section key={section.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-12">
          <h2 className="mb-4 text-lg font-semibold capitalize">{section.name.replaceAll("_", " ")}</h2>
          <div className="space-y-4">
            {section.components.map((component) => (
              <div key={component.id} className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/40">
                {renderComponent(component)}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
`;

const button = `import * as React from "react";

export function Button({ className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={\`inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 \${className}\`}
      {...props}
    />
  );
}
`;

const card = `import * as React from "react";

export function Card({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={\`rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 \${className}\`} {...props} />;
}
`;

const chart = `export function ChartPlaceholder({ title }: { title: string }) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">{title}</p>
      <div className="flex h-40 items-end gap-2">
        {[28, 62, 46, 80, 58, 70].map((height, index) => (
          <div key={index} className="flex-1 rounded-t-md bg-gradient-to-t from-blue-500 to-cyan-400" style={{ height: \`\${height}%\` }} />
        ))}
      </div>
    </div>
  );
}
`;

const table = `import { mockRows } from "@/lib/mock-data";

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
`;

const types = `export type Position = "top" | "left" | "center" | "right" | "bottom";

export interface UIComponent {
  id: string;
  type: "chart" | "table" | "button" | "card" | "text";
  props: Record<string, unknown>;
  style: Record<string, unknown>;
  children: UIComponent[];
}

export interface UISection {
  id: string;
  name: string;
  position: Position;
  components: UIComponent[];
}

export interface UISchema {
  page_name: string;
  layout: {
    type: "grid";
    columns: 24;
  };
  sections: UISection[];
  interactions: Array<Record<string, unknown>>;
}
`;

const layout = `import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PRD2PROTOTYPE",
  description: "Structured generative UI engine"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
`;

const globals = `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: light dark;
}

body {
  font-family: Inter, Arial, sans-serif;
}
`;

const mockData = `export const mockRows = [
  { metric: "Monthly Active Users", value: "42,130", trend: "+8.2%" },
  { metric: "Conversion Rate", value: "4.7%", trend: "+0.4%" },
  { metric: "Churn", value: "2.1%", trend: "-0.3%" }
];
`;

const nextConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true
};

export default nextConfig;
`;

const pkg = `{
  "name": "frontend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "15.3.1",
    "react": "19.1.0",
    "react-dom": "19.1.0"
  },
  "devDependencies": {
    "typescript": "5.8.3",
    "tailwindcss": "3.4.17",
    "postcss": "8.5.3",
    "autoprefixer": "10.4.21",
    "@types/react": "19.1.2",
    "@types/react-dom": "19.1.2",
    "@types/node": "22.15.3"
  }
}
`;

const tailwindConfig = `import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {}
  },
  plugins: []
};

export default config;
`;

const postcss = `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
};
`;

export const generateFrontend = (schema: UISchema): void => {
  write("app/page.tsx", templatePage(schema));
  write("app/layout.tsx", layout);
  write("app/globals.css", globals);
  write("components/render-schema.tsx", renderer);
  write("components/ui/button.tsx", button);
  write("components/ui/card.tsx", card);
  write("components/ui/chart-placeholder.tsx", chart);
  write("components/ui/data-table.tsx", table);
  write("lib/mock-data.ts", mockData);
  write("lib/types.ts", types);
  write("lib/structure.json", `${JSON.stringify(schema, null, 2)}\n`);
  write("next.config.mjs", nextConfig);
  write("tailwind.config.ts", tailwindConfig);
  write("postcss.config.mjs", postcss);
  write("package.json", pkg);
  write(
    "tsconfig.json",
    JSON.stringify(
      {
        compilerOptions: {
          target: "ES2022",
          lib: ["dom", "dom.iterable", "esnext"],
          strict: true,
          noEmit: true,
          module: "esnext",
          moduleResolution: "bundler",
          resolveJsonModule: true,
          isolatedModules: true,
          jsx: "preserve",
          incremental: true,
          baseUrl: ".",
          paths: {
            "@/*": ["./*"]
          }
        },
        include: ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
        exclude: ["node_modules"]
      },
      null,
      2
    ) + "\n"
  );
  write("next-env.d.ts", `/// <reference types=\"next\" />\n/// <reference types=\"next/image-types/global\" />\n\n// This file is auto-generated by Next.js\n`);
};

if (process.argv[1]?.endsWith("json-to-ui.ts")) {
  const schema = JSON.parse(fs.readFileSync(path.resolve("output/structure.json"), "utf8")) as UISchema;
  generateFrontend(schema);
}
