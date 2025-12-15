import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  GitBranch, GitCommit, Check, X, Plus, RefreshCw, Loader2,
  FileText, FilePlus, FileX, ChevronDown, ChevronUp,
  AlertCircle, Clock, AlertTriangle, Sparkles, RotateCcw
} from 'lucide-react';
import { GitStatus, GitCommit as GitCommitType, CommitDetails, gitApi } from '@/services/projectApi';
import { FileSystem } from '@/types';
import { getProviderManager } from '@/services/ai';
import { LocalChange } from './types';
import { formatCommitDate } from './utils';
import { FileItem } from './FileItem';
import { CommitDetailsView } from './CommitDetailsView';
import { DiffModal } from './DiffModal';

interface GitPanelProps {
  projectId: string | null;
  gitStatus: GitStatus | null;
  onInitGit: (force?: boolean) => Promise<boolean>;
  onCommit: (message: string) => Promise<boolean>;
  onRefreshStatus: () => Promise<void>;
  // Local changes (WIP - not yet synced to backend)
  hasUncommittedChanges?: boolean;
  localChanges?: LocalChange[];
  // Files for AI commit message generation
  files?: FileSystem;
  // Discard all local changes and restore from last commit
  onDiscardChanges?: () => Promise<void>;
  // Revert to a specific commit
  onRevertToCommit?: (commitHash: string) => Promise<boolean>;
}

export const GitPanel: React.FC<GitPanelProps> = ({
  projectId,
  gitStatus,
  onInitGit,
  onCommit,
  onRefreshStatus,
  hasUncommittedChanges = false,
  localChanges = [],
  files = {},
  onDiscardChanges,
  onRevertToCommit,
}) => {
  // Git initialization state comes from gitStatus - single source of truth
  const isGitInitialized = gitStatus?.initialized ?? false;
  const [commitMessage, setCommitMessage] = useState('');
  const [isCommitting, setIsCommitting] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [commits, setCommits] = useState<GitCommitType[]>([]);
  const [isLoadingCommits, setIsLoadingCommits] = useState(false);
  const [expandedSection, setExpandedSection] = useState<'staged' | 'modified' | 'untracked' | null>('modified');

  // AI commit message state
  const [isGeneratingMessage, setIsGeneratingMessage] = useState(false);

  // Discard changes state
  const [isDiscarding, setIsDiscarding] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // Revert to commit state
  const [isReverting, setIsReverting] = useState(false);
  const [showRevertConfirm, setShowRevertConfirm] = useState(false);
  const [revertTargetCommit, setRevertTargetCommit] = useState<CommitDetails | null>(null);

  // Commit details state
  const [selectedCommit, setSelectedCommit] = useState<CommitDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [showDiffModal, setShowDiffModal] = useState(false);
  const [diffContent, setDiffContent] = useState<string>('');
  const [diffFile, setDiffFile] = useState<string | null>(null);
  const [isLoadingDiff, setIsLoadingDiff] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  // Define loadCommits before useEffect
  const loadCommits = useCallback(async () => {
    if (!projectId) return;

    setIsLoadingCommits(true);
    try {
      const result = await gitApi.log(projectId, 20);
      setCommits(result.commits);
    } catch (err) {
      console.error('Failed to load commits:', err);
    } finally {
      setIsLoadingCommits(false);
    }
  }, [projectId]);

  // Load commit history when git is initialized
  useEffect(() => {
    if (projectId && isGitInitialized) {
      loadCommits();
    }
  }, [projectId, isGitInitialized, loadCommits]);

  const loadCommitDetails = async (hash: string) => {
    if (!projectId) return;

    setIsLoadingDetails(true);
    try {
      const details = await gitApi.commitDetails(projectId, hash);
      setSelectedCommit(details);
    } catch (err) {
      console.error('Failed to load commit details:', err);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const loadCommitDiff = async (hash: string, file?: string) => {
    if (!projectId) return;

    setIsLoadingDiff(true);
    setDiffFile(file || null);
    setShowDiffModal(true);

    try {
      const result = await gitApi.commitDiff(projectId, hash, file);
      setDiffContent(result.diff);
    } catch (err) {
      console.error('Failed to load diff:', err);
      setDiffContent('Failed to load diff');
    } finally {
      setIsLoadingDiff(false);
    }
  };

  const copyHash = async (hash: string) => {
    try {
      await navigator.clipboard.writeText(hash);
      setCopiedHash(hash);
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = setTimeout(() => setCopiedHash(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleInitGit = async (force = false) => {
    setIsInitializing(true);
    try {
      await onInitGit(force);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleCommit = async () => {
    if (!commitMessage.trim()) return;

    setIsCommitting(true);
    try {
      const success = await onCommit(commitMessage.trim());
      if (success) {
        setCommitMessage('');
        loadCommits();
      }
    } finally {
      setIsCommitting(false);
    }
  };

  // Discard all local changes
  const handleDiscardChanges = async () => {
    if (!onDiscardChanges) return;

    setIsDiscarding(true);
    try {
      await onDiscardChanges();
      setShowDiscardConfirm(false);
    } finally {
      setIsDiscarding(false);
    }
  };

  // Generate AI commit message
  const generateCommitMessage = useCallback(async () => {
    const allChanges = [
      ...localChanges,
      ...(gitStatus?.modified?.map(p => ({ path: p, status: 'modified' as const })) || []),
      ...(gitStatus?.staged?.map(p => ({ path: p, status: 'modified' as const })) || []),
      ...(gitStatus?.not_added?.map(p => ({ path: p, status: 'added' as const })) || []),
      ...(gitStatus?.deleted?.map(p => ({ path: p, status: 'deleted' as const })) || []),
    ];

    if (allChanges.length === 0) return;

    setIsGeneratingMessage(true);
    try {
      const manager = getProviderManager();
      const activeConfig = manager.getActiveConfig();

      if (!activeConfig) {
        setCommitMessage('// No AI provider configured');
        return;
      }

      // Build context from changed files
      const changedFilesContext = allChanges
        .slice(0, 10) // Limit to 10 files
        .map(change => {
          const content = files[change.path];
          const preview = content ? content.slice(0, 500) : '(file content not available)';
          return `${change.status.toUpperCase()}: ${change.path}\n${preview}`;
        })
        .join('\n\n---\n\n');

      const prompt = `Generate a concise git commit message for these changes. Follow conventional commit format (feat:, fix:, refactor:, etc.). Be specific but brief (max 72 chars for first line). Only output the commit message, nothing else.

Changed files:
${changedFilesContext}`;

      const response = await manager.generate({
        prompt,
        systemInstruction: 'You are a helpful assistant that generates git commit messages. Output only the commit message text, no explanations or markdown.',
      });

      const message = response.text?.trim() || '';
      // Clean any markdown or quotes
      const cleanMessage = message
        .replace(/^```.*\n?/gm, '')
        .replace(/```$/gm, '')
        .replace(/^["']|["']$/g, '')
        .trim();

      setCommitMessage(cleanMessage);
    } catch (err) {
      console.error('Failed to generate commit message:', err);
      setCommitMessage('// Failed to generate message');
    } finally {
      setIsGeneratingMessage(false);
    }
  }, [localChanges, gitStatus, files]);

  // Handle revert to commit
  const handleRevertClick = useCallback((commit: CommitDetails) => {
    setRevertTargetCommit(commit);
    setShowRevertConfirm(true);
  }, []);

  const handleConfirmRevert = useCallback(async () => {
    if (!revertTargetCommit || !onRevertToCommit) return;

    setIsReverting(true);
    try {
      const success = await onRevertToCommit(revertTargetCommit.hash);
      if (success) {
        setShowRevertConfirm(false);
        setRevertTargetCommit(null);
        setSelectedCommit(null);
        // Reload commit history
        loadCommits();
      }
    } catch (err) {
      console.error('Failed to revert:', err);
    } finally {
      setIsReverting(false);
    }
  }, [revertTargetCommit, onRevertToCommit, loadCommits]);

  // No project selected
  if (!projectId) {
    return (
      <div className="p-4 text-center text-slate-500 text-sm">
        <GitBranch className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No project selected</p>
      </div>
    );
  }

  // Git repository is corrupted
  if (gitStatus?.corrupted) {
    return (
      <div className="p-4">
        <div className="text-center mb-4">
          <AlertCircle className="w-10 h-10 mx-auto mb-3 text-red-400" />
          <h3 className="text-sm font-medium text-white mb-1">Repository Corrupted</h3>
          <p className="text-xs text-slate-400 mb-2">
            {gitStatus.message || 'The git repository data is corrupted.'}
          </p>
        </div>
        <button
          onClick={() => handleInitGit(true)}
          disabled={isInitializing}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 disabled:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {isInitializing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Re-initialize Repository
        </button>
      </div>
    );
  }

  // Git not initialized
  if (!isGitInitialized) {
    return (
      <div className="p-4">
        <div className="text-center mb-4">
          <GitBranch className="w-10 h-10 mx-auto mb-3 text-slate-500" />
          <h3 className="text-sm font-medium text-white mb-1">Initialize Git</h3>
          <p className="text-xs text-slate-400">
            Start version control for this project
          </p>
        </div>
        <button
          onClick={() => handleInitGit(false)}
          disabled={isInitializing}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {isInitializing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          Initialize Repository
        </button>
      </div>
    );
  }

  // Calculate changes count
  const stagedCount = gitStatus?.staged?.length || 0;
  const modifiedCount = gitStatus?.modified?.length || 0;
  const untrackedCount = gitStatus?.not_added?.length || 0;
  const deletedCount = gitStatus?.deleted?.length || 0;
  const totalChanges = stagedCount + modifiedCount + untrackedCount + deletedCount;
  const hasChanges = !gitStatus?.clean || hasUncommittedChanges;
  const localChangeCount = localChanges.length;

  return (
    <div className="flex flex-col h-full relative">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <GitBranch className="w-5 h-5 text-emerald-400" />
          <span className="text-base font-medium text-white">
            {gitStatus?.branch || 'main'}
          </span>
          {hasUncommittedChanges ? (
            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              {localChangeCount} local
            </span>
          ) : gitStatus?.clean ? (
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded">
              Clean
            </span>
          ) : (
            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded">
              {totalChanges} change{totalChanges !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <button
          onClick={onRefreshStatus}
          className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
          title="Refresh git status"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Two Column Layout */}
      <div className="flex-1 flex min-h-0">
        {/* Left Column: Changes + Commit */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-white/5">
          {/* Changes Section */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {/* Local Changes (WIP) */}
            {hasUncommittedChanges && localChanges.length > 0 && (
              <div className="p-3 border-b border-amber-500/20 bg-amber-500/5">
                <div className="flex items-center justify-between px-2 py-1.5">
                  <div className="flex items-center gap-2 text-sm text-amber-400">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="font-medium">Local Changes</span>
                  </div>
                  {onDiscardChanges && (
                    <button
                      onClick={() => setShowDiscardConfirm(true)}
                      className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-red-400 hover:bg-red-500/10 rounded transition-colors"
                      title="Discard all changes and restore from last commit"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Discard
                    </button>
                  )}
                </div>
                <div className="mt-2 space-y-1">
                  {localChanges.map((change) => (
                    <div
                      key={change.path}
                      className="flex items-center gap-2.5 px-2.5 py-1.5 ml-4 text-sm text-slate-400"
                    >
                      {change.status === 'added' && <FilePlus className="w-4 h-4 text-emerald-400" />}
                      {change.status === 'modified' && <FileText className="w-4 h-4 text-amber-400" />}
                      {change.status === 'deleted' && <FileX className="w-4 h-4 text-red-400" />}
                      <span className="truncate">{change.path}</span>
                    </div>
                  ))}
                </div>

                {/* Discard Confirmation */}
                {showDiscardConfirm && (
                  <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-xs text-red-300 mb-3">
                      This will discard all local changes and restore to last commit. Are you sure?
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleDiscardChanges}
                        disabled={isDiscarding}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 disabled:bg-slate-700 text-white rounded text-xs font-medium transition-colors"
                      >
                        {isDiscarding ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RotateCcw className="w-4 h-4" />
                        )}
                        Discard All
                      </button>
                      <button
                        onClick={() => setShowDiscardConfirm(false)}
                        className="flex-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Git Changes */}
            {totalChanges > 0 ? (
              <div className="p-3 space-y-2">
                {/* Staged Files */}
                {stagedCount > 0 && (
                  <div>
                    <button
                      onClick={() => setExpandedSection(expandedSection === 'staged' ? null : 'staged')}
                      className="w-full flex items-center justify-between px-2.5 py-2 hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <span className="flex items-center gap-2 text-sm text-emerald-400">
                        <Check className="w-4 h-4" />
                        Staged ({stagedCount})
                      </span>
                      {expandedSection === 'staged' ? (
                        <ChevronUp className="w-4 h-4 text-slate-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-500" />
                      )}
                    </button>
                    {expandedSection === 'staged' && (
                      <div className="mt-1 space-y-0.5">
                        {gitStatus?.staged?.map((file) => (
                          <FileItem key={file} file={file} status="staged" />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Modified Files */}
                {modifiedCount > 0 && (
                  <div>
                    <button
                      onClick={() => setExpandedSection(expandedSection === 'modified' ? null : 'modified')}
                      className="w-full flex items-center justify-between px-2.5 py-2 hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <span className="flex items-center gap-2 text-sm text-amber-400">
                        <FileText className="w-4 h-4" />
                        Modified ({modifiedCount})
                      </span>
                      {expandedSection === 'modified' ? (
                        <ChevronUp className="w-4 h-4 text-slate-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-500" />
                      )}
                    </button>
                    {expandedSection === 'modified' && (
                      <div className="mt-1 space-y-0.5">
                        {gitStatus?.modified?.map((file) => (
                          <FileItem key={file} file={file} status="modified" />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Untracked Files */}
                {untrackedCount > 0 && (
                  <div>
                    <button
                      onClick={() => setExpandedSection(expandedSection === 'untracked' ? null : 'untracked')}
                      className="w-full flex items-center justify-between px-2.5 py-2 hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <span className="flex items-center gap-2 text-sm text-blue-400">
                        <FilePlus className="w-4 h-4" />
                        Untracked ({untrackedCount})
                      </span>
                      {expandedSection === 'untracked' ? (
                        <ChevronUp className="w-4 h-4 text-slate-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-500" />
                      )}
                    </button>
                    {expandedSection === 'untracked' && (
                      <div className="mt-1 space-y-0.5">
                        {gitStatus?.not_added?.map((file) => (
                          <FileItem key={file} file={file} status="untracked" />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Deleted Files */}
                {deletedCount > 0 && gitStatus?.deleted?.map((file) => (
                  <FileItem key={file} file={file} status="deleted" />
                ))}
              </div>
            ) : !hasUncommittedChanges ? (
              <div className="p-4 text-center text-slate-500 text-sm">
                <Check className="w-8 h-8 mx-auto mb-2 text-emerald-500 opacity-50" />
                <p>Working tree clean</p>
                <p className="text-xs mt-1">No uncommitted changes</p>
              </div>
            ) : null}
          </div>

          {/* Commit Section */}
          <div className="border-t border-white/5 p-3 flex-shrink-0">
            <div className="relative">
              <textarea
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                placeholder="Commit message..."
                rows={2}
                className="w-full px-3 py-2 pr-10 bg-slate-800/50 border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500/50 resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    handleCommit();
                  }
                }}
              />
              {/* AI Generate Button */}
              <button
                onClick={generateCommitMessage}
                disabled={isGeneratingMessage || (!hasChanges && localChanges.length === 0)}
                className="absolute right-2 top-2 p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-purple-400 disabled:text-slate-600 disabled:hover:bg-transparent transition-colors"
                title="Generate commit message with AI"
              >
                {isGeneratingMessage ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
              </button>
            </div>
            <button
              onClick={handleCommit}
              disabled={!commitMessage.trim() || (!hasChanges && localChanges.length === 0) || isCommitting}
              className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {isCommitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <GitCommit className="w-4 h-4" />
              )}
              Commit
            </button>
          </div>
        </div>

        {/* Right Column: Commit History */}
        <div className="w-1/2 flex flex-col min-w-0 bg-slate-950/30">
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/5 flex-shrink-0">
            <span className="flex items-center gap-2 text-sm text-slate-400 font-medium">
              <Clock className="w-4 h-4" />
              History
            </span>
            <span className="text-xs text-slate-500">{commits.length} commits</span>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {isLoadingCommits ? (
              <div className="p-4 text-center">
                <Loader2 className="w-5 h-5 mx-auto text-blue-400 animate-spin" />
              </div>
            ) : commits.length === 0 ? (
              <div className="p-4 text-center text-slate-500 text-xs">
                <GitCommit className="w-6 h-6 mx-auto mb-2 opacity-50" />
                <p>No commits yet</p>
              </div>
            ) : selectedCommit ? (
              <CommitDetailsView
                commit={selectedCommit}
                isLoading={isLoadingDetails}
                onBack={() => setSelectedCommit(null)}
                onViewDiff={(file) => loadCommitDiff(selectedCommit.hash, file)}
                onViewFullDiff={() => loadCommitDiff(selectedCommit.hash)}
                onCopyHash={() => copyHash(selectedCommit.hash)}
                copiedHash={copiedHash}
                onRevert={onRevertToCommit ? handleRevertClick : undefined}
                isFirstCommit={commits.length > 0 && commits[0].hash === selectedCommit.hash}
              />
            ) : (
              <div className="p-2 space-y-1">
                {commits.map((commit, index) => (
                  <button
                    key={commit.hash}
                    onClick={() => loadCommitDetails(commit.hash)}
                    className="w-full flex items-start gap-2.5 p-2.5 hover:bg-white/5 rounded-lg text-left transition-colors group"
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1 group-hover:bg-blue-400 transition-colors" />
                      {index < commits.length - 1 && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-px h-[calc(100%+0.25rem)] bg-slate-700" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate group-hover:text-blue-300 transition-colors leading-snug">
                        {commit.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500 font-mono">
                          {commit.hashShort}
                        </span>
                        <span className="text-xs text-slate-600">·</span>
                        <span className="text-xs text-slate-500">
                          {formatCommitDate(commit.date)}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Diff Modal */}
      {showDiffModal && (
        <DiffModal
          diff={diffContent}
          isLoading={isLoadingDiff}
          fileName={diffFile}
          commitHash={selectedCommit?.hashShort}
          onClose={() => {
            setShowDiffModal(false);
            setDiffContent('');
            setDiffFile(null);
          }}
        />
      )}

      {/* Revert Confirmation Modal */}
      {showRevertConfirm && revertTargetCommit && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-950/98 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden mx-4 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center gap-3 p-5 border-b border-white/10 bg-amber-500/5">
              <div className="p-2 bg-amber-500/20 rounded-xl">
                <RotateCcw className="w-6 h-6 text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white">Restore to Commit?</h3>
                <p className="text-sm text-slate-400">This will change your project files</p>
              </div>
              <button
                onClick={() => {
                  setShowRevertConfirm(false);
                  setRevertTargetCommit(null);
                }}
                className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
              <div className="p-3 bg-slate-900/50 rounded-lg border border-white/5">
                <p className="text-sm font-medium text-white truncate">{revertTargetCommit.message}</p>
                <p className="text-xs text-slate-500 mt-1 font-mono">{revertTargetCommit.hashShort}</p>
              </div>

              <p className="text-sm text-slate-300">
                Your project files will be restored to this commit's state.
                Any commits after this point will still exist in history.
              </p>

              {/* Uncommitted Changes Warning */}
              {hasUncommittedChanges && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-300">Uncommitted Changes</p>
                      <p className="text-xs text-red-400/80 mt-1">
                        You have {localChanges.length} uncommitted change{localChanges.length !== 1 ? 's' : ''}.
                        These will be lost when you restore.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 p-5 border-t border-white/10 bg-slate-900/30">
              <button
                onClick={() => {
                  setShowRevertConfirm(false);
                  setRevertTargetCommit(null);
                }}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-300 bg-slate-800/50 hover:bg-slate-800 rounded-lg border border-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRevert}
                disabled={isReverting}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isReverting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RotateCcw className="w-4 h-4" />
                )}
                {isReverting ? 'Restoring...' : 'Restore'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GitPanel;

// Re-export all components for external use
export { FileItem } from './FileItem';
export { CommitFileIcon } from './CommitFileIcon';
export { DiffViewer } from './DiffViewer';
export { DiffModal } from './DiffModal';
export { CommitDetailsView } from './CommitDetailsView';
// eslint-disable-next-line react-refresh/only-export-components -- Utility re-export for module API
export { formatCommitDate } from './utils';
export type { LocalChange, FileItemProps, CommitFileIconProps, DiffModalProps, DiffViewerProps, CommitDetailsViewProps } from './types';
