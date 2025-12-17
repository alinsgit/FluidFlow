import { AIProvider, ProviderConfig, GenerationRequest, GenerationResponse, StreamChunk, ModelOption } from '../types';
import { fetchWithTimeout, TIMEOUT_TEST_CONNECTION, TIMEOUT_GENERATE, TIMEOUT_LIST_MODELS } from '../utils/fetchWithTimeout';
import { prepareJsonRequest } from '../utils/jsonOutput';
import { throwIfNotOk } from '../utils/errorHandling';
import { processSSEStream, createEstimatedUsage } from '../utils/streamParser';

// Cerebras uses OpenAI-compatible API
interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
  stream_options?: { include_usage: boolean };
}

interface CerebrasModel {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

/**
 * Cerebras AI Provider
 * Uses OpenAI-compatible chat completions API
 * Known for extremely fast inference (~2000-3000 tokens/sec)
 */
export class CerebrasProvider implements AIProvider {
  readonly config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetchWithTimeout(`${this.config.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        timeout: TIMEOUT_TEST_CONNECTION,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Connection failed' };
    }
  }

  async generate(request: GenerationRequest, model: string): Promise<GenerationResponse> {
    const messages: ChatMessage[] = [];

    // Use unified JSON output handling
    const jsonRequest = request.responseFormat === 'json'
      ? prepareJsonRequest(this.config.type, request.systemInstruction || '', request.responseSchema)
      : null;

    const systemContent = jsonRequest?.systemInstruction ?? request.systemInstruction ?? '';

    if (systemContent) {
      messages.push({ role: 'system', content: systemContent });
    }

    // Add conversation history if present
    if (request.conversationHistory && request.conversationHistory.length > 0) {
      for (const msg of request.conversationHistory) {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      }
    }

    // Add user message (Cerebras doesn't support vision)
    messages.push({ role: 'user', content: request.prompt });

    const body: ChatCompletionRequest = {
      model,
      messages,
      max_tokens: request.maxTokens || 8192,
      temperature: request.temperature ?? 0.7,
    };

    const response = await fetchWithTimeout(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
        ...this.config.headers,
      },
      body: JSON.stringify(body),
      timeout: TIMEOUT_GENERATE,
    });

    await throwIfNotOk(response, 'cerebras');

    const data = await response.json();

    return {
      text: data.choices[0]?.message?.content || '',
      finishReason: data.choices[0]?.finish_reason,
      usage: {
        inputTokens: data.usage?.prompt_tokens,
        outputTokens: data.usage?.completion_tokens,
      }
    };
  }

  async generateStream(
    request: GenerationRequest,
    model: string,
    onChunk: (chunk: StreamChunk) => void
  ): Promise<GenerationResponse> {
    const messages: ChatMessage[] = [];

    // Use unified JSON output handling
    const jsonRequest = request.responseFormat === 'json'
      ? prepareJsonRequest(this.config.type, request.systemInstruction || '', request.responseSchema)
      : null;

    const systemContent = jsonRequest?.systemInstruction ?? request.systemInstruction ?? '';

    if (systemContent) {
      messages.push({ role: 'system', content: systemContent });
    }

    // Add conversation history if present
    if (request.conversationHistory && request.conversationHistory.length > 0) {
      for (const msg of request.conversationHistory) {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      }
    }

    // Add user message
    messages.push({ role: 'user', content: request.prompt });

    const body: ChatCompletionRequest = {
      model,
      messages,
      max_tokens: request.maxTokens || 8192,
      temperature: request.temperature ?? 0.7,
      stream: true,
      stream_options: { include_usage: true },
    };

    const response = await fetchWithTimeout(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
        ...this.config.headers,
      },
      body: JSON.stringify(body),
      timeout: TIMEOUT_GENERATE,
    });

    await throwIfNotOk(response, 'cerebras');

    // Use unified SSE stream parser (OpenAI-compatible format)
    const { fullText, usage } = await processSSEStream(response, {
      format: 'openai',
      onChunk,
    });

    // If no usage from API, estimate tokens
    if (!usage) {
      const estimated = createEstimatedUsage(JSON.stringify(messages), fullText);
      return { text: fullText, usage: estimated };
    }

    return { text: fullText, usage };
  }

  async listModels(): Promise<ModelOption[]> {
    const response = await fetchWithTimeout(`${this.config.baseUrl}/models`, {
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      timeout: TIMEOUT_LIST_MODELS,
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();

    return (data.data || []).map((m: CerebrasModel) => ({
      id: m.id,
      name: m.id,
      description: `Cerebras ${m.id}`,
      supportsVision: false,
      supportsStreaming: true,
    }));
  }
}
