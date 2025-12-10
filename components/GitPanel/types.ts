/**
 * Shared types for GitPanel components
 */

import { CommitFileChange } from '@/services/projectApi';

export interface LocalChange {
  path: string;
  status: 'added' | 'modified' | 'deleted';
}

export interface FileItemProps {
  file: string;
  status: 'staged' | 'modified' | 'untracked' | 'deleted';
}

export interface CommitFileIconProps {
  status: CommitFileChange['status'];
}

export interface DiffModalProps {
  diff: string;
  isLoading: boolean;
  fileName: string | null;
  commitHash?: string;
  onClose: () => void;
}

export interface DiffViewerProps {
  diff: string;
}

export interface CommitDetailsViewProps {
  commit: import('@/services/projectApi').CommitDetails;
  isLoading: boolean;
  onBack: () => void;
  onViewDiff: (file: string) => void;
  onViewFullDiff: () => void;
  onCopyHash: () => void;
  copiedHash: string | null;
  onRevert?: (commit: import('@/services/projectApi').CommitDetails) => void;
  isFirstCommit?: boolean;
}
