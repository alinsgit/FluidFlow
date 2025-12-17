import { Router } from 'express';
import { spawn, spawnSync, ChildProcess } from 'child_process';
import path from 'path';
import { existsSync, readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync } from 'fs';
import { isValidProjectId, isValidInteger } from '../utils/validation';

// Type for VFS files
type FileSystem = Record<string, string>;

const router = Router();

// Projects directory
const PROJECTS_DIR = path.join(process.cwd(), 'projects');

// Port range for running projects (3300-3399)
const PORT_RANGE_START = 3300;
const PORT_RANGE_END = 3399;

// Kill any processes using ports in our range (cleanup orphans)
// RUN-003 fix: Use spawnSync with array args to avoid shell injection
function cleanupOrphanProcesses() {
  if (process.platform !== 'win32') {
    // On Unix, use lsof + kill without shell interpolation
    try {
      for (let port = PORT_RANGE_START; port <= PORT_RANGE_END; port++) {
        try {
          // RUN-003 fix: Get PIDs using lsof without shell
          const lsofResult = spawnSync('lsof', ['-ti', `:${port}`], { encoding: 'utf-8' });
          if (lsofResult.status === 0 && lsofResult.stdout) {
            const pids = lsofResult.stdout.trim().split('\n').filter((p: string) => p.length > 0);
            for (const pid of pids) {
              // Validate PID before killing
              if (/^\d+$/.test(pid)) {
                spawnSync('kill', ['-9', pid], { stdio: 'ignore' });
              }
            }
          }
        } catch {
          // Port not in use, ignore
        }
      }
    } catch {
      // Ignore errors
    }
  } else {
    // On Windows, use netstat + taskkill
    // BUG-012 fix: Use spawnSync with args array instead of execSync with shell string
    try {
      const netstatResult = spawnSync('netstat', ['-ano'], { encoding: 'utf-8' });
      if (netstatResult.status !== 0 || !netstatResult.stdout) {
        console.warn('[Runner] netstat command failed');
        return;
      }
      const output = netstatResult.stdout;
      const lines = output.split('\n');
      const pidsToKill = new Set<string>();

      for (const line of lines) {
        // Match lines like: TCP    0.0.0.0:3300    0.0.0.0:0    LISTENING    12345
        const match = line.match(/TCP\s+\S+:(\d+)\s+\S+\s+LISTENING\s+(\d+)/);
        if (match) {
          const port = parseInt(match[1], 10);
          const pid = match[2];
          if (port >= PORT_RANGE_START && port <= PORT_RANGE_END && pid !== '0') {
            pidsToKill.add(pid);
          }
        }
      }

      for (const pid of pidsToKill) {
        // Validate PID is a safe integer before using in command
        if (!isValidInteger(pid, 1, 999999)) {
          console.warn(`[Runner] Invalid PID skipped: ${pid}`);
          continue;
        }
        try {
          // Use spawn with array args instead of string interpolation for safety
          const result = spawnSync('taskkill', ['/pid', pid, '/f', '/t'], { stdio: 'ignore' });
          if (result.status === 0) {
            console.log(`[Runner] Killed orphan process PID ${pid}`);
          }
        } catch {
          // Process might have already exited
        }
      }

      if (pidsToKill.size > 0) {
        console.log(`[Runner] Cleaned up ${pidsToKill.size} orphan process(es)`);
      }
    } catch (err) {
      console.error('[Runner] Failed to cleanup orphan processes:', err);
    }
  }
}

// Run cleanup on startup
console.log('[Runner] Checking for orphan processes on ports 3300-3399...');
cleanupOrphanProcesses();

// Track running processes
const MAX_LOG_ENTRIES = 1000; // Limit log entries to prevent memory leak

interface RunningProject {
  projectId: string;
  port: number;
  // BUG-F01/F02 FIX: Process can be null when not yet spawned or after cleanup on error
  process: ChildProcess | null;
  status: 'installing' | 'starting' | 'running' | 'error' | 'stopped';
  logs: string[];
  errorLogs: string[];
  startedAt: number;
  url: string;
}

const runningProjects: Map<string, RunningProject> = new Map();

// RUN-002 fix: Track reserved ports to prevent race condition
// Ports are reserved when a start request begins and released when fully registered or on error
const reservedPorts: Set<number> = new Set();

// Helper to push logs with size limit (prevents memory leak)
function pushLog(logs: string[], entry: string): void {
  logs.push(entry);
  // Remove oldest entries if over limit
  while (logs.length > MAX_LOG_ENTRIES) {
    logs.shift();
  }
}

// Find an available port and reserve it atomically
// RUN-002 fix: Returns port only if successfully reserved
function findAndReservePort(): number | null {
  const usedPorts = new Set(Array.from(runningProjects.values()).map(p => p.port));

  for (let port = PORT_RANGE_START; port <= PORT_RANGE_END; port++) {
    // Check both running projects AND reserved ports
    if (!usedPorts.has(port) && !reservedPorts.has(port)) {
      // Immediately reserve this port
      reservedPorts.add(port);
      return port;
    }
  }
  return null;
}

// Release a reserved port (called on error or when port is no longer needed)
function releasePort(port: number): void {
  reservedPorts.delete(port);
}

// Get project files directory
const getFilesDir = (id: string) => path.join(PROJECTS_DIR, id, 'files');

// Temp directory for running uncommitted VFS files
const TEMP_RUN_DIR = path.join(process.cwd(), 'projects', '_temp_run');

/**
 * Sync VFS files to disk
 * Creates directories as needed and writes all files
 */
function syncFilesToDisk(targetDir: string, files: FileSystem): void {
  // Clean the directory first (but keep node_modules if exists for faster installs)
  const nodeModulesPath = path.join(targetDir, 'node_modules');
  const hadNodeModules = existsSync(nodeModulesPath);

  // Remove all files except node_modules
  if (existsSync(targetDir)) {
    const entries = readdirSync(targetDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name !== 'node_modules') {
        const fullPath = path.join(targetDir, entry.name);
        rmSync(fullPath, { recursive: true, force: true });
      }
    }
  } else {
    mkdirSync(targetDir, { recursive: true });
  }

  // Write all files
  for (const [filePath, content] of Object.entries(files)) {
    const fullPath = path.join(targetDir, filePath);
    const dir = path.dirname(fullPath);

    // Create directory if needed
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    // Write file
    writeFileSync(fullPath, content, 'utf-8');
  }

  console.log(`[Runner] Synced ${Object.keys(files).length} files to ${targetDir}${hadNodeModules ? ' (preserved node_modules)' : ''}`);
}

// COEP/CORP headers required for iframe embedding in FluidFlow
const COEP_HEADERS_CONFIG = `
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'credentialless',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Resource-Policy': 'cross-origin'
    }
  }`;

/**
 * Ensure vite.config.ts has COEP headers for iframe embedding
 * This allows the running app to be displayed in FluidFlow's RunnerPanel iframe
 */
function ensureViteCoepHeaders(filesDir: string): void {
  const viteConfigPath = path.join(filesDir, 'vite.config.ts');

  if (!existsSync(viteConfigPath)) {
    console.log('[Runner] No vite.config.ts found, skipping COEP injection');
    return;
  }

  try {
    let content = readFileSync(viteConfigPath, 'utf-8');

    // Check if COEP headers are already present
    if (content.includes('Cross-Origin-Embedder-Policy')) {
      console.log('[Runner] vite.config.ts already has COEP headers');
      return;
    }

    // Find the closing of defineConfig and inject server config before it
    // Handle both `defineConfig({...})` and `export default {...}`

    // Pattern 1: defineConfig({ ... })
    // We need to find the last closing bracket before the final )
    const defineConfigMatch = content.match(/defineConfig\s*\(\s*\{/);
    if (defineConfigMatch) {
      // Find position to insert - look for the last } before the closing )
      // Simple approach: find the last }) and insert before the }
      const lastBracketIndex = content.lastIndexOf('})');
      if (lastBracketIndex > 0) {
        // Check if there's already a comma before the closing brace
        const beforeBracket = content.substring(0, lastBracketIndex).trimEnd();
        const needsComma = !beforeBracket.endsWith(',') && !beforeBracket.endsWith('{');

        const insertion = (needsComma ? ',' : '') + COEP_HEADERS_CONFIG;
        content = content.substring(0, lastBracketIndex) + insertion + '\n' + content.substring(lastBracketIndex);

        writeFileSync(viteConfigPath, content, 'utf-8');
        console.log('[Runner] Injected COEP headers into vite.config.ts');
        return;
      }
    }

    console.log('[Runner] Could not find insertion point for COEP headers in vite.config.ts');
  } catch (err) {
    console.error('[Runner] Failed to inject COEP headers:', err);
  }
}

// List all running projects
router.get('/', (req, res) => {
  const projects = Array.from(runningProjects.entries()).map(([_id, info]) => ({
    projectId: info.projectId,
    port: info.port,
    status: info.status,
    url: info.url,
    startedAt: info.startedAt,
    logsCount: info.logs.length,
    errorLogsCount: info.errorLogs.length
  }));

  res.json(projects);
});

// Get specific running project status
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const running = runningProjects.get(id);

  if (!running) {
    return res.json({ status: 'stopped', running: false });
  }

  res.json({
    projectId: running.projectId,
    port: running.port,
    status: running.status,
    url: running.url,
    startedAt: running.startedAt,
    running: running.status === 'running' || running.status === 'installing' || running.status === 'starting',
    logs: running.logs.slice(-100), // Last 100 logs
    errorLogs: running.errorLogs.slice(-50) // Last 50 error logs
  });
});

// Start a project
// Accepts optional 'files' in body to sync VFS to disk before running
router.post('/:id/start', async (req, res) => {
  const { id } = req.params;
  const { files } = req.body as { files?: FileSystem };

  // Special case: "_temp" project ID for running uncommitted VFS files
  const isTempRun = id === '_temp';

  // Validate project ID to prevent path traversal (skip for temp)
  if (!isTempRun && !isValidProjectId(id)) {
    return res.status(400).json({ error: 'Invalid project ID' });
  }

  // Determine target directory
  const filesDir = isTempRun ? TEMP_RUN_DIR : getFilesDir(id);

  // If files provided, sync them to disk first
  if (files && Object.keys(files).length > 0) {
    try {
      syncFilesToDisk(filesDir, files);
    } catch (err) {
      console.error('[Runner] Failed to sync files:', err);
      return res.status(500).json({ error: 'Failed to sync files to disk' });
    }
  }

  // Check if project/files exist
  if (!existsSync(filesDir)) {
    return res.status(404).json({ error: 'Project not found. Provide files in request body for temp runs.' });
  }

  // Check if already running
  const existingProject = runningProjects.get(id);
  if (existingProject) {
    if (existingProject.status === 'running' || existingProject.status === 'installing' || existingProject.status === 'starting') {
      return res.json({
        message: 'Project is already running',
        port: existingProject.port,
        url: existingProject.url,
        status: existingProject.status
      });
    }
    // Clean up old entry
    runningProjects.delete(id);
  }

  // RUN-002 fix: Find and reserve port atomically
  const port = findAndReservePort();
  if (port === null) {
    return res.status(503).json({ error: 'No available ports. Stop some running projects first.' });
  }

  // Check if package.json exists
  const packageJsonPath = path.join(filesDir, 'package.json');
  if (!existsSync(packageJsonPath)) {
    // RUN-002 fix: Release port on error
    releasePort(port);
    return res.status(400).json({ error: 'No package.json found in project' });
  }

  // Create running project entry
  // BUG-F01 FIX: Process is initially null and will be set when installation/start begins
  const runningProject: RunningProject = {
    projectId: id,
    port,
    process: null, // Will be set below when spawn is called
    status: 'installing',
    logs: [],
    errorLogs: [],
    startedAt: Date.now(),
    url: `http://localhost:${port}`
  };

  runningProjects.set(id, runningProject);

  // RUN-002 fix: Release reservation once properly registered
  releasePort(port);

  // Ensure vite.config.ts has COEP headers for iframe embedding
  ensureViteCoepHeaders(filesDir);

  // Check if node_modules exists
  const nodeModulesPath = path.join(filesDir, 'node_modules');
  const needsInstall = !existsSync(nodeModulesPath);

  console.log(`[Runner] Starting project ${id} on port ${port}${needsInstall ? ' (installing dependencies first)' : ''}`);

  // Function to start the dev server
  const startDevServer = () => {
    runningProject.status = 'starting';
    pushLog(runningProject.logs,`[${new Date().toISOString()}] Starting dev server on port ${port}...`);

    // Spawn vite dev server with specific port
    // Note: shell: false (default) is safer - prevents command injection
    const devProcess = spawn('npx', ['vite', '--port', String(port), '--host'], {
      cwd: filesDir,
      shell: process.platform === 'win32', // Only use shell on Windows for npx compatibility
      env: { ...process.env, FORCE_COLOR: '1' }
    });

    runningProject.process = devProcess;

    devProcess.stdout?.on('data', (data) => {
      const output = data.toString();
      pushLog(runningProject.logs,output);

      // Detect when server is ready
      if (output.includes('Local:') || output.includes('ready in')) {
        runningProject.status = 'running';
        console.log(`[Runner] Project ${id} is running on port ${port}`);
      }
    });

    devProcess.stderr?.on('data', (data) => {
      const output = data.toString();
      pushLog(runningProject.errorLogs,output);
      // Vite outputs to stderr sometimes even for non-errors
      pushLog(runningProject.logs,output);
    });

    devProcess.on('error', (err) => {
      runningProject.status = 'error';
      pushLog(runningProject.errorLogs,`Process error: ${err.message}`);
      console.error(`[Runner] Project ${id} error:`, err);
    });

    devProcess.on('exit', (code) => {
      runningProject.status = 'stopped';
      pushLog(runningProject.logs,`[${new Date().toISOString()}] Process exited with code ${code}`);
      console.log(`[Runner] Project ${id} stopped (exit code: ${code})`);
    });
  };

  // Install dependencies if needed
  if (needsInstall) {
    pushLog(runningProject.logs,`[${new Date().toISOString()}] Installing dependencies...`);

    const installProcess = spawn('npm', ['install'], {
      cwd: filesDir,
      shell: process.platform === 'win32', // Only use shell on Windows for npm compatibility
      env: { ...process.env, FORCE_COLOR: '1' }
    });

    runningProject.process = installProcess;

    installProcess.stdout?.on('data', (data) => {
      pushLog(runningProject.logs,data.toString());
    });

    installProcess.stderr?.on('data', (data) => {
      // npm install outputs a lot to stderr even on success
      pushLog(runningProject.logs,data.toString());
    });

    installProcess.on('error', (err) => {
      runningProject.status = 'error';
      pushLog(runningProject.errorLogs,`Install error: ${err.message}`);
      console.error(`[Runner] Project ${id} install error:`, err);
      // BUG-019 FIX: Clean up process reference on error
      runningProject.process = null;
    });

    installProcess.on('exit', (code) => {
      if (code === 0) {
        pushLog(runningProject.logs,`[${new Date().toISOString()}] Dependencies installed successfully`);
        startDevServer();
      } else {
        runningProject.status = 'error';
        pushLog(runningProject.errorLogs,`npm install failed with code ${code}`);
        console.error(`[Runner] Project ${id} npm install failed with code ${code}`);
        // BUG-019 FIX: Clean up process reference on failed install
        runningProject.process = null;
      }
    });
  } else {
    // Start immediately if node_modules exists
    startDevServer();
  }

  res.json({
    message: needsInstall ? 'Installing dependencies...' : 'Starting dev server...',
    port,
    url: runningProject.url,
    status: runningProject.status
  });
});

// Stop a project
router.post('/:id/stop', (req, res) => {
  const { id } = req.params;
  const running = runningProjects.get(id);

  if (!running) {
    return res.json({ message: 'Project is not running', status: 'stopped' });
  }

  console.log(`[Runner] Stopping project ${id}...`);

  // Kill the process
  if (running.process && !running.process.killed) {
    // On Windows, we need to kill the whole process tree
    if (process.platform === 'win32') {
      // Use spawnSync without shell for safety (pid is from Node's ChildProcess, so it's a safe number)
      spawnSync('taskkill', ['/pid', String(running.process.pid), '/f', '/t'], { stdio: 'ignore' });
    } else {
      running.process.kill('SIGTERM');
    }
  }

  running.status = 'stopped';
  pushLog(running.logs,`[${new Date().toISOString()}] Stopped by user`);

  // BUG-FIX (MED-S04): Store startedAt to prevent deleting a restarted project entry
  // If user restarts the project within 5 seconds, this closure's startedAt won't match
  const stoppedEntryStartedAt = running.startedAt;

  // Clean up after a delay
  setTimeout(() => {
    const currentEntry = runningProjects.get(id);
    // Only delete if the entry is the same one we stopped (same startedAt timestamp)
    if (currentEntry && currentEntry.startedAt === stoppedEntryStartedAt) {
      runningProjects.delete(id);
    }
  }, 5000);

  res.json({ message: 'Project stopped', status: 'stopped' });
});

// Get logs for a project (streaming-friendly)
router.get('/:id/logs', (req, res) => {
  const { id } = req.params;
  const { since } = req.query;
  const running = runningProjects.get(id);

  if (!running) {
    return res.json({ logs: [], errorLogs: [], status: 'stopped' });
  }

  // If 'since' is provided, only return logs after that index
  const sinceIndex = since ? parseInt(since as string, 10) : 0;

  res.json({
    logs: running.logs.slice(sinceIndex),
    errorLogs: running.errorLogs,
    status: running.status,
    totalLogs: running.logs.length
  });
});

// Stop all running projects (cleanup endpoint)
router.post('/stop-all', (req, res) => {
  const stopped: string[] = [];

  for (const [id, running] of runningProjects.entries()) {
    if (running.process && !running.process.killed) {
      if (process.platform === 'win32') {
        // Use spawnSync without shell for safety
        spawnSync('taskkill', ['/pid', String(running.process.pid), '/f', '/t'], { stdio: 'ignore' });
      } else {
        running.process.kill('SIGTERM');
      }
      stopped.push(id);
    }
  }

  runningProjects.clear();

  // Also cleanup any orphan processes not in our map
  cleanupOrphanProcesses();

  console.log(`[Runner] Stopped all projects: ${stopped.join(', ')}`);
  res.json({ message: `Stopped ${stopped.length} projects`, stopped });
});

// Cleanup orphans endpoint (manual trigger)
router.post('/cleanup', (req, res) => {
  cleanupOrphanProcesses();
  res.json({ message: 'Orphan processes cleaned up' });
});

export { router as runnerRouter };
