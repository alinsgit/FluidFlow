export { ASTParser } from './ASTParser';
export { CodeCollector } from './CodeCollector';
export * from './types';

import { CodeCollector } from './CodeCollector';

// Main API
export async function generateCodeMap(options = {}) {
  const collector = new CodeCollector(options);
  return await collector.collectCode();
}

export async function analyzeProject(projectPath?: string) {
  const collector = new CodeCollector();
  return await collector.collectCode(projectPath);
}