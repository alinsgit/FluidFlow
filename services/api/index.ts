/**
 * API Module Index
 *
 * Barrel export for all API modules.
 */

// Types
export type {
  // Project types
  ProjectMeta,
  Project,
  ProjectUpdateResponse,
  ProjectContext,
  HistoryEntry,
  AIHistoryEntry,
  // Git types
  GitStatus,
  GitCommit,
  CommitFileChange,
  CommitDetails,
  GitRemote,
  // GitHub types
  GitHubUser,
  GitHubRepo,
  // Settings types
  StoredProviderConfig,
  CustomSnippet,
  GlobalSettings,
  // Runner types
  RunningProjectInfo,
} from './types';

// Client utilities
export {
  API_BASE,
  apiCall,
  checkServerHealth,
  isBackendOnline,
  startHealthMonitor,
  stopHealthMonitor,
} from './client';

// API clients
export { projectApi } from './projects';
export { gitApi } from './git';
export { githubApi } from './github';
export { settingsApi } from './settings';
export { runnerApi } from './runner';

// Utilities
export { autoSave } from './autoSave';
