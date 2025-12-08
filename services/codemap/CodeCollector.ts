import { glob } from 'glob';
import { join, dirname, resolve } from 'path';
import { readFile, stat } from 'fs/promises';
import { ASTParser } from './ASTParser';
import { CodeMapNode, CodeMapOptions, CodeMap, CodeMapMetrics } from './types';

export class CodeCollector {
  private parser: ASTParser;
  private options: CodeMapOptions;

  constructor(options: CodeMapOptions = {}) {
    this.options = {
      includeTests: false,
      includeNodeModules: false,
      maxDepth: 10,
      excludePatterns: [
        '**/node_modules/**',
        '**/dist/**',
        '**/.git/**',
        '**/*.test.*',
        '**/*.spec.*',
        '**/coverage/**',
        '**/src/**',           // Exclude main source directory
        '**/data/**',           // Exclude data directory
        '**/components/**',     // Exclude components directory (when not in project)
        '**/hooks/**',          // Exclude hooks directory
        '**/utils/**',          // Exclude utils directory
        '**/types/**',          // Exclude types directory
        '**/services/**',       // Exclude services directory
        '**/server/**',         // Exclude server directory
        '**/public/**',         // Exclude public directory
        '**/.vscode/**',        // Exclude VSCode settings
        '**/.gitignore',        // Exclude gitignore
        '**/package*.json',     // Exclude package files
        '**/tsconfig*.json',    // Exclude TypeScript config
        '**/vite.config.*',     // Exclude Vite config
        '**/tailwind.config.*', // Exclude Tailwind config
        '**/*.lock',            // Exclude lock files
        '**/README.md',         // Exclude README files
        '**/CLAUDE.md'          // Exclude Claude instructions
      ],
      analyzeComplexity: true,
      generateDocumentation: true,
      ...options
    };

    this.parser = new ASTParser(this.options);
  }

  async collectCode(rootPath: string = process.cwd()): Promise<CodeMap> {
    console.log('🔍 Starting code collection...');

    const filePaths = await this.discoverFiles(rootPath);
    console.log(`📁 Found ${filePaths.length} files to analyze`);

    const nodes = new Map<string, CodeMapNode>();
    const dependencies = new Map<string, string[]>();
    const dependents = new Map<string, string[]>();

    // Parse all files in parallel batches
    const batchSize = 10;
    for (let i = 0; i < filePaths.length; i += batchSize) {
      const batch = filePaths.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map(filePath => this.parseFileSafely(filePath))
      );

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const node = result.value;
          nodes.set(node.id, node);

          // Extract dependencies
          dependencies.set(node.id, node.dependencies);
          dependents.set(node.id, []);
        } else {
          console.error(`Failed to parse ${batch[index]}:`, result.reason);
        }
      });

      if ((i + batchSize) % 50 === 0 || i + batchSize >= filePaths.length) {
        console.log(`⚡ Processed ${Math.min(i + batchSize, filePaths.length)}/${filePaths.length} files`);
      }
    }

    // Build dependents map (reverse dependencies)
    nodes.forEach((node, nodeId) => {
      node.dependencies.forEach(dep => {
        const depNode = Array.from(nodes.values()).find(n =>
          n.fileName === dep || n.filePath.includes(dep)
        );

        if (depNode) {
          const currentDependents = dependents.get(depNode.id) || [];
          currentDependents.push(nodeId);
          dependents.set(depNode.id, [...new Set(currentDependents)]);
        }
      });
    });

    // Find circular dependencies
    const circularDeps = this.detectCircularDependencies(dependencies, dependents);

    // Identify entry points
    const entryPoints = this.identifyEntryPoints(nodes, dependents);

    // Calculate metrics
    const metrics = this.calculateMetrics(nodes);

    const codeMap: CodeMap = {
      nodes,
      rootNode: this.findRootNode(nodes),
      dependencies,
      dependents,
      entryPoints,
      circularDependencies: circularDeps,
      metrics,
      lastGenerated: Date.now()
    };

    console.log('✅ Code collection completed!');
    console.log(`📊 Stats: ${metrics.totalFiles} files, ${metrics.totalFunctions} functions, ${metrics.totalReactComponents} components`);

    return codeMap;
  }

  private async discoverFiles(rootPath: string): Promise<string[]> {
    const patterns = [
      '**/*.ts',
      '**/*.tsx',
      '**/*.js',
      '**/*.jsx'
    ];

    const allFiles: string[] = [];

    for (const pattern of patterns) {
      try {
        const files = await glob(pattern, {
          cwd: rootPath,
          absolute: true,
          ignore: this.options.excludePatterns
        });
        allFiles.push(...files);
      } catch (error) {
        console.warn(`Warning: Could not glob pattern ${pattern}:`, error);
      }
    }

    // Filter and deduplicate
    const uniqueFiles = [...new Set(allFiles)]
      .filter(file => {
        // Apply additional filters
        if (!this.options.includeTests && this.isTestFile(file)) {
          return false;
        }

        if (!this.options.includeNodeModules && file.includes('node_modules')) {
          return false;
        }

        return true;
      })
      .sort();

    return uniqueFiles;
  }

  private async parseFileSafely(filePath: string): Promise<CodeMapNode> {
    try {
      // Check if file exists and is readable
      const stats = await stat(filePath);
      if (!stats.isFile()) {
        throw new Error(`Not a file: ${filePath}`);
      }

      return await this.parser.parseFile(filePath);
    } catch (error) {
      console.error(`Error parsing ${filePath}:`, error);
      throw error;
    }
  }

  private isTestFile(filePath: string): boolean {
    return /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(filePath) ||
           filePath.includes('__tests__') ||
           filePath.includes('.test.') ||
           filePath.includes('.spec.');
  }

  private detectCircularDependencies(
    dependencies: Map<string, string[]>,
    dependents: Map<string, string[]>
  ): string[][] {
    const circular: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const detectCycle = (nodeId: string, path: string[]) => {
      if (recursionStack.has(nodeId)) {
        const cycleStart = path.indexOf(nodeId);
        if (cycleStart !== -1) {
          const cycle = path.slice(cycleStart);
          circular.push([...cycle, nodeId]);
        }
        return;
      }

      if (visited.has(nodeId)) {
        return;
      }

      visited.add(nodeId);
      recursionStack.add(nodeId);

      const deps = dependencies.get(nodeId) || [];
      for (const dep of deps) {
        detectCycle(dep, [...path, nodeId]);
      }

      recursionStack.delete(nodeId);
    };

    // Check each node for cycles
    dependencies.forEach((_, nodeId) => {
      if (!visited.has(nodeId)) {
        detectCycle(nodeId, []);
      }
    });

    return circular;
  }

  private identifyEntryPoints(
    nodes: Map<string, CodeMapNode>,
    dependents: Map<string, string[]>
  ): string[] {
    const entryPoints: string[] = [];

    nodes.forEach((node, nodeId) => {
      // Files with no dependents are likely entry points
      const dependentCount = dependents.get(nodeId)?.length || 0;

      // Common entry point patterns
      const isEntryPointFile =
        node.fileName === 'index.ts' ||
        node.fileName === 'index.js' ||
        node.fileName === 'App.tsx' ||
        node.fileName === 'App.jsx' ||
        node.fileName === 'main.ts' ||
        node.fileName === 'main.js' ||
        node.filePath.includes('src/entry') ||
        node.filePath.includes('src/client') ||
        node.filePath.includes('src/server');

      if (dependentCount === 0 || isEntryPointFile) {
        entryPoints.push(nodeId);
      }
    });

    return [...new Set(entryPoints)];
  }

  private findRootNode(nodes: Map<string, CodeMapNode>): string {
    // Try to find a natural root node
    const potentialRoots = Array.from(nodes.values()).filter(node =>
      node.fileName === 'App.tsx' ||
      node.fileName === 'App.jsx' ||
      node.fileName === 'index.tsx' ||
      node.fileName === 'index.ts'
    );

    if (potentialRoots.length > 0) {
      return potentialRoots[0].id;
    }

    // Fall back to first node
    return nodes.values().next().value?.id || '';
  }

  private calculateMetrics(nodes: Map<string, CodeMapNode>): CodeMapMetrics {
    let totalFunctions = 0;
    let totalClasses = 0;
    let totalInterfaces = 0;
    let totalReactComponents = 0;
    let totalCustomHooks = 0;
    let totalAPIEndpoints = 0;
    let totalComplexity = 0;
    let totalMaintainability = 0;

    nodes.forEach(node => {
      totalFunctions += node.functions.length;
      totalClasses += node.classes.length;
      totalInterfaces += node.interfaces.length;
      totalReactComponents += node.reactComponents.length;
      totalCustomHooks += node.customHooks.length;
      totalAPIEndpoints += node.apiEndpoints.length;
      totalComplexity += node.metrics.complexity;
      totalMaintainability += node.metrics.maintainabilityIndex;
    });

    const nodeCount = nodes.size;
    const averageComplexity = nodeCount > 0 ? totalComplexity / nodeCount : 0;
    const averageMaintainabilityIndex = nodeCount > 0 ? totalMaintainability / nodeCount : 0;

    // Simple technical debt score calculation
    const technicalDebtScore = Math.max(0, (averageComplexity - 5) * 10);

    return {
      totalFiles: nodeCount,
      totalFunctions,
      totalClasses,
      totalInterfaces,
      totalReactComponents,
      totalCustomHooks,
      totalAPIEndpoints,
      averageComplexity,
      averageMaintainabilityIndex,
      technicalDebtScore
    };
  }

  async getFileInfo(filePath: string): Promise<CodeMapNode | null> {
    try {
      return await this.parseFileSafely(filePath);
    } catch (error) {
      console.error(`Failed to get file info for ${filePath}:`, error);
      return null;
    }
  }

  async searchFiles(query: string, options: {
    type?: 'function' | 'class' | 'interface' | 'variable';
    caseSensitive?: boolean;
    regex?: boolean;
  } = {}): Promise<{ node: CodeMapNode; matches: string[] }[]> {
    const results: { node: CodeMapNode; matches: string[] }[] = [];

    // Get all files first
    const rootPath = process.cwd();
    const filePaths = await this.discoverFiles(rootPath);

    for (const filePath of filePaths.slice(0, 20)) { // Limit to 20 files for performance
      try {
        const node = await this.parseFileSafely(filePath);
        const matches: string[] = [];

        // Simple text search in various properties
        const searchText = options.caseSensitive ? query : query.toLowerCase();

        switch (options.type) {
          case 'function':
            node.functions.forEach(func => {
              const text = options.caseSensitive ? func.name : func.name.toLowerCase();
              if (text.includes(searchText)) {
                matches.push(`Function: ${func.name} (line ${func.startLine})`);
              }
            });
            break;
          case 'class':
            node.classes.forEach(cls => {
              const text = options.caseSensitive ? cls.name : cls.name.toLowerCase();
              if (text.includes(searchText)) {
                matches.push(`Class: ${cls.name} (line ${cls.startLine})`);
              }
            });
            break;
          case 'interface':
            node.interfaces.forEach(iface => {
              const text = options.caseSensitive ? iface.name : iface.name.toLowerCase();
              if (text.includes(searchText)) {
                matches.push(`Interface: ${iface.name} (line ${iface.startLine})`);
              }
            });
            break;
          default:
            // Search all types
            [...node.functions, ...node.classes, ...node.interfaces].forEach(item => {
              const text = options.caseSensitive ? item.name : item.name.toLowerCase();
              if (text.includes(searchText)) {
                matches.push(`${item.constructor.name}: ${item.name} (line ${item.startLine})`);
              }
            });
        }

        if (matches.length > 0) {
          results.push({ node, matches });
        }
      } catch (error) {
        console.error(`Error searching in ${filePath}:`, error);
      }
    }

    return results;
  }

  async getDependencyGraph(): Promise<{
    nodes: Array<{ id: string; name: string; path: string }>;
    edges: Array<{ from: string; to: string }>;
  }> {
    const codeMap = await this.collectCode();
    const nodes: Array<{ id: string; name: string; path: string }> = [];
    const edges: Array<{ from: string; to: string }> = [];

    codeMap.nodes.forEach((node, nodeId) => {
      nodes.push({
        id: nodeId,
        name: node.fileName,
        path: node.filePath
      });

      node.dependencies.forEach(dep => {
        edges.push({ from: nodeId, to: dep });
      });
    });

    return { nodes, edges };
  }

  async getFileStatistics(): Promise<{
    totalFiles: number;
    filesByType: Record<string, number>;
    largestFiles: Array<{ path: string; lines: number; size: number }>;
    mostComplexFiles: Array<{ path: string; complexity: number }>;
  }> {
    const codeMap = await this.collectCode();
    const filesByType: Record<string, number> = {};
    const files: Array<{ path: string; lines: number; size: number; complexity: number }> = [];

    codeMap.nodes.forEach(node => {
      const ext = node.fileType;
      filesByType[ext] = (filesByType[ext] || 0) + 1;

      files.push({
        path: node.filePath,
        lines: node.metrics.linesOfCode,
        size: node.metrics.linesOfCode,
        complexity: node.metrics.complexity
      });
    });

    const largestFiles = files
      .sort((a, b) => b.lines - a.lines)
      .slice(0, 10);

    const mostComplexFiles = files
      .sort((a, b) => b.complexity - a.complexity)
      .slice(0, 10);

    return {
      totalFiles: codeMap.nodes.size,
      filesByType,
      largestFiles,
      mostComplexFiles
    };
  }
}