export type DataKind = 'chart' | 'table';

export interface ChartPoint {
  label: string;
  value: number;
}

export interface ChartDataset {
  title: string;
  points: ChartPoint[];
}

export interface TableRow {
  id: string;
  metric: string;
  value: string;
  trend: string;
}

export interface TableDataset {
  title: string;
  rows: TableRow[];
}

export type DataSourceMode = 'mock' | 'real';

export interface DataSourceConfig {
  mode?: DataSourceMode;
  endpoint?: string;
  mockKey?: string;
}
