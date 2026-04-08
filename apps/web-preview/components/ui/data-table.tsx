'use client';

import { useTableQuery } from '@/lib/data/hooks';
import type { UIComponent } from '@/lib/types';

export function DataTable({ component }: { component: UIComponent }) {
  const { data, isLoading, error } = useTableQuery(component);
  const title = data?.title ?? String(component.props.title ?? component.id);

  return (
    <div className="space-y-sm">
      <p className="text-sm font-medium">{title}</p>
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-surface-muted">
            <tr>
              <th className="px-sm py-xs font-medium">Metric</th>
              <th className="px-sm py-xs font-medium">Value</th>
              <th className="px-sm py-xs font-medium">Trend</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr className="border-t border-border">
                <td className="px-sm py-sm text-text-muted" colSpan={3}>
                  Loading table data...
                </td>
              </tr>
            )}
            {error && !isLoading && (
              <tr className="border-t border-border">
                <td className="px-sm py-sm text-red-700" colSpan={3}>
                  Failed to load table: {error}
                </td>
              </tr>
            )}
            {!isLoading && !error && data?.rows.length === 0 && (
              <tr className="border-t border-border">
                <td className="px-sm py-sm text-text-muted" colSpan={3}>
                  Empty table data.
                </td>
              </tr>
            )}
            {!isLoading &&
              !error &&
              data?.rows.map((row) => (
                <tr key={row.id} className="border-t border-border">
                  <td className="px-sm py-xs">{row.metric}</td>
                  <td className="px-sm py-xs">{row.value}</td>
                  <td className="px-sm py-xs text-text-muted">{row.trend}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
