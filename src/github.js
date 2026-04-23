import { Octokit } from '@octokit/rest';
import { config } from './config.js';

const octokit = new Octokit({ auth: config.githubToken });

export async function getRepo(owner, repo) {
  const { data } = await octokit.repos.get({ owner, repo });
  return data;
}

export async function createBranch(owner, repo, branch, baseSha) {
  await octokit.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${branch}`,
    sha: baseSha
  });
  return { branch };
}

export async function createFile(owner, repo, path, content, branch) {
  const { data: refData } = await octokit.git.getRef({ owner, repo, ref: `heads/${branch}` });
  const baseSha = refData.object.sha;

  const { data: commitData } = await octokit.git.createCommit({
    owner,
    repo,
    message: `Add ${path}`,
    tree: baseSha,
    parents: [baseSha]
  });

  return commitData;
}

export async function openPr(owner, repo, head, base, title, body) {
  const { data } = await octokit.pulls.create({ owner, repo, head, base, title, body });
  return data;
}

export async function mergePr(owner, repo, pull_number) {
  const { data } = await octokit.pulls.merge({ owner, repo, pull_number, merge_method: 'squash' });
  return data;
}
