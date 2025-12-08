import { CodeMap, CodeMapNode, CodeMapMetrics } from './codemap/types';

export interface CodeMapResponse {
  success: boolean;
  codeMap?: {
    nodes: Record<string, CodeMapNode>;
    rootNode: string;
    dependencies: Record<string, string[]>;
    dependents: Record<string, string[]>;
    entryPoints: string[];
    circularDependencies: string[][];
    metrics: CodeMapMetrics;
    lastGenerated: number;
  };
  error?: string;
  details?: string;
}

export interface CodeMapStats {
  totalFiles: number;
  filesByType: Record<string, number>;
  largestFiles: Array<{ path: string; lines: number; size: number }>;
  mostComplexFiles: Array<{ path: string; complexity: number }>;
  summary: {
    totalFiles: number;
    totalDependencies: number;
    circularDeps: number;
    entryPoints: number;
  };
}

export interface SearchResult {
  node: CodeMapNode;
  matches: string[];
}

export interface SearchResponse {
  success: boolean;
  results: SearchResult[];
  error?: string;
}

class CodeMapAPI {
  private baseUrl = 'http://localhost:3200/api/codemap';

  async generateCodeMap(projectId: string): Promise<CodeMapResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to generate CodeMap');
      }

      return data;
    } catch (error) {
      console.error('CodeMap API Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async analyzeFile(projectId: string, filePath: string): Promise<{ success: boolean; fileInfo?: CodeMapNode; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/analyze-file`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectId, filePath }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to analyze file');
      }

      return data;
    } catch (error) {
      console.error('File analysis API Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async searchCodebase(
    projectId: string,
    query: string,
    options: {
      type?: 'function' | 'class' | 'interface' | 'variable';
      caseSensitive?: boolean;
      regex?: boolean;
    } = {}
  ): Promise<SearchResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          query,
          ...options,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to search codebase');
      }

      return data;
    } catch (error) {
      console.error('Search API Error:', error);
      return {
        success: false,
        results: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async getProjectStats(projectId: string): Promise<{ success: boolean; stats?: CodeMapStats; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/stats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to get project statistics');
      }

      return data;
    } catch (error) {
      console.error('Stats API Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // Utility function to format file size
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  // Utility function to get complexity color
  getComplexityColor(complexity: number): string {
    if (complexity <= 5) return 'text-green-400';
    if (complexity <= 10) return 'text-yellow-400';
    if (complexity <= 20) return 'text-orange-400';
    return 'text-red-400';
  }

  // Utility function to get complexity background color
  getComplexityBgColor(complexity: number): string {
    if (complexity <= 5) return 'bg-green-500/20';
    if (complexity <= 10) return 'bg-yellow-500/20';
    if (complexity <= 20) return 'bg-orange-500/20';
    return 'bg-red-500/20';
  }
}

export const codemapApi = new CodeMapAPI();