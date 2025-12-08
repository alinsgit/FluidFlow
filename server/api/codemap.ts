import { Router } from 'express';
import { generateCodeMap, analyzeProject } from '../../services/codemap';
import { Project } from '../projects';

const router = Router();

// Generate complete code map for the current project
router.post('/generate', async (req, res) => {
  try {
    const { projectId } = req.body;

    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    // Get project path
    const projectsDir = process.env.PROJECTS_DIR || './projects';
    const projectPath = `${projectsDir}/${projectId}/files`;

    console.log('🔍 Starting CodeMap generation for project:', projectId);

    // Generate code map with correct project path (excludePatterns will use CodeCollector defaults)
    const codeMap = await generateCodeMap({
      rootPath: projectPath,
      includeTests: false,
      maxDepth: 15
    });

    console.log('✅ CodeMap generation completed!');
    console.log(`📊 Analyzed ${codeMap.nodes.size} files, found ${codeMap.metrics.totalFunctions} functions`);

    res.json({
      success: true,
      codeMap: {
        nodes: Object.fromEntries(codeMap.nodes),
        rootNode: codeMap.rootNode,
        dependencies: Object.fromEntries(codeMap.dependencies),
        dependents: Object.fromEntries(codeMap.dependents),
        entryPoints: codeMap.entryPoints,
        circularDependencies: codeMap.circularDependencies,
        metrics: codeMap.metrics,
        lastGenerated: codeMap.lastGenerated
      }
    });
  } catch (error) {
    console.error('CodeMap generation error:', error);
    res.status(500).json({
      error: 'Failed to generate CodeMap',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Analyze specific file
router.post('/analyze-file', async (req, res) => {
  try {
    const { projectId, filePath } = req.body;

    if (!projectId || !filePath) {
      return res.status(400).json({ error: 'Project ID and file path are required' });
    }

    const projectsDir = process.env.PROJECTS_DIR || './projects';
    const fullPath = `${projectsDir}/${projectId}/files/${filePath}`;

    const codeMap = analyzeProject(fullPath);
    const fileInfo = codeMap.nodes.get(fullPath);

    if (!fileInfo) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.json({
      success: true,
      fileInfo
    });
  } catch (error) {
    console.error('File analysis error:', error);
    res.status(500).json({
      error: 'Failed to analyze file',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Search in codebase
router.post('/search', async (req, res) => {
  try {
    const { projectId, query, type, caseSensitive, regex } = req.body;

    if (!projectId || !query) {
      return res.status(400).json({ error: 'Project ID and query are required' });
    }

    const projectsDir = process.env.PROJECTS_DIR || './projects';
    const projectPath = `${projectsDir}/${projectId}/files`;

    const codeMap = analyzeProject(projectPath);
    const results = await codeMap.searchFiles(query, {
      type: type as 'function' | 'class' | 'interface' | 'variable',
      caseSensitive: Boolean(caseSensitive),
      regex: Boolean(regex)
    });

    res.json({
      success: true,
      results: results.map(({ node, matches }) => ({
        node: {
          id: node.id,
          filePath: node.filePath,
          fileName: node.fileName,
          fileType: node.fileType,
          functions: node.functions,
          classes: node.classes,
          interfaces: node.interfaces,
          metrics: node.metrics
        },
        matches
      }))
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      error: 'Failed to search codebase',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get project statistics
router.post('/stats', async (req, res) => {
  try {
    const { projectId } = req.body;

    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    const projectsDir = process.env.PROJECTS_DIR || './projects';
    const projectPath = `${projectsDir}/${projectId}/files`;

    const codeMap = analyzeProject(projectPath);
    const stats = await codeMap.getFileStatistics();
    const dependencyGraph = await codeMap.getDependencyGraph();

    res.json({
      success: true,
      stats,
      dependencyGraph,
      summary: {
        totalFiles: codeMap.nodes.size,
        totalDependencies: Array.from(codeMap.dependencies.values()).reduce((sum, deps) => sum + deps.length, 0),
        circularDeps: codeMap.circularDependencies.length,
        entryPoints: codeMap.entryPoints.length
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      error: 'Failed to get project statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export const codemapRouter = router;
export default router;