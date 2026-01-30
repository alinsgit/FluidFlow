import React from 'react';
import { Check, X, AlertCircle, ExternalLink } from 'lucide-react';
import type { OperationResult, ModalStep } from './types';

interface Props {
  result: OperationResult;
  isImport: boolean;
  setForcePush: (force: boolean) => void;
  setStep: (step: ModalStep) => void;
  setResult: (result: OperationResult | null) => void;
}

export const ResultStep: React.FC<Props> = ({ result, isImport, setForcePush, setStep, setResult }) => (
  <div className="flex flex-col items-center justify-center py-12 px-6">
    {result.success ? (
      <>
        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-success-subtle)' }}>
          <Check className="w-8 h-8" style={{ color: 'var(--color-success)' }} />
        </div>
        <h4 className="mt-6 text-lg font-medium" style={{ color: 'var(--theme-text-primary)' }}>
          {isImport ? 'Import Successful!' : 'Push Successful!'}
        </h4>
        {isImport ? (
          <p className="mt-2 text-sm" style={{ color: 'var(--theme-text-muted)' }}>
            Project "{result.project?.name}" has been imported.
          </p>
        ) : (
          <p className="mt-2 text-sm" style={{ color: 'var(--theme-text-muted)' }}>
            Your project has been pushed to GitHub.
          </p>
        )}

        {result.repoUrl && (
          <a
            href={result.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex items-center gap-2 underline underline-offset-4"
            style={{ color: 'var(--theme-accent)' }}
          >
            View on GitHub <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}

        {isImport && result.restored && (
          <div className="mt-6 w-full max-w-sm space-y-2">
            <RestorationCard label="Project Metadata" restored={result.restored.metadata} />
            <RestorationCard label="Conversation Context" restored={result.restored.context} />
          </div>
        )}
      </>
    ) : (
      <>
        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-error-subtle)' }}>
          <AlertCircle className="w-8 h-8" style={{ color: 'var(--color-error)' }} />
        </div>
        <h4 className="mt-6 text-lg font-medium" style={{ color: 'var(--theme-text-primary)' }}>
          {isImport ? 'Import Failed' : 'Push Failed'}
        </h4>
        <p className="mt-2 text-sm p-3 rounded-lg max-w-md text-center" style={{ backgroundColor: 'var(--color-error-subtle)', border: '1px solid var(--color-error-border)', color: 'var(--color-error)' }}>
          {result.error}
        </p>
        {result.error?.includes('Force Push') && (
          <button
            onClick={() => {
              setForcePush(true);
              setStep('repos');
              setResult(null);
            }}
            className="mt-4 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ backgroundColor: 'var(--color-warning)', color: 'white' }}
          >
            Enable Force Push & Retry
          </button>
        )}
      </>
    )}
  </div>
);

// ── Sub-component ─────────────────────────────────────────────────────

const RestorationCard: React.FC<{ label: string; restored: boolean }> = ({ label, restored }) => (
  <div className="flex items-center gap-3 p-3 rounded-lg" style={{
    backgroundColor: restored ? 'var(--color-success-subtle)' : 'var(--theme-glass-200)',
    border: restored ? '1px solid var(--color-success-border)' : '1px solid var(--theme-border-light)'
  }}>
    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{
      backgroundColor: restored ? 'var(--color-success-subtle)' : 'var(--theme-glass-300)'
    }}>
      {restored ? (
        <Check className="w-4 h-4" style={{ color: 'var(--color-success)' }} />
      ) : (
        <X className="w-4 h-4" style={{ color: 'var(--theme-text-dim)' }} />
      )}
    </div>
    <div>
      <p className="text-sm" style={{ color: 'var(--theme-text-primary)' }}>{label}</p>
      <p className="text-[10px]" style={{ color: 'var(--theme-text-dim)' }}>
        {restored ? 'Restored from backup' : 'Not found'}
      </p>
    </div>
  </div>
);
