import React, { useState, useCallback, useImperativeHandle, forwardRef, useEffect, useRef } from 'react';
import { Layers, RotateCcw, Settings, ChevronDown, SlidersHorizontal, Upload } from 'lucide-react';
import { FileSystem, ChatMessage, ChatAttachment, FileChange } from '../../types';
import { estimateTokenCount } from './utils';
import { restoreFromHistoryEntries, getEntriesUpToTimestamp, restoreFromSingleEntry } from './utils/restoreHistory';
import { executeConsultantMode } from './utils/consultantMode';
import { debugLog, resetDebugState } from '../../hooks/useDebugStore';
import { clearAllFileTrackers } from '../../services/context/fileContextTracker';
import { useTechStack } from '../../hooks/useTechStack';
import { useGenerationState } from '../../hooks/useGenerationState';
import { useContinuationGeneration } from '../../hooks/useContinuationGeneration';
import { useInspectEdit, InspectContext } from '../../hooks/useInspectEdit';
import { useCodeGeneration } from '../../hooks/useCodeGeneration';
import { getProviderManager, GenerationRequest } from '../../services/ai';
import { InspectedElement, EditScope } from '../PreviewPanel/ComponentInspector';
import { useAIHistory } from '../../hooks/useAIHistory';
import { LazyAIHistoryModal, LazyCodebaseSyncModal } from '../LazyModals';
import { TechStackModal } from './TechStackModal';
import { PromptEngineerModal } from './PromptEngineerModal';
import { BatchGenerationModal } from './BatchGenerationModal';
import { ContextIndicator } from '../ContextIndicator';
import { getFluidFlowConfig } from '../../services/fluidflowConfig';
import { addPromptToHistory } from '@/services/promptHistory';

// Context hooks - direct consumption instead of prop drilling
import { useAppContext } from '../../contexts/AppContext';
import { useUI } from '../../contexts/UIContext';

// Sub-components
import { ChatPanel } from './ChatPanel';
import { ChatInput } from './ChatInput';
import { SettingsPanel } from './SettingsPanel';
import { ModeToggle } from './ModeToggle';
import { ResetConfirmModal } from './ResetConfirmModal';
import { runnerApi } from '@/services/projectApi';
import { getChatMessages, saveChatMessages, clearChatMessages, SCRATCH_WIP_ID } from '@/services/wipStorage';
import { DEFAULT_FILES } from '@/constants/defaultFiles';

// Local hooks
import { useContextSync, useControlPanelModals } from './hooks';


// Ref interface for external access
export interface ControlPanelRef {
  handleInspectEdit: (prompt: string, element: InspectedElement, scope: EditScope) => Promise<void>;
  sendErrorToChat: (errorMessage: string) => void;
}

/**
 * Minimal props interface - most data now comes from contexts directly
 * Reduced from 48 props to 12 props (75% reduction)
 */
interface ControlPanelProps {
  // App.tsx callbacks that wrap context methods with additional logic
  resetApp: () => void;
  onModelChange: (modelId: string) => void;

  // Modal open callbacks from App.tsx's useModalManager
  onOpenAISettings?: () => void;
  onOpenMegaSettings?: () => void;
  onOpenCodeMap?: () => void;
  onOpenGitTab?: () => void;
  onOpenPromptHistory?: () => void;

  // Auto-commit (from useAutoCommit hook in App.tsx)
  onToggleAutoCommit?: () => void;
  isAutoCommitting?: boolean;

  // App.tsx local state
  hasRunningServer?: boolean;
  historyPrompt?: string;
}

export const ControlPanel = forwardRef<ControlPanelRef, ControlPanelProps>(({
  // Minimal props - most data from contexts
  resetApp,
  onModelChange,
  onOpenAISettings,
  onOpenMegaSettings,
  onOpenCodeMap,
  onOpenGitTab,
  onOpenPromptHistory,
  onToggleAutoCommit,
  isAutoCommitting,
  hasRunningServer,
  historyPrompt
}, ref) => {
  // ============ Context Consumption ============
  // Get data directly from contexts instead of props (reduced from 48 to 12 props)
  const ctx = useAppContext();
  const ui = useUI();

  // Destructure commonly used values from contexts
  const {
    files,
    setFiles,
    activeFile: _activeFile,
    currentProject,
    projects,
    isServerOnline,
    isSyncing,
    lastSyncedAt,
    isLoadingProjects,
    isInitialized,
    createProject: onCreateProject,
    openProject,
    deleteProject: onDeleteProject,
    duplicateProject: onDuplicateProject,
    refreshProjects: onRefreshProjects,
    closeProject: onCloseProject,
    gitStatus,
    hasUncommittedChanges,
    reviewChange,
    saveSnapshot: onSaveCheckpoint,
  } = ctx;

  const {
    isGenerating,
    setIsGenerating,
    setSuggestions,
    selectedModel,
    autoAcceptChanges,
    setAutoAcceptChanges: onAutoAcceptChangesChange,
    diffModeEnabled,
    setDiffModeEnabled: onDiffModeChange,
    autoCommitEnabled,
  } = ui;

  // Wrap openProject to match expected signature
  const onOpenProject = useCallback(async (id: string) => {
    const result = await openProject(id);
    return result.success;
  }, [openProject]);

  // ============ Local State ============
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConsultantMode, setIsConsultantMode] = useState(false);
  const [isEducationMode, setIsEducationMode] = useState(false);
  const [, forceUpdate] = useState({});

  // Refs for chat persistence
  const hasRestoredChatRef = useRef(false);
  const lastSavedMessagesRef = useRef<string>('');
  const previousProjectIdRef = useRef<string | undefined>(currentProject?.id);

  // ============ Chat Persistence Effects ============
  // Restore chat messages once project is initialized
  useEffect(() => {
    // Wait for project initialization to complete
    if (!isInitialized) return;
    if (hasRestoredChatRef.current) return;
    hasRestoredChatRef.current = true;

    const restoreChat = async () => {
      try {
        const chatId = currentProject?.id || SCRATCH_WIP_ID;
        const savedMessages = await getChatMessages(chatId);
        if (savedMessages.length > 0) {
          console.log('[ControlPanel] Restoring chat messages:', savedMessages.length, 'for:', chatId);
          setMessages(savedMessages);
          lastSavedMessagesRef.current = JSON.stringify(savedMessages);
        }
      } catch (err) {
        console.warn('[ControlPanel] Failed to restore chat messages:', err);
      }
    };

    restoreChat();
  }, [isInitialized, currentProject?.id]); // Wait for initialization

  // Save chat messages when they change
  useEffect(() => {
    // Don't save if no messages or if this is the initial empty state
    if (messages.length === 0) return;

    const chatId = currentProject?.id || SCRATCH_WIP_ID;
    const messagesJson = JSON.stringify(messages);

    // Skip if messages haven't changed
    if (messagesJson === lastSavedMessagesRef.current) return;
    lastSavedMessagesRef.current = messagesJson;

    // Debounce save
    const saveTimer = setTimeout(() => {
      saveChatMessages(chatId, messages).catch(console.warn);
    }, 500);

    return () => clearTimeout(saveTimer);
  }, [messages, currentProject?.id]);

  // Handle project changes - transfer or load chat messages
  useEffect(() => {
    const prevProjectId = previousProjectIdRef.current;
    const newProjectId = currentProject?.id;

    // Skip if project hasn't changed
    if (prevProjectId === newProjectId) return;

    // Update ref for next comparison
    previousProjectIdRef.current = newProjectId;

    const handleProjectChange = async () => {
      // Case 1: Created new project from scratch mode (null -> projectId)
      // Current messages are in state, transfer them to the new project
      if (!prevProjectId && newProjectId) {
        // Get current messages from storage (the save effect may not have run yet)
        const scratchMessages = await getChatMessages(SCRATCH_WIP_ID);
        if (scratchMessages.length > 0) {
          console.log('[ControlPanel] Transferring chat from scratch to new project:', newProjectId);
          await saveChatMessages(newProjectId, scratchMessages);
          await clearChatMessages(SCRATCH_WIP_ID);
          // Don't change state - messages are already there
        }
        return;
      }

      // Case 2: Switched to a different project (projectId -> different projectId)
      if (prevProjectId && newProjectId && prevProjectId !== newProjectId) {
        console.log('[ControlPanel] Loading chat for project:', newProjectId);
        // Load messages for the new project
        const projectMessages = await getChatMessages(newProjectId);
        setMessages(projectMessages);
        lastSavedMessagesRef.current = JSON.stringify(projectMessages);
        return;
      }

      // Case 3: Closed project (projectId -> null)
      if (prevProjectId && !newProjectId) {
        console.log('[ControlPanel] Project closed, loading scratch chat');
        // Load scratch messages
        const scratchMessages = await getChatMessages(SCRATCH_WIP_ID);
        setMessages(scratchMessages);
        lastSavedMessagesRef.current = JSON.stringify(scratchMessages);
      }
    };

    handleProjectChange().catch(console.warn);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProject?.id]);

  // Modal state management (extracted to hook)
  const modals = useControlPanelModals();

  // Generation state (streaming, file plan, truncation, continuation)
  const genState = useGenerationState();
  const {
    streamingStatus, setStreamingStatus,
    streamingChars, setStreamingChars,
    streamingFiles, setStreamingFiles,
    fileProgress,
    setFileProgress,
    updateFileProgress,
    initFileProgressFromPlan,
    filePlan, setFilePlan,
    truncatedContent, setTruncatedContent,
    continuationState, setContinuationState,
    externalPrompt, setExternalPrompt
  } = genState;

  // Tech stack configuration (must be before hooks that use generateSystemInstruction)
  const { generateSystemInstruction } = useTechStack();

  // Continuation generation hook (handles multi-batch, retries, missing files)
  const {
    handleContinueGeneration,
    requestMissingFiles: _requestMissingFiles,
    handleTruncationRetry: hookTruncationRetry
  } = useContinuationGeneration({
    files,
    selectedModel,
    setIsGenerating,
    setStreamingStatus,
    setStreamingChars,
    setFilePlan,
    setContinuationState,
    setTruncatedContent,
    setMessages,
    reviewChange,
  });

  // Inspect edit hook (handles element-scoped editing)
  const { handleInspectEditRequest } = useInspectEdit({
    files,
    selectedModel,
    generateSystemInstruction,
    setStreamingStatus,
    setIsGenerating,
    setMessages,
    reviewChange,
  });

  // AI History - persists across refreshes (declared early for use in useCodeGeneration)
  const aiHistory = useAIHistory(currentProject?.id || null);

  // Context management (extracted to hook) - needs to be before useCodeGeneration for sessionId
  const { sessionId, contextManager } = useContextSync({
    projectId: currentProject?.id,
    messages,
  });

  // Code generation hook (handles main generation logic)
  const { generateCode } = useCodeGeneration({
    files,
    selectedModel,
    sessionId,  // Pass sessionId for auto-compaction
    generateSystemInstruction,
    setStreamingStatus,
    setStreamingChars,
    setStreamingFiles,
    setFilePlan,
    setContinuationState,
    setTruncatedContent,
    setIsGenerating,
    setMessages,
    reviewChange,
    handleContinueGeneration,
    addAIHistoryEntry: aiHistory.addEntry,
    updateFileProgress,
    initFileProgressFromPlan,
    setFileProgress,
  });

  const existingApp = files['src/App.tsx'];

  // Handle context compaction
  const handleCompaction = useCallback(async () => {
    const manager = getProviderManager();
    const config = getFluidFlowConfig();

    await contextManager.compactContext(sessionId, async (text) => {
      const request: GenerationRequest = {
        prompt: `Summarize this conversation concisely, preserving key decisions, code changes, and context:\n\n${text}`,
        systemInstruction: 'You are a conversation summarizer. Create a brief but complete summary that captures the essential context, decisions made, and any code or technical details discussed.',
        responseFormat: 'text'
      };
      const response = await manager.generate(request);

      // Log compaction
      const context = contextManager.getContext(sessionId);
      config.addCompactionLog({
        contextId: sessionId,
        beforeTokens: context.estimatedTokens * 2,
        afterTokens: context.estimatedTokens,
        messagesSummarized: messages.length - 2,
        summary: response.text || 'Conversation compacted'
      });

      return response.text || '';
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, messages.length]);

  // Handle provider changes from settings
  const handleProviderChange = useCallback((providerId: string, modelId: string) => {
    // Force re-render to update the active provider display
    forceUpdate({});
    // Model change handled through the provider's defaultModel
    onModelChange(modelId);
  }, [onModelChange]);

  // Handle prompt generated from PromptEngineerModal
  const handlePromptGenerated = useCallback((prompt: string) => {
    // Auto-fill the chat input with the generated prompt
    const inputElement = document.querySelector('textarea[placeholder*="Type your prompt"]') as HTMLTextAreaElement;
    if (inputElement) {
      inputElement.value = prompt;
      inputElement.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }, []);

  // Handle truncation retry - wrapper for hook function
  const handleTruncationRetry = async () => {
    if (!truncatedContent) return;
    await hookTruncationRetry(truncatedContent, reviewChange);
  };

  // handleSend is intentionally not wrapped in useCallback - it has many dependencies
  // and the complexity of tracking them all outweighs the re-render cost
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleSend = async (prompt: string, attachments: ChatAttachment[], _fileContext?: string[], inspectContext?: InspectContext) => {
    // Track if continuation was started (to prevent finally block from clearing isGenerating)
    let continuationStarted = false;

    // Create user message
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      timestamp: Date.now(),
      prompt: prompt || (attachments.length > 0 ? 'Generate from uploaded sketch' : ''),
      attachments: attachments.length > 0 ? attachments : undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setIsGenerating(true);
    setSuggestions(null);

    // Save to prompt history
    addPromptToHistory({
      prompt: prompt || (attachments.length > 0 ? 'Generate from uploaded sketch' : ''),
      model: selectedModel,
      projectContext: {
        projectId: currentProject?.id,
        fileCount: Object.keys(files).length,
      },
    });

    try {
      if (inspectContext) {
        // INSPECT EDIT MODE - Delegated to useInspectEdit hook
        await handleInspectEditRequest(prompt, inspectContext);
        return;

      } else if (isConsultantMode) {
        // Consultant mode - delegated to utility
        const result = await executeConsultantMode({
          prompt,
          attachments,
          files,
          selectedModel,
        });
        setSuggestions(result.suggestions);
        setMessages(prev => [...prev, result.message]);
      } else {
        // Generate/Update app mode - Delegated to useCodeGeneration hook
        const conversationHistory = contextManager.getMessagesForAI(sessionId);
        console.log(`[handleSend] Session: ${sessionId}, History messages: ${conversationHistory.length}`);
        if (conversationHistory.length > 0) {
          const totalHistoryChars = conversationHistory.reduce((sum, m) => sum + m.content.length, 0);
          console.log(`[handleSend] History total chars: ${totalHistoryChars}, estimated tokens: ~${Math.ceil(totalHistoryChars / 4)}`);
        }

        const result = await generateCode({
          prompt,
          attachments,
          isEducationMode,
          diffModeEnabled,
          conversationHistory,
        });

        continuationStarted = result.continuationStarted || false;

        // Exit early - hook handles all success/error states internally
        return;
      }
    } catch (error) {
      console.error('Error generating content:', error);

      const manager = getProviderManager();
      const activeConfig = manager.getActiveConfig();
      debugLog.error('generation', error instanceof Error ? error.message : 'Unknown error', {
        model: activeConfig?.defaultModel || selectedModel,
        metadata: { mode: isConsultantMode ? 'consultant' : 'generator', provider: activeConfig?.name }
      });

      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
        snapshotFiles: { ...files }
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      // Only clear generating state if continuation was NOT started
      // (continuation handles its own state management)
      if (!continuationStarted) {
        setIsGenerating(false);
        // Clear streaming status after a delay so user sees final status
        setTimeout(() => {
          setStreamingStatus('');
          setStreamingChars(0);
        }, 2000);
      }
    }
  };

  const handleRevert = (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (message?.snapshotFiles) {
      // Skip history for revert - do not create undo entry
      reviewChange(`Revert to earlier state`, message.snapshotFiles, { skipHistory: true });
    }
  };

  // Handle time travel navigation (preview snapshot without creating history)
  const handleTimeTravel = useCallback((snapshotFiles: FileSystem | null) => {
    if (snapshotFiles === null) {
      // Return to current state - need to restore from history
      // For now, just log - actual restore would need history access
      console.log('[ControlPanel] Time travel: returning to current state');
      return;
    }
    // Preview the snapshot files without creating history entry
    reviewChange('Time Travel Preview', snapshotFiles, { skipHistory: true });
  }, [reviewChange]);

  const handleRetry = (errorMessageId: string) => {
    // Find the error message and the user message before it
    const errorIndex = messages.findIndex(m => m.id === errorMessageId);
    if (errorIndex < 1) return;

    const userMessage = messages[errorIndex - 1];
    if (userMessage.role !== 'user') return;

    // Remove the error message and user message from chat
    setMessages(prev => prev.filter((_, i) => i !== errorIndex && i !== errorIndex - 1));

    // Re-send the request
    handleSend(
      userMessage.prompt || '',
      userMessage.attachments || []
    );
  };

  // Handle inspect edit from PreviewPanel - with strict scope enforcement
  const handleInspectEdit = useCallback(async (prompt: string, element: InspectedElement, scope: EditScope) => {
    console.log('[ControlPanel.handleInspectEdit] Called with:', { prompt, element, scope });
    // Use handleSend with inspectContext for strict scope enforcement
    await handleSend(prompt, [], undefined, { element, scope });
  }, [handleSend]);

  // Send error to chat - called from PreviewPanel when auto-fix fails
  const sendErrorToChat = useCallback((errorMessage: string) => {
    const errorPrompt = `🚨 **Runtime Error - Auto-fix Failed**

The following error occurred and auto-fix could not resolve it:

\`\`\`
${errorMessage}
\`\`\`

Please analyze this error and fix the code. Focus on:
1. Understanding what caused the error
2. Identifying the exact location in the code
3. Providing a working fix

Fix the error in src/App.tsx.`;

    // Send to chat using normal flow
    handleSend(errorPrompt, []);
  }, [handleSend]);


  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    handleInspectEdit,
    sendErrorToChat
  }), [handleInspectEdit, sendErrorToChat]);

  const handleResetClick = () => {
    modals.openResetConfirm();
  };

  const handleConfirmReset = async () => {
    // Stop all running servers (fire and forget)
    runnerApi.stopAll().catch(err => {
      console.warn('[ControlPanel] Failed to stop runners:', err);
    });

    // Clear chat messages (both state and storage)
    setMessages([]);
    lastSavedMessagesRef.current = '';
    const chatId = currentProject?.id || SCRATCH_WIP_ID;
    clearChatMessages(chatId).catch(console.warn);
    // Also clear scratch chat to ensure clean slate
    if (chatId !== SCRATCH_WIP_ID) {
      clearChatMessages(SCRATCH_WIP_ID).catch(console.warn);
    }

    // Clear ALL AI contexts (main-chat, prompt-improver, git-commit, quick-edit, etc.)
    contextManager.clearAllContexts();

    // Clear file context trackers (smart delta tracking)
    clearAllFileTrackers();

    // Clear debug logs
    resetDebugState();

    // Reset app state (files, project, WIP, UI)
    resetApp();

    // Close the modal
    modals.closeResetConfirm();

    // If backend is online, automatically create a new empty project
    // Pass DEFAULT_FILES explicitly to ensure clean slate (not stale closure files)
    if (isServerOnline) {
      const timestamp = new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).replace(',', '');
      const projectName = `Untitled ${timestamp}`;

      // Create project with explicit default files (avoid stale closure)
      onCreateProject(projectName, undefined, DEFAULT_FILES)
        .then(newProject => {
          if (newProject) {
            console.log('[ControlPanel] Auto-created new project:', newProject.name);
          }
        })
        .catch(err => {
          console.warn('[ControlPanel] Failed to auto-create project:', err);
        });
    }

    console.log('[ControlPanel] Start Fresh completed - all contexts cleared');
  };

  return (
    <aside className="w-full h-full self-stretch min-h-0 flex flex-col bg-slate-900/60 backdrop-blur-xl border-r border-white/10 overflow-hidden relative z-20">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl border border-white/5">
            <Layers className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-100 to-slate-300">
              FluidFlow
            </h1>
            <p className="text-[10px] text-slate-500 font-medium tracking-wide">REACT PAGE BUILDER</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onOpenMegaSettings}
            className="p-2 hover:bg-blue-500/10 rounded-lg text-slate-500 hover:text-blue-400 transition-colors"
            title="Settings (Ctrl+,)"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetClick}
            className="p-2 hover:bg-red-500/10 rounded-lg text-slate-500 hover:text-red-400 transition-colors"
            title="Start Fresh"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* AI Provider Quick Selector */}
      <div className="px-4 py-2 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-2">
          {/* Model Selector Dropdown */}
          <div className="flex-1 relative">
            <select
              value={selectedModel}
              onChange={(e) => onModelChange(e.target.value)}
              className="w-full appearance-none bg-slate-800/50 border border-white/10 rounded-lg px-3 py-1.5 pr-8 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50 cursor-pointer hover:bg-slate-800/70 transition-colors"
            >
              {(() => {
                const manager = getProviderManager();
                const activeConfig = manager.getActiveConfig();
                if (!activeConfig?.models?.length) {
                  return <option value={selectedModel}>{selectedModel || 'No models'}</option>;
                }
                return activeConfig.models.map(model => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ));
              })()}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          </div>

          {/* Provider Badge & Settings Button */}
          <button
            onClick={onOpenAISettings}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800/50 hover:bg-slate-700/50 border border-white/10 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
            title="AI Provider Settings"
          >
            <span className="text-blue-400">
              {(() => {
                const manager = getProviderManager();
                const activeConfig = manager.getActiveConfig();
                return activeConfig?.name?.split(' ')[0] || 'AI';
              })()}
            </span>
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Context Indicator */}
      <div className="px-4 py-2 border-b border-white/5 flex-shrink-0">
        <ContextIndicator
          contextId={sessionId}
          showLabel={true}
          onCompact={handleCompaction}
          className="w-full"
        />
      </div>

      {/* Chat Messages */}
      <ChatPanel
        messages={messages}
        onRevert={handleRevert}
        onRetry={handleRetry}
        isGenerating={isGenerating}
        streamingStatus={streamingStatus}
        streamingChars={streamingChars}
        streamingFiles={streamingFiles}
        aiHistoryCount={aiHistory.history.filter(h => h.success).length}
        truncatedContent={truncatedContent}
        onTruncationRetry={handleTruncationRetry}
        onBatchGeneration={(incompleteFiles, prompt, systemInstruction) => {
          modals.openBatchGen(prompt, systemInstruction, incompleteFiles);
        }}
        onSetExternalPrompt={setExternalPrompt}
        continuationState={continuationState}
        onContinueGeneration={() => handleContinueGeneration()}
        filePlan={filePlan}
        fileProgress={fileProgress}
        onSaveCheckpoint={() => {
          // Check if there are files to checkpoint
          if (Object.keys(files).length === 0) {
            const errorMessage: ChatMessage = {
              id: crypto.randomUUID(),
              role: 'assistant',
              explanation: '⚠️ **No files to checkpoint.** Generate some code first before saving a checkpoint.',
              timestamp: Date.now()
            };
            setMessages(prev => [...prev, errorMessage]);
            return;
          }

          // Save to History Timeline using the prop callback
          if (onSaveCheckpoint) {
            const checkpointName = `Checkpoint (${Object.keys(files).length} files)`;
            onSaveCheckpoint(checkpointName);

            // Show success feedback
            const successMessage: ChatMessage = {
              id: crypto.randomUUID(),
              role: 'assistant',
              explanation: `✅ **Checkpoint saved!** Saved ${Object.keys(files).length} files. You can restore this checkpoint from the History Timeline (Ctrl+Shift+H).`,
              timestamp: Date.now()
            };
            setMessages(prev => [...prev, successMessage]);
          } else {
            const errorMessage: ChatMessage = {
              id: crypto.randomUUID(),
              role: 'assistant',
              explanation: '⚠️ **Checkpoint not available.** History Timeline is not connected.',
              timestamp: Date.now()
            };
            setMessages(prev => [...prev, errorMessage]);
          }
        }}
        onTimeTravel={handleTimeTravel}
        onRestoreFromHistory={() => {
          const lastEntry = aiHistory.history.find(h => h.success);
          if (!lastEntry) return;

          const entries = getEntriesUpToTimestamp(aiHistory.history, lastEntry.timestamp);
          const result = restoreFromHistoryEntries(entries);

          if (result.success) {
            setMessages(result.messages);
            setFiles(result.files);
          }
        }}
      />

      {/* Mode Toggle + Auto-Accept */}
      <div className="px-3 py-2 border-t border-white/5 flex-shrink-0 flex items-center justify-between gap-2">
        <ModeToggle
          isConsultantMode={isConsultantMode}
          onToggle={() => setIsConsultantMode(!isConsultantMode)}
          autoAcceptChanges={autoAcceptChanges}
          onAutoAcceptChange={onAutoAcceptChangesChange}
        />
        {/* Sync Codebase Button */}
        {Object.keys(files).length > 0 && (
          <button
            onClick={modals.openCodebaseSync}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg border border-blue-500/20 transition-all"
            title="Sync current codebase to AI context"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Sync to AI</span>
          </button>
        )}
      </div>

      {/* Chat Input */}
      <ChatInput
        onSend={handleSend}
        isGenerating={isGenerating}
        hasExistingApp={!!existingApp}
        placeholder={isConsultantMode ? "Describe what to analyze..." : undefined}
        files={files}
        onOpenPromptEngineer={modals.openPromptEngineer}
        onOpenHistory={onOpenPromptHistory}
        externalPrompt={externalPrompt}
        historyPrompt={historyPrompt}
      />

      {/* Settings Panel */}
      <SettingsPanel
        isEducationMode={isEducationMode}
        onEducationModeChange={setIsEducationMode}
        hasApiKey={(() => {
          const manager = getProviderManager();
          const config = manager.getActiveConfig();
          return !!(config?.apiKey || config?.isLocal);
        })()}
        selectedModel={selectedModel}
        onModelChange={onModelChange}
        onProviderChange={handleProviderChange}
        onOpenAISettings={onOpenAISettings}
        onOpenMegaSettings={onOpenMegaSettings}
        onOpenCodeMap={onOpenCodeMap}
        onOpenTechStack={modals.openTechStack}
        aiHistoryCount={aiHistory.history.length}
        onOpenAIHistory={modals.openAIHistory}
        autoAcceptChanges={autoAcceptChanges}
        onAutoAcceptChangesChange={onAutoAcceptChangesChange}
        diffModeEnabled={diffModeEnabled}
        onDiffModeChange={onDiffModeChange}
        shouldClose={modals.shouldCloseSettings}
        onClosed={modals.closeSettings}
        onOpened={modals.openSettings}
      />


      {/* Reset Confirmation Modal */}
      <ResetConfirmModal
        isOpen={modals.showResetConfirm}
        onClose={modals.closeResetConfirm}
        onConfirm={handleConfirmReset}
        currentProjectName={currentProject?.name}
        hasUncommittedChanges={hasUncommittedChanges}
        onOpenGitTab={onOpenGitTab}
        hasRunningServer={hasRunningServer}
      />

      {/* AI History Modal */}
      <LazyAIHistoryModal
        isOpen={modals.showAIHistory}
        onClose={modals.closeAIHistory}
        history={aiHistory.history}
        onClearHistory={aiHistory.clearHistory}
        onDeleteEntry={aiHistory.deleteEntry}
        onExportHistory={aiHistory.exportHistory}
        onRestoreEntry={async (entry) => {
          // Use single entry restore instead of merging all entries up to timestamp
          // This prevents issues where merged history creates broken/incomplete state
          const result = restoreFromSingleEntry(entry, files);

          if (result.success) {
            // Only add the messages from this single entry, not replace all
            setMessages(prev => [...prev, ...result.messages]);
            setFiles(result.files);
            return true;
          }
          return false;
        }}
      />

      {/* Tech Stack Modal */}
      <TechStackModal
        isOpen={modals.isTechStackOpen}
        onClose={modals.closeTechStack}
      />

      {/* Prompt Engineer Modal */}
      <PromptEngineerModal
        isOpen={modals.isPromptEngineerOpen}
        onClose={modals.closePromptEngineer}
        onPromptGenerated={handlePromptGenerated}
      />

      {/* Batch Generation Modal */}
      {modals.batchGenModal && (
        <BatchGenerationModal
          isOpen={modals.batchGenModal.isOpen}
          onClose={modals.closeBatchGen}
          prompt={modals.batchGenModal.prompt}
          systemInstruction={modals.batchGenModal.systemInstruction}
          targetFiles={modals.batchGenModal.targetFiles}
          onComplete={(generatedFiles: FileSystem) => {
            // Apply the generated files to the current project
            const fileChanges: FileChange[] = Object.entries(generatedFiles).map(([path, content]) => ({
              path,
              type: files[path] ? 'modified' : 'added',
              additions: content.split('\n').length,
              deletions: files[path] ? files[path].split('\n').length : 0
            }));

            // Create a message for the batch generation completion
            const batchMessage: ChatMessage = {
              id: crypto.randomUUID(),
              role: 'assistant',
              timestamp: Date.now(),
              explanation: `✅ Successfully generated ${Object.keys(generatedFiles).length} files in batches.`,
              files: generatedFiles,
              fileChanges,
              snapshotFiles: { ...files }
            };

            setMessages(prev => [...prev, batchMessage]);

            // Show in diff modal (or auto-apply if auto-accept is on)
            reviewChange('Batch Generated Files', { ...files, ...generatedFiles });
            modals.closeBatchGen();
          }}
        />
      )}

      {/* Codebase Sync Modal */}
      <LazyCodebaseSyncModal
        isOpen={modals.showCodebaseSync}
        onClose={modals.closeCodebaseSync}
        files={files}
        onSync={async (payload) => {
          const { displayMessage, llmMessage, fileCount, tokenEstimate, batchIndex, totalBatches } = payload;

          // Debug log - request
          console.log(`[CodebaseSync] Batch ${batchIndex + 1}/${totalBatches}`, {
            fileCount,
            tokenEstimate,
            displayMessageLength: displayMessage.length,
            llmMessageLength: llmMessage.length
          });
          debugLog.request('other', {
            model: 'codebase-sync',
            prompt: `Sync batch ${batchIndex + 1}/${totalBatches}: ${fileCount} files, ~${tokenEstimate} tokens`,
            metadata: { fileCount, tokenEstimate, batchIndex, totalBatches }
          });

          // Create message for chat UI (short display) but with full LLM content
          const syncMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'user',
            timestamp: Date.now(),
            prompt: displayMessage,
            // Store full content for LLM in a separate field
            llmContent: llmMessage,
            // Track precise token count from sync calculation
            tokenUsage: {
              inputTokens: tokenEstimate,
              outputTokens: 0,
              totalTokens: tokenEstimate,
              isEstimated: false // This is calculated precisely from file sizes
            }
          };
          setMessages(prev => [...prev, syncMessage]);

          // If this is the last batch, add an AI acknowledgment
          if (batchIndex === totalBatches - 1) {
            const totalFiles = Object.keys(files).length;
            const ackExplanation = `✅ **Codebase synced successfully!**\n\nI now have the complete and up-to-date view of your project (${totalFiles} files). I'll use this as the reference for all future requests.\n\nFeel free to ask me to make changes or improvements!`;
            const ackTokens = estimateTokenCount(ackExplanation);
            const ackMessage: ChatMessage = {
              id: crypto.randomUUID(),
              role: 'assistant',
              timestamp: Date.now(),
              explanation: ackExplanation,
              tokenUsage: {
                inputTokens: 0,
                outputTokens: ackTokens,
                totalTokens: ackTokens,
                isEstimated: true
              }
            };
            setMessages(prev => [...prev, ackMessage]);

            // Debug log - complete
            console.log('[CodebaseSync] Sync complete', { totalFiles, totalBatches });
            debugLog.response('other', {
              id: 'codebase-sync-complete',
              model: 'codebase-sync',
              duration: 0,
              response: `Synced ${totalFiles} files in ${totalBatches} batch(es)`
            });
          }
        }}
      />
    </aside>
  );
});

ControlPanel.displayName = 'ControlPanel';
