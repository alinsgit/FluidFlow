/**
 * PromptConfirmationModal
 *
 * Modal shown before sending prompts to LLM.
 * Displays prompt details, model info, and context usage.
 */

import React, { useMemo } from 'react';
import {
  Bot,
  X,
  Send,
  Ban,
  ChevronDown,
  ChevronRight,
  Cpu,
  MessageSquare,
  FileText,
  Sparkles,
  AlertCircle,
  Paperclip,
  Zap
} from 'lucide-react';
import { usePromptConfirmation } from '../contexts/PromptConfirmationContext';

export const PromptConfirmationModal: React.FC = () => {
  const { pendingRequest, handleConfirm, handleCancel } = usePromptConfirmation();
  const [expandedSections, setExpandedSections] = React.useState<Set<string>>(
    new Set(['prompt'])
  );

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      next.has(section) ? next.delete(section) : next.add(section);
      return next;
    });
  };

  // Estimate tokens (rough: 4 chars = 1 token)
  const tokenEstimates = useMemo(() => {
    if (!pendingRequest) return { prompt: 0, system: 0, total: 0 };
    const promptTokens = Math.ceil((pendingRequest.details.prompt?.length || 0) / 4);
    const systemTokens = Math.ceil((pendingRequest.details.systemInstruction?.length || 0) / 4);
    return {
      prompt: promptTokens,
      system: systemTokens,
      total: promptTokens + systemTokens,
    };
  }, [pendingRequest]);

  if (!pendingRequest) return null;

  const { details } = pendingRequest;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Confirm AI Request</h2>
              <p className="text-sm text-slate-400">Review before sending to LLM</p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Info Bar */}
        <div className="flex items-center gap-4 px-6 py-3 bg-slate-800/50 border-b border-white/5 text-sm">
          {/* Provider & Model */}
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-400" />
            <span className="text-slate-300">{details.provider || 'Unknown'}</span>
            <span className="text-slate-500">/</span>
            <span className="text-white font-medium">{details.model}</span>
          </div>

          {/* Separator */}
          <div className="w-px h-4 bg-white/10" />

          {/* Category */}
          {details.category && (
            <>
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-slate-300 capitalize">{details.category}</span>
              </div>
              <div className="w-px h-4 bg-white/10" />
            </>
          )}

          {/* Token Estimate */}
          <div className="flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-green-400" />
            <span className="text-slate-300">~{tokenEstimates.total.toLocaleString()} tokens</span>
          </div>

          {/* Attachments */}
          {details.attachments && details.attachments.length > 0 && (
            <>
              <div className="w-px h-4 bg-white/10" />
              <div className="flex items-center gap-1.5">
                <Paperclip className="w-4 h-4 text-amber-400" />
                <span className="text-slate-300">{details.attachments.length} attachment(s)</span>
              </div>
            </>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* System Instruction Section */}
          {details.systemInstruction && (
            <div className="border-b border-white/5">
              <button
                onClick={() => toggleSection('system')}
                className="w-full flex items-center gap-2 px-6 py-3 hover:bg-white/5 transition-colors"
              >
                {expandedSections.has('system') ? (
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                )}
                <Bot className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-medium text-slate-300">System Instruction</span>
                <span className="text-xs text-slate-500 ml-auto">
                  ~{tokenEstimates.system.toLocaleString()} tokens
                </span>
              </button>
              {expandedSections.has('system') && (
                <div className="px-6 pb-4">
                  <pre className="text-xs font-mono bg-cyan-950/20 border border-cyan-800/30 p-4 rounded-lg overflow-x-auto max-h-48 overflow-y-auto whitespace-pre-wrap text-cyan-100/80">
                    {details.systemInstruction}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Prompt Section */}
          <div className="border-b border-white/5">
            <button
              onClick={() => toggleSection('prompt')}
              className="w-full flex items-center gap-2 px-6 py-3 hover:bg-white/5 transition-colors"
            >
              {expandedSections.has('prompt') ? (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-500" />
              )}
              <FileText className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-slate-300">Prompt</span>
              <span className="text-xs text-slate-500 ml-auto">
                ~{tokenEstimates.prompt.toLocaleString()} tokens • {details.prompt.length.toLocaleString()} chars
              </span>
            </button>
            {expandedSections.has('prompt') && (
              <div className="px-6 pb-4">
                <pre className="text-xs font-mono bg-blue-950/20 border border-blue-800/30 p-4 rounded-lg overflow-x-auto max-h-64 overflow-y-auto whitespace-pre-wrap text-blue-100/80">
                  {details.prompt}
                </pre>
              </div>
            )}
          </div>

          {/* Attachments Section */}
          {details.attachments && details.attachments.length > 0 && (
            <div className="border-b border-white/5">
              <button
                onClick={() => toggleSection('attachments')}
                className="w-full flex items-center gap-2 px-6 py-3 hover:bg-white/5 transition-colors"
              >
                {expandedSections.has('attachments') ? (
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                )}
                <Paperclip className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-medium text-slate-300">Attachments</span>
                <span className="text-xs text-slate-500 ml-auto">
                  {details.attachments.length} file(s)
                </span>
              </button>
              {expandedSections.has('attachments') && (
                <div className="px-6 pb-4">
                  <div className="space-y-2">
                    {details.attachments.map((att, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-3 bg-amber-950/20 border border-amber-800/30 rounded-lg"
                      >
                        <Paperclip className="w-4 h-4 text-amber-400" />
                        <span className="text-sm text-amber-100/80">{att.type}</span>
                        <span className="text-xs text-slate-500 ml-auto">
                          {(att.size / 1024).toFixed(1)} KB
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Warning */}
        <div className="px-6 py-3 bg-amber-950/20 border-t border-amber-800/30 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <p className="text-xs text-amber-200/80">
            This prompt will be sent to the AI provider. Review the content before proceeding.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-slate-950">
          <p className="text-xs text-slate-500">
            You can disable this confirmation in Settings → Advanced
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Ban className="w-4 h-4" />
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-blue-500/20"
            >
              <Send className="w-4 h-4" />
              Send to AI
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptConfirmationModal;
