import { Router } from 'express';
import simpleGit, { SimpleGit } from 'simple-git';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Projects directory - use process.cwd() for reliability
const PROJECTS_DIR = path.join(process.cwd(), 'projects');

// Helper to get project paths
const getProjectPath = (id: string) => path.join(PROJECTS_DIR, id);
const getFilesDir = (id: string) => path.join(getProjectPath(id), 'files');
const getMetaPath = (id: string) => path.join(getProjectPath(id), 'project.json');

// Check if directory has its own .git folder (not inherited from parent)
const isOwnGitRepo = (dir: string): boolean => {
  return existsSync(path.join(dir, '.git'));
};

// Set remote origin
router.post('/:id/remote', async (req, res) => {
  try {
    const { id } = req.params;
    const { url, name = 'origin' } = req.body;
    const filesDir = getFilesDir(id);

    if (!existsSync(filesDir)) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (!url) {
      return res.status(400).json({ error: 'Remote URL required' });
    }

    if (!isOwnGitRepo(filesDir)) {
      return res.status(400).json({ error: 'Git not initialized' });
    }

    const git: SimpleGit = simpleGit(filesDir);

    // Check if remote exists
    const remotes = await git.getRemotes();
    const existingRemote = remotes.find(r => r.name === name);

    if (existingRemote) {
      await git.remote(['set-url', name, url]);
    } else {
      await git.addRemote(name, url);
    }

    // Update meta
    const meta = JSON.parse(await fs.readFile(getMetaPath(id), 'utf-8'));
    meta.githubRepo = url;
    meta.updatedAt = Date.now();
    await fs.writeFile(getMetaPath(id), JSON.stringify(meta, null, 2));

    res.json({ message: `Remote '${name}' set to ${url}` });
  } catch (error) {
    console.error('Set remote error:', error);
    res.status(500).json({ error: 'Failed to set remote' });
  }
});

// Get remotes
router.get('/:id/remote', async (req, res) => {
  try {
    const { id } = req.params;
    const filesDir = getFilesDir(id);

    if (!existsSync(filesDir)) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (!isOwnGitRepo(filesDir)) {
      return res.json({ initialized: false, remotes: [] });
    }

    const git: SimpleGit = simpleGit(filesDir);
    const remotes = await git.getRemotes(true);

    res.json({
      initialized: true,
      remotes: remotes.map(r => ({
        name: r.name,
        fetch: r.refs.fetch,
        push: r.refs.push
      }))
    });
  } catch (error) {
    console.error('Get remotes error:', error);
    res.status(500).json({ error: 'Failed to get remotes' });
  }
});

// Push to remote
router.post('/:id/push', async (req, res) => {
  try {
    const { id } = req.params;
    const { remote = 'origin', branch, force = false, setUpstream = true } = req.body;
    const filesDir = getFilesDir(id);

    if (!existsSync(filesDir)) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (!isOwnGitRepo(filesDir)) {
      return res.status(400).json({ error: 'Git not initialized' });
    }

    const git: SimpleGit = simpleGit(filesDir);

    // Get current branch if not specified
    const currentBranch = branch || (await git.branchLocal()).current;

    // Build push options
    const pushOptions: string[] = [];
    if (setUpstream) pushOptions.push('-u');
    if (force) pushOptions.push('--force');

    await git.push(remote, currentBranch, pushOptions);

    res.json({
      message: `Pushed to ${remote}/${currentBranch}`,
      remote,
      branch: currentBranch
    });
  } catch (error: any) {
    console.error('Push error:', error);
    // Check for authentication error
    if (error.message?.includes('Authentication') || error.message?.includes('403')) {
      return res.status(401).json({
        error: 'Authentication failed. Make sure you have configured git credentials or use a personal access token.',
        details: error.message
      });
    }
    res.status(500).json({ error: 'Failed to push', details: error.message });
  }
});

// Pull from remote
router.post('/:id/pull', async (req, res) => {
  try {
    const { id } = req.params;
    const { remote = 'origin', branch } = req.body;
    const filesDir = getFilesDir(id);

    if (!existsSync(filesDir)) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (!isOwnGitRepo(filesDir)) {
      return res.status(400).json({ error: 'Git not initialized' });
    }

    const git: SimpleGit = simpleGit(filesDir);
    const currentBranch = branch || (await git.branchLocal()).current;
    const result = await git.pull(remote, currentBranch);

    res.json({
      message: 'Pulled successfully',
      summary: result.summary
    });
  } catch (error: any) {
    console.error('Pull error:', error);
    res.status(500).json({ error: 'Failed to pull', details: error.message });
  }
});

// Fetch from remote
router.post('/:id/fetch', async (req, res) => {
  try {
    const { id } = req.params;
    const { remote = 'origin', prune = false } = req.body;
    const filesDir = getFilesDir(id);

    if (!existsSync(filesDir)) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (!isOwnGitRepo(filesDir)) {
      return res.status(400).json({ error: 'Git not initialized' });
    }

    const git: SimpleGit = simpleGit(filesDir);
    const fetchOptions = prune ? ['--prune'] : [];
    await git.fetch(remote, undefined, fetchOptions);

    res.json({ message: `Fetched from ${remote}` });
  } catch (error: any) {
    console.error('Fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch', details: error.message });
  }
});

// Clone a repository
router.post('/clone', async (req, res) => {
  try {
    const { url, name } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'Repository URL required' });
    }

    // Generate project ID
    const { v4: uuidv4 } = await import('uuid');
    const id = uuidv4();
    const projectPath = getProjectPath(id);
    const filesDir = getFilesDir(id);

    // Create project directory
    await fs.mkdir(projectPath, { recursive: true });

    // Clone repository
    const git: SimpleGit = simpleGit();
    await git.clone(url, filesDir);

    // Extract repo name from URL if not provided
    const repoName = name || url.split('/').pop()?.replace('.git', '') || 'Cloned Project';

    // Create meta file
    const meta = {
      id,
      name: repoName,
      description: `Cloned from ${url}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      gitInitialized: true,
      githubRepo: url
    };

    await fs.writeFile(getMetaPath(id), JSON.stringify(meta, null, 2));

    res.status(201).json({
      message: 'Repository cloned successfully',
      project: meta
    });
  } catch (error: any) {
    console.error('Clone error:', error);
    res.status(500).json({ error: 'Failed to clone repository', details: error.message });
  }
});

// Create GitHub repository (requires token)
router.post('/:id/create-repo', async (req, res) => {
  try {
    const { id } = req.params;
    const { token, name, description, isPrivate = false } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'GitHub token required' });
    }

    const filesDir = getFilesDir(id);
    if (!existsSync(filesDir)) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Get project meta for default name
    const meta = JSON.parse(await fs.readFile(getMetaPath(id), 'utf-8'));
    const repoName = name || meta.name.replace(/\s+/g, '-').toLowerCase();

    // Create repo via GitHub API
    const response = await fetch('https://api.github.com/user/repos', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: repoName,
        description: description || meta.description || `Created with FluidFlow`,
        private: isPrivate,
        auto_init: false
      })
    });

    if (!response.ok) {
      const error = await response.json();
      return res.status(response.status).json({
        error: 'Failed to create GitHub repository',
        details: error.message || error.errors?.[0]?.message
      });
    }

    const repo = await response.json();

    // Initialize git if needed
    const git: SimpleGit = simpleGit(filesDir);

    if (!isOwnGitRepo(filesDir)) {
      await git.init();
      await fs.writeFile(path.join(filesDir, '.gitignore'), 'node_modules/\n.env\ndist/\n');
      await git.add('.');
      await git.commit('Initial commit - Created with FluidFlow');
    }

    // Set remote
    const remotes = await git.getRemotes();
    if (remotes.find(r => r.name === 'origin')) {
      await git.remote(['set-url', 'origin', repo.clone_url]);
    } else {
      await git.addRemote('origin', repo.clone_url);
    }

    // Update meta
    meta.gitInitialized = true;
    meta.githubRepo = repo.html_url;
    meta.updatedAt = Date.now();
    await fs.writeFile(getMetaPath(id), JSON.stringify(meta, null, 2));

    res.status(201).json({
      message: 'GitHub repository created',
      repository: {
        name: repo.name,
        url: repo.html_url,
        cloneUrl: repo.clone_url,
        sshUrl: repo.ssh_url,
        private: repo.private
      }
    });
  } catch (error: any) {
    console.error('Create repo error:', error);
    res.status(500).json({ error: 'Failed to create repository', details: error.message });
  }
});

// Verify GitHub token
router.post('/verify-token', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token required' });
    }

    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) {
      return res.status(401).json({ valid: false, error: 'Invalid token' });
    }

    const user = await response.json();

    res.json({
      valid: true,
      user: {
        login: user.login,
        name: user.name,
        avatar: user.avatar_url,
        url: user.html_url
      }
    });
  } catch (error) {
    console.error('Verify token error:', error);
    res.status(500).json({ error: 'Failed to verify token' });
  }
});

export { router as githubRouter };
