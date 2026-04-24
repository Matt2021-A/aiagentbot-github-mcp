# aiagentbot-github-mcp

Provider-neutral GitHub MCP service scaffold for Claude-first remote connector use.

This repo mirrors the Yahoo MCP architecture, but targets GitHub operations instead of mail. The practical goal is simple: let Claude use GitHub through a custom MCP surface with the same basic operator flow ChatGPT already has in this workspace.

## Current status

This is an active starter implementation, not a finished production service yet.

What is already in the repo:

- app entrypoint
- config loader
- provider abstraction
- mock GitHub provider for local development
- real GitHub provider using the GitHub REST API
- MCP server scaffold with write-path tools
- app Dockerfile
- local compose file
- public compose file
- Caddyfile scaffold
- custom Caddy build scaffold with Cloudflare DNS plugin
- env template and ignore files
- published Docker image

Published image:

```text
iwashuman2021/mcp:github-mcp-latest
```

Verified pull:

```bash
docker pull iwashuman2021/mcp:github-mcp-latest
```

What still needs hands-on work:

- validate the full MCP tool flow from Claude
- confirm the final public hostname
- create or confirm the Cloudflare DNS token
- test public alternate-port HTTPS
- add the final connector in Claude
- harden branch/PR safety behavior after first live test

## Architecture

```text
Claude
  |
  | HTTPS to public hostname on alternate port
  | Example: https://githubmcp.example.com:8444
  v
Public DNS record
  |
  | points to home public IP
  v
Home router
  |
  | forwards chosen external port to Docker host
  v
Ubuntu machine running Docker
  |
  +------------------------------------------------+
  | Docker host                                    |
  |                                                |
  |  +------------------------------------------+  |
  |  | Caddy HTTPS front end                    |  |
  |  |                                          |  |
  |  | - listens on alternate HTTPS port        |  |
  |  | - gets certificate with DNS-01           |  |
  |  | - reverse proxies to app container       |  |
  |  +-------------------+----------------------+  |
  |                      |                         |
  |                      v                         |
  |  +------------------------------------------+  |
  |  | GitHub MCP app container                 |  |
  |  |                                          |  |
  |  | - Node runtime                           |  |
  |  | - official MCP TypeScript SDK            |  |
  |  | - Streamable HTTP                        |  |
  |  | - provider abstraction                    |  |
  |  | - tools: repo, branch, file, PR, merge   |  |
  |  +-------------------+----------------------+  |
  +----------------------|-------------------------+
                         |
                         | outbound authenticated API traffic
                         v
                   GitHub REST API
```

## Tool surface

The scaffold registers these MCP tools:

1. `get_repo` -- fetch repository details
2. `create_branch` -- create a branch from the default branch
3. `create_file` -- create or update a file on a branch
4. `open_pr` -- open a pull request
5. `merge_pr` -- squash merge a pull request

The intended Claude flow is:

```text
get_repo
create_branch
create_file
open_pr
merge_pr
```

## Repo layout

```text
.
├── .env.example
├── Caddyfile
├── Dockerfile
├── README.md
├── compose.public.yaml
├── compose.yaml
├── docker/
│   └── caddy/
│       └── Dockerfile
├── index.js
├── package.json
└── src/
    ├── config.js
    ├── github.js
    ├── providers/
    │   ├── githubProvider.js
    │   ├── index.js
    │   └── mockProvider.js
    └── server.js
```

## Provider model

This service follows the same provider pattern as the Yahoo MCP repo.

- `mock` mode is for local development and contract testing. It should not make live GitHub API calls.
- `github` mode uses a GitHub token and talks to the real GitHub REST API.

Environment control:

```env
GITHUB_MODE=mock
```

or:

```env
GITHUB_MODE=github
GITHUB_TOKEN=replace_with_real_github_pat
```

The intended GitHub actor for Claude is:

```env
GITHUB_ACTOR=ClaudeBot-MattR
```

## Environment variables

Create a local `.env` file based on `.env.example`.

Expected values:

```env
GITHUB_MODE=mock
GITHUB_TOKEN=mock_token_not_used
GITHUB_ALLOWED_OWNER=Matt2021-A
GITHUB_ACTOR=ClaudeBot-MattR
PORT=3000
HOST_PORT=3001
HOSTNAME=githubmcp.techthatmattrs.net
PUBLIC_HTTPS_PORT=8444
ACME_EMAIL=you@example.com
CF_API_TOKEN=replace_me_only_for_public_stack
```

Important:

- do not commit `.env`
- do not paste tokens into GitHub issues, PRs, Asana, or chat logs
- use mock mode for local smoke testing
- switch to GitHub mode only when the ClaudeBot-MattR token is ready
- `CF_API_TOKEN` is only required for the public stack

## Compose file split

This repo has two run modes on purpose.

### `compose.yaml`

Local development only.

Use this when you want:

- the app container only
- no Caddy
- no Cloudflare token
- no DNS-01 certificate flow
- a simple local health check

Local host port can be controlled with:

```env
HOST_PORT=3001
```

Then test:

```bash
curl http://localhost:3001/health
```

### `compose.public.yaml`

Public-stack mode.

Use this when you want:

- the app container
- the Caddy HTTPS front end
- Cloudflare DNS challenge
- alternate-port public HTTPS

This project uses alternate-port HTTPS because ports 80 and 443 are unavailable.

Default public port:

```text
8444
```

## Docker image workflow

Build locally:

```bash
docker build -t iwashuman2021/mcp:github-mcp-latest .
```

Tag a version:

```bash
docker tag iwashuman2021/mcp:github-mcp-latest iwashuman2021/mcp:github-mcp-0.1.0
```

Push:

```bash
docker push iwashuman2021/mcp:github-mcp-latest
docker push iwashuman2021/mcp:github-mcp-0.1.0
```

Verify pull:

```bash
docker pull iwashuman2021/mcp:github-mcp-latest
```

Shared Docker Hub naming pattern:

```text
iwashuman2021/mcp:yahoo-mcp-latest
iwashuman2021/mcp:yahoo-mcp-0.1.0
iwashuman2021/mcp:github-mcp-latest
iwashuman2021/mcp:github-mcp-0.1.0
```

## Local development steps

### 1. Clone the repo

```bash
git clone https://github.com/Matt2021-A/aiagentbot-github-mcp.git
cd aiagentbot-github-mcp
git checkout align-yahoo-architecture-20260423
```

### 2. Create `.env`

Copy `.env.example` to `.env` and adjust values.

For local boot only, mock mode is enough.

### 3. Install Node dependencies locally

```bash
npm install
```

### 4. Start directly for the fastest smoke test

```bash
npm start
```

Then test:

```bash
curl http://localhost:3000/health
```

### 5. Start the local Docker stack

```bash
docker compose up --build
```

Then test:

```bash
curl http://localhost:${HOST_PORT:-3000}/health
```

## Public alternate-port deployment steps

### 1. Pick the final hostname

Example:

```text
githubmcp.techthatmattrs.net
```

### 2. Point DNS to the home public IP

Create the DNS record for the hostname in Cloudflare or the chosen DNS provider.

### 3. Create the Cloudflare API token

Recommended minimum permissions for the zone used by this service:

- Zone.Zone:Read
- Zone.DNS:Edit

Store it securely and put the actual value only in `.env`.

### 4. Confirm router forwarding

Forward the chosen public port, likely `8444`, to the Docker host machine.

### 5. Start the public stack

```bash
docker compose -f compose.public.yaml up -d --build
```

### 6. Watch for certificate issuance

Caddy should use DNS-01 to obtain the certificate.

### 7. Test from outside the house

Use mobile data or another external network and test:

```text
https://githubmcp.techthatmattrs.net:8444/health
```

You want:

- valid HTTPS
- no certificate warning
- healthy JSON response

## Claude connector path

Once public HTTPS works:

1. add the final public connector URL in Claude
2. start a fresh Claude session
3. confirm the five tools appear
4. validate in this order:
   - `get_repo`
   - `create_branch`
   - `create_file`
   - `open_pr`
   - `merge_pr`

## Safety notes

A few honest truths:

- the current branch flow assumes branch names are unique
- duplicate PR detection is not implemented yet
- repo access is currently scoped by `GITHUB_ALLOWED_OWNER`
- direct writes to `main` should be avoided by workflow, even if the token technically allows them
- future hardening should require a safe branch prefix such as `claude/`

## What I would do next

1. validate local Docker health in mock mode
2. switch to GitHub mode with the ClaudeBot-MattR token
3. run one harmless branch/file/PR test against a repo designed for validation
4. confirm GitHub-side attribution
5. only then move to public alternate-port HTTPS and Claude connector validation

That is the shape of the work now. The service has moved from empty shell to real GitHub operator lane scaffold.
