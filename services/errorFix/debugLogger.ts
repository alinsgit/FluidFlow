/**
 * AutoFix Debug Logger
 *
 * Comprehensive logging system for debugging the AutoFix pipeline.
 * Tracks all AI requests, responses, strategies, and timing.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'success';
export type LogCategory =
  | 'analyze'
  | 'local-fix'
  | 'ai-request'
  | 'ai-response'
  | 'strategy'
  | 'validation'
  | 'apply'
  | 'timing';

export interface AutoFixLogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  category: LogCategory;
  title: string;
  message: string;
  details?: Record<string, unknown>;
  duration?: number;
  code?: string;
  truncated?: boolean;
}

export interface AIRequestLog {
  id: string;
  timestamp: Date;
  strategy: string;
  prompt: string;
  systemInstruction?: string;
  model: string;
  targetFile: string;
  errorMessage: string;
  contextFiles?: string[];
}

export interface AIResponseLog {
  id: string;
  requestId: string;
  timestamp: Date;
  success: boolean;
  response?: string;
  error?: string;
  duration: number;
  tokenEstimate?: number;
}

class AutoFixDebugLogger {
  private logs: AutoFixLogEntry[] = [];
  private aiRequests: AIRequestLog[] = [];
  private aiResponses: AIResponseLog[] = [];
  private listeners: Set<(entry: AutoFixLogEntry) => void> = new Set();
  private maxLogs = 500;
  private enabled = true;
  private sessionId = '';
  private sessionStartTime = 0;

  // ============================================================================
  // Session Management
  // ============================================================================

  startSession(errorMessage: string, targetFile: string): string {
    this.sessionId = `session-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    this.sessionStartTime = Date.now();

    this.log('info', 'analyze', '🚀 AutoFix Session Started', {
      message: `Fixing: ${errorMessage.slice(0, 100)}${errorMessage.length > 100 ? '...' : ''}`,
      details: {
        sessionId: this.sessionId,
        targetFile,
        errorLength: errorMessage.length,
      }
    });

    return this.sessionId;
  }

  endSession(success: boolean, summary: string): void {
    const duration = Date.now() - this.sessionStartTime;

    this.log(
      success ? 'success' : 'error',
      'timing',
      success ? '✅ Session Complete' : '❌ Session Failed',
      {
        message: summary,
        details: {
          sessionId: this.sessionId,
          totalDuration: `${(duration / 1000).toFixed(2)}s`,
          totalLogs: this.logs.filter(l => l.id.startsWith(this.sessionId)).length,
          aiRequests: this.aiRequests.length,
        },
        duration,
      }
    );
  }

  // ============================================================================
  // Logging Methods
  // ============================================================================

  log(
    level: LogLevel,
    category: LogCategory,
    title: string,
    options: {
      message: string;
      details?: Record<string, unknown>;
      duration?: number;
      code?: string;
    }
  ): AutoFixLogEntry {
    const entry: AutoFixLogEntry = {
      id: `${this.sessionId}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      timestamp: new Date(),
      level,
      category,
      title,
      message: options.message,
      details: options.details,
      duration: options.duration,
      code: options.code ? this.truncateCode(options.code) : undefined,
      truncated: options.code ? options.code.length > 500 : false,
    };

    this.logs.push(entry);
    this.trimLogs();
    this.notifyListeners(entry);

    // Console output for development
    if (this.enabled) {
      const color = this.getConsoleColor(level);
      const prefix = `[AutoFix:${category}]`;
      console.log(
        `%c${prefix} ${title}`,
        color,
        options.message,
        options.details || ''
      );
    }

    return entry;
  }

  // Strategy logging
  logStrategy(strategy: string, status: 'start' | 'success' | 'fail', message: string): void {
    this.log(
      status === 'success' ? 'success' : status === 'fail' ? 'warn' : 'info',
      'strategy',
      `Strategy: ${strategy}`,
      {
        message: `${status.toUpperCase()} - ${message}`,
        details: { strategy, status },
      }
    );
  }

  // Local fix logging
  logLocalFix(fixType: string, success: boolean, description: string, codeSnippet?: string): void {
    this.log(
      success ? 'success' : 'debug',
      'local-fix',
      success ? `✓ Local Fix: ${fixType}` : `○ Tried: ${fixType}`,
      {
        message: description,
        details: { fixType, success },
        code: codeSnippet,
      }
    );
  }

  // AI Request logging
  logAIRequest(request: Omit<AIRequestLog, 'id' | 'timestamp'>): string {
    const id = `req-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const aiRequest: AIRequestLog = {
      id,
      timestamp: new Date(),
      ...request,
    };

    this.aiRequests.push(aiRequest);

    this.log('info', 'ai-request', `🤖 AI Request: ${request.strategy}`, {
      message: `Model: ${request.model} | Target: ${request.targetFile}`,
      details: {
        requestId: id,
        strategy: request.strategy,
        model: request.model,
        promptLength: request.prompt.length,
        systemInstructionLength: request.systemInstruction?.length || 0,
        contextFiles: request.contextFiles,
      },
      code: this.formatPromptPreview(request.prompt),
    });

    return id;
  }

  // AI Response logging
  logAIResponse(
    requestId: string,
    success: boolean,
    responseOrError: string,
    duration: number
  ): void {
    const response: AIResponseLog = {
      id: `resp-${Date.now()}`,
      requestId,
      timestamp: new Date(),
      success,
      response: success ? responseOrError : undefined,
      error: success ? undefined : responseOrError,
      duration,
      tokenEstimate: success ? Math.round(responseOrError.length / 4) : undefined,
    };

    this.aiResponses.push(response);

    this.log(
      success ? 'success' : 'error',
      'ai-response',
      success ? '✓ AI Response Received' : '✗ AI Request Failed',
      {
        message: success
          ? `${(duration / 1000).toFixed(2)}s | ~${response.tokenEstimate} tokens`
          : responseOrError,
        details: {
          requestId,
          duration: `${(duration / 1000).toFixed(2)}s`,
          responseLength: success ? responseOrError.length : 0,
          tokenEstimate: response.tokenEstimate,
        },
        duration,
        code: success ? this.truncateCode(responseOrError) : undefined,
      }
    );
  }

  // Validation logging
  logValidation(
    type: 'syntax' | 'verify' | 'compare',
    passed: boolean,
    details: string
  ): void {
    this.log(
      passed ? 'success' : 'warn',
      'validation',
      passed ? `✓ ${type} validation passed` : `✗ ${type} validation failed`,
      {
        message: details,
        details: { type, passed },
      }
    );
  }

  // Apply logging
  logApply(files: string[], description: string): void {
    this.log('success', 'apply', '📝 Applying Fix', {
      message: description,
      details: {
        files,
        fileCount: files.length,
      },
    });
  }

  // Error analysis logging
  logAnalysis(parsed: {
    type: string;
    category: string;
    confidence: number;
    isAutoFixable: boolean;
    suggestedFix?: string;
  }): void {
    this.log('info', 'analyze', '🔍 Error Analysis', {
      message: `Type: ${parsed.type} | Category: ${parsed.category} | Confidence: ${(parsed.confidence * 100).toFixed(0)}%`,
      details: parsed,
    });
  }

  // ============================================================================
  // Getters
  // ============================================================================

  getLogs(): AutoFixLogEntry[] {
    return [...this.logs];
  }

  getSessionLogs(): AutoFixLogEntry[] {
    return this.logs.filter(l => l.id.startsWith(this.sessionId));
  }

  getAIRequests(): AIRequestLog[] {
    return [...this.aiRequests];
  }

  getAIResponses(): AIResponseLog[] {
    return [...this.aiResponses];
  }

  getLastRequest(): AIRequestLog | null {
    return this.aiRequests[this.aiRequests.length - 1] || null;
  }

  getLastResponse(): AIResponseLog | null {
    return this.aiResponses[this.aiResponses.length - 1] || null;
  }

  // Get full request/response pair
  getRequestResponsePair(requestId: string): {
    request: AIRequestLog | null;
    response: AIResponseLog | null;
  } {
    return {
      request: this.aiRequests.find(r => r.id === requestId) || null,
      response: this.aiResponses.find(r => r.requestId === requestId) || null,
    };
  }

  // ============================================================================
  // Listeners
  // ============================================================================

  subscribe(callback: (entry: AutoFixLogEntry) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(entry: AutoFixLogEntry): void {
    this.listeners.forEach(cb => cb(entry));
  }

  // ============================================================================
  // Configuration
  // ============================================================================

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  clear(): void {
    this.logs = [];
    this.aiRequests = [];
    this.aiResponses = [];
  }

  // ============================================================================
  // Helpers
  // ============================================================================

  private trimLogs(): void {
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  private truncateCode(code: string, maxLength = 500): string {
    if (code.length <= maxLength) return code;
    return code.slice(0, maxLength) + '\n... [truncated]';
  }

  private formatPromptPreview(prompt: string): string {
    // Show first 300 chars of prompt
    const preview = prompt.slice(0, 300);
    return preview + (prompt.length > 300 ? '\n... [see full in details]' : '');
  }

  private getConsoleColor(level: LogLevel): string {
    const colors: Record<LogLevel, string> = {
      debug: 'color: #888',
      info: 'color: #3b82f6',
      warn: 'color: #f59e0b',
      error: 'color: #ef4444',
      success: 'color: #22c55e',
    };
    return colors[level];
  }

  // Export logs as JSON for debugging
  exportLogs(): string {
    return JSON.stringify({
      logs: this.logs,
      aiRequests: this.aiRequests,
      aiResponses: this.aiResponses,
      exportedAt: new Date().toISOString(),
    }, null, 2);
  }
}

// Singleton export
export const autoFixLogger = new AutoFixDebugLogger();
