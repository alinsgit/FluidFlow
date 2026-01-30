/**
 * WIP Storage Service
 *
 * Work In Progress (WIP) storage using IndexedDB.
 * WIP data survives page refreshes and allows users to continue where they left off.
 * Files only sync to backend on COMMIT (git-centric approach).
 */

import { WIP_DB_NAME, WIP_DB_VERSION, WIP_STORE_NAME, CHAT_STORE_NAME } from '@/constants';
import { FileSystem, ChatMessage } from '@/types';
import { LockManager } from '@/utils/async';

/**
 * Special ID for scratch mode (no project selected)
 * Used to persist work even when no project has been created
 */
export const SCRATCH_WIP_ID = '__scratch__';

/**
 * WIP data structure stored in IndexedDB
 */
export interface WIPData {
  /** Project ID (used as key in IndexedDB) */
  id: string;
  /** Current file system state */
  files: FileSystem;
  /** Currently active file path */
  activeFile: string;
  /** Currently active tab */
  activeTab: string;
  /** Timestamp when WIP was saved */
  savedAt: number;
  /** Version for conflict detection */
  version?: number;
}

// Lock managers to prevent concurrent IndexedDB writes
const wipLock = new LockManager();
const chatLock = new LockManager();

/**
 * Open the WIP IndexedDB database
 * Creates the object store if it doesn't exist.
 * Caches the connection to avoid opening a new one on every operation.
 */
let cachedDb: IDBDatabase | null = null;

function openDatabaseInternal(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(WIP_DB_NAME, WIP_DB_VERSION);

    request.onerror = () => {
      console.error('[WIPStorage] Failed to open database:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      cachedDb = request.result;
      // Clear cache if the browser closes the connection (e.g. during version change)
      cachedDb.onclose = () => { cachedDb = null; };
      cachedDb.onversionchange = () => {
        cachedDb?.close();
        cachedDb = null;
      };
      resolve(cachedDb);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(WIP_STORE_NAME)) {
        db.createObjectStore(WIP_STORE_NAME, { keyPath: 'id' });
      }
      // Add chat store for message persistence
      if (!db.objectStoreNames.contains(CHAT_STORE_NAME)) {
        db.createObjectStore(CHAT_STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

/**
 * Open the database with stale connection recovery.
 * If the cached connection is stale (closed by another tab or browser),
 * clears the cache and retries once.
 */
async function openDatabase(): Promise<IDBDatabase> {
  if (cachedDb) {
    try {
      // Verify the cached connection is still usable by attempting a transaction
      cachedDb.transaction(WIP_STORE_NAME, 'readonly');
      return cachedDb;
    } catch {
      // Connection is stale (InvalidStateError), clear and reopen
      console.warn('[WIPStorage] Stale database connection detected, reconnecting...');
      cachedDb = null;
    }
  }
  return openDatabaseInternal();
}

// ============ Generic IndexedDB Helpers ============

/**
 * Get a record from a store by key.
 * Returns null if the record doesn't exist; throws on database errors.
 */
async function dbGet<T>(storeName: string, key: string, label: string): Promise<T | null> {
  const db = await openDatabase();
  const tx = db.transaction(storeName, 'readonly');
  const store = tx.objectStore(storeName);

  return new Promise((resolve, reject) => {
    const request = store.get(key);
    request.onerror = () => {
      console.error(`[${label}] Failed to get:`, request.error);
      reject(request.error);
    };
    request.onsuccess = () => resolve(request.result || null);
  });
}

/**
 * Put a record into a store (insert or update).
 * Uses the provided lock to prevent concurrent writes.
 */
async function dbPut<T>(storeName: string, data: T, lock: LockManager, label: string): Promise<void> {
  return lock.run(async () => {
    const db = await openDatabase();
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.put(data);
      request.onerror = () => {
        console.error(`[${label}] Failed to save:`, request.error);
        reject(request.error);
      };
      request.onsuccess = () => resolve();
    });
  });
}

/**
 * Delete a record from a store by key.
 * Uses the provided lock to prevent concurrent writes.
 */
async function dbDelete(storeName: string, key: string, lock: LockManager, label: string): Promise<void> {
  return lock.run(async () => {
    const db = await openDatabase();
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.delete(key);
      request.onerror = () => {
        console.warn(`[${label}] Failed to clear:`, request.error);
        reject(request.error);
      };
      request.onsuccess = () => resolve();
    });
  });
}

// ============ WIP Storage Operations ============

/**
 * Get WIP data for a project
 *
 * @param projectId - The project ID to retrieve WIP for
 * @returns WIP data or null if not found; throws on database errors
 */
export async function getWIP(projectId: string): Promise<WIPData | null> {
  return dbGet<WIPData>(WIP_STORE_NAME, projectId, 'WIPStorage');
}

/**
 * Save WIP data for a project
 * Uses a write lock to prevent concurrent operations
 *
 * @param data - WIP data to save
 */
export async function saveWIP(data: WIPData): Promise<void> {
  await dbPut(WIP_STORE_NAME, data, wipLock, 'WIPStorage');
  console.log('[WIPStorage] WIP saved for project:', data.id);
}

/**
 * Clear WIP data for a project
 * Uses a write lock to prevent concurrent operations
 *
 * @param projectId - The project ID to clear WIP for
 */
export async function clearWIP(projectId: string): Promise<void> {
  await dbDelete(WIP_STORE_NAME, projectId, wipLock, 'WIPStorage');
  console.log('[WIPStorage] Cleared WIP for project:', projectId);
}

/**
 * Check if WIP exists for a project
 *
 * @param projectId - The project ID to check
 * @returns true if WIP exists with files
 */
export async function hasWIP(projectId: string): Promise<boolean> {
  const wip = await getWIP(projectId);
  return wip !== null && wip.files !== null && Object.keys(wip.files).length > 0;
}

/**
 * Create WIP data object
 * Helper to create properly structured WIP data
 *
 * @param projectId - Project ID
 * @param files - Current file system state
 * @param activeFile - Currently active file
 * @param activeTab - Currently active tab
 * @returns WIPData object ready for saving
 */
export function createWIPData(
  projectId: string,
  files: FileSystem,
  activeFile: string,
  activeTab: string
): WIPData {
  return {
    id: projectId,
    files,
    activeFile,
    activeTab,
    savedAt: Date.now(),
  };
}

// ============ Chat Message Storage ============

/**
 * Chat data structure stored in IndexedDB
 */
export interface ChatData {
  /** Project ID or SCRATCH_WIP_ID (used as key) */
  id: string;
  /** Chat messages */
  messages: ChatMessage[];
  /** Timestamp when chat was saved */
  savedAt: number;
}

/**
 * Get chat messages for a project
 * @returns Messages array (empty if no data); throws on database errors
 */
export async function getChatMessages(projectId: string): Promise<ChatMessage[]> {
  const data = await dbGet<ChatData>(CHAT_STORE_NAME, projectId, 'ChatStorage');
  return data?.messages || [];
}

/**
 * Save chat messages for a project
 */
export async function saveChatMessages(projectId: string, messages: ChatMessage[]): Promise<void> {
  const data: ChatData = { id: projectId, messages, savedAt: Date.now() };
  await dbPut(CHAT_STORE_NAME, data, chatLock, 'ChatStorage');
  console.log('[ChatStorage] Messages saved for:', projectId, '- count:', messages.length);
}

/**
 * Clear chat messages for a project
 */
export async function clearChatMessages(projectId: string): Promise<void> {
  await dbDelete(CHAT_STORE_NAME, projectId, chatLock, 'ChatStorage');
  console.log('[ChatStorage] Cleared messages for:', projectId);
}
