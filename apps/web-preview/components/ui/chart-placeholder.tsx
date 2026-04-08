'use client';

import { useChartQuery } from '@/lib/data/hooks';
import type { UIComponent } from '@/lib/types';

export function ChartPlaceholder({ component }: { component: UIComponent }) {
  const { data, isLoading, error } = useChartQuery(component);
  const title = data?.title ?? String(component.props.title ?? component.id);

  if (isLoading) {
    return (
      <div className="space-y-sm">
        <p className="text-sm font-medium">{title}</p>
        <div className="flex h-40 items-center justify-center rounded-md border border-dashed border-border text-xs text-text-muted">
          Loading chart data...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-sm">
        <p className="text-sm font-medium">{title}</p>
        <div className="rounded-md border border-red-300 bg-red-50 p-sm text-xs text-red-700">
          Failed to load chart: {error}
        </div>
      </div>
    );
  }

  if (!data || data.points.length === 0) {
    return (
      <div className="space-y-sm">
        <p className="text-sm font-medium">{title}</p>
        <div className="flex h-40 items-center justify-center rounded-md border border-border text-xs text-text-muted">
          Empty chart data.
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...data.points.map((point) => point.value), 1);

  return (
    <div className="space-y-sm">
      <p className="text-sm font-medium">{title}</p>
      <div className="flex h-40 items-end gap-sm">
        {data.points.map((point) => (
          <div key={point.label} className="flex flex-1 flex-col items-center gap-xs">
            <div
              className="w-full rounded-t-sm bg-gradient-to-t from-accent-from to-accent-to"
              style={{ height: `${Math.max((point.value / maxValue) * 100, 6)}%` }}
            />
            <span className="text-xs text-text-muted">{point.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
