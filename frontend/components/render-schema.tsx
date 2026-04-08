"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChartPlaceholder } from "@/components/ui/chart-placeholder";
import { DataTable } from "@/components/ui/data-table";
import type { UISchema, UIComponent } from "@/lib/types";

const renderComponent = (component: UIComponent) => {
  if (component.type === "chart") return <ChartPlaceholder title={String(component.props.title ?? component.id)} />;
  if (component.type === "table") return <DataTable title={String(component.props.title ?? component.id)} />;
  if (component.type === "button") return <Button>{String(component.props.label ?? "Action")}</Button>;
  if (component.type === "card") {
    return (
      <Card className="p-4">
        <p>{String(component.props.title ?? component.id)}</p>
      </Card>
    );
  }
  return <p>{String(component.props.content ?? component.id)}</p>;
};

export function RenderSchema({ schema }: { schema: UISchema }) {
  return (
    <div className="grid grid-cols-1 gap-6">
      {schema.sections.map((section) => (
        <section key={section.id} className="rounded-2xl border bg-white p-6 shadow-sm dark:bg-slate-900">
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
