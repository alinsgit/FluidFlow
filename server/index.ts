import express from 'express';
import cors from 'cors';
import { projectsRouter } from './api/projects.js';
import { gitRouter } from './api/git.js';
import { githubRouter } from './api/github.js';
import { settingsRouter } from './api/settings.js';
import { runnerRouter } from './api/runner.js';
import { codemapRouter } from './api/codemap.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.SERVER_PORT || 3200;

// Ensure projects directory exists
const PROJECTS_DIR = path.join(__dirname, '../projects');
if (!fs.existsSync(PROJECTS_DIR)) {
  fs.mkdirSync(PROJECTS_DIR, { recursive: true });
}

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc)
    if (!origin) return callback(null, true);

    // Allow localhost ports: 3100-3102 (FluidFlow), 5173 (Vite dev), 3300-3399 (running projects)
    const allowedPatterns = [
      /^http:\/\/localhost:(3100|3101|3102|5173)$/,
      /^http:\/\/localhost:33\d{2}$/, // 3300-3399
    ];

    const isAllowed = allowedPatterns.some(pattern => pattern.test(origin));
    callback(null, isAllowed);
  },
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// API Routes
app.use('/api/projects', projectsRouter);
app.use('/api/git', gitRouter);
app.use('/api/github', githubRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/runner', runnerRouter);
app.use('/api/codemap', codemapRouter);

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Server Error]', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`\n🚀 FluidFlow Backend Server running on http://localhost:${PORT}`);
  console.log(`   Projects directory: ${PROJECTS_DIR}\n`);
});

export { PROJECTS_DIR };
