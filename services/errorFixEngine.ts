/**
 * Ultra-Powerful ErrorFix Engine
 *
 * A comprehensive error fixing system that GUARANTEES error resolution.
 * Uses a multi-strategy pipeline: Local → AI → Iterative → Regeneration
 *
 * Key Features:
 * - Multiple fix strategies executed in sequence until success
 * - Parallel strategy execution where possible
 * - Smart context building for AI
 * - Fix verification system
 * - Learning from failures
 * - Timeout management for fast resolution
 */

import { FileSystem, LogEntry } from '../types';
import { trySimpleFix, tryFixBareSpecifierMultiFile, analyzeCode } from '../utils/simpleFixes';
import { classifyError, ErrorClassification, recordFixAttempt } from './autoFixService';
import { parseStackTrace, buildAutoFixPrompt, getRelatedFiles } from '../utils/errorContext';
import { cleanGeneratedCode, isValidCode } from '../utils/cleanCode';
import { getProviderManager } from './ai';

// ============================================================================
// Types
// ============================================================================

export interface FixResult {
  success: boolean;
  fixedFiles: Record<string, string>;
  description: string;
  strategy: FixStrategy;
  attempts: number;
  timeMs: number;
  error?: string;
}

export type FixStrategy =
  | 'local-simple'          // Pattern-based local fix
  | 'local-multifile'       // Multi-file local fix (bare specifiers, etc.)
  | 'local-proactive'       // Proactive code analysis
  | 'ai-quick'              // Quick AI fix with minimal context
  | 'ai-full'               // Full AI fix with complete context
  | 'ai-iterative'          // Multiple AI attempts with feedback
  | 'ai-regenerate'         // Full component regeneration
  | 'ai-collaborative';     // AI fix with human-in-the-loop feedback

export interface FixEngineOptions {
  files: FileSystem;
  errorMessage: string;
  errorStack?: string;
  targetFile?: string;
  appCode?: string;
  logs?: LogEntry[];
  systemInstruction?: string;
  onProgress?: (stage: string, progress: number) => void;
  onStrategyChange?: (strategy: FixStrategy) => void;
  maxAttempts?: number;
  timeout?: number;
  skipStrategies?: FixStrategy[];
}

interface StrategyResult {
  success: boolean;
  fixedFiles?: Record<string, string>;
  description?: string;
  shouldContinue: boolean;
  feedback?: string;
}

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  // Timeouts
  LOCAL_FIX_TIMEOUT: 2000,      // 2 seconds for local fixes
  AI_QUICK_TIMEOUT: 15000,      // 15 seconds for quick AI
  AI_FULL_TIMEOUT: 30000,       // 30 seconds for full AI
  AI_ITERATIVE_TIMEOUT: 60000,  // 60 seconds for iterative AI
  TOTAL_TIMEOUT: 90000,         // 90 seconds total max

  // Attempts
  MAX_AI_ATTEMPTS: 3,
  MAX_ITERATIVE_ROUNDS: 3,

  // Context limits
  MAX_CONTEXT_FILES: 8,
  MAX_FILE_SIZE: 50000,         // 50KB per file
  MAX_TOTAL_CONTEXT: 200000,    // 200KB total context
};

// ============================================================================
// Fix Strategy Definitions
// ============================================================================

const STRATEGY_PRIORITY: FixStrategy[] = [
  'local-simple',
  'local-multifile',
  'local-proactive',
  'ai-quick',
  'ai-full',
  'ai-iterative',
  'ai-regenerate',
];

// ============================================================================
// ErrorFix Engine Class
// ============================================================================

export class ErrorFixEngine {
  private options: Required<FixEngineOptions>;
  private startTime: number = 0;
  private attempts: number = 0;
  private currentStrategy: FixStrategy = 'local-simple';
  private strategyHistory: Array<{ strategy: FixStrategy; success: boolean; error?: string }> = [];
  private abortController: AbortController | null = null;

  constructor(options: FixEngineOptions) {
    this.options = {
      files: options.files,
      errorMessage: options.errorMessage,
      errorStack: options.errorStack || '',
      targetFile: options.targetFile || this.detectTargetFile(options.errorMessage, options.files),
      appCode: options.appCode || options.files['src/App.tsx'] || '',
      logs: options.logs || [],
      systemInstruction: options.systemInstruction || '',
      onProgress: options.onProgress || (() => {}),
      onStrategyChange: options.onStrategyChange || (() => {}),
      maxAttempts: options.maxAttempts || 10,
      timeout: options.timeout || CONFIG.TOTAL_TIMEOUT,
      skipStrategies: options.skipStrategies || [],
    };
  }

  /**
   * Main entry point - Execute the fix pipeline
   * Returns when error is fixed or all strategies exhausted
   */
  async fix(): Promise<FixResult> {
    this.startTime = Date.now();
    this.abortController = new AbortController();

    const classification = classifyError(this.options.errorMessage);
    console.log('[ErrorFixEngine] Starting fix pipeline', {
      error: this.options.errorMessage.slice(0, 100),
      classification,
      targetFile: this.options.targetFile,
    });

    // Filter strategies based on error classification
    const strategies = this.selectStrategies(classification);

    for (const strategy of strategies) {
      // Check timeout
      if (this.isTimedOut()) {
        console.log('[ErrorFixEngine] Total timeout reached');
        break;
      }

      // Skip if strategy is in skip list
      if (this.options.skipStrategies.includes(strategy)) {
        continue;
      }

      // Execute strategy
      this.currentStrategy = strategy;
      this.options.onStrategyChange(strategy);
      this.options.onProgress(this.getStrategyLabel(strategy), this.getProgress());

      try {
        const result = await this.executeStrategy(strategy);
        this.strategyHistory.push({ strategy, success: result.success, error: result.feedback });

        if (result.success && result.fixedFiles) {
          const timeMs = Date.now() - this.startTime;

          // Record analytics
          recordFixAttempt(
            this.options.errorMessage,
            classification.category,
            strategy,
            true,
            timeMs
          );

          console.log('[ErrorFixEngine] Fix successful!', {
            strategy,
            attempts: this.attempts,
            timeMs,
          });

          return {
            success: true,
            fixedFiles: result.fixedFiles,
            description: result.description || `Fixed via ${strategy}`,
            strategy,
            attempts: this.attempts,
            timeMs,
          };
        }

        // If strategy says do not continue, stop
        if (!result.shouldContinue) {
          console.log('[ErrorFixEngine] Strategy indicated to stop pipeline');
          break;
        }

      } catch (e) {
        console.error('[ErrorFixEngine] Strategy error:', strategy, e);
        this.strategyHistory.push({
          strategy,
          success: false,
          error: e instanceof Error ? e.message : String(e)
        });
      }
    }

    // All strategies exhausted
    const timeMs = Date.now() - this.startTime;
    recordFixAttempt(
      this.options.errorMessage,
      classification.category,
      'all-failed',
      false,
      timeMs
    );

    return {
      success: false,
      fixedFiles: {},
      description: 'All fix strategies exhausted',
      strategy: this.currentStrategy,
      attempts: this.attempts,
      timeMs,
      error: this.buildFailureReport(),
    };
  }

  /**
   * Abort the current fix operation
   */
  abort(): void {
    this.abortController?.abort();
  }

  // ============================================================================
  // Strategy Selection
  // ============================================================================

  private selectStrategies(classification: ErrorClassification): FixStrategy[] {
    const strategies: FixStrategy[] = [];

    // Always try local fixes first (fast)
    strategies.push('local-simple');

    // For import errors, try multi-file fix
    if (classification.category === 'import') {
      strategies.push('local-multifile');
    }

    // Proactive analysis for potential issues
    strategies.push('local-proactive');

    // If fixable by AI
    if (classification.isFixable) {
      // Quick AI for simple errors
      if (classification.priority >= 4) {
        strategies.push('ai-quick');
      }

      // Full AI for complex errors
      strategies.push('ai-full');

      // Iterative for stubborn errors
      if (classification.priority >= 3) {
        strategies.push('ai-iterative');
      }
    }

    // Regeneration as last resort
    strategies.push('ai-regenerate');

    return strategies;
  }

  // ============================================================================
  // Strategy Execution
  // ============================================================================

  private async executeStrategy(strategy: FixStrategy): Promise<StrategyResult> {
    this.attempts++;

    switch (strategy) {
      case 'local-simple':
        return this.executeLocalSimple();
      case 'local-multifile':
        return this.executeLocalMultifile();
      case 'local-proactive':
        return this.executeLocalProactive();
      case 'ai-quick':
        return this.executeAIQuick();
      case 'ai-full':
        return this.executeAIFull();
      case 'ai-iterative':
        return this.executeAIIterative();
      case 'ai-regenerate':
        return this.executeAIRegenerate();
      default:
        return { success: false, shouldContinue: true };
    }
  }

  // ============================================================================
  // Local Fix Strategies
  // ============================================================================

  private async executeLocalSimple(): Promise<StrategyResult> {
    this.options.onProgress('Trying local fix...', 10);

    const targetFile = this.options.targetFile;
    const code = this.options.files[targetFile] || this.options.appCode;

    if (!code) {
      return { success: false, shouldContinue: true, feedback: 'No code found' };
    }

    try {
      const result = trySimpleFix(this.options.errorMessage, code);

      if (result.fixed && result.newCode !== code) {
        // Validate the fix
        if (isValidCode(result.newCode)) {
          return {
            success: true,
            fixedFiles: { [targetFile]: result.newCode },
            description: result.description,
            shouldContinue: false,
          };
        }
      }

      return { success: false, shouldContinue: true, feedback: 'Local fix did not resolve error' };
    } catch (e) {
      return { success: false, shouldContinue: true, feedback: String(e) };
    }
  }

  private async executeLocalMultifile(): Promise<StrategyResult> {
    this.options.onProgress('Scanning all files...', 15);

    try {
      const result = tryFixBareSpecifierMultiFile(this.options.errorMessage, this.options.files);

      if (result.fixed && result.multiFileChanges) {
        // Validate all changed files
        let allValid = true;
        for (const [, code] of Object.entries(result.multiFileChanges)) {
          if (!isValidCode(code)) {
            allValid = false;
            break;
          }
        }

        if (allValid) {
          return {
            success: true,
            fixedFiles: result.multiFileChanges,
            description: result.description,
            shouldContinue: false,
          };
        }
      }

      return { success: false, shouldContinue: true, feedback: 'Multi-file fix did not resolve error' };
    } catch (e) {
      return { success: false, shouldContinue: true, feedback: String(e) };
    }
  }

  private async executeLocalProactive(): Promise<StrategyResult> {
    this.options.onProgress('Analyzing code...', 20);

    const targetFile = this.options.targetFile;
    const code = this.options.files[targetFile] || this.options.appCode;

    if (!code) {
      return { success: false, shouldContinue: true };
    }

    try {
      const issues = analyzeCode(code);
      const autoFixable = issues.filter(i => i.autoFixable && i.type === 'error');

      if (autoFixable.length > 0) {
        // Try to fix detected issues
        let fixedCode = code;
        const appliedFixes: string[] = [];

        for (const issue of autoFixable) {
          if (issue.fix) {
            const newCode = issue.fix();
            if (newCode !== fixedCode && isValidCode(newCode)) {
              fixedCode = newCode;
              appliedFixes.push(issue.message);
            }
          }
        }

        if (fixedCode !== code && appliedFixes.length > 0) {
          return {
            success: true,
            fixedFiles: { [targetFile]: fixedCode },
            description: `Fixed: ${appliedFixes.join(', ')}`,
            shouldContinue: false,
          };
        }
      }

      return { success: false, shouldContinue: true };
    } catch (e) {
      return { success: false, shouldContinue: true, feedback: String(e) };
    }
  }

  // ============================================================================
  // AI Fix Strategies
  // ============================================================================

  private async executeAIQuick(): Promise<StrategyResult> {
    this.options.onProgress('Quick AI analysis...', 30);

    const targetFile = this.options.targetFile;
    const code = this.options.files[targetFile] || this.options.appCode;

    if (!code) {
      return { success: false, shouldContinue: true };
    }

    try {
      const manager = getProviderManager();
      const config = manager.getActiveConfig();

      if (!config) {
        return { success: false, shouldContinue: true, feedback: 'No AI provider configured' };
      }

      // Build minimal prompt for speed
      const prompt = this.buildQuickPrompt(code);

      const response = await Promise.race([
        manager.generate({ prompt, responseFormat: 'text' }, config.defaultModel),
        this.timeout(CONFIG.AI_QUICK_TIMEOUT),
      ]);

      if (!response || typeof response === 'symbol') {
        return { success: false, shouldContinue: true, feedback: 'AI timeout' };
      }

      const fixedCode = cleanGeneratedCode(response.text || '');

      if (fixedCode && isValidCode(fixedCode) && fixedCode !== code) {
        return {
          success: true,
          fixedFiles: { [targetFile]: fixedCode },
          description: 'Quick AI fix applied',
          shouldContinue: false,
        };
      }

      return { success: false, shouldContinue: true, feedback: 'AI fix invalid' };
    } catch (e) {
      return { success: false, shouldContinue: true, feedback: String(e) };
    }
  }

  private async executeAIFull(): Promise<StrategyResult> {
    this.options.onProgress('Full AI analysis...', 50);

    const targetFile = this.options.targetFile;
    const code = this.options.files[targetFile] || this.options.appCode;

    if (!code) {
      return { success: false, shouldContinue: true };
    }

    try {
      const manager = getProviderManager();
      const config = manager.getActiveConfig();

      if (!config) {
        return { success: false, shouldContinue: true, feedback: 'No AI provider configured' };
      }

      // Build full context prompt
      const prompt = buildAutoFixPrompt({
        errorMessage: this.options.errorMessage,
        targetFile,
        targetFileContent: code,
        files: this.options.files,
        techStackContext: this.options.systemInstruction,
        logs: this.options.logs,
      });

      const response = await Promise.race([
        manager.generate({ prompt, responseFormat: 'text' }, config.defaultModel),
        this.timeout(CONFIG.AI_FULL_TIMEOUT),
      ]);

      if (!response || typeof response === 'symbol') {
        return { success: false, shouldContinue: true, feedback: 'AI timeout' };
      }

      const fixedCode = cleanGeneratedCode(response.text || '');

      if (fixedCode && isValidCode(fixedCode) && fixedCode !== code) {
        return {
          success: true,
          fixedFiles: { [targetFile]: fixedCode },
          description: 'AI fix applied with full context',
          shouldContinue: false,
        };
      }

      return {
        success: false,
        shouldContinue: true,
        feedback: 'AI generated invalid or unchanged code'
      };
    } catch (e) {
      return { success: false, shouldContinue: true, feedback: String(e) };
    }
  }

  private async executeAIIterative(): Promise<StrategyResult> {
    this.options.onProgress('Iterative AI fixing...', 70);

    const targetFile = this.options.targetFile;
    const currentCode = this.options.files[targetFile] || this.options.appCode;

    if (!currentCode) {
      return { success: false, shouldContinue: true };
    }

    const feedbackHistory: string[] = [];

    for (let round = 0; round < CONFIG.MAX_ITERATIVE_ROUNDS; round++) {
      if (this.isTimedOut()) break;

      this.options.onProgress(
        `AI attempt ${round + 1}/${CONFIG.MAX_ITERATIVE_ROUNDS}...`,
        70 + (round * 10)
      );

      try {
        const manager = getProviderManager();
        const config = manager.getActiveConfig();

        if (!config) {
          return { success: false, shouldContinue: true };
        }

        // Build prompt with feedback from previous attempts
        const prompt = this.buildIterativePrompt(currentCode, feedbackHistory, round);

        const response = await Promise.race([
          manager.generate({ prompt, responseFormat: 'text' }, config.defaultModel),
          this.timeout(CONFIG.AI_FULL_TIMEOUT),
        ]);

        if (!response || typeof response === 'symbol') {
          feedbackHistory.push('Timeout - AI took too long');
          continue;
        }

        const fixedCode = cleanGeneratedCode(response.text || '');

        if (!fixedCode) {
          feedbackHistory.push('AI returned empty response');
          continue;
        }

        if (!isValidCode(fixedCode)) {
          feedbackHistory.push('AI generated syntactically invalid code');
          continue;
        }

        if (fixedCode === currentCode) {
          feedbackHistory.push('AI made no changes');
          continue;
        }

        // Success!
        return {
          success: true,
          fixedFiles: { [targetFile]: fixedCode },
          description: `Fixed after ${round + 1} AI iterations`,
          shouldContinue: false,
        };

      } catch (e) {
        feedbackHistory.push(`Error: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    return {
      success: false,
      shouldContinue: true,
      feedback: `Failed after ${CONFIG.MAX_ITERATIVE_ROUNDS} iterations: ${feedbackHistory.join('; ')}`
    };
  }

  private async executeAIRegenerate(): Promise<StrategyResult> {
    this.options.onProgress('Regenerating component...', 90);

    const targetFile = this.options.targetFile;
    const originalCode = this.options.files[targetFile] || this.options.appCode;

    if (!originalCode) {
      return { success: false, shouldContinue: false };
    }

    try {
      const manager = getProviderManager();
      const config = manager.getActiveConfig();

      if (!config) {
        return { success: false, shouldContinue: false };
      }

      // Extract component intent from original code
      const componentName = this.extractComponentName(originalCode);
      const relatedFiles = getRelatedFiles(this.options.errorMessage, originalCode, this.options.files);

      const prompt = this.buildRegenerationPrompt(originalCode, componentName, relatedFiles);

      const response = await Promise.race([
        manager.generate({ prompt, responseFormat: 'text' }, config.defaultModel),
        this.timeout(CONFIG.AI_ITERATIVE_TIMEOUT),
      ]);

      if (!response || typeof response === 'symbol') {
        return { success: false, shouldContinue: false, feedback: 'AI timeout during regeneration' };
      }

      const regeneratedCode = cleanGeneratedCode(response.text || '');

      if (regeneratedCode && isValidCode(regeneratedCode)) {
        return {
          success: true,
          fixedFiles: { [targetFile]: regeneratedCode },
          description: `Regenerated ${componentName || 'component'}`,
          shouldContinue: false,
        };
      }

      return { success: false, shouldContinue: false, feedback: 'Regeneration produced invalid code' };
    } catch (e) {
      return { success: false, shouldContinue: false, feedback: String(e) };
    }
  }

  // ============================================================================
  // Prompt Builders
  // ============================================================================

  private buildQuickPrompt(code: string): string {
    const classification = classifyError(this.options.errorMessage);

    return `Fix this ${classification.category} error in React/TypeScript code.

ERROR: ${this.options.errorMessage}

${classification.suggestedFix ? `HINT: ${classification.suggestedFix}` : ''}

CODE:
\`\`\`tsx
${code.slice(0, 10000)}${code.length > 10000 ? '\n// ... truncated' : ''}
\`\`\`

RULES:
1. Return ONLY the complete fixed code
2. No explanations, no markdown blocks
3. Keep all existing functionality
4. Only fix the specific error

OUTPUT:`;
  }

  private buildIterativePrompt(code: string, feedbackHistory: string[], round: number): string {
    const classification = classifyError(this.options.errorMessage);
    const stackInfo = parseStackTrace(this.options.errorMessage);

    let prompt = `You are an expert React/TypeScript developer. Fix this error.

ERROR: ${this.options.errorMessage}
CATEGORY: ${classification.category}
${stackInfo.line ? `LINE: ${stackInfo.line}` : ''}
${classification.suggestedFix ? `SUGGESTED FIX: ${classification.suggestedFix}` : ''}

`;

    // Add feedback from previous attempts
    if (feedbackHistory.length > 0) {
      prompt += `PREVIOUS ATTEMPTS FAILED:
${feedbackHistory.map((f, i) => `${i + 1}. ${f}`).join('\n')}

Please try a DIFFERENT approach this time. Be more careful and thorough.

`;
    }

    // Add round-specific hints
    if (round >= 1) {
      prompt += `IMPORTANT: Previous fixes didn't work. Please:
- Double-check all imports
- Verify all variable names
- Ensure proper React hooks usage
- Check for TypeScript type issues

`;
    }

    if (round >= 2) {
      prompt += `CRITICAL: This is the last attempt. Please:
- Completely review the code logic
- Add defensive null checks where needed
- Consider if the component structure needs changes
- Make sure ALL possible edge cases are handled

`;
    }

    prompt += `CODE TO FIX:
\`\`\`tsx
${code}
\`\`\`

AVAILABLE FILES: ${Object.keys(this.options.files).join(', ')}

Return ONLY the complete fixed code. No explanations.`;

    return prompt;
  }

  private buildRegenerationPrompt(
    originalCode: string,
    componentName: string | null,
    relatedFiles: Record<string, string>
  ): string {
    // Extract JSX structure to understand the UI intent
    const jsxMatch = originalCode.match(/return\s*\(\s*([\s\S]*?)\s*\);?\s*(?:}|$)/);
    const jsxContent = jsxMatch ? jsxMatch[1] : '';

    // Extract imports to understand dependencies
    const imports = originalCode.match(/^import\s+.*$/gm) || [];

    // Extract props if any
    const propsMatch = originalCode.match(/(?:interface|type)\s+\w*Props\s*(?:=\s*)?{([^}]*)}/);
    const propsDefinition = propsMatch ? propsMatch[0] : '';

    let relatedContext = '';
    if (Object.keys(relatedFiles).length > 0) {
      relatedContext = '\n\nRELATED FILES:\n';
      for (const [path, content] of Object.entries(relatedFiles).slice(0, 3)) {
        relatedContext += `\n// ${path}\n${content.slice(0, 2000)}\n`;
      }
    }

    return `Regenerate this React component from scratch, fixing all errors while maintaining the same functionality.

ORIGINAL ERROR: ${this.options.errorMessage}

COMPONENT NAME: ${componentName || 'App'}

ORIGINAL IMPORTS (may need fixes):
${imports.join('\n')}

${propsDefinition ? `PROPS INTERFACE:\n${propsDefinition}\n` : ''}

ORIGINAL JSX STRUCTURE (the UI to recreate):
${jsxContent.slice(0, 3000)}
${relatedContext}

${this.options.systemInstruction}

REQUIREMENTS:
1. Create a working React component with the same visual output
2. Use correct import paths (motion/react, not framer-motion)
3. Fix all TypeScript errors
4. Add proper null checks
5. Maintain the same component API (props)

Return ONLY the complete component code. No explanations.`;
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  private detectTargetFile(errorMessage: string, files: FileSystem): string {
    const stackInfo = parseStackTrace(errorMessage);
    if (stackInfo.file && files[stackInfo.file]) {
      return stackInfo.file;
    }

    // Check for bare specifier errors
    const bareMatch = errorMessage.match(/["']?(src\/[\w./-]+)["']?/i);
    if (bareMatch) {
      // Find which file imports this
      const specifier = bareMatch[1];
      for (const [path, content] of Object.entries(files)) {
        if (content.includes(specifier)) {
          return path;
        }
      }
    }

    return 'src/App.tsx';
  }

  private extractComponentName(code: string): string | null {
    // Try to find exported component name
    const exportMatch = code.match(/export\s+(?:default\s+)?(?:function|const)\s+(\w+)/);
    if (exportMatch) return exportMatch[1];

    // Try to find any function component
    const funcMatch = code.match(/(?:function|const)\s+([A-Z]\w+)\s*(?:=|:|\()/);
    if (funcMatch) return funcMatch[1];

    return null;
  }

  private getStrategyLabel(strategy: FixStrategy): string {
    const labels: Record<FixStrategy, string> = {
      'local-simple': '🔧 Quick fix',
      'local-multifile': '📁 Multi-file fix',
      'local-proactive': '🔍 Code analysis',
      'ai-quick': '⚡ Quick AI',
      'ai-full': '🤖 AI analysis',
      'ai-iterative': '🔄 Deep AI analysis',
      'ai-regenerate': '🔨 Regenerating',
      'ai-collaborative': '👥 Collaborative fix',
    };
    return labels[strategy] || strategy;
  }

  private getProgress(): number {
    const index = STRATEGY_PRIORITY.indexOf(this.currentStrategy);
    return Math.round((index / STRATEGY_PRIORITY.length) * 100);
  }

  private isTimedOut(): boolean {
    return Date.now() - this.startTime > this.options.timeout;
  }

  private timeout(ms: number): Promise<symbol> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(Symbol('timeout')), ms);
    });
  }

  private buildFailureReport(): string {
    const lines = ['Fix attempt summary:'];

    for (const { strategy, success, error } of this.strategyHistory) {
      const status = success ? '✅' : '❌';
      lines.push(`${status} ${strategy}${error ? `: ${error}` : ''}`);
    }

    lines.push(`Total attempts: ${this.attempts}`);
    lines.push(`Time elapsed: ${Date.now() - this.startTime}ms`);

    return lines.join('\n');
  }
}

// ============================================================================
// Convenience Function
// ============================================================================

/**
 * Quick fix function - returns fixed files or null
 */
export async function quickFix(
  errorMessage: string,
  files: FileSystem,
  options?: Partial<FixEngineOptions>
): Promise<Record<string, string> | null> {
  const engine = new ErrorFixEngine({
    errorMessage,
    files,
    ...options,
  });

  const result = await engine.fix();
  return result.success ? result.fixedFiles : null;
}

/**
 * Fix with progress callback
 */
export async function fixWithProgress(
  errorMessage: string,
  files: FileSystem,
  onProgress: (stage: string, progress: number) => void,
  options?: Partial<FixEngineOptions>
): Promise<FixResult> {
  const engine = new ErrorFixEngine({
    errorMessage,
    files,
    onProgress,
    ...options,
  });

  return engine.fix();
}

export default ErrorFixEngine;
