import { chooseProvider } from '@/lib/data/providers';
import type { ChartDataset, DataSourceConfig, RunsResponse, TableDataset } from '@/lib/data/types';

export class TypedDataClient {
  async fetchChartData(config: DataSourceConfig, title: string): Promise<ChartDataset> {
    const provider = chooseProvider(config);
    return provider.getChartData(config, title);
  }

  async fetchTableData(config: DataSourceConfig, title: string): Promise<TableDataset> {
    const provider = chooseProvider(config);
    return provider.getTableData(config, title);
  }

  async fetchRuns(): Promise<RunsResponse> {
    const response = await fetch('/api/runs', { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Failed to load runs (${response.status})`);
    }
    return (await response.json()) as RunsResponse;
  }

  async resolveRunId(runId?: string): Promise<string | null> {
    if (runId) {
      return runId;
    }
    const payload = await this.fetchRuns();
    return payload.latestRunId ?? payload.runs[0]?.id ?? null;
  }

  async fetchRunArtifact(relativePath: string, runId?: string): Promise<string> {
    const resolvedRunId = await this.resolveRunId(runId);
    if (!resolvedRunId) {
      throw new Error('No runs available');
    }

    const response = await fetch(`/api/runs/${resolvedRunId}/artifacts/${relativePath}`, {
      cache: 'no-store'
    });
    if (!response.ok) {
      throw new Error(`Failed to load run artifact (${response.status})`);
    }
    return response.text();
  }
}

export const typedDataClient = new TypedDataClient();
