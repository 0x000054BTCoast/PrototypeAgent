'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChartPlaceholder } from '@/components/ui/chart-placeholder';
import { DataTable } from '@/components/ui/data-table';
import type { UISchema, UIComponent } from '@/lib/types';

const renderComponent = (component: UIComponent) => {
  if (component.type === 'chart') {
    return <ChartPlaceholder title={String(component.props.title ?? component.id)} />;
  }

  if (component.type === 'table') {
    return <DataTable title={String(component.props.title ?? component.id)} />;
  }

  if (component.type === 'button') {
    return <Button>{String(component.props.label ?? 'Action')}</Button>;
  }

  if (component.type === 'card') {
    return (
      <Card className="p-4">
        <p className="text-base font-medium">{String(component.props.title ?? component.id)}</p>
      </Card>
    );
  }

  return (
    <p className="text-sm text-text-muted">{String(component.props.content ?? component.id)}</p>
  );
};

export function RenderSchema({ schema }: { schema: UISchema }) {
  return (
    <div className="grid grid-cols-1 gap-lg lg:grid-cols-12">
      {schema.sections.map((section) => (
        <section
          key={section.id}
          className="rounded-xl border border-border bg-surface p-lg shadow-sm lg:col-span-12"
        >
          <h2 className="mb-md text-lg font-semibold capitalize">
            {section.name.replaceAll('_', ' ')}
          </h2>
          <div className="space-y-md">
            {section.components.map((component) => (
              <div key={component.id} className="rounded-lg bg-surface-muted p-md">
                {renderComponent(component)}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
