import { chooseProvider } from '@/lib/data/providers';
import type { ChartDataset, DataSourceConfig, TableDataset } from '@/lib/data/types';

export class TypedDataClient {
  async fetchChartData(config: DataSourceConfig, title: string): Promise<ChartDataset> {
    const provider = chooseProvider(config);
    return provider.getChartData(config, title);
  }

  async fetchTableData(config: DataSourceConfig, title: string): Promise<TableDataset> {
    const provider = chooseProvider(config);
    return provider.getTableData(config, title);
  }
}

export const typedDataClient = new TypedDataClient();
