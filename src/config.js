import dotenv from 'dotenv';
import * as z from 'zod/v4';

dotenv.config();

const envSchema = z.object({
  GITHUB_MODE: z.enum(['mock', 'github']).default('mock'),
  GITHUB_TOKEN: z.string().min(1).optional(),
  GITHUB_ALLOWED_OWNER: z.string().min(1),
  GITHUB_ALLOWED_REPOS: z.string().min(1).default('example-repo'),
  GITHUB_ACTOR: z.string().min(1).default('automation-bot'),
  ENABLE_MERGE_TOOL: z.enum(['true', 'false']).default('false'),
  MCP_BEARER_TOKEN: z.string().min(32).optional(),
  PORT: z.coerce.number().default(3000),
  HOSTNAME: z.string().min(1),
  PUBLIC_HTTPS_PORT: z.coerce.number().default(443)
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join('; ');
  throw new Error(`[config] Invalid environment configuration: ${details}`);
}

if (parsed.data.GITHUB_MODE === 'github') {
  const missing = [];

  if (!parsed.data.GITHUB_TOKEN) {
    missing.push('GITHUB_TOKEN');
  }

  if (!parsed.data.MCP_BEARER_TOKEN) {
    missing.push('MCP_BEARER_TOKEN');
  }

  if (missing.length > 0) {
    throw new Error(`[config] GITHUB_MODE=github requires: ${missing.join(', ')}`);
  }
}

export const config = {
  githubMode: parsed.data.GITHUB_MODE,
  githubToken: parsed.data.GITHUB_TOKEN ?? '',
  allowedOwner: parsed.data.GITHUB_ALLOWED_OWNER,
  allowedRepos: parsed.data.GITHUB_ALLOWED_REPOS.split(',').map(repo => repo.trim()).filter(Boolean),
  githubActor: parsed.data.GITHUB_ACTOR,
  enableMergeTool: parsed.data.ENABLE_MERGE_TOOL === 'true',
  mcpBearerToken: parsed.data.MCP_BEARER_TOKEN ?? '',
  port: parsed.data.PORT,
  hostname: parsed.data.HOSTNAME,
  publicHttpsPort: parsed.data.PUBLIC_HTTPS_PORT
};
