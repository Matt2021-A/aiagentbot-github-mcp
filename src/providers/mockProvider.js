export function createMockGitHubProvider() {
  return {
    name: 'mock',

    async getRepo(repo) {
      return {
        repo,
        fullName: `mock/${repo}`,
        defaultBranch: 'main',
        private: false,
        permissions: {
          pull: true,
          push: false,
          admin: false
        }
      };
    },

    async getDefaultBranch(repo) {
      return {
        repo,
        branch: 'main',
        sha: 'mock-main-sha',
        protected: true
      };
    },

    async createBranch(repo, branch, baseSha) {
      return {
        repo,
        branch,
        baseSha,
        mocked: true
      };
    },

    async createOrUpdateFile(repo, branch, path, _content, message) {
      return {
        repo,
        branch,
        path,
        commitSha: 'mock-file-commit-sha',
        contentSha: 'mock-content-sha',
        action: 'mocked',
        message: message || `Update ${path}`
      };
    },

    async openPr(repo, head, base, title, body) {
      return {
        number: 1,
        title,
        state: 'open',
        htmlUrl: `https://example.invalid/mock/${repo}/pull/1`,
        head,
        base,
        body,
        mocked: true
      };
    },

    async mergePr(repo, pullNumber) {
      return {
        repo,
        pullNumber,
        merged: true,
        sha: 'mock-merge-sha',
        message: 'Mock merge completed'
      };
    }
  };
}
