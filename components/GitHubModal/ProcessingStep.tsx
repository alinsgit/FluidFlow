import React from 'react';
import { Download, Upload, Loader2 } from 'lucide-react';
import type { GitHubRepo } from './types';

interface Props {
  isImport: boolean;
  selectedRepo: GitHubRepo | null;
  cloneUrl: string;
}

export const ProcessingStep: React.FC<Props> = ({ isImport, selectedRepo, cloneUrl }) => (
  <div className="flex flex-col items-center justify-center py-16">
    <div className="relative">
      <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--theme-accent-subtle)' }}>
        {isImport ? (
          <Download className="w-8 h-8" style={{ color: 'var(--theme-accent)' }} />
        ) : (
          <Upload className="w-8 h-8" style={{ color: 'var(--theme-accent)' }} />
        )}
      </div>
      <div className="absolute -bottom-1 -right-1">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--theme-accent)' }} />
      </div>
    </div>
    <h4 className="mt-6 text-lg font-medium" style={{ color: 'var(--theme-text-primary)' }}>
      {isImport ? `Importing ${selectedRepo?.name || cloneUrl.split('/').pop()?.replace('.git', '') || 'project'}` : 'Pushing to GitHub'}
    </h4>
    <p className="mt-2 text-sm" style={{ color: 'var(--theme-text-muted)' }}>
      {isImport
        ? 'Cloning repository and checking for FluidFlow metadata...'
        : 'Creating repository and pushing files...'}
    </p>
  </div>
);
