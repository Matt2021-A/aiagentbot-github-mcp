import dotenv from 'dotenv';
import * as z from 'zod/v4';

dotenv.config();

const envSchema = z.object({
  GITHUB_MODE: z.enum(['mock', 'github']).default('mock'),
  GITHUB_TOKEN: z.string().min(1).optional(),
  GITHUB_ALLOWED_OWNER: z.string().min(1).default('Matt2021-A'),
  GITHUB_ACTOR: z.string().min(1).default('ClaudeBot-MattR'),
  PORT: z.coerce.number().default(3000),
  HOSTNAME: z.string().min(1),
  PUBLIC_HTTPS_PORT: z.coerce.number().default(8444),
  ACME_EMAIL: z.string().email().optional()
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join('; ');
  throw new Error(`[config] Invalid environment configuration: ${details}`);
}

if (parsed.data.GITHUB_MODE === 'github' && !parsed.data.GITHUB_TOKEN) {
  throw new Error('[config] GITHUB_MODE=github requires: GITHUB_TOKEN');
}

export const config = {
  githubMode: parsed.data.GITHUB_MODE,
  githubToken: parsed.data.GITHUB_TOKEN ?? '',
  allowedOwner: parsed.data.GITHUB_ALLOWED_OWNER,
  githubActor: parsed.data.GITHUB_ACTOR,
  port: parsed.data.PORT,
  hostname: parsed.data.HOSTNAME,
  publicHttpsPort: parsed.data.PUBLIC_HTTPS_PORT,
  acmeEmail: parsed.data.ACME_EMAIL
};
