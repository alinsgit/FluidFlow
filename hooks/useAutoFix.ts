/**
 * Auto-Fix Hook
 *
 * Manages automatic error fixing functionality for the preview panel.
 * Uses the ultra-powerful ErrorFixEngine for guaranteed error resolution.
 * Handles error classification, simple pattern-based fixes, and AI-powered fixes.
 */

import { useCallback, useRef, useState, useEffect } from 'react';
import { FileSystem, LogEntry } from '../types';
import { debugLog } from './useDebugStore';
import { classifyError, canAutoFix, wasRecentlyFixed, recordFixAttempt, attemptAutoFix } from '../services/autoFixService';
import { tryFixBareSpecifierMultiFile } from '../utils/simpleFixes';
import { parseStackTrace } from '../utils/errorContext';
import { ErrorFixEngine, FixStrategy } from '../services/errorFixEngine';
import { verifyFix } from '../services/fixVerification';

interface UseAutoFixOptions {
  files: FileSystem;
  setFiles: (files: FileSystem) => void;
  appCode: string | undefined;
  selectedModel: string;
  isGenerating: boolean;
  logs: LogEntry[];
  setLogs: React.Dispatch<React.SetStateAction<LogEntry[]>>;
  onSendErrorToChat?: (errorMessage: string) => void;
  generateSystemInstruction: () => string;
}

interface UseAutoFixReturn {
  // State
  autoFixEnabled: boolean;
  setAutoFixEnabled: (enabled: boolean) => void;
  isAutoFixing: boolean;
  autoFixToast: string | null;
  pendingAutoFix: string | null;
  failedAutoFixError: string | null;
  currentError: string | null;
  currentErrorStack: string | undefined;
  errorTargetFile: string;
  currentFixStrategy: FixStrategy | null;
  setCurrentError: (error: string | null) => void;
  setCurrentErrorStack: (stack: string | undefined) => void;
  setErrorTargetFile: (file: string) => void;

  // Handlers
  handleConfirmAutoFix: () => void;
  handleDeclineAutoFix: () => void;
  handleSendErrorToChat: () => void;
  handleDismissFailedError: () => void;
  abortFix: () => void;

  // Error processing
  processError: (errorMsg: string, stack?: string) => void;

  // Helpers (for ErrorFixPanel)
  parseStackTrace: (errorMessage: string) => { file?: string; line?: number; column?: number };
}

/**
 * Hook for managing auto-fix functionality
 */
export function useAutoFix({
  files,
  setFiles,
  appCode,
  selectedModel,
  isGenerating,
  logs,
  setLogs,
  onSendErrorToChat,
  generateSystemInstruction,
}: UseAutoFixOptions): UseAutoFixReturn {
  // State
  const [autoFixEnabled, setAutoFixEnabled] = useState(true);
  const [isAutoFixing, setIsAutoFixing] = useState(false);
  const [autoFixToast, setAutoFixToast] = useState<string | null>(null);
  const [pendingAutoFix, setPendingAutoFix] = useState<string | null>(null);
  const [failedAutoFixError, setFailedAutoFixError] = useState<string | null>(null);
  const [currentError, setCurrentError] = useState<string | null>(null);
  const [currentErrorStack, setCurrentErrorStack] = useState<string | undefined>(undefined);
  const [errorTargetFile, setErrorTargetFile] = useState<string>('src/App.tsx');

  // Refs
  const autoFixTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastFixedErrorRef = useRef<string | null>(null);
  const filesRef = useRef<FileSystem>(files);

  // Keep filesRef updated
  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (autoFixTimeoutRef.current) clearTimeout(autoFixTimeoutRef.current);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  // Current fix strategy for UI display
  const [currentFixStrategy, setCurrentFixStrategy] = useState<FixStrategy | null>(null);

  // Engine instance ref
  const engineRef = useRef<ErrorFixEngine | null>(null);

  // Main auto-fix function using ErrorFixEngine
  const autoFixError = useCallback(async (errorMessage: string) => {
    console.log('[AutoFix] autoFixError called:', errorMessage.slice(0, 100));

    if (!appCode || isAutoFixing || isGenerating) {
      return;
    }

    // Skip if we just fixed this error
    if (lastFixedErrorRef.current === errorMessage) {
      return;
    }

    setPendingAutoFix(null);
    setIsAutoFixing(true);
    setAutoFixToast('🔍 Analyzing error...');
    lastFixedErrorRef.current = errorMessage;

    const requestId = debugLog.request('auto-fix', {
      model: selectedModel,
      prompt: `Fix runtime error: ${errorMessage}`,
      metadata: { errorMessage }
    });
    const startTime = Date.now();

    try {
      // Determine target file
      const stackInfo = parseStackTrace(errorMessage);
      const targetFile = stackInfo.file || 'src/App.tsx';

      // Create and run the ErrorFixEngine
      const engine = new ErrorFixEngine({
        files: filesRef.current,
        errorMessage,
        errorStack: currentErrorStack,
        targetFile,
        appCode,
        logs,
        systemInstruction: generateSystemInstruction(),
        onProgress: (stage, progress) => {
          setAutoFixToast(`${stage} (${progress}%)`);
        },
        onStrategyChange: (strategy) => {
          setCurrentFixStrategy(strategy);
          console.log('[AutoFix] Strategy changed to:', strategy);
        },
        maxAttempts: 10,
        timeout: 90000, // 90 seconds max
      });

      engineRef.current = engine;

      const result = await engine.fix();

      debugLog.response('auto-fix', {
        id: requestId,
        model: selectedModel,
        duration: Date.now() - startTime,
        response: `Strategy: ${result.strategy}, Attempts: ${result.attempts}`,
        metadata: {
          success: result.success,
          strategy: result.strategy,
          attempts: result.attempts,
        }
      });

      if (result.success && Object.keys(result.fixedFiles).length > 0) {
        // Verify the fix before applying
        const changedFiles = Object.keys(result.fixedFiles);
        const verification = verifyFix({
          originalError: errorMessage,
          originalFiles: filesRef.current,
          fixedFiles: { ...filesRef.current, ...result.fixedFiles },
          changedFiles,
          strictMode: false,
        });

        if (verification.isValid || verification.confidence !== 'low') {
          // Apply the fix
          setFiles({ ...filesRef.current, ...result.fixedFiles });

          const fileNames = changedFiles.map(f => f.split('/').pop()).join(', ');
          setAutoFixToast(`✅ Fixed ${fileNames}!`);
          setFailedAutoFixError(null);

          // Clear the error from logs
          setLogs(prev => prev.map(l =>
            l.message === errorMessage ? { ...l, isFixed: true } : l
          ));

          console.log('[AutoFix] Fix applied successfully:', {
            strategy: result.strategy,
            files: changedFiles,
            verification: verification.confidence,
          });
        } else {
          // Fix verification failed
          console.warn('[AutoFix] Fix verification failed:', verification.issues);
          setFailedAutoFixError(errorMessage);
          setAutoFixToast(null);
        }

        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
        toastTimeoutRef.current = setTimeout(() => setAutoFixToast(null), 3000);
      } else {
        console.warn('[AutoFix] All fix strategies exhausted');
        console.warn('[AutoFix] Failure report:', result.error);
        setFailedAutoFixError(errorMessage);
        setAutoFixToast(null);
      }
    } catch (e) {
      console.error('[AutoFix] Exception:', e);
      setFailedAutoFixError(errorMessage);
      setAutoFixToast(null);
      debugLog.error('auto-fix', e instanceof Error ? e.message : 'Auto-fix failed', {
        id: requestId,
        model: selectedModel,
        duration: Date.now() - startTime
      });
    } finally {
      setIsAutoFixing(false);
      setCurrentFixStrategy(null);
      engineRef.current = null;
    }
  }, [appCode, isAutoFixing, isGenerating, selectedModel, generateSystemInstruction, logs, currentErrorStack, setFiles, setLogs]);

  // Confirmation handlers
  const handleConfirmAutoFix = useCallback(() => {
    console.log('[AutoFix] Fix with AI button clicked, pendingAutoFix:', pendingAutoFix?.slice(0, 100));
    if (pendingAutoFix) {
      autoFixError(pendingAutoFix);
    }
  }, [pendingAutoFix, autoFixError]);

  const handleDeclineAutoFix = useCallback(() => {
    setPendingAutoFix(null);
  }, []);

  const handleSendErrorToChat = useCallback(() => {
    if (failedAutoFixError && onSendErrorToChat) {
      onSendErrorToChat(failedAutoFixError);
      setFailedAutoFixError(null);
    }
  }, [failedAutoFixError, onSendErrorToChat]);

  const handleDismissFailedError = useCallback(() => {
    setFailedAutoFixError(null);
  }, []);

  // Abort current fix operation
  const abortFix = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.abort();
      console.log('[AutoFix] Fix operation aborted by user');
    }
    setIsAutoFixing(false);
    setAutoFixToast(null);
    setCurrentFixStrategy(null);
  }, []);

  // Process error from message listener
  const processError = useCallback((errorMsg: string, stack?: string) => {
    // Update Error Fix Panel state
    setCurrentError(errorMsg);
    setCurrentErrorStack(stack);

    // Parse stack trace to determine target file
    const stackInfo = parseStackTrace(errorMsg);
    if (stackInfo.file) {
      setErrorTargetFile(stackInfo.file);
    }

    console.log('[AutoFix] Error detected:', errorMsg.slice(0, 150));
    console.log('[AutoFix] State check - autoFixEnabled:', autoFixEnabled, 'isAutoFixing:', isAutoFixing, 'pendingAutoFix:', !!pendingAutoFix);

    if (!autoFixEnabled || isAutoFixing || pendingAutoFix) {
      return;
    }

    // Use robust error classification
    const errorInfo = classifyError(errorMsg);
    console.log('[AutoFix] Error classification:', errorInfo);

    // Skip ignorable/transient errors
    if (errorInfo.isIgnorable) {
      console.log('[AutoFix] Ignoring transient error:', errorMsg.slice(0, 100));
      return;
    }

    // Skip if already fixed
    if (lastFixedErrorRef.current === errorMsg || wasRecentlyFixed(errorMsg)) {
      return;
    }

    // Try simple auto-fix
    if (appCode && canAutoFix(errorMsg)) {
      try {
        const errorLower = errorMsg.toLowerCase();
        const isBareSpecifierError = errorLower.includes('bare specifier') || errorLower.includes('was not remapped');

        // Try multi-file bare specifier fix first
        if (isBareSpecifierError) {
          console.log('[AutoFix] Attempting multi-file bare specifier fix');
          const multiFileResult = tryFixBareSpecifierMultiFile(errorMsg, filesRef.current);

          if (multiFileResult.fixed && multiFileResult.multiFileChanges) {
            const changedFiles = Object.keys(multiFileResult.multiFileChanges);
            console.log('[AutoFix] Multi-file fix successful, changed files:', changedFiles);

            lastFixedErrorRef.current = errorMsg;
            setFiles({ ...filesRef.current, ...multiFileResult.multiFileChanges });
            setAutoFixToast(`⚡ ${multiFileResult.description}`);
            if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
            toastTimeoutRef.current = setTimeout(() => setAutoFixToast(null), 3000);
            console.log('[AutoFix] Applied multi-file fix:', multiFileResult.description);

            // Record fix analytics
            recordFixAttempt(errorMsg, 'import', 'bare-specifier-multifile', true, Date.now() - Date.now());
            return;
          }
        }

        // Single file fix fallback
        let targetFile = 'src/App.tsx';
        let targetFileContent = appCode;

        if (isBareSpecifierError) {
          // Find the file that imports the bare specifier
          const specifierMatch = errorMsg.match(/["']?(src\/[\w./-]+)["']?\s*(?:was a bare specifier|was not remapped)/i);
          if (specifierMatch) {
            const bareSpecifier = specifierMatch[1];
            const bareWithoutExt = bareSpecifier.replace(/\.(tsx?|jsx?)$/, '');

            console.log('[AutoFix] Bare specifier error, searching for import of:', bareSpecifier);

            for (const [filePath, content] of Object.entries(filesRef.current)) {
              if (content.includes(bareSpecifier) || content.includes(bareWithoutExt)) {
                console.log('[AutoFix] Found import in:', filePath);
                targetFile = filePath;
                targetFileContent = content;
                break;
              }
            }
          }
        } else {
          const stackInfo = parseStackTrace(errorMsg);
          targetFile = stackInfo.file || 'src/App.tsx';
          targetFileContent = filesRef.current[targetFile] || appCode;
        }

        console.log('[AutoFix] Simple fix attempt for:', targetFile);
        console.log('[AutoFix] Target file exists:', !!filesRef.current[targetFile], 'Content length:', targetFileContent?.length);

        const fixResult = attemptAutoFix(errorMsg, targetFileContent);
        console.log('[AutoFix] Fix result:', { success: fixResult.success, wasAINeeded: fixResult.wasAINeeded, error: fixResult.error, fixType: fixResult.fixType });

        if (fixResult.success && !fixResult.wasAINeeded) {
          lastFixedErrorRef.current = errorMsg;
          setFiles({ ...filesRef.current, [targetFile]: fixResult.newCode });
          setAutoFixToast(`⚡ ${fixResult.description}`);
          if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
          toastTimeoutRef.current = setTimeout(() => setAutoFixToast(null), 3000);
          console.log('[AutoFix] Applied:', fixResult.description, `(${fixResult.fixType})`, 'to:', targetFile);

          // Record fix analytics
          recordFixAttempt(errorMsg, errorInfo.category, fixResult.fixType || 'local', true, 0);
          return;
        }

        if (fixResult.error) {
          console.log('[AutoFix] Could not fix:', fixResult.error);
        }
      } catch (e) {
        console.error('[AutoFix] Service error:', e);
      }
    }

    // Show AI fix confirmation after delay
    console.log('[AutoFix] Checking if AI dialog should show:', { isFixable: errorInfo.isFixable, priority: errorInfo.priority });
    if (errorInfo.isFixable || errorInfo.priority >= 3) {
      if (autoFixTimeoutRef.current) clearTimeout(autoFixTimeoutRef.current);
      autoFixTimeoutRef.current = setTimeout(() => {
        console.log('[AutoFix] Showing AI fix dialog for:', errorMsg.slice(0, 100));
        setPendingAutoFix(errorMsg);
      }, 500);
    } else {
      console.log('[AutoFix] Not showing AI dialog - error not fixable or low priority');
    }
  }, [autoFixEnabled, isAutoFixing, pendingAutoFix, appCode, setFiles]);

  return {
    // State
    autoFixEnabled,
    setAutoFixEnabled,
    isAutoFixing,
    autoFixToast,
    pendingAutoFix,
    failedAutoFixError,
    currentError,
    currentErrorStack,
    errorTargetFile,
    currentFixStrategy,
    setCurrentError,
    setCurrentErrorStack,
    setErrorTargetFile,

    // Handlers
    handleConfirmAutoFix,
    handleDeclineAutoFix,
    handleSendErrorToChat,
    handleDismissFailedError,
    abortFix,

    // Error processing
    processError,

    // Helpers
    parseStackTrace,
  };
}
