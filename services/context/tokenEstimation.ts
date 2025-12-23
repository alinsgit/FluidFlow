/**
 * Token Estimation
 *
 * Utilities for estimating token counts from text.
 * AI-008 fix: Improved token estimation using word-based heuristics.
 */

/**
 * Estimates the token count for a given text.
 * Uses word-based heuristics for better accuracy than simple character division.
 *
 * Heuristics:
 * - Average ~0.75 tokens per word for English
 * - Average ~1.3 tokens per word for code
 * - Code operators/symbols: ~0.5 tokens per character
 * - Numbers: ~1 token each
 *
 * @param text - The text to estimate tokens for
 * @returns Estimated token count (minimum 1 for non-empty strings)
 */
export function estimateTokens(text: string): number {
  if (!text || text.length === 0) return 0;

  // Count words (sequences of alphanumeric characters)
  const wordMatches = text.match(/\b\w+\b/g);
  const wordCount = wordMatches ? wordMatches.length : 0;

  // Count code-like tokens (operators, brackets, special chars)
  const codeMatches = text.match(/[{}()[\]<>:;,=+\-*/&|!@#$%^]+/g);
  const codeCharCount = codeMatches ? codeMatches.reduce((sum: number, t: string) => sum + t.length, 0) : 0;

  // Count numbers (each number is typically 1 token)
  const numberMatches = text.match(/\b\d+\.?\d*\b/g);
  const numberCount = numberMatches ? numberMatches.length : 0;

  // Estimate based on content type
  // - Words: ~1.3 tokens per word (accounts for subword tokenization)
  // - Code tokens: ~0.5 tokens per character (densely packed)
  // - Numbers: ~1 token each

  const wordTokens = Math.ceil(wordCount * 1.3);
  const codeTokens = Math.ceil(codeCharCount * 0.5);

  // Add a small base for formatting/whitespace
  const totalEstimate = wordTokens + codeTokens + numberCount;

  // Ensure minimum of 1 token for non-empty strings, with fallback to char-based for very short strings
  return Math.max(1, totalEstimate || Math.ceil(text.length / 4));
}

/**
 * Estimates tokens for an array of messages
 * @param messages - Array of messages with content
 * @returns Total estimated tokens
 */
export function estimateMessagesTokens(messages: Array<{ content: string }>): number {
  return messages.reduce((sum, m) => sum + estimateTokens(m.content), 0);
}
