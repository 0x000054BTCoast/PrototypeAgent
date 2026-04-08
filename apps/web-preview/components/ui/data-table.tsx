import { mockRows } from "@/lib/mock-data";

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
