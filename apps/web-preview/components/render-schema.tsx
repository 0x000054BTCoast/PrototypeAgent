'use client';

import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChartPlaceholder } from '@/components/ui/chart-placeholder';
import { DataTable } from '@/components/ui/data-table';
import { InputField } from '@/components/ui/input-field';
import { SelectField } from '@/components/ui/select-field';
import { Tabs } from '@/components/ui/tabs';
import { TextareaField } from '@/components/ui/textarea-field';
import { asSize, asState } from '@/components/ui/style-system';
import type { UISchema, UIComponent } from '@/lib/types';

const textOf = (value: unknown, fallback: string) => (typeof value === 'string' ? value : fallback);

const renderComponent = (component: UIComponent) => {
  const size = asSize(component.props.size);
  const state = asState(component.props.state);

  if (component.type === 'chart') {
    return <ChartPlaceholder component={component} />;
  }

  if (component.type === 'table') {
    return <DataTable component={component} />;
  }

  if (component.type === 'button') {
    return (
      <Button
        variant={component.props.variant as 'primary' | 'secondary' | 'ghost' | 'danger'}
        size={size}
        state={state}
        slots={{
          leading: component.props.leadingSlot ? (
            <span>{String(component.props.leadingSlot)}</span>
          ) : undefined,
          trailing: component.props.trailingSlot ? (
            <span>{String(component.props.trailingSlot)}</span>
          ) : undefined
        }}
      >
        {String(component.props.label ?? 'Action')}
      </Button>
    );
  }

  if (component.type === 'card') {
    return (
      <Card
        variant={component.props.variant as 'elevated' | 'outline' | 'filled'}
        size={size}
        state={state}
        slots={{
          header: component.props.headerSlot ? (
            <p className="text-xs uppercase tracking-wide text-text-muted">
              {String(component.props.headerSlot)}
            </p>
          ) : undefined,
          footer: component.props.footerSlot ? (
            <p className="text-xs text-text-muted">{String(component.props.footerSlot)}</p>
          ) : undefined
        }}
      >
        <p className="text-base font-medium">{String(component.props.title ?? component.id)}</p>
      </Card>
    );
  }

  if (component.type === 'badge') {
    return (
      <Badge
        variant={component.props.variant as 'neutral' | 'info' | 'success' | 'warning'}
        size={size}
        state={state}
      >
        {textOf(component.props.label, component.id)}
      </Badge>
    );
  }

  if (component.type === 'alert') {
    return (
      <Alert
        variant={component.props.variant as 'info' | 'success' | 'warning' | 'error'}
        size={size}
        state={state}
        title={textOf(component.props.title, 'Notice')}
      >
        {textOf(component.props.content, component.id)}
      </Alert>
    );
  }

  if (component.type === 'input') {
    return (
      <InputField
        variant={component.props.variant as 'outline' | 'filled'}
        size={size}
        state={state}
        placeholder={textOf(component.props.placeholder, 'Type here...')}
      />
    );
  }

  if (component.type === 'textarea') {
    return (
      <TextareaField
        variant={component.props.variant as 'outline' | 'filled'}
        size={size}
        state={state}
        placeholder={textOf(component.props.placeholder, 'Describe details...')}
      />
    );
  }

  if (component.type === 'select') {
    const options = Array.isArray(component.props.options)
      ? component.props.options
      : ['Option A', 'Option B'];
    return (
      <SelectField
        variant={component.props.variant as 'outline' | 'filled'}
        size={size}
        state={state}
        defaultValue={String(options[0])}
      >
        {options.map((item) => (
          <option key={String(item)} value={String(item)}>
            {String(item)}
          </option>
        ))}
      </SelectField>
    );
  }

  if (component.type === 'tabs') {
    const labels = Array.isArray(component.props.labels)
      ? component.props.labels.map((value) => String(value))
      : ['Overview', 'Details', 'Metrics'];
    return (
      <Tabs
        labels={labels}
        variant={component.props.variant as 'line' | 'pills'}
        size={size}
        state={state}
      />
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
