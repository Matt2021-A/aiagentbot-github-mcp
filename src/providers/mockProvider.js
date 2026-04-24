export function createMockGitHubProvider() {
  return {
    name: 'mock',

    async getRepo(repo) {
      return {
        repo,
        fullName: `mock/${repo}`,
        defaultBranch: 'main',
        private: false
      };
    }
  };
}
