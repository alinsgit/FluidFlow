import React, { useState, useEffect, useRef } from 'react';
import * as Icons from 'lucide-react';
import { codemapApi } from '../../services/codemapApi';
import { CodeMap, CodeMapNode, SearchResult } from '../../services/codemap/types';

interface CodeMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
}

export const CodeMapModal: React.FC<CodeMapModalProps> = ({ isOpen, onClose, projectId }) => {
  const [codeMap, setCodeMap] = useState<CodeMap | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedFile, setSelectedFile] = useState<CodeMapNode | null>(null);
  const [viewMode, setViewMode] = useState<'tree' | 'graph' | 'metrics'>('tree');
  const [filterType, setFilterType] = useState<'all' | 'components' | 'hooks' | 'api'>('all');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && !codeMap) {
      loadCodeMap();
    }
  }, [isOpen]);

  const loadCodeMap = async () => {
    if (!projectId) {
      setError('No project selected');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await codemapApi.generateCodeMap(projectId);

      if (!response.success || !response.codeMap) {
        throw new Error(response.error || 'Failed to generate code map');
      }

      // Convert the response back to a CodeMap object with Map instances
      const codeMap: CodeMap = {
        nodes: new Map(Object.entries(response.codeMap.nodes)),
        rootNode: response.codeMap.rootNode,
        dependencies: new Map(Object.entries(response.codeMap.dependencies)),
        dependents: new Map(Object.entries(response.codeMap.dependents)),
        entryPoints: response.codeMap.entryPoints,
        circularDependencies: response.codeMap.circularDependencies,
        metrics: response.codeMap.metrics,
        lastGenerated: response.codeMap.lastGenerated
      };

      setCodeMap(codeMap);
    } catch (err) {
      console.error('Failed to generate code map:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate code map');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || !projectId) return;

    try {
      const response = await codemapApi.searchCodebase(projectId, searchQuery, {
        caseSensitive: false
      });

      if (response.success) {
        console.log('Search results:', response.results);
        setSearchResults(response.results);
      } else {
        setError(response.error || 'Search failed');
      }
    } catch (err) {
      console.error('Search failed:', err);
      setError('Search failed');
    }
  };

  const exportCodeMap = () => {
    if (!codeMap) return;

    const exportData = {
      metadata: {
        generated: new Date().toISOString(),
        totalFiles: codeMap.metrics.totalFiles,
        totalFunctions: codeMap.metrics.totalFunctions,
        totalComponents: codeMap.metrics.totalReactComponents
      },
      nodes: Array.from(codeMap.nodes.values()),
      dependencies: Object.fromEntries(codeMap.dependencies),
      metrics: codeMap.metrics,
      entryPoints: codeMap.entryPoints,
      circularDependencies: codeMap.circularDependencies
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `codemap-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleNodeExpansion = (nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const getFilteredFiles = () => {
    if (!codeMap) return [];

    const files = Array.from(codeMap.nodes.values());

    switch (filterType) {
      case 'components':
        return files.filter(file => file.reactComponents.length > 0);
      case 'hooks':
        return files.filter(file => file.customHooks.length > 0);
      case 'api':
        return files.filter(file => file.apiEndpoints.length > 0);
      default:
        return files;
    }
  };

  const getFileIcon = (file: CodeMapNode) => {
    if (file.reactComponents.length > 0) return <Icons.Package className="w-4 h-4" />;
    if (file.customHooks.length > 0) return <Icons.GitBranch className="w-4 h-4" />;
    if (file.apiEndpoints.length > 0) return <Icons.Activity className="w-4 h-4" />;
    return <Icons.FileCode className="w-4 h-4" />;
  };

  const getComplexityColor = (complexity: number) => {
    if (complexity <= 5) return 'text-green-400';
    if (complexity <= 10) return 'text-yellow-400';
    if (complexity <= 15) return 'text-orange-400';
    return 'text-red-400';
  };

  const filteredFiles = getFilteredFiles();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-7xl max-h-[90vh] bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-blue-500/10 to-purple-500/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Icons.Map className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Code Map</h2>
              <p className="text-xs text-slate-400">Interactive codebase analysis</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadCodeMap}
              disabled={isLoading}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh code map"
            >
              <Icons.RefreshCw className={`w-4 h-4 text-slate-400 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={exportCodeMap}
              disabled={!codeMap || isLoading}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
              title="Export as JSON"
            >
              <Icons.Download className="w-4 h-4 text-slate-400" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <Icons.X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
            <Icons.AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-sm text-red-400">{error}</span>
          </div>
        )}

        {/* Metrics Summary */}
        {codeMap && (
          <div className="px-4 py-3 border-b border-white/5 bg-slate-800/30">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-white">{codeMap.metrics.totalFiles}</div>
                <div className="text-xs text-slate-400">Files</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-400">{codeMap.metrics.totalReactComponents}</div>
                <div className="text-xs text-slate-400">Components</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-400">{codeMap.metrics.totalFunctions}</div>
                <div className="text-xs text-slate-400">Functions</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-400">{codeMap.metrics.averageMaintainabilityIndex.toFixed(1)}</div>
                <div className="text-xs text-slate-400">Maintainability</div>
              </div>
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            {/* View Mode */}
            <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('tree')}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  viewMode === 'tree'
                    ? 'bg-blue-500 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                <Icons.Layers className="w-3 h-3 inline mr-1" />
                Tree
              </button>
              <button
                onClick={() => setViewMode('graph')}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  viewMode === 'graph'
                    ? 'bg-blue-500 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                <Icons.GitBranch className="w-3 h-3 inline mr-1" />
                Graph
              </button>
              <button
                onClick={() => setViewMode('metrics')}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  viewMode === 'metrics'
                    ? 'bg-blue-500 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                <Icons.Code className="w-3 h-3 inline mr-1" />
                Metrics
              </button>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  filterType === 'all'
                    ? 'bg-purple-500 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                <Icons.Filter className="w-3 h-3 inline mr-1" />
                All
              </button>
              <button
                onClick={() => setFilterType('components')}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  filterType === 'components'
                    ? 'bg-purple-500 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                <Icons.Package className="w-3 h-3 inline mr-1" />
                Components
              </button>
              <button
                onClick={() => setFilterType('hooks')}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  filterType === 'hooks'
                    ? 'bg-purple-500 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                <Icons.GitBranch className="w-3 h-3 inline mr-1" />
                Hooks
              </button>
              <button
                onClick={() => setFilterType('api')}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  filterType === 'api'
                    ? 'bg-purple-500 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                <Icons.Activity className="w-3 h-3 inline mr-1" />
                API
              </button>
            </div>

            {/* Search */}
            <div className="flex-1 relative">
              <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search functions, classes, variables..."
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <Icons.X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main content container */}
        <div className="flex-1 overflow-hidden flex">
          {viewMode === 'tree' && (
            <>
              {/* Tree view section: File tree on left */}
              <div className="w-96 border-r border-white/5 overflow-y-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <Icons.RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-2" />
                      <p className="text-sm text-slate-400">Analyzing codebase...</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 space-y-2">
                    {searchResults.length > 0 ? (
                      <div className="mb-4">
                        <h3 className="text-sm font-medium text-white mb-2">Search Results ({searchResults.length})</h3>
                        <div className="space-y-1">
                          {searchResults.map((result, index) => (
                            <div key={index} className="p-2 bg-slate-800/50 rounded border border-blue-500/20">
                              <div className="flex items-center gap-2 mb-1">
                                <Icons.FileCode className="w-3 h-3 text-blue-400" />
                                <span className="text-xs font-medium text-blue-300">{result.node.fileName}</span>
                              </div>
                              <div className="text-xs text-slate-400 truncate">{result.node.filePath}</div>
                              <div className="mt-1">
                                {result.matches.map((match, matchIndex) => (
                                  <div key={matchIndex} className="text-xs text-yellow-300 bg-yellow-500/10 px-1 py-0.5 rounded mt-1">
                                    {match}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      searchQuery ? (
                        <div className="text-center py-8">
                          <Icons.Search className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                          <p className="text-sm text-slate-400">No search results for "{searchQuery}"</p>
                        </div>
                      ) : null
                    )}

                    {filteredFiles.map((file) => (
                      <div key={file.id}>
                        <button
                          onClick={() => setSelectedFile(file)}
                          className={`w-full text-left p-3 rounded-lg transition-colors ${
                            selectedFile?.id === file.id
                              ? 'bg-blue-500/20 border border-blue-500/50 text-blue-200'
                              : 'bg-slate-800/50 border border-white/10 hover:bg-slate-800 hover:border-white/20 text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {getFileIcon(file)}
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">{file.fileName}</div>
                              <div className="text-xs text-slate-500 truncate">
                                {file.filePath}
                              </div>
                            </div>
                            <div className="text-xs text-right">
                              {file.reactComponents.length > 0 && (
                                <div className="text-blue-400">🧩 {file.reactComponents.length}</div>
                              )}
                              {file.customHooks.length > 0 && (
                                <div className="text-purple-400">🪝 {file.customHooks.length}</div>
                              )}
                              {file.apiEndpoints.length > 0 && (
                                <div className="text-green-400">⚡ {file.apiEndpoints.length}</div>
                              )}
                            </div>
                          </div>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tree view section: File details on right - only when file selected */}
              {selectedFile && (
                <div className="flex-1 overflow-y-auto">
                  <div className="p-6">
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-white mb-2">{selectedFile.fileName}</h3>
                      <p className="text-sm text-slate-400">{selectedFile.filePath}</p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-300">
                          {selectedFile.fileType.toUpperCase()}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs ${getComplexityColor(selectedFile.metrics.complexity)}`}>
                          Complexity: {selectedFile.metrics.complexity}
                        </span>
                        <span className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-300">
                          {selectedFile.metrics.linesOfCode} lines
                        </span>
                        <span className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-300">
                          Maintainability: {selectedFile.metrics.maintainabilityIndex.toFixed(1)}
                        </span>
                      </div>
                    </div>

                    {/* Functions */}
                    {selectedFile.functions.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                          <Icons.Code className="w-4 h-4 text-blue-400" />
                          Functions ({selectedFile.functions.length})
                        </h4>
                        <div className="space-y-2">
                          {selectedFile.functions.map((func, index) => (
                            <div key={index} className="p-3 bg-slate-800/50 rounded-lg">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-blue-300">
                                  {func.name}
                                  {func.isAsync && <span className="ml-2 text-xs text-purple-400">(async)</span>}
                                </span>
                                <span className="text-xs text-slate-500">Line {func.startLine}</span>
                              </div>
                              {func.parameters.length > 0 && (
                                <div className="mt-2 text-xs text-slate-400">
                                  ({func.parameters.map(p => p.name).join(', ')})
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* React Components */}
                    {selectedFile.reactComponents.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                          <Icons.Package className="w-4 h-4 text-green-400" />
                          React Components ({selectedFile.reactComponents.length})
                        </h4>
                        <div className="space-y-2">
                          {selectedFile.reactComponents.map((component, index) => (
                            <div key={index} className="p-3 bg-slate-800/50 rounded-lg">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-green-300">{component.name}</span>
                                <span className="text-xs text-slate-500">
                                  Type: {component.type}
                                </span>
                              </div>
                              {component.hooks.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {component.hooks.map((hook, hookIndex) => (
                                    <span key={hookIndex} className="px-2 py-1 bg-slate-700 rounded text-xs text-slate-300">
                                      {hook}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Custom Hooks */}
                    {selectedFile.customHooks.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                          <Icons.GitBranch className="w-4 h-4 text-purple-400" />
                          Custom Hooks ({selectedFile.customHooks.length})
                        </h4>
                        <div className="space-y-2">
                          {selectedFile.customHooks.map((hook, index) => (
                            <div key={index} className="p-3 bg-slate-800/50 rounded-lg">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-purple-300">{hook.name}</span>
                                <span className="text-xs text-slate-500">Line {hook.startLine}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Imports */}
                    {selectedFile.imports.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-sm font-semibold text-white mb-3">Imports</h4>
                        <div className="space-y-1">
                          {selectedFile.imports.map((importInfo, index) => (
                            <div key={index} className="p-2 bg-slate-800/30 rounded text-xs">
                              <span className="text-blue-400">from</span>
                              <span className="text-slate-300 ml-2">{importInfo.source}</span>
                              {importInfo.imports.length > 0 && (
                                <div className="ml-4 text-slate-400">
                                  {importInfo.imports.map(spec => spec.alias || spec.name).join(', ')}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {!selectedFile && viewMode === 'tree' && (
                <div className="flex-1 overflow-y-auto">
                  <div className="flex items-center justify-center h-full">
                    <p className="text-slate-400">No file selected</p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Graph view section */}
          {viewMode === 'graph' && (
            <div className="flex-1 overflow-y-auto">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-6">Dependency Graph</h3>

                {codeMap && (
                  <div className="space-y-6">
                    {/* Graph Controls */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-slate-400">Show:</label>
                        <select
                          className="bg-slate-800 border border-white/10 rounded px-3 py-1 text-sm text-white"
                          value={filterType}
                          onChange={(e) => setFilterType(e.target.value as any)}
                        >
                          <option value="all">All Files</option>
                          <option value="components">Components</option>
                          <option value="hooks">Hooks</option>
                          <option value="api">API Endpoints</option>
                        </select>
                      </div>
                    </div>

                    {/* Enhanced SVG Graph Visualization */}
                    <div className="bg-slate-800/50 rounded-lg p-4 overflow-auto">
                      <div className="relative" style={{ minHeight: '600px' }}>
                        <svg
                          width="100%"
                          height="600"
                          className="w-full"
                          style={{ minWidth: '800px' }}
                        >
                          {/* Definitions for gradients and filters */}
                          <defs>
                            <filter id="glow">
                              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                              <feMerge>
                                <feMergeNode in="coloredBlur"/>
                                <feMergeNode in="SourceGraphic"/>
                              </feMerge>
                            </filter>
                            <marker
                              id="arrowhead"
                              markerWidth="10"
                              markerHeight="7"
                              refX="9"
                              refY="3.5"
                              orient="auto"
                            >
                              <polygon
                                points="0 0, 10 3.5, 0 7"
                                fill="#6366f1"
                                opacity="0.7"
                              />
                            </marker>
                            <linearGradient id="nodeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3"/>
                              <stop offset="100%" stopColor="#ffffff" stopOpacity="0"/>
                            </linearGradient>
                          </defs>

                          {/* Background grid */}
                          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#334155" strokeWidth="0.5" opacity="0.3"/>
                          </pattern>
                          <rect width="100%" height="100%" fill="url(#grid)" />

                          {/* Calculate positions using organic hierarchical layout */}
                          {(() => {
                            const filteredNodes = filteredFiles;
                            const nodeCount = filteredNodes.length;
                            const width = 800;
                            const height = 600;
                            const padding = 50;

                            // Create a more organic, tree-like layout
                            const positions = new Map<string, {x: number, y: number}>();

                            // Group by type and create horizontal layers
                            const layers = [
                              {
                                nodes: filteredNodes.filter(n => n.reactComponents.length > 0),
                                yPercent: 0.2,
                                label: 'Components'
                              },
                              {
                                nodes: filteredNodes.filter(n => n.customHooks.length > 0),
                                yPercent: 0.4,
                                label: 'Hooks'
                              },
                              {
                                nodes: filteredNodes.filter(n => n.apiEndpoints.length > 0),
                                yPercent: 0.6,
                                label: 'API'
                              },
                              {
                                nodes: filteredNodes.filter(n =>
                                  n.reactComponents.length === 0 &&
                                  n.customHooks.length === 0 &&
                                  n.apiEndpoints.length === 0
                                ),
                                yPercent: 0.8,
                                label: 'Other'
                              }
                            ];

                            // Sort nodes within each layer by complexity (more complex in center)
                            layers.forEach((layer) => {
                              if (layer.nodes.length === 0) return;

                              const sortedNodes = [...layer.nodes].sort((a, b) =>
                                b.metrics.complexity - a.metrics.complexity
                              );

                              const layerWidth = width - (padding * 2);
                              const spacing = layerWidth / (sortedNodes.length + 1);
                              const baseY = height * layer.yPercent;

                              sortedNodes.forEach((node, index) => {
                                // Create flowing wave pattern
                                const waveAmplitude = 20;
                                const waveFrequency = 0.3;
                                const wave = Math.sin((index / sortedNodes.length) * Math.PI * waveFrequency) * waveAmplitude;

                                // Position with organic variation
                                const x = padding + spacing * (index + 1);
                                const y = baseY + wave + (Math.random() - 0.5) * 10;

                                positions.set(node.id, {
                                  x: Math.max(padding, Math.min(width - padding, x)),
                                  y: Math.max(padding, Math.min(height - padding, y))
                                });
                              });
                            });

                            return (
                              <>
                                {/* Dependency Lines with curved paths */}
                                {filteredNodes.map(node => {
                                  const deps = codeMap.dependencies.get(node.id) || [];
                                  const nodePos = positions.get(node.id);
                                  if (!nodePos) return null;

                                  return deps.map(depId => {
                                    const depPos = positions.get(depId);
                                    if (!depPos || !filteredNodes.find(n => n.id === depId)) return null;

                                    const dx = depPos.x - nodePos.x;
                                    const dy = depPos.y - nodePos.y;
                                    const dr = Math.sqrt(dx * dx + dy * dy) / 2;

                                    return (
                                      <g key={`${node.id}-${depId}`}>
                                        <path
                                          d={`M ${nodePos.x} ${nodePos.y} Q ${(nodePos.x + depPos.x) / 2} ${(nodePos.y + depPos.y) / 2 - dr * 0.2} ${depPos.x} ${depPos.y}`}
                                          stroke="#6366f1"
                                          strokeWidth="2"
                                          fill="none"
                                          opacity="0.4"
                                          strokeDasharray="5,5"
                                          markerEnd="url(#arrowhead)"
                                          className="animate-pulse"
                                        />
                                      </g>
                                    );
                                  });
                                })}

                                {/* Layer labels and backgrounds */}
                                {layers.map((layer, index) => {
                                  if (layer.nodes.length === 0) return null;
                                  const labelY = height * layer.yPercent;
                                  return (
                                    <g key={`layer-${index}`}>
                                      {/* Layer background strip */}
                                      <rect
                                        x="0"
                                        y={labelY - 30}
                                        width={width}
                                        height="60"
                                        fill="#1e293b"
                                        opacity="0.2"
                                      />

                                      {/* Layer label */}
                                      <text
                                        x="25"
                                        y={labelY}
                                        textAnchor="start"
                                        dominantBaseline="middle"
                                        fill="#94a3b8"
                                        fontSize="13"
                                        fontWeight="600"
                                        opacity="0.9"
                                        className="select-none"
                                      >
                                        {layer.label}
                                      </text>

                                      {/* Decorative line */}
                                      <line
                                        x1="100"
                                        y1={labelY}
                                        x2="140"
                                        y2={labelY}
                                        stroke="#475569"
                                        strokeWidth="2"
                                        opacity="0.6"
                                      />
                                    </g>
                                  );
                                })}

                                {/* Modern card-style nodes */}
                                {filteredNodes.map(node => {
                                  const pos = positions.get(node.id);
                                  if (!pos) return null;

                                  const hasDeps = (codeMap.dependencies.get(node.id) || []).length > 0;
                                  const nodeWidth = 60 + Math.min(node.metrics.linesOfCode / 15, 80);
                                  const nodeHeight = 35;
                                  const color = node.reactComponents.length > 0 ? '#10b981' :
                                                node.customHooks.length > 0 ? '#8b5cf6' :
                                                node.apiEndpoints.length > 0 ? '#f97316' : '#3b82f6';
                                  const isSelected = selectedFile?.id === node.id;

                                  return (
                                    <g key={node.id}>
                                      {/* Node shadow */}
                                      <rect
                                        x={pos.x - nodeWidth/2 + 3}
                                        y={pos.y - nodeHeight/2 + 3}
                                        width={nodeWidth}
                                        height={nodeHeight}
                                        rx="8"
                                        fill="black"
                                        opacity="0.25"
                                      />

                                      {/* Selected glow effect */}
                                      {isSelected && (
                                        <>
                                          <rect
                                            x={pos.x - nodeWidth/2 - 6}
                                            y={pos.y - nodeHeight/2 - 6}
                                            width={nodeWidth + 12}
                                            height={nodeHeight + 12}
                                            rx="10"
                                            fill={color}
                                            opacity="0.15"
                                            filter="url(#glow)"
                                          />
                                          <rect
                                            x={pos.x - nodeWidth/2 - 3}
                                            y={pos.y - nodeHeight/2 - 3}
                                            width={nodeWidth + 6}
                                            height={nodeHeight + 6}
                                            rx="9"
                                            fill="none"
                                            stroke={color}
                                            strokeWidth="1"
                                            opacity="0.5"
                                            strokeDasharray="3,3"
                                            className="animate-pulse"
                                          />
                                        </>
                                      )}

                                      {/* Main node card */}
                                      <rect
                                        x={pos.x - nodeWidth/2}
                                        y={pos.y - nodeHeight/2}
                                        width={nodeWidth}
                                        height={nodeHeight}
                                        rx="8"
                                        fill={color}
                                        stroke={isSelected ? "#fbbf24" : "#ffffff"}
                                        strokeWidth={isSelected ? "2.5" : "1.5"}
                                        className="cursor-pointer transition-all hover:brightness-110"
                                        onClick={() => setSelectedFile(node)}
                                        style={{ filter: isSelected ? 'brightness(1.1)' : 'brightness(1)' }}
                                      />

                                      {/* Inner gradient overlay */}
                                      <rect
                                        x={pos.x - nodeWidth/2 + 1}
                                        y={pos.y - nodeHeight/2 + 1}
                                        width={nodeWidth - 2}
                                        height={nodeHeight - 2}
                                        rx="7"
                                        fill="url(#nodeGradient)"
                                        opacity="0.6"
                                      />

                                      {/* Node icon */}
                                      <text
                                        x={pos.x - nodeWidth/2 + 12}
                                        y={pos.y}
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        fill="white"
                                        fontSize="14"
                                        className="select-none"
                                      >
                                        {node.reactComponents.length > 0 ? '⚛️' :
                                         node.customHooks.length > 0 ? '🪝' :
                                         node.apiEndpoints.length > 0 ? '⚡' : '📄'}
                                      </text>

                                      {/* Node filename */}
                                      <text
                                        x={pos.x + 5}
                                        y={pos.y}
                                        textAnchor="start"
                                        dominantBaseline="middle"
                                        fill="white"
                                        fontSize="11"
                                        fontWeight="500"
                                        pointerEvents="none"
                                        className="select-none"
                                      >
                                        {node.fileName.length > Math.floor(nodeWidth / 7) ?
                                          node.fileName.substring(0, Math.floor(nodeWidth / 7) - 2) + '...' :
                                          node.fileName}
                                      </text>

                                      {/* Metrics indicator on right */}
                                      <g>
                                        {/* Dependency indicator */}
                                        {hasDeps && (
                                          <circle
                                            cx={pos.x + nodeWidth/2 - 8}
                                            cy={pos.y - nodeHeight/2 + 8}
                                            r="3"
                                            fill="#ef4444"
                                            stroke="white"
                                            strokeWidth="1"
                                          />
                                        )}

                                        {/* Complexity badge */}
                                        <rect
                                          x={pos.x + nodeWidth/2 - 16}
                                          y={pos.y + nodeHeight/2 - 8}
                                          width="12"
                                          height="5"
                                          rx="2"
                                          fill={node.metrics.complexity > 15 ? "#ef4444" :
                                                node.metrics.complexity > 10 ? "#f59e0b" :
                                                node.metrics.complexity > 5 ? "#eab308" : "#10b981"}
                                          opacity="0.9"
                                        />
                                      </g>
                                    </g>
                                  );
                                })}
                              </>
                            );
                          })()}
                        </svg>

                        {/* Floating stats overlay */}
                        <div className="absolute top-4 right-4 bg-slate-900/90 backdrop-blur rounded-lg p-3 border border-white/10">
                          <div className="text-xs text-slate-400 space-y-1">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-green-500"></div>
                              <span>Components: {filteredFiles.filter(f => f.reactComponents.length > 0).length}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                              <span>Hooks: {filteredFiles.filter(f => f.customHooks.length > 0).length}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                              <span>API: {filteredFiles.filter(f => f.apiEndpoints.length > 0).length}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                              <span>Other: {filteredFiles.filter(f =>
                                f.reactComponents.length === 0 &&
                                f.customHooks.length === 0 &&
                                f.apiEndpoints.length === 0
                              ).length}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Graph Legend */}
                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-white mb-4">Visual Guide</h4>

                      {/* Node Types */}
                      <div className="mb-4">
                        <h5 className="text-xs font-medium text-slate-400 mb-2">Node Types</h5>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">⚛️</span>
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <span className="text-slate-300">React Components</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">🪝</span>
                            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                            <span className="text-slate-300">Custom Hooks</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">⚡</span>
                            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                            <span className="text-slate-300">API Endpoints</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">📄</span>
                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                            <span className="text-slate-300">Other Files</span>
                          </div>
                        </div>
                      </div>

                      {/* Visual Indicators */}
                      <div className="space-y-3">
                        <h5 className="text-xs font-medium text-slate-400">Visual Indicators</h5>

                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-700 relative">
                            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 border border-white"></div>
                          </div>
                          <span className="text-xs text-slate-300">Red dot = Has dependencies</span>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-700 relative">
                            <div className="absolute -top-1 -left-1 w-2 h-2 rounded-full bg-green-500"></div>
                          </div>
                          <span className="text-xs text-slate-300">Colored dot = Complexity level</span>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full border-2 border-amber-400"></div>
                          <span className="text-xs text-slate-300">Yellow border = Selected node</span>
                        </div>

                        <div className="flex items-center gap-3">
                          <svg width="32" height="2">
                            <path d="M 0 1 L 32 1" stroke="#6366f1" strokeWidth="2" strokeDasharray="5,5" opacity="0.4"/>
                          </svg>
                          <span className="text-xs text-slate-300">Dashed line = Dependencies</span>
                        </div>
                      </div>

                      {/* Complexity Scale */}
                      <div className="mt-4 pt-3 border-t border-white/10">
                        <h5 className="text-xs font-medium text-slate-400 mb-2">Complexity Scale</h5>
                        <div className="flex items-center gap-2 text-xs">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <span className="text-slate-300">Low (≤5)</span>
                          <div className="w-2 h-2 rounded-full bg-yellow-500 ml-2"></div>
                          <span className="text-slate-300">Med (6-10)</span>
                          <div className="w-2 h-2 rounded-full bg-amber-500 ml-2"></div>
                          <span className="text-slate-300">High (11-15)</span>
                          <div className="w-2 h-2 rounded-full bg-red-500 ml-2"></div>
                          <span className="text-slate-300">V.High (&gt;15)</span>
                        </div>
                      </div>
                    </div>

                    {/* Selected File Details */}
                    {selectedFile && (
                      <div className="bg-slate-800/50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold text-white">{selectedFile.fileName}</h4>
                          <button
                            onClick={() => setSelectedFile(null)}
                            className="text-slate-400 hover:text-white"
                          >
                            <Icons.X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Path:</span>
                            <span className="text-slate-300">{selectedFile.filePath}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Dependencies:</span>
                            <span className="text-slate-300">{(codeMap.dependencies.get(selectedFile.id) || []).length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Dependents:</span>
                            <span className="text-slate-300">{(codeMap.dependents.get(selectedFile.id) || []).length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Complexity:</span>
                            <span className={getComplexityColor(selectedFile.metrics.complexity)}>
                              {selectedFile.metrics.complexity}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Metrics view section */}
          {viewMode === 'metrics' && (
            <div className="flex-1 overflow-y-auto">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-6">Code Metrics & Analytics</h3>

                {codeMap && (
                  <div className="space-y-6">
                    {/* Overall Stats */}
                    <div className="grid grid-cols-4 gap-4">
                      <div className="bg-slate-800/50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Icons.FileCode className="w-4 h-4 text-blue-400" />
                          <span className="text-sm text-slate-400">Total Files</span>
                        </div>
                        <div className="text-2xl font-bold text-white">{codeMap.nodes.size}</div>
                      </div>

                      <div className="bg-slate-800/50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Icons.Code className="w-4 h-4 text-green-400" />
                          <span className="text-sm text-slate-400">Functions</span>
                        </div>
                        <div className="text-2xl font-bold text-white">{codeMap.metrics.totalFunctions}</div>
                      </div>

                      <div className="bg-slate-800/50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Icons.Package className="w-4 h-4 text-purple-400" />
                          <span className="text-sm text-slate-400">Components</span>
                        </div>
                        <div className="text-2xl font-bold text-white">{codeMap.metrics.totalComponents}</div>
                      </div>

                      <div className="bg-slate-800/50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Icons.Activity className="w-4 h-4 text-orange-400" />
                          <span className="text-sm text-slate-400">API Endpoints</span>
                        </div>
                        <div className="text-2xl font-bold text-white">{codeMap.metrics.totalApiEndpoints}</div>
                      </div>
                    </div>

                    {/* File Type Distribution */}
                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-white mb-4">File Type Distribution</h4>
                      <div className="space-y-2">
                        {(() => {
                          const fileTypes: Record<string, number> = {};
                          codeMap.nodes.forEach(file => {
                            fileTypes[file.fileType] = (fileTypes[file.fileType] || 0) + 1;
                          });
                          return Object.entries(fileTypes).map(([type, count]) => (
                            <div key={type} className="flex items-center justify-between">
                              <span className="text-sm text-slate-300">{type.toUpperCase()}</span>
                              <div className="flex items-center gap-2">
                                <div className="w-32 bg-slate-700 rounded-full h-2">
                                  <div
                                    className="bg-blue-500 h-2 rounded-full"
                                    style={{ width: `${(count / codeMap.nodes.size) * 100}%` }}
                                  />
                                </div>
                                <span className="text-sm text-slate-400 w-8 text-right">{count}</span>
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>

                    {/* Complexity Analysis */}
                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-white mb-4">Complexity Analysis</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-400">
                            {Array.from(codeMap.nodes.values()).filter(f => f.metrics.complexity <= 5).length}
                          </div>
                          <div className="text-xs text-slate-400">Simple (≤5)</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-yellow-400">
                            {Array.from(codeMap.nodes.values()).filter(f => f.metrics.complexity > 5 && f.metrics.complexity <= 15).length}
                          </div>
                          <div className="text-xs text-slate-400">Moderate (6-15)</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-400">
                            {Array.from(codeMap.nodes.values()).filter(f => f.metrics.complexity > 15).length}
                          </div>
                          <div className="text-xs text-slate-400">Complex (&gt;15)</div>
                        </div>
                      </div>
                    </div>

                    {/* Largest Files */}
                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-white mb-4">Largest Files (by Lines)</h4>
                      <div className="space-y-2">
                        {Array.from(codeMap.nodes.values())
                          .sort((a, b) => b.metrics.linesOfCode - a.metrics.linesOfCode)
                          .slice(0, 5)
                          .map((file, index) => (
                            <div key={file.id} className="flex items-center justify-between text-sm">
                              <span className="text-slate-300 truncate flex-1 mr-2">{file.fileName}</span>
                              <span className="text-slate-400">{file.metrics.linesOfCode} lines</span>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Most Complex Files */}
                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-white mb-4">Most Complex Files</h4>
                      <div className="space-y-2">
                        {Array.from(codeMap.nodes.values())
                          .sort((a, b) => b.metrics.complexity - a.metrics.complexity)
                          .slice(0, 5)
                          .map((file, index) => (
                            <div key={file.id} className="flex items-center justify-between text-sm">
                              <span className="text-slate-300 truncate flex-1 mr-2">{file.fileName}</span>
                              <span className={`px-2 py-1 rounded text-xs ${getComplexityColor(file.metrics.complexity)}`}>
                                {file.metrics.complexity}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Dependencies Summary */}
                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-white mb-4">Dependencies</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-2xl font-bold text-blue-400">{codeMap.entryPoints.length}</div>
                          <div className="text-xs text-slate-400">Entry Points</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-orange-400">{codeMap.circularDependencies.length}</div>
                          <div className="text-xs text-slate-400">Circular Dependencies</div>
                        </div>
                      </div>
                      {codeMap.circularDependencies.length > 0 && (
                        <div className="mt-4">
                          <h5 className="text-xs font-medium text-slate-400 mb-2">Circular Dependencies:</h5>
                          <div className="space-y-1">
                            {codeMap.circularDependencies.slice(0, 3).map((cycle, index) => (
                              <div key={index} className="text-xs text-slate-300">
                                {cycle.join(' → ')}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
