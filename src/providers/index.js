import { config } from '../config.js';
import { createMockGitHubProvider } from './mockProvider.js';
import { createGitHubProvider } from './githubProvider.js';

export function createGitHubProviderSelector() {
  if (config.githubMode === 'mock') {
    return createMockGitHubProvider();
  }

  return createGitHubProvider();
}
