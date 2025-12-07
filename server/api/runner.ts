import { Router } from 'express';
import { spawn, ChildProcess, execSync } from 'child_process';
import path from 'path';
import { existsSync } from 'fs';

const router = Router();

// Projects directory
const PROJECTS_DIR = path.join(process.cwd(), 'projects');

// Port range for running projects (3300-3399)
const PORT_RANGE_START = 3300;
const PORT_RANGE_END = 3399;

// Kill any processes using ports in our range (cleanup orphans)
function cleanupOrphanProcesses() {
  if (process.platform !== 'win32') {
    // On Unix, use lsof
    try {
      for (let port = PORT_RANGE_START; port <= PORT_RANGE_END; port++) {
        try {
          execSync(`lsof -ti:${port} | xargs kill -9 2>/dev/null`, { stdio: 'ignore' });
        } catch {
          // Port not in use, ignore
        }
      }
    } catch {
      // Ignore errors
    }
  } else {
    // On Windows, use netstat + taskkill
    try {
      const output = execSync('netstat -ano', { encoding: 'utf-8' });
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
        try {
          execSync(`taskkill /pid ${pid} /f /t`, { stdio: 'ignore' });
          console.log(`[Runner] Killed orphan process PID ${pid}`);
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
interface RunningProject {
  projectId: string;
  port: number;
  process: ChildProcess;
  status: 'installing' | 'starting' | 'running' | 'error' | 'stopped';
  logs: string[];
  errorLogs: string[];
  startedAt: number;
  url: string;
}

const runningProjects: Map<string, RunningProject> = new Map();

// Find an available port
function findAvailablePort(): number | null {
  const usedPorts = new Set(Array.from(runningProjects.values()).map(p => p.port));

  for (let port = PORT_RANGE_START; port <= PORT_RANGE_END; port++) {
    if (!usedPorts.has(port)) {
      return port;
    }
  }
  return null;
}

// Get project files directory
const getFilesDir = (id: string) => path.join(PROJECTS_DIR, id, 'files');

// List all running projects
router.get('/', (req, res) => {
  const projects = Array.from(runningProjects.entries()).map(([id, info]) => ({
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
router.post('/:id/start', async (req, res) => {
  const { id } = req.params;
  const filesDir = getFilesDir(id);

  // Check if project exists
  if (!existsSync(filesDir)) {
    return res.status(404).json({ error: 'Project not found' });
  }

  // Check if already running
  if (runningProjects.has(id)) {
    const running = runningProjects.get(id)!;
    if (running.status === 'running' || running.status === 'installing' || running.status === 'starting') {
      return res.json({
        message: 'Project is already running',
        port: running.port,
        url: running.url,
        status: running.status
      });
    }
    // Clean up old entry
    runningProjects.delete(id);
  }

  // Find available port
  const port = findAvailablePort();
  if (port === null) {
    return res.status(503).json({ error: 'No available ports. Stop some running projects first.' });
  }

  // Check if package.json exists
  const packageJsonPath = path.join(filesDir, 'package.json');
  if (!existsSync(packageJsonPath)) {
    return res.status(400).json({ error: 'No package.json found in project' });
  }

  // Create running project entry
  const runningProject: RunningProject = {
    projectId: id,
    port,
    process: null as any, // Will be set below
    status: 'installing',
    logs: [],
    errorLogs: [],
    startedAt: Date.now(),
    url: `http://localhost:${port}`
  };

  runningProjects.set(id, runningProject);

  // Check if node_modules exists
  const nodeModulesPath = path.join(filesDir, 'node_modules');
  const needsInstall = !existsSync(nodeModulesPath);

  console.log(`[Runner] Starting project ${id} on port ${port}${needsInstall ? ' (installing dependencies first)' : ''}`);

  // Function to start the dev server
  const startDevServer = () => {
    runningProject.status = 'starting';
    runningProject.logs.push(`[${new Date().toISOString()}] Starting dev server on port ${port}...`);

    // Spawn vite dev server with specific port
    const devProcess = spawn('npx', ['vite', '--port', String(port), '--host'], {
      cwd: filesDir,
      shell: true,
      env: { ...process.env, FORCE_COLOR: '1' }
    });

    runningProject.process = devProcess;

    devProcess.stdout?.on('data', (data) => {
      const output = data.toString();
      runningProject.logs.push(output);

      // Detect when server is ready
      if (output.includes('Local:') || output.includes('ready in')) {
        runningProject.status = 'running';
        console.log(`[Runner] Project ${id} is running on port ${port}`);
      }
    });

    devProcess.stderr?.on('data', (data) => {
      const output = data.toString();
      runningProject.errorLogs.push(output);
      // Vite outputs to stderr sometimes even for non-errors
      runningProject.logs.push(output);
    });

    devProcess.on('error', (err) => {
      runningProject.status = 'error';
      runningProject.errorLogs.push(`Process error: ${err.message}`);
      console.error(`[Runner] Project ${id} error:`, err);
    });

    devProcess.on('exit', (code) => {
      runningProject.status = 'stopped';
      runningProject.logs.push(`[${new Date().toISOString()}] Process exited with code ${code}`);
      console.log(`[Runner] Project ${id} stopped (exit code: ${code})`);
    });
  };

  // Install dependencies if needed
  if (needsInstall) {
    runningProject.logs.push(`[${new Date().toISOString()}] Installing dependencies...`);

    const installProcess = spawn('npm', ['install'], {
      cwd: filesDir,
      shell: true,
      env: { ...process.env, FORCE_COLOR: '1' }
    });

    runningProject.process = installProcess;

    installProcess.stdout?.on('data', (data) => {
      runningProject.logs.push(data.toString());
    });

    installProcess.stderr?.on('data', (data) => {
      // npm install outputs a lot to stderr even on success
      runningProject.logs.push(data.toString());
    });

    installProcess.on('error', (err) => {
      runningProject.status = 'error';
      runningProject.errorLogs.push(`Install error: ${err.message}`);
      console.error(`[Runner] Project ${id} install error:`, err);
    });

    installProcess.on('exit', (code) => {
      if (code === 0) {
        runningProject.logs.push(`[${new Date().toISOString()}] Dependencies installed successfully`);
        startDevServer();
      } else {
        runningProject.status = 'error';
        runningProject.errorLogs.push(`npm install failed with code ${code}`);
        console.error(`[Runner] Project ${id} npm install failed with code ${code}`);
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
      spawn('taskkill', ['/pid', String(running.process.pid), '/f', '/t'], { shell: true });
    } else {
      running.process.kill('SIGTERM');
    }
  }

  running.status = 'stopped';
  running.logs.push(`[${new Date().toISOString()}] Stopped by user`);

  // Clean up after a delay
  setTimeout(() => {
    runningProjects.delete(id);
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
        spawn('taskkill', ['/pid', String(running.process.pid), '/f', '/t'], { shell: true });
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
