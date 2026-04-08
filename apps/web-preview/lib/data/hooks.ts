'use client';

import { useEffect, useMemo, useState } from 'react';

import { typedDataClient } from '@/lib/data/client';
import type { ChartDataset, DataSourceConfig, TableDataset } from '@/lib/data/types';
import type { UIComponent } from '@/lib/types';

const parseDataSource = (component: UIComponent): DataSourceConfig => {
  const raw = component.props.dataSource;
  if (typeof raw !== 'object' || raw === null) {
    return { mode: 'mock' };
  }

  const source = raw as {
    mode?: unknown;
    endpoint?: unknown;
    mockKey?: unknown;
    runId?: unknown;
  };

  return {
    mode: source.mode === 'real' ? 'real' : 'mock',
    endpoint: typeof source.endpoint === 'string' ? source.endpoint : undefined,
    mockKey: typeof source.mockKey === 'string' ? source.mockKey : undefined,
    runId: typeof source.runId === 'string' ? source.runId : undefined
  };
};

interface QueryState<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
}

export function useChartQuery(component: UIComponent) {
  const config = useMemo(() => parseDataSource(component), [component]);
  const [state, setState] = useState<QueryState<ChartDataset>>({
    data: null,
    error: null,
    isLoading: true
  });

  useEffect(() => {
    let isMounted = true;
    setState((previous) => ({ ...previous, isLoading: true, error: null }));

    typedDataClient
      .fetchChartData(config, String(component.props.title ?? component.id))
      .then((data) => {
        if (!isMounted) {
          return;
        }
        setState({ data, error: null, isLoading: false });
      })
      .catch((error: unknown) => {
        if (!isMounted) {
          return;
        }
        setState({
          data: null,
          error: error instanceof Error ? error.message : 'Unknown error',
          isLoading: false
        });
      });

    return () => {
      isMounted = false;
    };
  }, [component.id, component.props.title, config]);

  return state;
}

export function useTableQuery(component: UIComponent) {
  const config = useMemo(() => parseDataSource(component), [component]);
  const [state, setState] = useState<QueryState<TableDataset>>({
    data: null,
    error: null,
    isLoading: true
  });

  useEffect(() => {
    let isMounted = true;
    setState((previous) => ({ ...previous, isLoading: true, error: null }));

    typedDataClient
      .fetchTableData(config, String(component.props.title ?? component.id))
      .then((data) => {
        if (!isMounted) {
          return;
        }
        setState({ data, error: null, isLoading: false });
      })
      .catch((error: unknown) => {
        if (!isMounted) {
          return;
        }
        setState({
          data: null,
          error: error instanceof Error ? error.message : 'Unknown error',
          isLoading: false
        });
      });

    return () => {
      isMounted = false;
    };
  }, [component.id, component.props.title, config]);

  return state;
}

export function useRunArtifact(relativePath: string, runId?: string) {
  const [state, setState] = useState<QueryState<string>>({
    data: null,
    error: null,
    isLoading: true
  });

  useEffect(() => {
    let isMounted = true;
    setState((previous) => ({ ...previous, isLoading: true, error: null }));

    typedDataClient
      .fetchRunArtifact(relativePath, runId)
      .then((data) => {
        if (!isMounted) {
          return;
        }
        setState({ data, error: null, isLoading: false });
      })
      .catch((error: unknown) => {
        if (!isMounted) {
          return;
        }
        setState({
          data: null,
          error: error instanceof Error ? error.message : 'Unknown error',
          isLoading: false
        });
      });

    return () => {
      isMounted = false;
    };
  }, [relativePath, runId]);

  return state;
}
