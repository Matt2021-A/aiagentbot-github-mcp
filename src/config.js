import dotenv from 'dotenv';
import * as z from 'zod/v4';

dotenv.config();

const envSchema = z.object({
  GITHUB_TOKEN: z.string().min(1),
  GITHUB_ALLOWED_OWNER: z.string().min(1).default('Matt2021-A'),
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

export const config = {
  githubToken: parsed.data.GITHUB_TOKEN,
  allowedOwner: parsed.data.GITHUB_ALLOWED_OWNER,
  port: parsed.data.PORT,
  hostname: parsed.data.HOSTNAME,
  publicHttpsPort: parsed.data.PUBLIC_HTTPS_PORT,
  acmeEmail: parsed.data.ACME_EMAIL
};
