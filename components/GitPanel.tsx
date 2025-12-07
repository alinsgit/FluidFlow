import React, { useState, useEffect, useCallback } from 'react';
import {
  GitBranch, GitCommit, Check, X, Plus, RefreshCw, Loader2,
  FileText, FilePlus, FileX, ChevronDown, ChevronUp,
  AlertCircle, Clock, ArrowLeft, Eye, Copy, CheckCheck,
  GitMerge, AlertTriangle, Sparkles, RotateCcw
} from 'lucide-react';
import { GitStatus, GitCommit as GitCommitType, CommitDetails, CommitFileChange, gitApi } from '@/services/projectApi';
import { FileSystem } from '@/types';
import { getProviderManager } from '@/services/ai';

interface LocalChange {
  path: string;
  status: 'added' | 'modified' | 'deleted';
}

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

  // Commit details state
  const [selectedCommit, setSelectedCommit] = useState<CommitDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [showDiffModal, setShowDiffModal] = useState(false);
  const [diffContent, setDiffContent] = useState<string>('');
  const [diffFile, setDiffFile] = useState<string | null>(null);
  const [isLoadingDiff, setIsLoadingDiff] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Load commit history when git is initialized
  useEffect(() => {
    if (projectId && isGitInitialized) {
      loadCommits();
    }
  }, [projectId, isGitInitialized]);

  const loadCommits = async () => {
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
  };

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
      setTimeout(() => setCopiedHash(null), 2000);
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
    </div>
  );
};

// Commit Details View Component
interface CommitDetailsViewProps {
  commit: CommitDetails;
  isLoading: boolean;
  onBack: () => void;
  onViewDiff: (file: string) => void;
  onViewFullDiff: () => void;
  onCopyHash: () => void;
  copiedHash: string | null;
}

const CommitDetailsView: React.FC<CommitDetailsViewProps> = ({
  commit,
  isLoading,
  onBack,
  onViewDiff,
  onViewFullDiff,
  onCopyHash,
  copiedHash
}) => {
  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <Loader2 className="w-5 h-5 mx-auto text-blue-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-3">
      {/* Header with back button */}
      <div className="flex items-center gap-2.5 mb-3">
        <button
          onClick={onBack}
          className="p-1.5 hover:bg-white/10 rounded transition-colors text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white font-medium truncate">{commit.message}</p>
          <div className="flex items-center gap-2 mt-1">
            <button
              onClick={onCopyHash}
              className="flex items-center gap-1.5 text-xs text-slate-500 font-mono hover:text-blue-400 transition-colors"
            >
              {copiedHash === commit.hash ? (
                <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              {commit.hashShort}
            </button>
            <span className="text-xs text-slate-600">·</span>
            <span className="text-xs text-slate-500">{commit.author}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-2.5 mb-3 px-1">
        <span className="text-xs text-slate-400">
          {commit.stats.filesChanged} file{commit.stats.filesChanged !== 1 ? 's' : ''}
        </span>
        {commit.stats.insertions > 0 && (
          <span className="text-xs text-emerald-400">+{commit.stats.insertions}</span>
        )}
        {commit.stats.deletions > 0 && (
          <span className="text-xs text-red-400">-{commit.stats.deletions}</span>
        )}
        <button
          onClick={onViewFullDiff}
          className="ml-auto text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
        >
          <Eye className="w-3.5 h-3.5" />
          All
        </button>
      </div>

      {/* Changed Files */}
      <div className="space-y-1">
        {commit.files.map((file) => (
          <button
            key={file.path}
            onClick={() => onViewDiff(file.path)}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-sm text-slate-400 hover:bg-white/5 rounded group transition-colors"
          >
            <CommitFileIcon status={file.status} />
            <span className="truncate flex-1 text-left group-hover:text-white transition-colors">
              {file.newPath ? `${file.path} → ${file.newPath}` : file.path}
            </span>
            <Eye className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
};

// Commit File Icon
const CommitFileIcon: React.FC<{ status: CommitFileChange['status'] }> = ({ status }) => {
  const configs: Record<CommitFileChange['status'], { Icon: React.FC<any>; color: string }> = {
    added: { Icon: FilePlus, color: 'text-emerald-400' },
    modified: { Icon: FileText, color: 'text-amber-400' },
    deleted: { Icon: FileX, color: 'text-red-400' },
    renamed: { Icon: GitMerge, color: 'text-purple-400' },
    copied: { Icon: Copy, color: 'text-blue-400' },
    unknown: { Icon: FileText, color: 'text-slate-400' },
  };

  const { Icon, color } = configs[status] || configs.unknown;
  return <Icon className={`w-4 h-4 flex-shrink-0 ${color}`} />;
};

// Diff Modal Component
interface DiffModalProps {
  diff: string;
  isLoading: boolean;
  fileName: string | null;
  commitHash?: string;
  onClose: () => void;
}

const DiffModal: React.FC<DiffModalProps> = ({ diff, isLoading, fileName, commitHash, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-4xl max-h-[80vh] bg-slate-900 rounded-xl border border-white/10 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-white">
              {fileName ? fileName : 'All Changes'}
            </span>
            {commitHash && (
              <span className="text-xs text-slate-500 font-mono">@ {commitHash}</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="p-8 text-center">
              <Loader2 className="w-6 h-6 mx-auto text-blue-400 animate-spin" />
              <p className="text-sm text-slate-400 mt-2">Loading diff...</p>
            </div>
          ) : diff ? (
            <DiffViewer diff={diff} />
          ) : (
            <div className="p-8 text-center text-slate-500">
              <p>No changes to display</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Diff Viewer Component
const DiffViewer: React.FC<{ diff: string }> = ({ diff }) => {
  const lines = diff.split('\n');

  return (
    <pre className="text-sm font-mono p-4 overflow-x-auto">
      {lines.map((line, index) => {
        let className = 'text-slate-400';
        let bgClass = '';

        if (line.startsWith('+++') || line.startsWith('---')) {
          className = 'text-slate-500 font-bold';
        } else if (line.startsWith('@@')) {
          className = 'text-purple-400';
          bgClass = 'bg-purple-500/10';
        } else if (line.startsWith('+')) {
          className = 'text-emerald-400';
          bgClass = 'bg-emerald-500/10';
        } else if (line.startsWith('-')) {
          className = 'text-red-400';
          bgClass = 'bg-red-500/10';
        } else if (line.startsWith('diff --git')) {
          className = 'text-blue-400 font-bold';
          bgClass = 'bg-blue-500/10 border-t border-white/5 mt-2 pt-2';
        } else if (line.startsWith('index ') || line.startsWith('new file') || line.startsWith('deleted file')) {
          className = 'text-slate-600';
        }

        return (
          <div key={index} className={`${bgClass} -mx-4 px-4`}>
            <span className={className}>{line || ' '}</span>
          </div>
        );
      })}
    </pre>
  );
};

// File item component
interface FileItemProps {
  file: string;
  status: 'staged' | 'modified' | 'untracked' | 'deleted';
}

const FileItem: React.FC<FileItemProps> = ({ file, status }) => {
  const statusColors = {
    staged: 'text-emerald-400',
    modified: 'text-amber-400',
    untracked: 'text-blue-400',
    deleted: 'text-red-400',
  };

  const StatusIcon = {
    staged: Check,
    modified: FileText,
    untracked: FilePlus,
    deleted: FileX,
  }[status];

  return (
    <div className="flex items-center gap-2.5 px-2.5 py-1.5 ml-4 text-sm text-slate-400 hover:bg-white/5 rounded">
      <StatusIcon className={`w-4 h-4 ${statusColors[status]}`} />
      <span className="truncate">{file}</span>
    </div>
  );
};

// Format commit date
function formatCommitDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default GitPanel;
