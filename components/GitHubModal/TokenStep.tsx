import React from 'react';
import { Loader2, AlertTriangle, FolderGit, ExternalLink } from 'lucide-react';
import type { UseGitHubModalReturn } from './useGitHubModal';

type Props = Pick<UseGitHubModalReturn, 'token' | 'setToken' | 'tokenLoading' | 'tokenVerifying' | 'error' | 'isImport' | 'handleTokenSubmit'>;

export const TokenStep: React.FC<Props> = ({
  token, setToken, tokenLoading, tokenVerifying: _tokenVerifying, error, isImport, handleTokenSubmit,
}) => (
  <div className="p-6 space-y-4">
    {tokenLoading ? (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--theme-accent)' }} />
      </div>
    ) : (
      <>
        <div>
          <label className="text-xs font-semibold uppercase block mb-1.5" style={{ color: 'var(--theme-text-muted)' }}>
            GitHub Personal Access Token
          </label>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="ghp_xxxxxxxxxxxx"
            className="w-full rounded-lg px-4 py-3 text-sm outline-none"
            style={{ backgroundColor: 'var(--theme-input-bg)', border: '1px solid var(--theme-input-border)', color: 'var(--theme-text-primary)' }}
            onKeyDown={(e) => e.key === 'Enter' && handleTokenSubmit()}
            autoFocus
          />
          <p className="text-xs mt-2" style={{ color: 'var(--theme-text-dim)' }}>
            Requires 'repo' scope for private repositories.{' '}
            <a
              href="https://github.com/settings/tokens/new?scopes=repo&description=FluidFlow"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
              style={{ color: 'var(--theme-accent)' }}
            >
              Create token <ExternalLink className="w-3 h-3 inline" />
            </a>
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg text-sm" style={{ backgroundColor: 'var(--color-error-subtle)', border: '1px solid var(--color-error-border)', color: 'var(--color-error)' }}>
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {isImport && (
          <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--theme-glass-200)', border: '1px solid var(--theme-border-light)' }}>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2" style={{ color: 'var(--theme-text-primary)' }}>
              <FolderGit className="w-4 h-4" style={{ color: 'var(--color-success)' }} />
              FluidFlow Backup Detection
            </h4>
            <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
              Repositories with a <code className="px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--theme-glass-300)' }}>backup/auto</code> branch
              will be highlighted. These contain FluidFlow metadata that will be automatically restored.
            </p>
          </div>
        )}
      </>
    )}
  </div>
);
