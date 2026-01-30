/**
 * GitHub Modal
 *
 * Unified modal for GitHub operations:
 * - Import: Clone repositories from GitHub
 * - Push: Push current project to GitHub (new or existing repo)
 */

import React from 'react';
import { X, Download, Upload, Loader2 } from 'lucide-react';
import { useGitHubModal } from './useGitHubModal';
import { TokenStep } from './TokenStep';
import { ReposStep } from './ReposStep';
import { ProcessingStep } from './ProcessingStep';
import { ResultStep } from './ResultStep';
import type { GitHubModalProps } from './types';

export type { GitHubModalMode, GitHubModalProps } from './types';

export const GitHubModal: React.FC<GitHubModalProps> = (props) => {
  const modal = useGitHubModal(props);

  if (!props.isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200" style={{ backgroundColor: 'var(--theme-modal-overlay)' }}>
      <div className="w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col" style={{ backgroundColor: 'var(--theme-surface)', border: '1px solid var(--theme-border)' }}>
        {/* Header */}
        <div className="p-5 flex items-center justify-between shrink-0" style={{ borderBottom: '1px solid var(--theme-border)', backgroundColor: 'var(--theme-background)' }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: modal.isImport ? 'var(--theme-glass-200)' : 'var(--theme-accent-subtle)' }}>
              {modal.isImport ? (
                <Download className="w-5 h-5" style={{ color: 'var(--theme-text-primary)' }} />
              ) : (
                <Upload className="w-5 h-5" style={{ color: 'var(--theme-accent)' }} />
              )}
            </div>
            <div>
              <h3 className="font-bold" style={{ color: 'var(--theme-text-primary)' }}>
                {modal.isImport ? 'Import from GitHub' : 'Push to GitHub'}
              </h3>
              <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                {modal.step === 'token' && 'Enter your GitHub token to access repositories'}
                {modal.step === 'repos' && (modal.isImport ? 'Select a repository to import' : 'Select destination repository')}
                {modal.step === 'newRepo' && 'Configure new repository'}
                {modal.step === 'processing' && (modal.isImport ? 'Importing project...' : 'Pushing to GitHub...')}
                {modal.step === 'result' && (modal.result?.success ? (modal.isImport ? 'Import complete!' : 'Push complete!') : 'Operation failed')}
              </p>
            </div>
          </div>
          <button onClick={modal.handleClose} className="p-2 rounded-lg transition-colors" style={{ color: 'var(--theme-text-muted)' }} aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {modal.step === 'token' && <TokenStep {...modal} />}
          {modal.step === 'repos' && <ReposStep {...modal} />}
          {modal.step === 'processing' && (
            <ProcessingStep isImport={modal.isImport} selectedRepo={modal.selectedRepo} cloneUrl={modal.cloneUrl} />
          )}
          {modal.step === 'result' && modal.result && (
            <ResultStep
              result={modal.result}
              isImport={modal.isImport}
              setForcePush={modal.setForcePush}
              setStep={modal.setStep}
              setResult={modal.setResult}
            />
          )}
        </div>

        {/* Footer */}
        <div className="p-4 flex justify-between items-center shrink-0" style={{ backgroundColor: 'var(--theme-glass-100)', borderTop: '1px solid var(--theme-border)' }}>
          {modal.step === 'repos' ? (
            <button
              onClick={() => { modal.setStep('token'); modal.setToken(''); }}
              className="px-4 py-2 rounded-lg text-sm transition-colors"
              style={{ color: 'var(--theme-text-muted)' }}
            >
              Change Token
            </button>
          ) : <div />}

          <div className="flex gap-3">
            {modal.step === 'token' && !modal.tokenLoading && (
              <>
                <button onClick={modal.handleClose} className="px-4 py-2 rounded-lg text-sm transition-colors" style={{ color: 'var(--theme-text-muted)' }}>
                  Cancel
                </button>
                <button
                  onClick={modal.handleTokenSubmit}
                  disabled={!modal.token.trim() || modal.tokenVerifying}
                  className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                  style={{ backgroundColor: 'var(--theme-accent)', color: 'var(--theme-text-on-accent)' }}
                >
                  {modal.tokenVerifying && <Loader2 className="w-4 h-4 animate-spin" />}
                  Continue
                </button>
              </>
            )}

            {modal.step === 'repos' && (
              <button onClick={modal.handleClose} className="px-4 py-2 rounded-lg text-sm transition-colors" style={{ color: 'var(--theme-text-muted)' }}>
                Cancel
              </button>
            )}

            {modal.step === 'result' && (
              <button
                onClick={modal.result?.success ? modal.handleComplete : modal.handleClose}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{
                  backgroundColor: modal.result?.success ? 'var(--color-success)' : 'var(--theme-glass-200)',
                  color: modal.result?.success ? 'white' : 'var(--theme-text-primary)'
                }}
              >
                {modal.result?.success ? (modal.isImport ? 'Open Project' : 'Done') : 'Close'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GitHubModal;
