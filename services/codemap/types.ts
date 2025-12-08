import { Node } from '@typescript-eslint/typescript-estree';

export interface CodeMapNode {
  id: string;
  filePath: string;
  fileName: string;
  fileType: 'ts' | 'tsx' | 'js' | 'jsx';
  ast: Node;
  functions: FunctionInfo[];
  classes: ClassInfo[];
  interfaces: InterfaceInfo[];
  imports: ImportInfo[];
  exports: ExportInfo[];
  variables: VariableInfo[];
  reactComponents: ReactComponentInfo[];
  customHooks: CustomHookInfo[];
  apiEndpoints: APIEndpointInfo[];
  dependencies: string[];
  dependents: string[];
  metrics: FileMetrics;
}

export interface FunctionInfo {
  name: string;
  type: 'function' | 'arrow' | 'method';
  isAsync: boolean;
  parameters: ParameterInfo[];
  returnType?: string;
  body: string;
  startLine: number;
  endLine: number;
  complexity: number;
  docstring?: string;
}

export interface ClassInfo {
  name: string;
  extends?: string;
  implements?: string[];
  properties: PropertyInfo[];
  methods: FunctionInfo[];
  constructor?: FunctionInfo;
  decorators?: string[];
  startLine: number;
  endLine: number;
  isReactComponent: boolean;
}

export interface InterfaceInfo {
  name: string;
  extends?: string[];
  properties: PropertyInfo[];
  methods: FunctionInfo[];
  startLine: number;
  endLine: number;
}

export interface PropertyInfo {
  name: string;
  type?: string;
  isOptional: boolean;
  isReadonly: boolean;
  visibility?: 'public' | 'private' | 'protected';
  defaultValue?: string;
  startLine: number;
}

export interface ParameterInfo {
  name: string;
  type?: string;
  isOptional: boolean;
  defaultValue?: string;
  isRest: boolean;
}

export interface ImportInfo {
  source: string;
  imports: ImportSpecifier[];
  isDefault: boolean;
  isTypeOnly: boolean;
  startLine: number;
}

export interface ImportSpecifier {
  name: string;
  alias?: string;
  isDefault: boolean;
  isType: boolean;
}

export interface ExportInfo {
  name: string;
  type: 'function' | 'class' | 'interface' | 'variable' | 'type' | 'default';
  alias?: string;
  isDefault: boolean;
  isTypeOnly: boolean;
  startLine: number;
}

export interface ReactComponentInfo {
  name: string;
  type: 'function' | 'class' | 'forwardRef' | 'memo';
  props: PropertyInfo[];
  hooks: string[];
  children: string[];
  stateManagement?: 'useState' | 'useReducer' | 'context' | 'redux' | 'zustand';
  routing?: boolean;
  hooksUsage: HookUsageInfo[];
  startLine: number;
  endLine: number;
}

export interface CustomHookInfo {
  name: string;
  parameters: ParameterInfo[];
  returnType?: string;
  hooks: string[];
  stateManagement: boolean;
  sideEffects: boolean;
  startLine: number;
  endLine: number;
}

export interface HookUsageInfo {
  hook: string;
  count: number;
  lines: number[];
}

export interface APIEndpointInfo {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  handler: string;
  parameters: PropertyInfo[];
  middleware?: string[];
  startLine: number;
}

export interface FileMetrics {
  linesOfCode: number;
  commentLines: number;
  emptyLines: number;
  complexity: number;
  maintainabilityIndex: number;
  technicalDebt: number;
}

export interface CodeMap {
  nodes: Map<string, CodeMapNode>;
  rootNode: string;
  dependencies: Map<string, string[]>;
  dependents: Map<string, string[]>;
  entryPoints: string[];
  circularDependencies: string[][];
  metrics: CodeMapMetrics;
  lastGenerated: number;
}

export interface CodeMapMetrics {
  totalFiles: number;
  totalFunctions: number;
  totalClasses: number;
  totalInterfaces: number;
  totalReactComponents: number;
  totalCustomHooks: number;
  totalAPIEndpoints: number;
  averageComplexity: number;
  averageMaintainabilityIndex: number;
  technicalDebtScore: number;
}

export interface CodeMapOptions {
  includeTests?: boolean;
  includeNodeModules?: boolean;
  maxDepth?: number;
  excludePatterns?: string[];
  analyzeComplexity?: boolean;
  generateDocumentation?: boolean;
}

export interface SearchOptions {
  query: string;
  type?: 'function' | 'class' | 'interface' | 'variable' | 'import' | 'export';
  filePath?: string;
  caseSensitive?: boolean;
  regex?: boolean;
}

export interface SearchResult {
  node: CodeMapNode;
  matches: SearchMatch[];
}

export interface SearchMatch {
  type: string;
  name: string;
  line: number;
  column: number;
  context: string;
}