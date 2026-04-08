import { randomUUID } from "node:crypto";
import { performance } from "node:perf_hooks";

export type LogLevel = "INFO" | "ERROR";

export interface StructuredLogEvent {
  timestamp: string;
  level: LogLevel;
  trace_id: string;
  phase: string;
  duration_ms: number | null;
  error_code: string | null;
  message: string;
  metadata?: Record<string, unknown>;
}

interface LoggerOptions {
  traceId?: string;
}

interface StageContext {
  phase: string;
  startedAt: number;
}

export const createTraceId = (): string => randomUUID();

export const createStructuredLogger = (options: LoggerOptions = {}) => {
  const traceId = options.traceId ?? createTraceId();
  const events: StructuredLogEvent[] = [];

  const pushEvent = (event: Omit<StructuredLogEvent, "timestamp" | "trace_id">): void => {
    events.push({
      timestamp: new Date().toISOString(),
      trace_id: traceId,
      ...event
    });
  };

  const startPhase = (phase: string, metadata?: Record<string, unknown>): StageContext => {
    pushEvent({
      level: "INFO",
      phase,
      duration_ms: null,
      error_code: null,
      message: "phase_started",
      metadata
    });

    return {
      phase,
      startedAt: performance.now()
    };
  };

  const endPhase = (context: StageContext, metadata?: Record<string, unknown>): number => {
    const durationMs = Number((performance.now() - context.startedAt).toFixed(2));
    pushEvent({
      level: "INFO",
      phase: context.phase,
      duration_ms: durationMs,
      error_code: null,
      message: "phase_completed",
      metadata
    });
    return durationMs;
  };

  const failPhase = (
    context: StageContext,
    errorCode: string,
    error: unknown,
    metadata?: Record<string, unknown>
  ): number => {
    const durationMs = Number((performance.now() - context.startedAt).toFixed(2));
    pushEvent({
      level: "ERROR",
      phase: context.phase,
      duration_ms: durationMs,
      error_code: errorCode,
      message: error instanceof Error ? error.message : String(error),
      metadata
    });
    return durationMs;
  };

  const info = (phase: string, message: string, metadata?: Record<string, unknown>): void => {
    pushEvent({
      level: "INFO",
      phase,
      duration_ms: null,
      error_code: null,
      message,
      metadata
    });
  };

  const error = (
    phase: string,
    message: string,
    errorCode: string,
    metadata?: Record<string, unknown>
  ): void => {
    pushEvent({
      level: "ERROR",
      phase,
      duration_ms: null,
      error_code: errorCode,
      message,
      metadata
    });
  };

  return {
    traceId,
    events,
    startPhase,
    endPhase,
    failPhase,
    info,
    error
  };
};
