/**
 * FluidFlow Backend API Client
 *
 * Facade module that re-exports all API functionality from focused modules.
 * This maintains backward compatibility while allowing direct imports from submodules.
 *
 * @module services/projectApi
 *
 * Structure:
 * - services/api/types.ts     - All shared type definitions
 * - services/api/client.ts    - API call helper and health check
 * - services/api/projects.ts  - Project CRUD operations
 * - services/api/git.ts       - Git operations
 * - services/api/github.ts    - GitHub operations
 * - services/api/settings.ts  - Settings management
 * - services/api/runner.ts    - Project runner operations
 * - services/api/autoSave.ts  - Auto-save utility
 */

// Re-export everything from the api module
export {
  // Types
  type ProjectMeta,
  type Project,
  type ProjectUpdateResponse,
  type ProjectContext,
  type HistoryEntry,
  type AIHistoryEntry,
  type GitStatus,
  type GitCommit,
  type CommitFileChange,
  type CommitDetails,
  type GitRemote,
  type GitHubUser,
  type GitHubRepo,
  type StoredProviderConfig,
  type CustomSnippet,
  type GlobalSettings,
  type RunningProjectInfo,
  // Client utilities
  API_BASE,
  apiCall,
  checkServerHealth,
  isBackendOnline,
  startHealthMonitor,
  stopHealthMonitor,
  // API clients
  projectApi,
  gitApi,
  githubApi,
  settingsApi,
  runnerApi,
  // Utilities
  autoSave,
} from './api';
