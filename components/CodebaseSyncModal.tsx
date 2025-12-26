/**
 * Codebase Sync Modal
 *
 * Analyzes project files and generates AI context summaries.
 * Instead of sending all files to AI (which doesn't persist),
 * we generate condensed summaries included in every prompt.
 *
 * Generates:
 * 1. Style Guide - Design patterns, colors, typography
 * 2. Project Summary - Purpose, architecture, key files
 */

import React, { useState, useMemo } from 'react';
import {
  X,
  Sparkles,
  FileCode,
  Loader2,
  CheckCircle2,
  XCircle,
  Palette,
  FolderTree,
  Zap
} from 'lucide-react';
import type { FileSystem } from '@/types';
import { estimateTokenCount } from '../services/ai/capabilities';
import {
  generateProjectContext,
  ProjectContext,
  getProjectContext
} from '../services/projectContext';

interface CodebaseSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: FileSystem;
  projectId?: string;
  onSyncComplete?: (context: ProjectContext) => void;
}

type SyncPhase = 'ready' | 'generating' | 'complete' | 'error';

export const CodebaseSyncModal: React.FC<CodebaseSyncModalProps> = ({
  isOpen,
  onClose,
  files,
  projectId,
  onSyncComplete
}) => {
  const [phase, setPhase] = useState<SyncPhase>('ready');
  const [progress, setProgress] = useState<string>('');
  const [context, setContext] = useState<ProjectContext | null>(null);
  const [error, setError] = useState<string>('');

  // Check for existing context
  const existingContext = useMemo(() => {
    if (!projectId) return null;
    return getProjectContext(projectId);
  }, [projectId]);

  // Calculate file stats
  const stats = useMemo(() => {
    const entries = Object.entries(files);
    const totalLines = entries.reduce((sum, [_, content]) => sum + content.split('\n').length, 0);
    const totalTokens = entries.reduce((sum, [_, content]) => sum + estimateTokenCount(content), 0);
    return {
      fileCount: entries.length,
      lineCount: totalLines,
      tokenCount: totalTokens
    };
  }, [files]);

  // Handle generate
  const handleGenerate = async () => {
    if (!projectId) {
      setError('No project selected');
      setPhase('error');
      return;
    }

    setPhase('generating');
    setError('');

    try {
      const result = await generateProjectContext(projectId, files, setProgress);
      setContext(result);
      setPhase('complete');
      onSyncComplete?.(result);
    } catch (err) {
      console.error('[CodebaseSync] Generation failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setPhase('error');
    }
  };

  // Reset modal
  const handleReset = () => {
    setPhase('ready');
    setContext(null);
    setError('');
    setProgress('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-slate-900 border border-white/10 rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Generate AI Context</h2>
              <p className="text-sm text-white/60">
                {phase === 'ready' && 'Create project summaries for consistent AI responses'}
                {phase === 'generating' && progress}
                {phase === 'complete' && 'Context generated successfully!'}
                {phase === 'error' && 'Generation failed'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {/* Ready State */}
          {phase === 'ready' && (
            <>
              {/* Project Stats */}
              <div className="p-4 bg-white/5 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <FileCode className="w-5 h-5 text-blue-400" />
                  <span className="font-medium text-white">Project Overview</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-white">{stats.fileCount}</div>
                    <div className="text-xs text-white/50">Files</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{stats.lineCount.toLocaleString()}</div>
                    <div className="text-xs text-white/50">Lines</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">~{Math.round(stats.tokenCount / 1000)}K</div>
                    <div className="text-xs text-white/50">Tokens</div>
                  </div>
                </div>
              </div>

              {/* What will be generated */}
              <div className="space-y-3">
                <div className="text-sm text-white/60 font-medium">What will be generated:</div>

                <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                  <div className="flex items-center gap-2 text-purple-400 mb-2">
                    <Palette className="w-4 h-4" />
                    <span className="font-medium">Style Guide</span>
                  </div>
                  <div className="text-sm text-white/60">
                    Colors, typography, visual patterns, code conventions, component list
                  </div>
                </div>

                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-400 mb-2">
                    <FolderTree className="w-4 h-4" />
                    <span className="font-medium">Project Summary</span>
                  </div>
                  <div className="text-sm text-white/60">
                    Purpose, architecture, key files, features, tech stack
                  </div>
                </div>
              </div>

              {/* Existing context warning */}
              {existingContext && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <div className="text-sm text-amber-300">
                    ⚠️ This project already has a context (generated {new Date(existingContext.generatedAt).toLocaleDateString()}).
                    Generating again will replace it.
                  </div>
                </div>
              )}

              {/* Benefits */}
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-center gap-2 text-green-400 mb-2">
                  <Zap className="w-4 h-4" />
                  <span className="font-medium">Benefits</span>
                </div>
                <ul className="text-sm text-white/60 space-y-1">
                  <li>• AI maintains consistent style across all responses</li>
                  <li>• Works even after page refresh (persisted locally)</li>
                  <li>• Only ~1K tokens added to each prompt (not 50K+)</li>
                  <li>• No need to re-sync - context is automatically included</li>
                </ul>
              </div>
            </>
          )}

          {/* Generating State */}
          {phase === 'generating' && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 text-purple-400 animate-spin mb-4" />
              <div className="text-white font-medium mb-2">Analyzing codebase...</div>
              <div className="text-sm text-white/60">{progress}</div>
              <div className="text-xs text-white/40 mt-4">This may take 10-30 seconds</div>
            </div>
          )}

          {/* Complete State */}
          {phase === 'complete' && context && (
            <div className="space-y-4">
              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <div className="flex items-center gap-2 text-green-400 mb-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-medium">Context Generated Successfully!</span>
                </div>
                <div className="text-sm text-white/60">
                  Your project context will be included in all future AI prompts.
                </div>
              </div>

              {/* Style Guide Display */}
              <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                <div className="flex items-center gap-2 text-purple-400 mb-3">
                  <Palette className="w-5 h-5" />
                  <span className="font-medium">Style Guide</span>
                </div>

                <div className="text-sm text-white/80 mb-3">
                  {context.styleGuide.summary}
                </div>

                {/* Colors */}
                {Object.keys(context.styleGuide.colors).length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs text-white/50 mb-1">Colors</div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(context.styleGuide.colors)
                        .filter(([_, v]) => v)
                        .map(([name, value]) => (
                          <div
                            key={name}
                            className="flex items-center gap-1.5 px-2 py-1 bg-black/30 rounded text-xs"
                          >
                            <div
                              className="w-3 h-3 rounded-full border border-white/20"
                              style={{
                                backgroundColor: value?.startsWith('#') ? value : undefined,
                              }}
                            />
                            <span className="text-white/60">{name}:</span>
                            <span className="text-white/80">{value}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Typography, Borders, Effects Grid */}
                <div className="grid grid-cols-3 gap-3 mb-3">
                  {/* Typography */}
                  {context.styleGuide.typography.fontFamily && (
                    <div className="p-2 bg-black/20 rounded">
                      <div className="text-xs text-white/50 mb-1">Typography</div>
                      <div className="text-xs text-white/70 space-y-0.5">
                        {context.styleGuide.typography.fontFamily && (
                          <div>Font: {context.styleGuide.typography.fontFamily}</div>
                        )}
                        {context.styleGuide.typography.headingStyle && (
                          <div className="truncate" title={context.styleGuide.typography.headingStyle}>
                            H: {context.styleGuide.typography.headingStyle}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Borders */}
                  {context.styleGuide.borders.radius && (
                    <div className="p-2 bg-black/20 rounded">
                      <div className="text-xs text-white/50 mb-1">Borders</div>
                      <div className="text-xs text-white/70 space-y-0.5">
                        {context.styleGuide.borders.radius && (
                          <div>Radius: {context.styleGuide.borders.radius}</div>
                        )}
                        {context.styleGuide.borders.style && (
                          <div className="truncate" title={context.styleGuide.borders.style}>
                            Style: {context.styleGuide.borders.style}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Effects */}
                  {(context.styleGuide.effects.shadow || context.styleGuide.effects.blur) && (
                    <div className="p-2 bg-black/20 rounded">
                      <div className="text-xs text-white/50 mb-1">Effects</div>
                      <div className="text-xs text-white/70 space-y-0.5">
                        {context.styleGuide.effects.shadow && (
                          <div className="truncate" title={context.styleGuide.effects.shadow}>
                            Shadow: {context.styleGuide.effects.shadow}
                          </div>
                        )}
                        {context.styleGuide.effects.blur && (
                          <div className="truncate" title={context.styleGuide.effects.blur}>
                            Blur: {context.styleGuide.effects.blur}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Spacing */}
                {(context.styleGuide.spacing.containerPadding || context.styleGuide.spacing.elementGap) && (
                  <div className="mb-3">
                    <div className="text-xs text-white/50 mb-1">Spacing</div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {context.styleGuide.spacing.containerPadding && (
                        <span className="px-2 py-0.5 bg-black/30 rounded text-white/70">
                          Padding: {context.styleGuide.spacing.containerPadding}
                        </span>
                      )}
                      {context.styleGuide.spacing.elementGap && (
                        <span className="px-2 py-0.5 bg-black/30 rounded text-white/70">
                          Gap: {context.styleGuide.spacing.elementGap}
                        </span>
                      )}
                      {context.styleGuide.spacing.sectionSpacing && (
                        <span className="px-2 py-0.5 bg-black/30 rounded text-white/70">
                          Sections: {context.styleGuide.spacing.sectionSpacing}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Patterns */}
                {context.styleGuide.patterns.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs text-white/50 mb-1">Design Patterns</div>
                    <div className="flex flex-wrap gap-1.5">
                      {context.styleGuide.patterns.map((pattern, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded text-xs"
                        >
                          {pattern}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Components */}
                {context.styleGuide.components.length > 0 && (
                  <div>
                    <div className="text-xs text-white/50 mb-1">Components</div>
                    <div className="text-xs text-white/60">
                      {context.styleGuide.components.join(', ')}
                    </div>
                  </div>
                )}
              </div>

              {/* Project Summary Display */}
              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <div className="flex items-center gap-2 text-blue-400 mb-3">
                  <FolderTree className="w-5 h-5" />
                  <span className="font-medium">Project Summary</span>
                </div>

                <div className="text-sm text-white/80 mb-3">
                  {context.projectSummary.summary}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-xs text-white/50 mb-1">Purpose</div>
                    <div className="text-white/70">{context.projectSummary.purpose}</div>
                  </div>
                  <div>
                    <div className="text-xs text-white/50 mb-1">Architecture</div>
                    <div className="text-white/70">{context.projectSummary.architecture}</div>
                  </div>
                </div>

                {/* Key Files */}
                {Object.keys(context.projectSummary.keyFiles).length > 0 && (
                  <div className="mt-3">
                    <div className="text-xs text-white/50 mb-1">Key Files</div>
                    <div className="space-y-1">
                      {Object.entries(context.projectSummary.keyFiles).map(([path, desc]) => (
                        <div key={path} className="text-xs">
                          <span className="text-blue-400">{path}</span>
                          <span className="text-white/40"> - {desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tech Stack */}
                {context.projectSummary.techStack.length > 0 && (
                  <div className="mt-3">
                    <div className="text-xs text-white/50 mb-1">Tech Stack</div>
                    <div className="flex flex-wrap gap-1.5">
                      {context.projectSummary.techStack.map((tech, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded text-xs"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Token info */}
              <div className="text-center text-xs text-white/40">
                Combined context: ~{Math.ceil(context.combinedPrompt.length / 4)} tokens
                (included in every AI prompt)
              </div>
            </div>
          )}

          {/* Error State */}
          {phase === 'error' && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <div className="flex items-center gap-2 text-red-400 mb-2">
                <XCircle className="w-5 h-5" />
                <span className="font-medium">Generation Failed</span>
              </div>
              <div className="text-sm text-red-300">{error}</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex items-center justify-end gap-3">
          {phase === 'ready' && (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-white/60 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={!projectId}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-white/10 disabled:text-white/40 text-white rounded-lg transition-colors text-sm font-medium"
              >
                <Sparkles className="w-4 h-4" />
                Generate Context
              </button>
            </>
          )}

          {phase === 'generating' && (
            <div className="text-sm text-white/40">
              Please wait...
            </div>
          )}

          {(phase === 'complete' || phase === 'error') && (
            <>
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm text-white/60 hover:text-white transition-colors"
              >
                Generate Again
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors text-sm font-medium"
              >
                Done
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CodebaseSyncModal;
