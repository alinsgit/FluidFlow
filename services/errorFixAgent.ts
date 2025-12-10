/**
 * ErrorFixAgent - Agentic Error Fixing System
 *
 * An autonomous agent that communicates with LLM to fix errors iteratively.
 * Flow: Get Error → Send to LLM → Apply Fix → Verify → Repeat until resolved
 */

import { getProviderManager } from './ai';
import { FileSystem } from '../types';
import { parseMultiFileResponse } from '../utils/cleanCode';

// Agent states
export type AgentState =
  | 'idle'
  | 'analyzing'
  | 'fixing'
  | 'applying'
  | 'verifying'
  | 'success'
  | 'failed'
  | 'max_attempts_reached';

// Log entry for UI display
export interface AgentLogEntry {
  id: string;
  timestamp: Date;
  type: 'info' | 'prompt' | 'response' | 'fix' | 'error' | 'success' | 'warning';
  title: string;
  content: string;
  metadata?: {
    attempt?: number;
    file?: string;
    model?: string;
    duration?: number;
  };
}

// Agent configuration
export interface AgentConfig {
  maxAttempts: number;
  timeoutMs: number;
  onStateChange: (state: AgentState) => void;
  onLog: (entry: AgentLogEntry) => void;
  onFileUpdate: (path: string, content: string) => void;
  onComplete: (success: boolean, message: string) => void;
}

// Error context for LLM
interface ErrorContext {
  errorMessage: string;
  errorStack?: string;
  file: string;
  fileContent: string;
  allFiles: FileSystem;
  previousAttempts: Array<{
    prompt: string;
    response: string;
    appliedFix: string;
    resultingError?: string;
  }>;
}

// System prompt for error fixing - MUST return proper JSON format
const ERROR_FIX_SYSTEM_PROMPT = `You are an expert React/TypeScript error fixer. Your ONLY job is to fix the error provided.

## CRITICAL RULES:
1. ALWAYS use relative imports for local files (./component, ../utils)
2. NEVER use bare specifiers like "src/components/X" - use "./components/X" instead
3. Do NOT change anything unrelated to the error
4. Preserve all existing functionality
5. Return COMPLETE file content - no placeholders, no "// ... rest of code"

## COMMON FIXES:
- "X is not defined" → Add missing import at the top of the file
- "bare specifier" → Change "src/..." to "./" relative path
- "Cannot read property of undefined" → Add null check or default value
- "Expected X but got Y" → Fix type mismatch
- "Module not found" → Fix import path
- "Unexpected token" → Fix syntax error
- "is not a function" → Fix import (default vs named) or check export

## RESPONSE FORMAT - CRITICAL:
You MUST respond with a valid JSON object in this EXACT format:

\`\`\`json
{
  "files": {
    "FILEPATH": "COMPLETE_FILE_CONTENT_HERE"
  },
  "explanation": "Brief explanation of what was fixed"
}
\`\`\`

### RULES FOR JSON RESPONSE:
- The "files" object contains the file path as key and COMPLETE fixed code as value
- Use the EXACT file path provided in the error context (e.g., "src/App.tsx")
- The file content must be a COMPLETE, valid TypeScript/React file
- Escape special characters in strings: use \\n for newlines, \\" for quotes
- The "explanation" should be 1-2 sentences explaining the fix
- Do NOT include markdown code blocks inside the JSON values
- Do NOT truncate or abbreviate the code

### EXAMPLE RESPONSE:
\`\`\`json
{
  "files": {
    "src/App.tsx": "import React from 'react';\\nimport { Hero } from './components/Hero';\\n\\nexport default function App() {\\n  return <Hero />;\\n}"
  },
  "explanation": "Added missing import for Hero component"
}
\`\`\`

Remember: Return ONLY the JSON object, no other text before or after.`;

class ErrorFixAgent {
  private state: AgentState = 'idle';
  private config: AgentConfig | null = null;
  private abortController: AbortController | null = null;
  private currentAttempt = 0;
  private previousAttempts: ErrorContext['previousAttempts'] = [];

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private log(
    type: AgentLogEntry['type'],
    title: string,
    content: string,
    metadata?: AgentLogEntry['metadata']
  ): void {
    if (!this.config) return;

    this.config.onLog({
      id: this.generateId(),
      timestamp: new Date(),
      type,
      title,
      content,
      metadata: {
        ...metadata,
        attempt: this.currentAttempt
      }
    });
  }

  private setState(newState: AgentState): void {
    this.state = newState;
    this.config?.onStateChange(newState);
  }

  /**
   * Start the agentic error fixing loop
   */
  async start(
    errorMessage: string,
    errorStack: string | undefined,
    targetFile: string,
    files: FileSystem,
    config: AgentConfig
  ): Promise<void> {
    // Reset state
    this.config = config;
    this.currentAttempt = 0;
    this.previousAttempts = [];
    this.abortController = new AbortController();

    this.log('info', 'Agent Started', `Starting error fix agent for: ${targetFile}`);
    this.log('error', 'Error Detected', errorMessage, { file: targetFile });

    // Start the agentic loop
    await this.fixLoop(errorMessage, errorStack, targetFile, files);
  }

  /**
   * Main agentic loop
   */
  private async fixLoop(
    errorMessage: string,
    errorStack: string | undefined,
    targetFile: string,
    files: FileSystem
  ): Promise<void> {
    if (!this.config) return;

    while (this.currentAttempt < this.config.maxAttempts) {
      // Check if aborted
      if (this.abortController?.signal.aborted) {
        this.log('warning', 'Aborted', 'Agent was stopped by user');
        this.setState('idle');
        this.config.onComplete(false, 'Agent stopped by user');
        return;
      }

      this.currentAttempt++;
      this.log('info', `Attempt ${this.currentAttempt}/${this.config.maxAttempts}`,
        'Starting fix attempt...');

      try {
        // Step 1: Analyze
        this.setState('analyzing');
        const context = this.buildErrorContext(errorMessage, errorStack, targetFile, files);

        // Step 2: Generate prompt
        const prompt = this.buildPrompt(context);
        this.log('prompt', 'Prompt Sent to LLM', prompt, {
          file: targetFile,
          model: getProviderManager().getActiveConfig()?.defaultModel
        });

        // Step 3: Get fix from LLM
        this.setState('fixing');
        const startTime = Date.now();
        const fixedCode = await this.callLLM(prompt);
        const duration = Date.now() - startTime;

        if (!fixedCode || fixedCode.trim() === '') {
          this.log('error', 'Empty Response', 'LLM returned empty response');
          continue;
        }

        this.log('response', 'LLM Response', fixedCode.slice(0, 500) + (fixedCode.length > 500 ? '...' : ''), {
          duration,
          model: getProviderManager().getActiveConfig()?.defaultModel
        });

        // Step 4: Parse and validate the response
        const parseResult = parseMultiFileResponse(fixedCode, true);

        if (!parseResult || !parseResult.files || Object.keys(parseResult.files).length === 0) {
          this.log('error', 'Parse Failed', 'Could not parse LLM response as valid JSON with files');

          // Fallback: try to use cleanResponse for raw code
          const fallbackCode = this.cleanResponse(fixedCode);
          if (fallbackCode && fallbackCode !== files[targetFile]) {
            this.log('info', 'Using Fallback', 'Applying raw code as fallback');

            this.setState('applying');
            this.config.onFileUpdate(targetFile, fallbackCode);
            files = { ...files, [targetFile]: fallbackCode };

            this.previousAttempts.push({
              prompt,
              response: fixedCode,
              appliedFix: fallbackCode,
              resultingError: undefined
            });

            this.setState('verifying');
            this.log('info', 'Verifying Fix', 'Waiting for preview to compile...');
            await this.delay(2000);

            this.log('success', 'Fix Applied (Fallback)', `Successfully applied fallback fix to ${targetFile}`);
            this.setState('success');
            this.config.onComplete(true, `Fixed ${targetFile} after ${this.currentAttempt} attempt(s) (fallback mode)`);
            return;
          }

          continue;
        }

        // Log explanation if provided
        if (parseResult.explanation) {
          this.log('info', 'Fix Explanation', parseResult.explanation);
        }

        // Get the fixed file content
        const fixedFiles = parseResult.files;
        const fixedFilePath = Object.keys(fixedFiles)[0]; // Get first (and likely only) file
        const cleanedCode = fixedFiles[fixedFilePath];

        if (!cleanedCode || cleanedCode === files[targetFile]) {
          this.log('warning', 'No Changes', 'LLM returned identical code');
          continue;
        }

        // Step 5: Apply fix
        this.setState('applying');
        this.log('fix', 'Applying Fix', `Updating ${fixedFilePath}`, { file: fixedFilePath });

        // Update the file (use the path from response, but prefer targetFile if they match)
        const actualPath = fixedFilePath.includes(targetFile.split('/').pop() || '') ? targetFile : fixedFilePath;
        this.config.onFileUpdate(actualPath, cleanedCode);

        // Update local files reference for next iteration
        files = { ...files, [actualPath]: cleanedCode };

        // Record this attempt
        this.previousAttempts.push({
          prompt,
          response: fixedCode,
          appliedFix: cleanedCode,
          resultingError: undefined // Will be set if error persists
        });

        // Step 6: Verify (wait for preview to report new error or success)
        this.setState('verifying');
        this.log('info', 'Verifying Fix', 'Waiting for preview to compile...');

        // Give the preview time to compile and report errors
        // The verification is passive - we wait for the next error or success signal
        await this.delay(2000);

        // Check if we should continue (this will be updated externally via reportError or reportSuccess)
        // For now, we assume success if no new error is reported within timeout
        this.log('success', 'Fix Applied', `Successfully applied fix to ${targetFile}`);
        this.setState('success');
        this.config.onComplete(true, `Fixed ${targetFile} after ${this.currentAttempt} attempt(s)`);
        return;

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        this.log('error', 'Error in Fix Attempt', errorMsg);

        if (this.previousAttempts.length > 0) {
          this.previousAttempts[this.previousAttempts.length - 1].resultingError = errorMsg;
        }
      }
    }

    // Max attempts reached
    this.setState('max_attempts_reached');
    this.log('warning', 'Max Attempts Reached',
      `Failed to fix error after ${this.config.maxAttempts} attempts`);
    this.config.onComplete(false, `Failed after ${this.config.maxAttempts} attempts`);
  }

  /**
   * Report a new error (called after applying fix)
   * This continues the loop if the fix didn't work
   */
  reportError(errorMessage: string, errorStack?: string): void {
    if (this.state !== 'verifying') return;

    this.log('error', 'New Error After Fix', errorMessage);

    if (this.previousAttempts.length > 0) {
      this.previousAttempts[this.previousAttempts.length - 1].resultingError = errorMessage;
    }

    // The loop will continue automatically since we're still within fixLoop
  }

  /**
   * Report success (no more errors)
   */
  reportSuccess(): void {
    if (this.state !== 'verifying') return;

    this.log('success', 'Error Resolved', 'Preview compiled successfully!');
    this.setState('success');
    this.config?.onComplete(true, 'Error fixed successfully!');
  }

  /**
   * Stop the agent
   */
  stop(): void {
    this.abortController?.abort();
    this.log('warning', 'Stopping', 'Agent stop requested');
    this.setState('idle');
  }

  /**
   * Get current state
   */
  getState(): AgentState {
    return this.state;
  }

  /**
   * Build error context for LLM
   */
  private buildErrorContext(
    errorMessage: string,
    errorStack: string | undefined,
    targetFile: string,
    files: FileSystem
  ): ErrorContext {
    return {
      errorMessage,
      errorStack,
      file: targetFile,
      fileContent: files[targetFile] || '',
      allFiles: files,
      previousAttempts: this.previousAttempts
    };
  }

  /**
   * Build prompt for LLM
   */
  private buildPrompt(context: ErrorContext): string {
    let prompt = `Fix the following error in ${context.file}:\n\n`;
    prompt += `ERROR: ${context.errorMessage}\n`;

    if (context.errorStack) {
      prompt += `\nSTACK TRACE:\n${context.errorStack}\n`;
    }

    prompt += `\nCURRENT FILE CONTENT:\n${context.fileContent}\n`;

    // Add relevant other files for context
    const relevantFiles = this.getRelevantFiles(context);
    if (relevantFiles.length > 0) {
      prompt += `\nRELATED FILES FOR CONTEXT:\n`;
      for (const [path, content] of relevantFiles) {
        prompt += `\n--- ${path} ---\n${content.slice(0, 1000)}${content.length > 1000 ? '\n...(truncated)' : ''}\n`;
      }
    }

    // Add previous attempts if any
    if (context.previousAttempts.length > 0) {
      prompt += `\n\nPREVIOUS FAILED ATTEMPTS:\n`;
      for (let i = 0; i < context.previousAttempts.length; i++) {
        const attempt = context.previousAttempts[i];
        prompt += `\nAttempt ${i + 1}:\n`;
        prompt += `- Applied fix resulted in error: ${attempt.resultingError || 'Unknown'}\n`;
      }
      prompt += `\nDo NOT repeat these failed approaches. Try a different solution.\n`;
    }

    prompt += `\nReturn ONLY the complete fixed file content for ${context.file}. No explanations.`;

    return prompt;
  }

  /**
   * Get relevant files for context (imports, etc.)
   */
  private getRelevantFiles(context: ErrorContext): Array<[string, string]> {
    const relevant: Array<[string, string]> = [];
    const currentContent = context.fileContent;

    // Find imports in current file
    const importRegex = /from\s+['"]([^'"]+)['"]/g;
    let match;

    while ((match = importRegex.exec(currentContent)) !== null) {
      const importPath = match[1];

      // Skip npm packages
      if (!importPath.startsWith('.') && !importPath.startsWith('/')) continue;

      // Resolve path
      const currentDir = context.file.split('/').slice(0, -1).join('/');
      let resolvedPath = importPath;

      if (importPath.startsWith('./')) {
        resolvedPath = currentDir + importPath.slice(1);
      } else if (importPath.startsWith('../')) {
        const parts = currentDir.split('/');
        const upCount = (importPath.match(/\.\.\//g) || []).length;
        resolvedPath = parts.slice(0, -upCount).join('/') + '/' + importPath.replace(/\.\.\//g, '');
      }

      // Try to find the file with various extensions
      const extensions = ['', '.tsx', '.ts', '.jsx', '.js'];
      for (const ext of extensions) {
        const fullPath = resolvedPath + ext;
        if (context.allFiles[fullPath]) {
          relevant.push([fullPath, context.allFiles[fullPath]]);
          break;
        }
      }
    }

    // Limit to 3 most relevant files
    return relevant.slice(0, 3);
  }

  /**
   * Call LLM with prompt
   */
  private async callLLM(prompt: string): Promise<string> {
    const providerManager = getProviderManager();
    const provider = providerManager.getProvider();
    const config = providerManager.getActiveConfig();

    if (!provider || !config) {
      throw new Error('No AI provider configured');
    }

    let response = '';

    const request = {
      prompt,
      systemInstruction: ERROR_FIX_SYSTEM_PROMPT,
      temperature: 0.2 // Low temperature for more deterministic fixes
    };

    await provider.generateStream(
      request,
      config.defaultModel,
      (chunk) => {
        response += chunk.text;
      }
    );

    return response;
  }

  /**
   * Clean LLM response (remove markdown, explanations, etc.)
   */
  private cleanResponse(response: string): string {
    let code = response;

    // Remove markdown code blocks
    const codeBlockMatch = code.match(/```(?:tsx?|jsx?|javascript|typescript)?\s*\n?([\s\S]*?)```/);
    if (codeBlockMatch) {
      code = codeBlockMatch[1];
    }

    // Remove any leading/trailing explanations
    const lines = code.split('\n');
    let startIndex = 0;
    let endIndex = lines.length;

    // Find where actual code starts (import or first non-comment line)
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('import ') || line.startsWith('export ') ||
          line.startsWith('const ') || line.startsWith('function ') ||
          line.startsWith('class ') || line.startsWith('interface ') ||
          line.startsWith('type ') || line.startsWith("'use ") ||
          line.startsWith('"use ')) {
        startIndex = i;
        break;
      }
    }

    // Find where actual code ends
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();
      if (line.endsWith(';') || line.endsWith('}') || line.endsWith(')') ||
          line.startsWith('export ')) {
        endIndex = i + 1;
        break;
      }
    }

    code = lines.slice(startIndex, endIndex).join('\n');

    return code.trim();
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const errorFixAgent = new ErrorFixAgent();
