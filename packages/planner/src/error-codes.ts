export const PIPELINE_ERROR_CODES = {
  parser: {
    readInputFailed: "PARSER_READ_INPUT_FAILED",
    parseFailed: "PARSER_PARSE_FAILED"
  },
  schema: {
    serializeFailed: "SCHEMA_SERIALIZE_FAILED",
    deserializeFailed: "SCHEMA_DESERIALIZE_FAILED",
    validateFailed: "SCHEMA_VALIDATE_FAILED"
  },
  codegen: {
    uiGenerationFailed: "CODEGEN_UI_GENERATION_FAILED",
    svgExportFailed: "CODEGEN_SVG_EXPORT_FAILED",
    htmlExportFailed: "CODEGEN_HTML_EXPORT_FAILED"
  },
  qa: {
    outputMissing: "QA_OUTPUT_MISSING",
    stageRetryExhausted: "QA_STAGE_RETRY_EXHAUSTED",
    executionFailed: "QA_PIPELINE_EXECUTION_FAILED"
  }
} as const;

export type PipelineErrorCode =
  (typeof PIPELINE_ERROR_CODES)[keyof typeof PIPELINE_ERROR_CODES][keyof (typeof PIPELINE_ERROR_CODES)[keyof typeof PIPELINE_ERROR_CODES]];

export class PipelineError extends Error {
  readonly code: PipelineErrorCode;

  readonly cause: unknown;

  constructor(code: PipelineErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = "PipelineError";
    this.code = code;
    this.cause = cause;
  }
}

export const asPipelineError = (
  code: PipelineErrorCode,
  message: string,
  cause: unknown
): PipelineError => {
  if (cause instanceof PipelineError) {
    return cause;
  }
  return new PipelineError(code, message, cause);
};
