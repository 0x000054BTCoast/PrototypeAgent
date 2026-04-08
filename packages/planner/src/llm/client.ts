import { parsePrdToSchema } from '../../../parser/src/index';
import { buildStructuredPlanningPrompt } from './prompt';

export interface TokenUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
}

export interface ProviderAttemptFailure {
  provider: string;
  model: string;
  reason: string;
}

export interface LLMProviderResponse {
  provider: string;
  model: string;
  rawText: string;
  tokenUsage?: TokenUsage;
}

interface ChatCompletionsResponse {
  usage?: TokenUsage;
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

type Transport = (url: string, init: RequestInit) => Promise<Response>;

export interface PlannerClientOptions {
  transport?: Transport;
  preferredProvider?: 'auto' | 'deepseek' | 'fallback' | 'local';
  deepseekApiKey?: string;
  deepseekModel?: string;
  fallbackApiKey?: string;
  fallbackModel?: string;
  fallbackBaseUrl?: string;
  allowLocalFallback?: boolean;
}

export interface LLMFallbackResult {
  response: LLMProviderResponse;
  failures: ProviderAttemptFailure[];
  retries: number;
}

const requestOpenAICompatible = async (
  transport: Transport,
  args: {
    baseUrl: string;
    apiKey: string;
    model: string;
    prompt: string;
    provider: string;
  }
): Promise<LLMProviderResponse> => {
  const endpoint = `${args.baseUrl.replace(/\/$/, '')}/chat/completions`;
  const res = await transport(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${args.apiKey}`
    },
    body: JSON.stringify({
      model: args.model,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: args.prompt }]
    })
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  const data = (await res.json()) as ChatCompletionsResponse;
  const content = data.choices?.[0]?.message?.content;
  if (!content || typeof content !== 'string') {
    throw new Error('empty_response_content');
  }

  return {
    provider: args.provider,
    model: args.model,
    rawText: content,
    tokenUsage: data.usage
  };
};

export class LLMPlannerClient {
  private readonly transport: Transport;

  private readonly options: PlannerClientOptions;

  constructor(options: PlannerClientOptions = {}) {
    this.transport = options.transport ?? fetch;
    this.options = options;
  }

  async planWithFallback(prdMarkdown: string): Promise<LLMFallbackResult> {
    const prompt = buildStructuredPlanningPrompt(prdMarkdown);
    const failures: ProviderAttemptFailure[] = [];

    const preferredProvider = this.options.preferredProvider ?? 'auto';
    const allowDeepseek = preferredProvider === 'auto' || preferredProvider === 'deepseek';
    const allowFallback = preferredProvider === 'auto' || preferredProvider === 'fallback';

    const deepseekApiKey = this.options.deepseekApiKey ?? process.env.DEEPSEEK_API_KEY;
    const deepseekModel =
      this.options.deepseekModel ?? process.env.DEEPSEEK_MODEL ?? 'deepseek-chat';

    if (allowDeepseek && deepseekApiKey) {
      try {
        const response = await requestOpenAICompatible(this.transport, {
          baseUrl: 'https://api.deepseek.com',
          apiKey: deepseekApiKey,
          model: deepseekModel,
          prompt,
          provider: 'deepseek'
        });
        return { response, failures, retries: failures.length };
      } catch (error) {
        failures.push({
          provider: 'deepseek',
          model: deepseekModel,
          reason: error instanceof Error ? error.message : String(error)
        });
      }
    } else if (allowDeepseek) {
      failures.push({ provider: 'deepseek', model: deepseekModel, reason: 'missing_api_key' });
    }

    const fallbackApiKey = this.options.fallbackApiKey ?? process.env.FALLBACK_LLM_API_KEY;
    const fallbackModel =
      this.options.fallbackModel ?? process.env.FALLBACK_LLM_MODEL ?? 'gpt-4o-mini';
    const fallbackBaseUrl =
      this.options.fallbackBaseUrl ??
      process.env.FALLBACK_LLM_BASE_URL ??
      'https://api.openai.com/v1';

    if (allowFallback && fallbackApiKey) {
      try {
        const response = await requestOpenAICompatible(this.transport, {
          baseUrl: fallbackBaseUrl,
          apiKey: fallbackApiKey,
          model: fallbackModel,
          prompt,
          provider: 'fallback'
        });
        return { response, failures, retries: failures.length };
      } catch (error) {
        failures.push({
          provider: 'fallback',
          model: fallbackModel,
          reason: error instanceof Error ? error.message : String(error)
        });
      }
    } else if (allowFallback) {
      failures.push({ provider: 'fallback', model: fallbackModel, reason: 'missing_api_key' });
    }

    if (preferredProvider === 'local' || (this.options.allowLocalFallback ?? true)) {
      const schema = parsePrdToSchema(prdMarkdown);
      return {
        response: {
          provider: 'local_parser_fallback',
          model: 'parsePrdToSchema',
          rawText: JSON.stringify(schema)
        },
        failures,
        retries: failures.length
      };
    }

    throw new Error(`all_providers_failed: ${JSON.stringify(failures)}`);
  }
}
