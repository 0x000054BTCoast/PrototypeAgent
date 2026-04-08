import { Card } from '@/components/ui/card';

const REPORTS = [
  { id: 'weekly-kpi', name: 'Weekly KPI', status: 'Ready' },
  { id: 'sales-pipeline', name: 'Sales Pipeline', status: 'Draft' },
  { id: 'cohort-retention', name: 'Cohort Retention', status: 'Ready' }
];

export default function ReportsPage() {
  return (
    <div className="grid grid-cols-1 gap-md">
      {REPORTS.map((report) => (
        <Card key={report.id}>
          <div className="flex items-center justify-between gap-md">
            <p className="text-base font-medium">{report.name}</p>
            <span className="rounded bg-surface-muted px-sm py-xs text-xs text-text-muted">
              {report.status}
            </span>
          </div>
        </Card>
      ))}
    </div>
  );
}
