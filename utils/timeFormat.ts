/**
 * Time Formatting Utilities
 *
 * Shared time/duration formatting functions to avoid code duplication.
 */

/**
 * Format duration in milliseconds to human-readable string
 * 
 * @param ms - Duration in milliseconds
 * @returns Formatted string (e.g., "500ms", "1.5s")
 */
export const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
};

/**
 * Format timestamp to localized time string
 * 
 * @param timestamp - Unix timestamp in milliseconds or Date object
 * @returns Localized time string
 */
export const formatTime = (timestamp: number | Date): string => {
  const d = typeof timestamp === 'number' ? new Date(timestamp) : timestamp;
  return d.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3
  });
};

/**
 * Format character count to human-readable size
 * 
 * @param chars - Number of characters
 * @returns Formatted string (e.g., "512 chars", "1.2KB")
 */
export const formatSize = (chars: number): string => {
  if (chars < 1024) return `${chars} chars`;
  return `${(chars / 1024).toFixed(1)}KB`;
};

/**
 * Format date to relative time (e.g., "2 hours ago", "just now")
 * 
 * @param date - Date object or timestamp
 * @returns Relative time string
 */
export const formatRelativeTime = (date: Date | number): string => {
  const d = typeof date === 'number' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};
