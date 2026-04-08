import type { ChartDataset, DataSourceConfig, TableDataset } from '@/lib/data/types';

export interface DataProvider {
  getChartData(config: DataSourceConfig, fallbackTitle: string): Promise<ChartDataset>;
  getTableData(config: DataSourceConfig, fallbackTitle: string): Promise<TableDataset>;
}

const mockCharts: Record<string, ChartDataset> = {
  revenueByMonth: {
    title: 'Revenue by month',
    points: [
      { label: 'Jan', value: 28 },
      { label: 'Feb', value: 62 },
      { label: 'Mar', value: 46 },
      { label: 'Apr', value: 80 },
      { label: 'May', value: 58 },
      { label: 'Jun', value: 70 }
    ]
  },
  empty: {
    title: 'No data yet',
    points: []
  }
};

const mockTables: Record<string, TableDataset> = {
  topCustomers: {
    title: 'Top customers',
    rows: [
      { id: '1', metric: 'Monthly Active Users', value: '42,130', trend: '+8.2%' },
      { id: '2', metric: 'Conversion Rate', value: '4.7%', trend: '+0.4%' },
      { id: '3', metric: 'Churn', value: '2.1%', trend: '-0.3%' }
    ]
  },
  empty: {
    title: 'No data yet',
    rows: []
  }
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const mockProvider: DataProvider = {
  async getChartData(config, fallbackTitle) {
    await wait(300);
    const key = config.mockKey ?? 'revenueByMonth';
    const data = mockCharts[key] ?? mockCharts.revenueByMonth;
    return { ...data, title: data.title || fallbackTitle };
  },
  async getTableData(config, fallbackTitle) {
    await wait(300);
    const key = config.mockKey ?? 'topCustomers';
    const data = mockTables[key] ?? mockTables.topCustomers;
    return { ...data, title: data.title || fallbackTitle };
  }
};

const parseChart = (json: unknown, fallbackTitle: string): ChartDataset => {
  if (typeof json !== 'object' || json === null) {
    return { title: fallbackTitle, points: [] };
  }
  const points = Array.isArray((json as { points?: unknown }).points)
    ? ((json as { points: unknown[] }).points
        .map((point) => {
          if (typeof point !== 'object' || point === null) {
            return null;
          }
          const label = (point as { label?: unknown }).label;
          const value = (point as { value?: unknown }).value;
          if (typeof label !== 'string' || typeof value !== 'number') {
            return null;
          }
          return { label, value };
        })
        .filter(Boolean) as ChartDataset['points'])
    : [];

  return {
    title:
      typeof (json as { title?: unknown }).title === 'string'
        ? ((json as { title: string }).title ?? fallbackTitle)
        : fallbackTitle,
    points
  };
};

const parseTable = (json: unknown, fallbackTitle: string): TableDataset => {
  if (typeof json !== 'object' || json === null) {
    return { title: fallbackTitle, rows: [] };
  }

  const rows = Array.isArray((json as { rows?: unknown }).rows)
    ? ((json as { rows: unknown[] }).rows
        .map((row, index) => {
          if (typeof row !== 'object' || row === null) {
            return null;
          }
          const metric = (row as { metric?: unknown }).metric;
          const value = (row as { value?: unknown }).value;
          const trend = (row as { trend?: unknown }).trend;
          if (
            typeof metric !== 'string' ||
            typeof value !== 'string' ||
            typeof trend !== 'string'
          ) {
            return null;
          }
          return { id: String(index + 1), metric, value, trend };
        })
        .filter(Boolean) as TableDataset['rows'])
    : [];

  return {
    title:
      typeof (json as { title?: unknown }).title === 'string'
        ? ((json as { title: string }).title ?? fallbackTitle)
        : fallbackTitle,
    rows
  };
};

export const realProvider: DataProvider = {
  async getChartData(config, fallbackTitle) {
    if (!config.endpoint) {
      return { title: fallbackTitle, points: [] };
    }
    const response = await fetch(config.endpoint, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Failed to load chart data (${response.status})`);
    }
    return parseChart((await response.json()) as unknown, fallbackTitle);
  },
  async getTableData(config, fallbackTitle) {
    if (!config.endpoint) {
      return { title: fallbackTitle, rows: [] };
    }
    const response = await fetch(config.endpoint, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Failed to load table data (${response.status})`);
    }
    return parseTable((await response.json()) as unknown, fallbackTitle);
  }
};

export const chooseProvider = (config: DataSourceConfig): DataProvider => {
  if (config.mode === 'real' && config.endpoint) {
    return realProvider;
  }
  return mockProvider;
};
