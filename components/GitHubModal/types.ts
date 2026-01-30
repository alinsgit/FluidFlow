import type { ProjectMeta } from '@/services/projectApi';

export interface GitHubRepo {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  url: string;
  cloneUrl: string;
  private: boolean;
  updatedAt: string;
  defaultBranch: string;
  hasFluidFlowBackup: boolean;
}

export interface OperationResult {
  success: boolean;
  project?: ProjectMeta;
  restored?: { metadata: boolean; context: boolean };
  repoUrl?: string;
  error?: string;
}

export type GitHubModalMode = 'import' | 'push';

export interface GitHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: GitHubModalMode;
  onImportComplete?: (project: ProjectMeta) => void;
  projectId?: string;
  projectName?: string;
  hasExistingRemote?: boolean;
  existingRemoteUrl?: string;
  onPushComplete?: (repoUrl: string) => void;
}

export type ModalStep = 'token' | 'repos' | 'newRepo' | 'processing' | 'result';
