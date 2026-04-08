import { PipelineError, PIPELINE_ERROR_CODES } from '../error-codes.js';
import { LLMPlannerClient, type TokenUsage } from './client.js';
import {
  parseRawStructuredPlan,
  toUISchemaFromStructuredPlan,
  validateStructuredPlan
} from './schema.js';

export interface StructuredPlannerArtifact {
  provider: string;
  model: string;
  retries: number;
  token_usage: TokenUsage | null;
  failures: Array<{ provider: string; model: string; reason: string }>;
  raw_response: string;
  cleaned_json: unknown | null;
  validation: {
    success: boolean;
    issues: Array<{ path: string; message: string }>;
  };
}

export const runStructuredPlanner = async (
  prdMarkdown: string,
  options?: ConstructorParameters<typeof LLMPlannerClient>[0]
): Promise<{
  schema: ReturnType<typeof toUISchemaFromStructuredPlan>;
  artifact: StructuredPlannerArtifact;
}> => {
  const client = new LLMPlannerClient(options);

  let result;
  try {
    result = await client.planWithFallback(prdMarkdown);
  } catch (error) {
    throw new PipelineError(
      PIPELINE_ERROR_CODES.llm.allProvidersFailed,
      `[${PIPELINE_ERROR_CODES.llm.allProvidersFailed}] ${error instanceof Error ? error.message : String(error)}`,
      error
    );
  }

  let parsed: unknown;
  try {
    parsed = parseRawStructuredPlan(result.response.rawText);
  } catch (error) {
    throw new PipelineError(
      PIPELINE_ERROR_CODES.llm.jsonParseFailed,
      `[${PIPELINE_ERROR_CODES.llm.jsonParseFailed}] Unable to parse LLM output as JSON`,
      error
    );
  }

  const validation = validateStructuredPlan(parsed);
  if (!validation.success) {
    throw new PipelineError(
      PIPELINE_ERROR_CODES.llm.schemaValidateFailed,
      `[${PIPELINE_ERROR_CODES.llm.schemaValidateFailed}] Structured payload validation failed`,
      validation.issues
    );
  }

  let schema;
  try {
    schema = toUISchemaFromStructuredPlan(parsed);
  } catch (error) {
    throw new PipelineError(
      PIPELINE_ERROR_CODES.llm.transformToUiSchemaFailed,
      `[${PIPELINE_ERROR_CODES.llm.transformToUiSchemaFailed}] Unable to transform structured payload to UISchema`,
      error
    );
  }

  return {
    schema,
    artifact: {
      provider: result.response.provider,
      model: result.response.model,
      retries: result.retries,
      token_usage: result.response.tokenUsage ?? null,
      failures: result.failures,
      raw_response: result.response.rawText,
      cleaned_json: parsed,
      validation
    }
  };
};
