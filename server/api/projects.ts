import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Projects directory - use process.cwd() for reliability
const PROJECTS_DIR = path.join(process.cwd(), 'projects');

// Ensure projects dir exists
if (!existsSync(PROJECTS_DIR)) {
  mkdirSync(PROJECTS_DIR, { recursive: true });
}

interface ProjectMeta {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  description?: string;
  gitInitialized?: boolean;
  githubRepo?: string;
}

interface ProjectFile {
  path: string;
  content: string;
}

interface Project extends ProjectMeta {
  files: Record<string, string>;
}

// Helper to get project path
const getProjectPath = (id: string) => path.join(PROJECTS_DIR, id);
const getMetaPath = (id: string) => path.join(getProjectPath(id), 'project.json');
const getFilesDir = (id: string) => path.join(getProjectPath(id), 'files');
const getContextPath = (id: string) => path.join(getProjectPath(id), 'context.json');

// Project context structure (version history + UI state)
interface HistoryEntry {
  files: Record<string, string>;
  label: string;
  timestamp: number;
  type: 'auto' | 'manual' | 'snapshot';
  changedFiles?: string[];
}

interface ProjectContext {
  // Version history
  history: HistoryEntry[];
  currentIndex: number;

  // UI state
  activeFile?: string;
  activeTab?: string;

  // Saved at timestamp
  savedAt: number;
}

// List all projects
router.get('/', async (req, res) => {
  try {
    const entries = await fs.readdir(PROJECTS_DIR, { withFileTypes: true });
    const projects: ProjectMeta[] = [];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const metaPath = getMetaPath(entry.name);
        try {
          const meta = JSON.parse(await fs.readFile(metaPath, 'utf-8'));
          projects.push(meta);
        } catch {
          // Skip invalid projects
        }
      }
    }

    // Sort by updatedAt descending
    projects.sort((a, b) => b.updatedAt - a.updatedAt);
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Failed to list projects' });
  }
});

// Get single project
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const projectPath = getProjectPath(id);

    if (!existsSync(projectPath)) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const meta: ProjectMeta = JSON.parse(await fs.readFile(getMetaPath(id), 'utf-8'));
    const filesDir = getFilesDir(id);
    const files: Record<string, string> = {};

    // Read all files recursively (excluding .git and other system folders)
    const IGNORED_FOLDERS = ['.git', 'node_modules', '.next', '.nuxt', 'dist', 'build', '.cache'];
    const IGNORED_FILES = ['.DS_Store', 'Thumbs.db'];

    async function readFilesRecursively(dir: string, basePath: string = '') {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        // Skip ignored folders and files
        if (IGNORED_FOLDERS.includes(entry.name) || IGNORED_FILES.includes(entry.name)) {
          continue;
        }

        const fullPath = path.join(dir, entry.name);
        const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name;

        if (entry.isDirectory()) {
          await readFilesRecursively(fullPath, relativePath);
        } else {
          files[relativePath] = await fs.readFile(fullPath, 'utf-8');
        }
      }
    }

    if (existsSync(filesDir)) {
      await readFilesRecursively(filesDir);
    }

    res.json({ ...meta, files });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get project' });
  }
});

// Create new project
router.post('/', async (req, res) => {
  try {
    const { name, description, files } = req.body;
    const id = uuidv4();
    const projectPath = getProjectPath(id);
    const filesDir = getFilesDir(id);

    // Create directories
    await fs.mkdir(projectPath, { recursive: true });
    await fs.mkdir(filesDir, { recursive: true });

    // Create meta file
    const meta: ProjectMeta = {
      id,
      name: name || 'Untitled Project',
      description,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      gitInitialized: false
    };

    await fs.writeFile(getMetaPath(id), JSON.stringify(meta, null, 2));

    // Save files
    if (files && typeof files === 'object') {
      for (const [filePath, content] of Object.entries(files)) {
        const fullPath = path.join(filesDir, filePath);
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.writeFile(fullPath, content as string);
      }
    }

    res.status(201).json({ ...meta, files: files || {} });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Update project (auto-save endpoint)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, files, force } = req.body;
    const projectPath = getProjectPath(id);

    if (!existsSync(projectPath)) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Update meta
    const meta: ProjectMeta = JSON.parse(await fs.readFile(getMetaPath(id), 'utf-8'));
    if (name) meta.name = name;
    if (description !== undefined) meta.description = description;
    meta.updatedAt = Date.now();

    await fs.writeFile(getMetaPath(id), JSON.stringify(meta, null, 2));

    // Update files if provided
    if (files && typeof files === 'object') {
      const fileCount = Object.keys(files).length;
      const filesDir = getFilesDir(id);

      // Count existing files to detect suspicious updates (excluding .git, node_modules, etc.)
      const IGNORED_FOLDERS = ['.git', 'node_modules', '.next', '.nuxt', 'dist', 'build', '.cache'];
      const IGNORED_FILES = ['.DS_Store', 'Thumbs.db'];

      let existingFileCount = 0;
      if (existsSync(filesDir)) {
        async function countFiles(dir: string): Promise<number> {
          let count = 0;
          try {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
              // Skip ignored folders and files
              if (IGNORED_FOLDERS.includes(entry.name) || IGNORED_FILES.includes(entry.name)) {
                continue;
              }
              if (entry.isDirectory()) {
                count += await countFiles(path.join(dir, entry.name));
              } else {
                count++;
              }
            }
          } catch {
            // Ignore errors
          }
          return count;
        }
        existingFileCount = await countFiles(filesDir);
      }

      // CRITICAL: Never delete all files if incoming files is empty!
      // This prevents accidental data loss from race conditions or bugs
      if (fileCount === 0) {
        console.warn(`[Projects API] BLOCKED empty files update for project ${id} - would delete ${existingFileCount} files!`);
        // Don't update files at all if empty - return warning but success
        return res.json({
          ...meta,
          message: 'Empty update blocked',
          warning: 'Cannot sync empty file set - this would delete all project files',
          blocked: true,
          existingFileCount,
          newFileCount: fileCount
        });
      } else if (!force && existingFileCount > 5 && fileCount < existingFileCount * 0.3) {
        // If we have more than 5 files and new update has less than 30% of them, ask for confirmation
        // Unless force=true is passed (user confirmed)
        console.warn(`[Projects API] Suspicious update for project ${id} - would reduce files from ${existingFileCount} to ${fileCount}. Requesting confirmation.`);
        return res.json({
          ...meta,
          confirmationRequired: true,
          message: `This update will reduce files from ${existingFileCount} to ${fileCount}. Are you sure?`,
          existingFileCount,
          newFileCount: fileCount,
          warning: 'Significant file reduction detected'
        });
      } else {
        // Safe to update (or force=true was passed)
        if (force && existingFileCount > 5 && fileCount < existingFileCount * 0.3) {
          console.log(`[Projects API] FORCE update for project ${id} - reducing files from ${existingFileCount} to ${fileCount} (user confirmed)`);
        }

        // IMPORTANT: Don't delete entire directory - preserve .git!
        // Instead: delete old files, write new files, keep .git intact

        if (existsSync(filesDir)) {
          // Get list of current files (excluding .git)
          async function getFilePaths(dir: string, basePath: string = ''): Promise<string[]> {
            const paths: string[] = [];
            try {
              const entries = await fs.readdir(dir, { withFileTypes: true });
              for (const entry of entries) {
                // Skip .git and other preserved folders
                if (IGNORED_FOLDERS.includes(entry.name)) continue;

                const fullPath = path.join(dir, entry.name);
                const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name;

                if (entry.isDirectory()) {
                  paths.push(...await getFilePaths(fullPath, relativePath));
                } else {
                  if (!IGNORED_FILES.includes(entry.name)) {
                    paths.push(relativePath);
                  }
                }
              }
            } catch {
              // Ignore errors
            }
            return paths;
          }

          const existingPaths = await getFilePaths(filesDir);
          const newPaths = new Set(Object.keys(files));

          // Delete files that are no longer in the new set
          for (const oldPath of existingPaths) {
            if (!newPaths.has(oldPath)) {
              const fullPath = path.join(filesDir, oldPath);
              try {
                await fs.unlink(fullPath);
              } catch {
                // File might already be gone
              }
            }
          }

          // Clean up empty directories (except .git)
          async function cleanEmptyDirs(dir: string): Promise<void> {
            try {
              const entries = await fs.readdir(dir, { withFileTypes: true });
              for (const entry of entries) {
                if (entry.isDirectory() && !IGNORED_FOLDERS.includes(entry.name)) {
                  const subDir = path.join(dir, entry.name);
                  await cleanEmptyDirs(subDir);
                  // Try to remove if empty
                  try {
                    await fs.rmdir(subDir);
                  } catch {
                    // Not empty, that's fine
                  }
                }
              }
            } catch {
              // Ignore errors
            }
          }
          await cleanEmptyDirs(filesDir);
        } else {
          await fs.mkdir(filesDir, { recursive: true });
        }

        // Write new/updated files
        for (const [filePath, content] of Object.entries(files)) {
          const fullPath = path.join(filesDir, filePath);
          await fs.mkdir(path.dirname(fullPath), { recursive: true });
          await fs.writeFile(fullPath, content as string);
        }

        console.log(`[Projects API] Updated ${fileCount} files for project ${id} (was ${existingFileCount})`);
      }
    }

    res.json({ ...meta, message: 'Project updated' });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Delete project
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const projectPath = getProjectPath(id);

    if (!existsSync(projectPath)) {
      return res.status(404).json({ error: 'Project not found' });
    }

    await fs.rm(projectPath, { recursive: true });
    res.json({ message: 'Project deleted', id });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// Duplicate project
router.post('/:id/duplicate', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const sourcePath = getProjectPath(id);

    if (!existsSync(sourcePath)) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Get source project
    const sourceMeta: ProjectMeta = JSON.parse(await fs.readFile(getMetaPath(id), 'utf-8'));

    // Create new project
    const newId = uuidv4();
    const newPath = getProjectPath(newId);

    // Copy directory
    await fs.cp(sourcePath, newPath, { recursive: true });

    // Update meta
    const newMeta: ProjectMeta = {
      ...sourceMeta,
      id: newId,
      name: name || `${sourceMeta.name} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      gitInitialized: false,
      githubRepo: undefined
    };

    await fs.writeFile(getMetaPath(newId), JSON.stringify(newMeta, null, 2));

    // Remove .git if exists
    const gitDir = path.join(newPath, '.git');
    if (existsSync(gitDir)) {
      await fs.rm(gitDir, { recursive: true });
    }

    res.status(201).json(newMeta);
  } catch (error) {
    res.status(500).json({ error: 'Failed to duplicate project' });
  }
});

// ============ PROJECT CONTEXT (VERSION HISTORY + UI STATE) ============

// Get project context
router.get('/:id/context', async (req, res) => {
  try {
    const { id } = req.params;
    const projectPath = getProjectPath(id);

    if (!existsSync(projectPath)) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const contextPath = getContextPath(id);

    if (existsSync(contextPath)) {
      const context = JSON.parse(await fs.readFile(contextPath, 'utf-8'));
      res.json(context);
    } else {
      // Return empty context if not exists
      res.json({
        history: [],
        currentIndex: -1,
        savedAt: 0
      });
    }
  } catch (error) {
    console.error('Get context error:', error);
    res.status(500).json({ error: 'Failed to get project context' });
  }
});

// Save project context (PUT for normal requests, POST for sendBeacon)
router.put('/:id/context', async (req, res) => {
  try {
    const { id } = req.params;
    const { history, currentIndex, activeFile, activeTab } = req.body;
    const projectPath = getProjectPath(id);

    if (!existsSync(projectPath)) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Validate and limit history size (max 30 entries to avoid huge files)
    const MAX_HISTORY = 30;
    let limitedHistory = history || [];
    if (limitedHistory.length > MAX_HISTORY) {
      // Keep most recent entries, but preserve snapshots
      const snapshots = limitedHistory.filter((h: HistoryEntry) => h.type === 'snapshot');
      const nonSnapshots = limitedHistory.filter((h: HistoryEntry) => h.type !== 'snapshot');

      // Keep all snapshots + most recent non-snapshots
      const keepNonSnapshots = nonSnapshots.slice(-Math.max(0, MAX_HISTORY - snapshots.length));
      limitedHistory = [...snapshots, ...keepNonSnapshots]
        .sort((a: HistoryEntry, b: HistoryEntry) => a.timestamp - b.timestamp);
    }

    const context: ProjectContext = {
      history: limitedHistory,
      currentIndex: Math.min(currentIndex || 0, limitedHistory.length - 1),
      activeFile,
      activeTab,
      savedAt: Date.now()
    };

    await fs.writeFile(getContextPath(id), JSON.stringify(context, null, 2));

    // Also update project meta updatedAt
    const metaPath = getMetaPath(id);
    const meta = JSON.parse(await fs.readFile(metaPath, 'utf-8'));
    meta.updatedAt = Date.now();
    await fs.writeFile(metaPath, JSON.stringify(meta, null, 2));

    res.json({ message: 'Context saved', savedAt: context.savedAt });
  } catch (error) {
    console.error('Save context error:', error);
    res.status(500).json({ error: 'Failed to save project context' });
  }
});

// Save project context via POST (for sendBeacon on page unload)
router.post('/:id/context', async (req, res) => {
  try {
    const { id } = req.params;
    const { history, currentIndex, activeFile, activeTab } = req.body;
    const projectPath = getProjectPath(id);

    if (!existsSync(projectPath)) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Validate and limit history size (max 30 entries to avoid huge files)
    const MAX_HISTORY = 30;
    let limitedHistory = history || [];
    if (limitedHistory.length > MAX_HISTORY) {
      // Keep most recent entries, but preserve snapshots
      const snapshots = limitedHistory.filter((h: HistoryEntry) => h.type === 'snapshot');
      const nonSnapshots = limitedHistory.filter((h: HistoryEntry) => h.type !== 'snapshot');

      // Keep all snapshots + most recent non-snapshots
      const keepNonSnapshots = nonSnapshots.slice(-Math.max(0, MAX_HISTORY - snapshots.length));
      limitedHistory = [...snapshots, ...keepNonSnapshots]
        .sort((a: HistoryEntry, b: HistoryEntry) => a.timestamp - b.timestamp);
    }

    const context: ProjectContext = {
      history: limitedHistory,
      currentIndex: Math.min(currentIndex || 0, limitedHistory.length - 1),
      activeFile,
      activeTab,
      savedAt: Date.now()
    };

    await fs.writeFile(getContextPath(id), JSON.stringify(context, null, 2));

    // Also update project meta updatedAt
    const metaPath = getMetaPath(id);
    const meta = JSON.parse(await fs.readFile(metaPath, 'utf-8'));
    meta.updatedAt = Date.now();
    await fs.writeFile(metaPath, JSON.stringify(meta, null, 2));

    res.json({ message: 'Context saved', savedAt: context.savedAt });
  } catch (error) {
    console.error('Save context error:', error);
    res.status(500).json({ error: 'Failed to save project context' });
  }
});

// Clear project context (useful for reset)
router.delete('/:id/context', async (req, res) => {
  try {
    const { id } = req.params;
    const contextPath = getContextPath(id);

    if (existsSync(contextPath)) {
      await fs.unlink(contextPath);
    }

    res.json({ message: 'Context cleared' });
  } catch (error) {
    console.error('Clear context error:', error);
    res.status(500).json({ error: 'Failed to clear project context' });
  }
});

export { router as projectsRouter };
