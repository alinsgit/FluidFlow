import { useState, useCallback, useRef, useEffect } from 'react';
import { COPY_FEEDBACK_RESET_MS } from '../constants/timing';

/**
 * Reusable hook for copy-to-clipboard with visual feedback.
 * Replaces the duplicated clipboard pattern across 17+ components.
 *
 * @param resetDelay - Time in ms before `isCopied` resets to false (default: 2000)
 * @returns `{ isCopied, copy }` — `copy(text)` writes to clipboard and sets `isCopied` for `resetDelay` ms
 */
export function useCopyToClipboard(resetDelay = COPY_FEEDBACK_RESET_MS) {
  const [isCopied, setIsCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setIsCopied(false), resetDelay);
    } catch {
      // Fallback: textarea-based copy for older browsers / insecure contexts
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setIsCopied(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setIsCopied(false), resetDelay);
    }
  }, [resetDelay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return { isCopied, copy };
}
