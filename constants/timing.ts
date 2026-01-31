/**
 * Timing Constants
 *
 * All time-related constants in milliseconds unless otherwise noted.
 */

// Auto-save intervals
export const AUTO_SAVE_INTERVAL_MS = 30_000; // 30 seconds
export const WIP_SAVE_DEBOUNCE_MS = 1_000; // 1 second
export const STREAMING_SAVE_DEBOUNCE_MS = 2_000; // 2 seconds

// UI delays
export const CREDITS_MODAL_DELAY_MS = 1_000; // 1 second
export const TOAST_DURATION_MS = 3_000; // 3 seconds
export const DEBOUNCE_DEFAULT_MS = 300; // 300ms
export const COPY_FEEDBACK_RESET_MS = 2_000; // 2 seconds — clipboard "Copied!" feedback
export const CHAT_SAVE_DEBOUNCE_MS = 500; // 500ms — chat history save debounce
export const ERROR_DISPLAY_DURATION_MS = 3_000; // 3 seconds — error message display
export const SAVE_INDICATOR_DURATION_MS = 1_500; // 1.5 seconds — save/copy indicator in editor
export const CONTEXT_POLL_INTERVAL_MS = 2_000; // 2 seconds — context stats update interval

// API timeouts
export const API_TIMEOUT_MS = 30_000; // 30 seconds
export const GENERATION_TIMEOUT_MS = 300_000; // 5 minutes
export const TEST_CONNECTION_TIMEOUT_MS = 30_000; // 30 seconds
export const LIST_MODELS_TIMEOUT_MS = 30_000; // 30 seconds

// File lock timeout
export const FILE_LOCK_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
