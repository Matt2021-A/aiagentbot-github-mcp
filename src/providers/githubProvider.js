import { Octokit } from '@octokit/rest';
import { config } from '../config.js';

const blockedPathPrefixes = ['.github/workflows/', '.env', 'certs/', '.caddy/'];

function createClient() {
  return new Octokit({ auth: config.githubToken });
}

function cleanRepo(repo) {
  return repo.replace(/^\/+|\/+$/g, '');
}

function assertRepoAllowed(repo) {
  const clean = cleanRepo(repo);

  if (!config.allowedRepos.includes(clean)) {
    throw new Error('Repository is not allowlisted.');
  }

  return clean;
}

function assertSafePath(path) {
  const normalized = path.replace(/^\/+/, '');

  if (normalized.includes('..') || blockedPathPrefixes.some(prefix => normalized.startsWith(prefix))) {
    throw new Error('Path is not allowed for automated writes.');
  }

  return normalized;
}

export function createGitHubProvider() {
  const octokit = createClient();

  return {
    name: 'github',

    async getRepo(repo) {
      const safeRepo = assertRepoAllowed(repo);
      const { data } = await octokit.repos.get({
        owner: config.allowedOwner,
        repo: safeRepo
      });

      return {
        owner: config.allowedOwner,
        repo: data.name,
        fullName: data.full_name,
        defaultBranch: data.default_branch,
        private: data.private,
        permissions: data.permissions
      };
    },

    async getDefaultBranch(repo) {
      const safeRepo = assertRepoAllowed(repo);
      const details = await this.getRepo(safeRepo);
      const { data } = await octokit.repos.getBranch({
        owner: config.allowedOwner,
        repo: safeRepo,
        branch: details.defaultBranch
      });

      return {
        repo: details.repo,
        branch: details.defaultBranch,
        sha: data.commit.sha,
        protected: data.protected
      };
    },

    async createBranch(repo, branch, baseSha) {
      const safeRepo = assertRepoAllowed(repo);
      await octokit.git.createRef({
        owner: config.allowedOwner,
        repo: safeRepo,
        ref: `refs/heads/${branch}`,
        sha: baseSha
      });

      return { repo: safeRepo, branch, baseSha };
    },

    async createOrUpdateFile(repo, branch, path, content, message) {
      const safeRepo = assertRepoAllowed(repo);
      const safePath = assertSafePath(path);
      let existingSha;

      try {
        const { data } = await octokit.repos.getContent({
          owner: config.allowedOwner,
          repo: safeRepo,
          path: safePath,
          ref: branch
        });

        if (!Array.isArray(data)) {
          existingSha = data.sha;
        }
      } catch (error) {
        if (error.status !== 404) {
          throw error;
        }
      }

      const { data } = await octokit.repos.createOrUpdateFileContents({
        owner: config.allowedOwner,
        repo: safeRepo,
        path: safePath,
        message: message || `Update ${safePath}`,
        content: Buffer.from(content, 'utf8').toString('base64'),
        branch,
        sha: existingSha
      });

      return {
        repo: safeRepo,
        branch,
        path: safePath,
        commitSha: data.commit.sha,
        contentSha: data.content?.sha,
        action: existingSha ? 'updated' : 'created'
      };
    },

    async openPr(repo, head, base, title, body) {
      const safeRepo = assertRepoAllowed(repo);
      const { data } = await octokit.pulls.create({
        owner: config.allowedOwner,
        repo: safeRepo,
        head,
        base,
        title,
        body
      });

      return {
        number: data.number,
        title: data.title,
        state: data.state,
        htmlUrl: data.html_url,
        head: data.head.ref,
        base: data.base.ref
      };
    },

    async mergePr(repo, pullNumber) {
      const safeRepo = assertRepoAllowed(repo);
      const { data } = await octokit.pulls.merge({
        owner: config.allowedOwner,
        repo: safeRepo,
        pull_number: pullNumber,
        merge_method: 'squash'
      });

      return data;
    }
  };
}
