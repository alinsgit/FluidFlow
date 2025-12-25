/**
 * AutoFix AI Prompts
 *
 * Human-like, context-aware prompts for AI-assisted error fixing.
 * These prompts are designed to give the AI maximum context for accurate fixes.
 */

import { ParsedError } from './types';
import { LogEntry } from '../../types';

// ============================================================================
// System Instructions
// ============================================================================

export const AUTOFIX_SYSTEM_INSTRUCTION = `You are an expert React/TypeScript debugger. Your job is to fix runtime errors in React applications.

## Your Capabilities
- You understand React 19, TypeScript 5.9+, Tailwind CSS 4, and modern JavaScript
- You can identify the root cause of errors from stack traces and error messages
- You fix code while preserving the original intent and style
- You NEVER introduce new bugs while fixing existing ones

## Response Rules
1. Return ONLY the complete fixed code - no explanations, no markdown
2. Keep ALL imports, even unused ones (the bundler will handle tree-shaking)
3. Preserve component structure and naming
4. Fix the specific error without refactoring unrelated code
5. If you're unsure, add defensive checks (optional chaining, null checks)

## Common Error Patterns You Know
- Import errors: Wrong package names, missing exports, bare specifiers
- Syntax errors: Missing arrows (=>), unclosed brackets, malformed JSX
- Runtime errors: Cannot read property of undefined/null
- Type errors: Wrong prop types, missing required props
- Hook errors: Conditional hooks, hooks outside components

## Tech Stack Context
- React 19.x (NOT 18) - Use new features like useId, useOptimistic
- TypeScript 5.9+ with strict mode
- Tailwind CSS 4.x (v4 syntax with @theme)
- lucide-react for icons
- motion (NOT framer-motion) for animations
- react-router (NOT react-router-dom) for routing`;

// ============================================================================
// Prompt Builders
// ============================================================================

export interface PromptContext {
  errorMessage: string;
  errorStack?: string;
  targetFile: string;
  targetFileContent: string;
  parsedError?: ParsedError;
  relatedFiles?: Record<string, string>;
  logs?: LogEntry[];
  previousAttempts?: string[];
  techStackContext?: string;
}

/**
 * Build a quick fix prompt for simple errors
 */
export function buildQuickFixPrompt(ctx: PromptContext): string {
  const { errorMessage, parsedError, targetFile, targetFileContent } = ctx;

  let prompt = `Fix this error in ${targetFile}:\n\n`;
  prompt += `ERROR: ${errorMessage}\n`;

  if (parsedError) {
    if (parsedError.suggestedFix) {
      prompt += `HINT: ${parsedError.suggestedFix}\n`;
    }
    if (parsedError.line) {
      prompt += `LOCATION: Line ${parsedError.line}${parsedError.column ? `:${parsedError.column}` : ''}\n`;
    }
  }

  prompt += `\nCODE:\n\`\`\`tsx\n${targetFileContent}\n\`\`\`\n\n`;
  prompt += `Return ONLY the complete fixed file. No explanations.`;

  return prompt;
}

/**
 * Build a full context prompt with related files
 */
export function buildFullContextPrompt(ctx: PromptContext): string {
  const {
    errorMessage,
    errorStack,
    targetFile,
    targetFileContent,
    parsedError,
    relatedFiles,
    logs,
  } = ctx;

  let prompt = `# Error Fix Request\n\n`;

  // Error details
  prompt += `## Error\n`;
  prompt += `\`\`\`\n${errorMessage}\n\`\`\`\n\n`;

  if (errorStack) {
    prompt += `## Stack Trace\n`;
    prompt += `\`\`\`\n${errorStack.slice(0, 1000)}\n\`\`\`\n\n`;
  }

  // Analysis
  if (parsedError) {
    prompt += `## Analysis\n`;
    prompt += `- Type: ${parsedError.type}\n`;
    prompt += `- Category: ${parsedError.category}\n`;
    if (parsedError.identifier) prompt += `- Identifier: ${parsedError.identifier}\n`;
    if (parsedError.importPath) prompt += `- Import: ${parsedError.importPath}\n`;
    if (parsedError.suggestedFix) prompt += `- Suggested: ${parsedError.suggestedFix}\n`;
    prompt += `\n`;
  }

  // Target file
  prompt += `## File to Fix: ${targetFile}\n`;
  prompt += `\`\`\`tsx\n${targetFileContent}\n\`\`\`\n\n`;

  // Related files for context
  if (relatedFiles && Object.keys(relatedFiles).length > 0) {
    prompt += `## Related Files (for context only)\n`;
    for (const [path, content] of Object.entries(relatedFiles).slice(0, 3)) {
      const truncated = content.slice(0, 1500);
      prompt += `\n### ${path}\n`;
      prompt += `\`\`\`tsx\n${truncated}${content.length > 1500 ? '\n// ... truncated' : ''}\n\`\`\`\n`;
    }
    prompt += `\n`;
  }

  // Console logs if relevant
  if (logs && logs.length > 0) {
    const errorLogs = logs.filter(l => l.type === 'error').slice(-5);
    if (errorLogs.length > 0) {
      prompt += `## Recent Console Errors\n`;
      errorLogs.forEach(l => {
        prompt += `- ${l.message.slice(0, 200)}\n`;
      });
      prompt += `\n`;
    }
  }

  // Instructions
  prompt += `## Instructions\n`;
  prompt += `1. Fix the error in ${targetFile}\n`;
  prompt += `2. Return ONLY the complete fixed file\n`;
  prompt += `3. Keep all imports and component structure\n`;
  prompt += `4. Do not explain, just return the code\n`;

  return prompt;
}

/**
 * Build an iterative fix prompt with feedback from previous attempts
 */
export function buildIterativePrompt(ctx: PromptContext): string {
  const {
    errorMessage,
    targetFile,
    targetFileContent,
    previousAttempts,
  } = ctx;

  let prompt = `# Error Fix - Retry\n\n`;
  prompt += `The previous fix attempt(s) did not resolve the error.\n\n`;

  prompt += `## Error (still occurring)\n`;
  prompt += `\`\`\`\n${errorMessage}\n\`\`\`\n\n`;

  if (previousAttempts && previousAttempts.length > 0) {
    prompt += `## What Didn't Work\n`;
    previousAttempts.forEach((attempt, i) => {
      prompt += `${i + 1}. ${attempt}\n`;
    });
    prompt += `\n`;
    prompt += `Try a DIFFERENT approach. Think about:\n`;
    prompt += `- Is the error in a different place than assumed?\n`;
    prompt += `- Are there multiple issues compounding?\n`;
    prompt += `- Is there a type mismatch or missing import?\n\n`;
  }

  prompt += `## Current Code (${targetFile})\n`;
  prompt += `\`\`\`tsx\n${targetFileContent}\n\`\`\`\n\n`;

  prompt += `Return the COMPLETE fixed file. Different approach this time.`;

  return prompt;
}

/**
 * Build a regeneration prompt for severely broken components
 */
export function buildRegenerationPrompt(ctx: PromptContext): string {
  const {
    errorMessage,
    targetFile,
    targetFileContent,
    relatedFiles,
    techStackContext,
  } = ctx;

  // Extract component info
  const componentName = extractComponentName(targetFileContent);
  const imports = extractImports(targetFileContent);
  const jsx = extractJSX(targetFileContent);
  const props = extractProps(targetFileContent);

  let prompt = `# Component Regeneration Request\n\n`;
  prompt += `The component "${componentName || 'Component'}" has errors that require regeneration.\n\n`;

  prompt += `## Error\n`;
  prompt += `\`\`\`\n${errorMessage}\n\`\`\`\n\n`;

  prompt += `## Component Info\n`;
  prompt += `- File: ${targetFile}\n`;
  prompt += `- Name: ${componentName || 'Unknown'}\n`;
  if (props) prompt += `- Props: ${props}\n`;
  prompt += `\n`;

  prompt += `## Original Imports\n`;
  prompt += `\`\`\`tsx\n${imports.join('\n')}\n\`\`\`\n\n`;

  if (jsx) {
    prompt += `## Original JSX Structure (preserve this)\n`;
    prompt += `\`\`\`tsx\n${jsx.slice(0, 2000)}\n\`\`\`\n\n`;
  }

  if (relatedFiles && Object.keys(relatedFiles).length > 0) {
    prompt += `## Related Components (reference for types/props)\n`;
    for (const [path, content] of Object.entries(relatedFiles).slice(0, 2)) {
      prompt += `\n### ${path}\n`;
      prompt += `\`\`\`tsx\n${content.slice(0, 1000)}\n\`\`\`\n`;
    }
    prompt += `\n`;
  }

  if (techStackContext) {
    prompt += `## Tech Stack\n${techStackContext}\n\n`;
  }

  prompt += `## Instructions\n`;
  prompt += `1. Regenerate the component from scratch\n`;
  prompt += `2. Keep the same visual structure and functionality\n`;
  prompt += `3. Fix all errors while preserving intent\n`;
  prompt += `4. Use proper TypeScript types\n`;
  prompt += `5. Return ONLY the complete component file\n`;

  return prompt;
}

// ============================================================================
// Helpers
// ============================================================================

function extractComponentName(code: string): string | null {
  const match = code.match(/export\s+(?:default\s+)?(?:function|const)\s+(\w+)/);
  return match ? match[1] : null;
}

function extractImports(code: string): string[] {
  return code.match(/^import\s+.+$/gm) || [];
}

function extractJSX(code: string): string | null {
  const match = code.match(/return\s*\(\s*([\s\S]*?)\s*\);?\s*(?:}|$)/);
  return match ? match[1] : null;
}

function extractProps(code: string): string | null {
  const match = code.match(/(?:interface|type)\s+\w*Props\s*[=]?\s*\{([^}]+)\}/);
  return match ? match[1].trim() : null;
}

// ============================================================================
// Export convenience function
// ============================================================================

export function buildPromptForStrategy(
  strategy: 'quick' | 'full' | 'iterative' | 'regenerate',
  ctx: PromptContext
): { systemInstruction: string; prompt: string } {
  const systemInstruction = AUTOFIX_SYSTEM_INSTRUCTION + (ctx.techStackContext ? `\n\n${ctx.techStackContext}` : '');

  let prompt: string;
  switch (strategy) {
    case 'quick':
      prompt = buildQuickFixPrompt(ctx);
      break;
    case 'full':
      prompt = buildFullContextPrompt(ctx);
      break;
    case 'iterative':
      prompt = buildIterativePrompt(ctx);
      break;
    case 'regenerate':
      prompt = buildRegenerationPrompt(ctx);
      break;
    default:
      prompt = buildQuickFixPrompt(ctx);
  }

  return { systemInstruction, prompt };
}
