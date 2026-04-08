import { mockRows } from '@/lib/mock-data';

export function DataTable({ title }: { title: string }) {
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
            {mockRows.map((row) => (
              <tr key={row.metric} className="border-t border-border">
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
