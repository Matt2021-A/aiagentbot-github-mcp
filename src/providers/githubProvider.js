import { Octokit } from '@octokit/rest';
import { config } from '../config.js';

function createClient() {
  return new Octokit({ auth: config.githubToken });
}

function cleanRepo(repo) {
  return repo.replace(/^\/+|\/+$/g, '');
}

export function createGitHubProvider() {
  const octokit = createClient();

  return {
    name: 'github',

    async getRepo(repo) {
      const { data } = await octokit.repos.get({
        owner: config.allowedOwner,
        repo: cleanRepo(repo)
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
      const details = await this.getRepo(repo);
      const { data } = await octokit.repos.getBranch({
        owner: config.allowedOwner,
        repo: cleanRepo(repo),
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
      await octokit.git.createRef({
        owner: config.allowedOwner,
        repo: cleanRepo(repo),
        ref: `refs/heads/${branch}`,
        sha: baseSha
      });

      return { repo: cleanRepo(repo), branch, baseSha };
    },

    async createOrUpdateFile(repo, branch, path, content, message) {
      let existingSha;

      try {
        const { data } = await octokit.repos.getContent({
          owner: config.allowedOwner,
          repo: cleanRepo(repo),
          path,
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
        repo: cleanRepo(repo),
        path,
        message: message || `Update ${path}`,
        content: Buffer.from(content, 'utf8').toString('base64'),
        branch,
        sha: existingSha
      });

      return {
        repo: cleanRepo(repo),
        branch,
        path,
        commitSha: data.commit.sha,
        contentSha: data.content?.sha,
        action: existingSha ? 'updated' : 'created'
      };
    },

    async openPr(repo, head, base, title, body) {
      const { data } = await octokit.pulls.create({
        owner: config.allowedOwner,
        repo: cleanRepo(repo),
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
      const { data } = await octokit.pulls.merge({
        owner: config.allowedOwner,
        repo: cleanRepo(repo),
        pull_number: pullNumber,
        merge_method: 'squash'
      });

      return data;
    }
  };
}
