/**
 * Async Utility Functions
 *
 * Reusable utilities for common async patterns:
 * - Debouncing actions
 * - Lock-based concurrency control
 * - Delay utilities
 */

/**
 * Creates a debounced version of an async function
 *
 * @param fn - The function to debounce
 * @param delay - Delay in milliseconds
 * @returns A debounced function that can be called multiple times
 *
 * @example
 * ```typescript
 * const debouncedSave = createDebouncedAction(
 *   () => saveToStorage(),
 *   300
 * );
 *
 * // Multiple rapid calls only execute once after delay
 * debouncedSave();
 * debouncedSave();
 * debouncedSave(); // Only this one executes after 300ms
 * ```
 */
export function createDebouncedAction<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      fn(...args);
      timeout = null;
    }, delay);
  };
}

/**
 * Executes a function with lock-based concurrency control
 * Ensures only one operation runs at a time per lock
 *
 * @param lock - The current lock promise
 * @param fn - The async function to execute
 * @returns A promise that resolves with the function result
 *
 * @example
 * ```typescript
 * let myLock: Promise<void> = Promise.resolve();
 *
 * async function saveData(data: Data) {
 *   return withLock(myLock, async () => {
 *     // Only one save operation runs at a time
 *     await db.save(data);
 *   });
 * }
 * ```
 */
export async function withLock<T>(
  lock: Promise<void>,
  fn: () => Promise<T>
): Promise<T> {
  const previousLock = lock;
  let releaseLock: () => void = () => {};

  // Create new lock for next operation
  lock = new Promise((resolve) => {
    releaseLock = resolve;
  });

  try {
    // Wait for any previous operation to complete
    await previousLock;
    // Execute the function
    return await fn();
  } finally {
    // Release the lock
    releaseLock();
  }
}

/**
 * Lock manager for easier lock handling
 * Encapsulates the lock promise and provides a clean API
 */
export class LockManager {
  private lock: Promise<void> = Promise.resolve();

  /**
   * Execute a function with lock protection
   */
  async run<T>(fn: () => Promise<T>): Promise<T> {
    const previousLock = this.lock;
    let releaseLock: () => void = () => {};

    this.lock = new Promise((resolve) => {
      releaseLock = resolve;
    });

    try {
      await previousLock;
      return await fn();
    } finally {
      releaseLock();
    }
  }

  /**
   * Check if the lock is currently held
   */
  isLocked(): boolean {
    // Promise.race with a resolved promise checks if lock is pending
    return Promise.race([this.lock, Promise.resolve()]) === this.lock;
  }
}

/**
 * Creates a delayed promise
 *
 * @param ms - Milliseconds to delay
 * @returns A promise that resolves after the delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Creates a timeout for an async operation
 *
 * @param promise - The promise to wait for
 * @param timeoutMs - Timeout in milliseconds
 * @param errorMessage - Custom error message (optional)
 * @returns The promise result or throws timeout error
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage = `Operation timed out after ${timeoutMs}ms`
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
}

/**
 * Retry an async function with exponential backoff
 *
 * @param fn - The function to retry
 * @param options - Retry options
 * @returns The function result or throws last error
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    initialDelay?: number;
    backoffMultiplier?: number;
    maxDelay?: number;
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelay = 100,
    backoffMultiplier = 2,
    maxDelay = 5000,
  } = options;

  let lastError: Error | undefined;
  let currentDelay = initialDelay;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxAttempts) {
        break;
      }

      // Wait before retry with exponential backoff
      await delay(Math.min(currentDelay, maxDelay));
      currentDelay *= backoffMultiplier;
    }
  }

  throw lastError || new Error('Retry failed');
}
