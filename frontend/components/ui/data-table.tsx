import { mockRows } from "@/lib/mock-data";

export function DataTable({ title }: { title: string }) {
  return (
    <div>
      <p className="text-sm font-medium">{title}</p>
      <table className="mt-3 min-w-full text-left text-sm">
        <thead>
          <tr>
            <th>Metric</th>
            <th>Value</th>
            <th>Trend</th>
          </tr>
        </thead>
        <tbody>
          {mockRows.map((row) => (
            <tr key={row.metric}>
              <td>{row.metric}</td>
              <td>{row.value}</td>
              <td>{row.trend}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
