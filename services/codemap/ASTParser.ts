import { parse as parseTS, Node, TSESTreeOptions } from '@typescript-eslint/typescript-estree';
import { parse as parseJS } from 'acorn';
import { simple as walk } from 'acorn-walk';
import { join, extname, basename } from 'path';
import { readFileSync } from 'fs';
import {
  CodeMapNode,
  FunctionInfo,
  ClassInfo,
  InterfaceInfo,
  ImportInfo,
  ExportInfo,
  PropertyInfo,
  ParameterInfo,
  ReactComponentInfo,
  CustomHookInfo,
  HookUsageInfo,
  APIEndpointInfo,
  FileMetrics,
  CodeMapOptions
} from './types';

export class ASTParser {
  private options: CodeMapOptions;
  private tsConfig: TSESTreeOptions;

  constructor(options: CodeMapOptions = {}) {
    this.options = {
      includeTests: false,
      includeNodeModules: false,
      maxDepth: 10,
      excludePatterns: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
      analyzeComplexity: true,
      generateDocumentation: true,
      ...options
    };

    this.tsConfig = {
      loc: true,
      range: true,
      tokens: true,
      comment: true,
      ecmaVersion: 2022,
      sourceType: 'module',
      ecmaFeatures: {
        jsx: true,
      },
      project: false,
      tsconfigRootDir: process.cwd(),
    };
  }

  async parseFile(filePath: string): Promise<CodeMapNode> {
    const content = readFileSync(filePath, 'utf-8');
    const ext = extname(filePath);
    const fileName = basename(filePath);

    const node: Node = ext === '.ts' || ext === '.tsx'
      ? this.parseTypeScript(content, filePath)
      : this.parseJavaScript(content, filePath);

    const fileNode: CodeMapNode = {
      id: this.generateNodeId(filePath),
      filePath,
      fileName,
      fileType: ext.replace('.', '') as 'ts' | 'tsx' | 'js' | 'jsx',
      ast: node,
      functions: [],
      classes: [],
      interfaces: [],
      imports: [],
      exports: [],
      variables: [],
      reactComponents: [],
      customHooks: [],
      apiEndpoints: [],
      dependencies: [],
      dependents: [],
      metrics: this.calculateMetrics(content, node)
    };

    this.extractFunctions(node, fileNode);
    this.extractClasses(node, fileNode);
    this.extractInterfaces(node, fileNode);
    this.extractImports(node, fileNode);
    this.extractExports(node, fileNode);
    this.extractVariables(node, fileNode);
    this.extractReactComponents(node, fileNode);
    this.extractCustomHooks(node, fileNode);
    this.extractAPIEndpoints(node, fileNode);
    this.extractDependencies(node, fileNode);

    return fileNode;
  }

  private parseTypeScript(content: string, filePath: string): Node {
    return parseTS(content, this.tsConfig) as Node;
  }

  private parseJavaScript(content: string, filePath: string): Node {
    const ext = extname(filePath);
    const isJSX = ext === '.jsx';

    try {
      const ast = parseJS(content, {
        ecmaVersion: 2022,
        sourceType: 'module',
        allowHashBang: true,
        allowReturnOutsideFunction: false,
        locations: true,
        ranges: true,
        ...(isJSX && { ecmaFeatures: { jsx: true } })
      });

      // Convert acorn AST to our format (simplified)
      return ast as any as Node;
    } catch (error) {
      console.error(`Error parsing JavaScript file ${filePath}:`, error);
      throw error;
    }
  }

  private extractFunctions(node: Node, fileNode: CodeMapNode): void {
    const functions: FunctionInfo[] = [];

    this.traverse(node, {
      FunctionDeclaration: (n: any) => {
        if (n.id && n.id.name) {
          functions.push(this.createFunctionInfo(n, 'function'));
        }
      },
      FunctionExpression: (n: any) => {
        const name = this.getFunctionName(n);
        if (name) {
          functions.push(this.createFunctionInfo(n, 'function', name));
        }
      },
      ArrowFunctionExpression: (n: any) => {
        const name = this.getFunctionName(n);
        if (name) {
          functions.push(this.createFunctionInfo(n, 'arrow', name));
        }
      },
      MethodDefinition: (n: any) => {
        if (n.key && n.key.name) {
          functions.push(this.createFunctionInfo(n.value, 'method', n.key.name));
        }
      }
    });

    fileNode.functions = functions;
  }

  private createFunctionInfo(node: any, type: string, name?: string): FunctionInfo {
    return {
      name: name || 'anonymous',
      type: type as any,
      isAsync: node.async || false,
      parameters: this.extractParameters(node.params || []),
      returnType: this.extractReturnType(node),
      body: this.extractBody(node),
      startLine: node.loc?.start?.line || 0,
      endLine: node.loc?.end?.line || 0,
      complexity: this.options.analyzeComplexity ? this.calculateComplexity(node) : 1,
      docstring: this.extractDocstring(node)
    };
  }

  private extractClasses(node: Node, fileNode: CodeMapNode): void {
    const classes: ClassInfo[] = [];

    this.traverse(node, {
      ClassDeclaration: (n: any) => {
        if (n.id && n.id.name) {
          classes.push(this.createClassInfo(n));
        }
      },
      ClassExpression: (n: any) => {
        const name = this.getFunctionName(n);
        if (name) {
          classes.push(this.createClassInfo(n, name));
        }
      }
    });

    fileNode.classes = classes;
  }

  private createClassInfo(node: any, name?: string): ClassInfo {
    const className = name || node.id?.name || 'anonymous';

    return {
      name: className,
      extends: node.superClass?.name,
      implements: node.implements?.map((impl: any) => impl.expression?.name) || [],
      properties: this.extractClassProperties(node.body?.body || []),
      methods: this.extractClassMethods(node.body?.body || []),
      constructor: this.extractConstructor(node.body?.body || []),
      decorators: node.decorators?.map((dec: any) => dec.expression?.name) || [],
      startLine: node.loc?.start?.line || 0,
      endLine: node.loc?.end?.line || 0,
      isReactComponent: this.isReactComponent(className, node)
    };
  }

  private extractInterfaces(node: Node, fileNode: CodeMapNode): void {
    const interfaces: InterfaceInfo[] = [];

    this.traverse(node, {
      TSInterfaceDeclaration: (n: any) => {
        if (n.id && n.id.name) {
          interfaces.push(this.createInterfaceInfo(n));
        }
      }
    });

    fileNode.interfaces = interfaces;
  }

  private createInterfaceInfo(node: any): InterfaceInfo {
    return {
      name: node.id.name,
      extends: node.extends?.map((ext: any) => ext.expression?.name) || [],
      properties: this.extractInterfaceProperties(node.body?.body || []),
      methods: this.extractInterfaceMethods(node.body?.body || []),
      startLine: node.loc?.start?.line || 0,
      endLine: node.loc?.end?.line || 0
    };
  }

  private extractImports(node: Node, fileNode: CodeMapNode): void {
    const imports: ImportInfo[] = [];

    this.traverse(node, {
      ImportDeclaration: (n: any) => {
        const importInfo: ImportInfo = {
          source: n.source?.value || '',
          imports: [],
          isDefault: false,
          isTypeOnly: n.importKind === 'type',
          startLine: n.loc?.start?.line || 0
        };

        n.specifiers?.forEach((spec: any) => {
          if (spec.type === 'ImportDefaultSpecifier') {
            importInfo.imports.push({
              name: spec.local.name,
              isDefault: true,
              isType: false
            });
          } else if (spec.type === 'ImportSpecifier') {
            importInfo.imports.push({
              name: spec.imported?.name || spec.local.name,
              alias: spec.imported?.name !== spec.local.name ? spec.local.name : undefined,
              isDefault: false,
              isType: spec.importKind === 'type'
            });
          }
        });

        imports.push(importInfo);
      }
    });

    fileNode.imports = imports;
  }

  private extractExports(node: Node, fileNode: CodeMapNode): void {
    const exports: ExportInfo[] = [];

    this.traverse(node, {
      ExportDefaultDeclaration: (n: any) => {
        exports.push({
          name: 'default',
          type: 'default',
          isDefault: true,
          isTypeOnly: false,
          startLine: n.loc?.start?.line || 0
        });
      },
      ExportNamedDeclaration: (n: any) => {
        n.specifiers?.forEach((spec: any) => {
          if (spec.type === 'ExportSpecifier') {
            exports.push({
              name: spec.local.name,
              alias: spec.exported?.name !== spec.local.name ? spec.exported.name : undefined,
              type: 'variable',
              isDefault: false,
              isTypeOnly: spec.exportKind === 'type',
              startLine: n.loc?.start?.line || 0
            });
          }
        });
      }
    });

    fileNode.exports = exports;
  }

  private extractVariables(node: Node, fileNode: CodeMapNode): void {
    // Implementation for variable extraction
  }

  private extractReactComponents(node: Node, fileNode: CodeMapNode): void {
    const components: ReactComponentInfo[] = [];

    this.traverse(node, {
      FunctionDeclaration: (n: any) => {
        if (this.isReactFunctionComponent(n)) {
          components.push(this.createReactComponentInfo(n, 'function'));
        }
      },
      FunctionExpression: (n: any) => {
        if (this.isReactFunctionComponent(n)) {
          components.push(this.createReactComponentInfo(n, 'function'));
        }
      },
      ClassDeclaration: (n: any) => {
        if (this.isReactClassComponent(n)) {
          components.push(this.createReactComponentInfo(n, 'class'));
        }
      },
      CallExpression: (n: any) => {
        if (this.isReactForwardRef(n) || this.isReactMemo(n)) {
          components.push(this.createReactComponentInfo(n, n.callee?.name));
        }
      }
    });

    fileNode.reactComponents = components;
  }

  private createReactComponentInfo(node: any, type: string): ReactComponentInfo {
    const name = this.getComponentName(node);
    return {
      name,
      type: type as any,
      props: this.extractComponentProps(node),
      hooks: this.extractUsedHooks(node),
      children: [],
      stateManagement: this.detectStateManagement(node),
      routing: this.detectRouting(node),
      hooksUsage: this.analyzeHookUsage(node),
      startLine: node.loc?.start?.line || 0,
      endLine: node.loc?.end?.line || 0
    };
  }

  private extractCustomHooks(node: Node, fileNode: CodeMapNode): void {
    const hooks: CustomHookInfo[] = [];

    this.traverse(node, {
      FunctionDeclaration: (n: any) => {
        if (this.isCustomHook(n)) {
          hooks.push(this.createCustomHookInfo(n));
        }
      }
    });

    fileNode.customHooks = hooks;
  }

  private createCustomHookInfo(node: any): CustomHookInfo {
    return {
      name: node.id.name,
      parameters: this.extractParameters(node.params || []),
      returnType: this.extractReturnType(node),
      hooks: this.extractUsedHooks(node),
      stateManagement: this.usesStateManagement(node),
      sideEffects: this.hasSideEffects(node),
      startLine: node.loc?.start?.line || 0,
      endLine: node.loc?.end?.line || 0
    };
  }

  private extractAPIEndpoints(node: Node, fileNode: CodeMapNode): void {
    const endpoints: APIEndpointInfo[] = [];

    this.traverse(node, {
      CallExpression: (n: any) => {
        if (this.isAPIEndpoint(n)) {
          endpoints.push(this.createAPIEndpointInfo(n));
        }
      }
    });

    fileNode.apiEndpoints = endpoints;
  }

  private createAPIEndpointInfo(node: any): APIEndpointInfo {
    // Implementation for API endpoint extraction
    return {
      method: 'GET',
      path: '',
      handler: '',
      parameters: [],
      startLine: node.loc?.start?.line || 0
    };
  }

  private extractDependencies(node: Node, fileNode: CodeMapNode): void {
    const dependencies: string[] = [];

    fileNode.imports.forEach(importInfo => {
      if (!importInfo.source.startsWith('.') && !importInfo.source.startsWith('/')) {
        dependencies.push(importInfo.source);
      }
    });

    fileNode.dependencies = [...new Set(dependencies)];
  }

  private traverse(node: Node, visitors: Record<string, (node: any) => void>): void {
    // Simple traversal implementation
    const visit = (n: any) => {
      if (!n) return;

      const visitor = visitors[n.type];
      if (visitor) {
        visitor(n);
      }

      // Visit child nodes
      for (const key in n) {
        if (key === 'parent' || key === 'type') continue;

        const child = n[key];
        if (Array.isArray(child)) {
          child.forEach(visit);
        } else if (child && typeof child === 'object') {
          visit(child);
        }
      }
    };

    visit(node);
  }

  private generateNodeId(filePath: string): string {
    return filePath.replace(/[\/\\]/g, '_').replace(/\./g, '_');
  }

  private calculateMetrics(content: string, node: Node): FileMetrics {
    const lines = content.split('\n');
    const linesOfCode = lines.length;
    const commentLines = this.countCommentLines(content);
    const emptyLines = lines.filter(line => line.trim() === '').length;
    const complexity = this.options.analyzeComplexity ? this.calculateComplexity(node) : 1;

    return {
      linesOfCode,
      commentLines,
      emptyLines,
      complexity,
      maintainabilityIndex: this.calculateMaintainabilityIndex(linesOfCode, complexity),
      technicalDebt: this.calculateTechnicalDebt(linesOfCode, complexity)
    };
  }

  private countCommentLines(content: string): number {
    const singleLineComments = content.match(/\/\/.*$/gm) || [];
    const multiLineComments = content.match(/\/\*[\s\S]*?\*\//gm) || [];

    return singleLineComments.length + multiLineComments.length;
  }

  private calculateComplexity(node: any): number {
    // Simplified cyclomatic complexity calculation
    let complexity = 1;

    this.traverse(node, {
      IfStatement: () => complexity++,
      SwitchCase: () => complexity++,
      LogicalExpression: (n: any) => {
        if (n.operator === '&&' || n.operator === '||') complexity++;
      },
      ForStatement: () => complexity++,
      WhileStatement: () => complexity++,
      DoWhileStatement: () => complexity++,
      ForInStatement: () => complexity++,
      ForOfStatement: () => complexity++,
      CatchClause: () => complexity++
    });

    return complexity;
  }

  private calculateMaintainabilityIndex(linesOfCode: number, complexity: number): number {
    // Simplified maintainability index calculation
    const volume = linesOfCode * Math.log2(linesOfCode);
    const difficulty = complexity / 2;
    return Math.max(0, 171 - 5.2 * Math.log(volume) - 0.23 * complexity - 16.2 * Math.log(difficulty));
  }

  private calculateTechnicalDebt(linesOfCode: number, complexity: number): number {
    // Simplified technical debt calculation
    return Math.max(0, complexity - 10) * 60; // Minutes of debt
  }

  // Helper methods
  private getFunctionName(node: any): string | undefined {
    // Extract function name from different contexts
    if (node.id && node.id.name) {
      return node.id.name;
    }

    // For arrow functions and function expressions assigned to variables
    if (node.parent) {
      const parent = node.parent;

      // Variable declaration: const myFunc = () => {}
      if (parent.type === 'VariableDeclarator' && parent.id && parent.id.name) {
        return parent.id.name;
      }

      // Assignment: obj.myMethod = function() {}
      if (parent.type === 'AssignmentExpression' && parent.left) {
        if (parent.left.type === 'Identifier') {
          return parent.left.name;
        }
        if (parent.left.type === 'MemberExpression' && parent.left.property) {
          return parent.left.property.name;
        }
      }

      // Object property: { myMethod: function() {} }
      if (parent.type === 'Property' && parent.key) {
        if (parent.key.name) {
          return parent.key.name;
        }
        if (parent.key.value) {
          return parent.key.value;
        }
      }

      // Array element: [function() {}]
      if (parent.type === 'ArrayExpression') {
        const index = parent.elements.indexOf(node);
        return `[${index}]`;
      }
    }

    // For methods in object literals
    if (node.key && node.key.name) {
      return node.key.name;
    }

    // For exported functions: export function myFunc() {}
    if (node.type === 'ExportNamedDeclaration' && node.declaration) {
      if (node.declaration.id && node.declaration.id.name) {
        return node.declaration.id.name;
      }
    }

    return undefined;
  }

  private extractParameters(params: any[]): ParameterInfo[] {
    return params.map((param: any) => ({
      name: param.name || param.left?.name || 'param',
      type: param.typeAnnotation?.typeAnnotation?.type,
      isOptional: param.optional || false,
      defaultValue: param.value?.value,
      isRest: param.type === 'RestElement'
    }));
  }

  private extractReturnType(node: any): string | undefined {
    return node.returnType?.typeAnnotation?.type;
  }

  private extractBody(node: any): string {
    return node.body?.body?.slice(0, 100) + '...';
  }

  private extractDocstring(node: any): string | undefined {
    // Implementation to extract JSDoc comments
    return undefined;
  }

  private extractClassProperties(body: any[]): PropertyInfo[] {
    return body
      .filter((member: any) => member.type === 'ClassProperty')
      .map((prop: any) => ({
        name: prop.key?.name,
        type: prop.typeAnnotation?.typeAnnotation?.type,
        isOptional: prop.optional || false,
        isReadonly: prop.readonly || false,
        visibility: prop.accessibility,
        defaultValue: prop.value?.value,
        startLine: prop.loc?.start?.line || 0
      }));
  }

  private extractClassMethods(body: any[]): FunctionInfo[] {
    return body
      .filter((member: any) => member.type === 'MethodDefinition')
      .map((method: any) => this.createFunctionInfo(method.value, 'method', method.key?.name));
  }

  private extractConstructor(body: any[]): FunctionInfo | undefined {
    const constructor = body.find((member: any) => member.type === 'MethodDefinition' && member.kind === 'constructor');
    if (constructor) {
      return this.createFunctionInfo(constructor.value, 'constructor', 'constructor');
    }
    return undefined;
  }

  private extractInterfaceProperties(body: any[]): PropertyInfo[] {
    return body
      .filter((member: any) => member.type === 'TSPropertySignature')
      .map((prop: any) => ({
        name: prop.key?.name,
        type: prop.typeAnnotation?.typeAnnotation?.type,
        isOptional: prop.optional || false,
        isReadonly: prop.readonly || false,
        startLine: prop.loc?.start?.line || 0
      }));
  }

  private extractInterfaceMethods(body: any[]): FunctionInfo[] {
    return body
      .filter((member: any) => member.type === 'TSMethodSignature')
      .map((method: any) => ({
        name: method.key?.name,
        type: 'method',
        isAsync: false,
        parameters: this.extractParameters(method.parameters || []),
        returnType: method.returnType?.type,
        body: '',
        startLine: method.loc?.start?.line || 0,
        endLine: method.loc?.end?.line || 0,
        complexity: 1
      }));
  }

  private extractComponentProps(node: any): PropertyInfo[] {
    // Implementation to extract React component props
    return [];
  }

  private extractUsedHooks(node: any): string[] {
    const hooks: string[] = [];

    this.traverse(node, {
      CallExpression: (n: any) => {
        if (n.callee?.type === 'Identifier' && n.callee?.name?.startsWith('use')) {
          hooks.push(n.callee.name);
        }
      }
    });

    return [...new Set(hooks)];
  }

  private analyzeHookUsage(node: any): HookUsageInfo[] {
    const hooks = this.extractUsedHooks(node);
    const usage: HookUsageInfo[] = [];

    hooks.forEach(hook => {
      usage.push({
        hook,
        count: 0,
        lines: []
      });
    });

    return usage;
  }

  private detectStateManagement(node: any): string | undefined {
    // Implementation to detect state management patterns
    return undefined;
  }

  private detectRouting(node: any): boolean {
    // Implementation to detect routing usage
    return false;
  }

  private isReactFunctionComponent(node: any): boolean {
    // Check if function returns JSX
    return false;
  }

  private isReactClassComponent(node: any): boolean {
    // Check if class extends React.Component or has render method
    return false;
  }

  private isReactForwardRef(node: any): boolean {
    return node.callee?.name === 'forwardRef';
  }

  private isReactMemo(node: any): boolean {
    return node.callee?.name === 'memo';
  }

  private isCustomHook(node: any): boolean {
    return node.id?.name?.startsWith('use') &&
           node.id?.name.length > 3 &&
           node.id?.name[2].toUpperCase() === node.id?.name[2];
  }

  private getComponentName(node: any): string {
    if (node.id?.name) return node.id.name;
    if (node.callee?.object?.name && node.callee?.property?.name) {
      return node.callee.object.name;
    }
    return 'Component';
  }

  private usesStateManagement(node: any): boolean {
    // Check if hook uses useState, useReducer, etc.
    return false;
  }

  private hasSideEffects(node: any): boolean {
    // Check if function has side effects
    return false;
  }

  private isAPIEndpoint(node: any): boolean {
    // Check if call represents an API endpoint
    return false;
  }

  private isReactComponent(className: string, node: any): boolean {
    // Check if class is a React component
    return className.includes('Component') ||
           className.includes('Page') ||
           this.hasRenderMethod(node);
  }

  private hasRenderMethod(node: any): boolean {
    // Check if class has render method
    return false;
  }
}