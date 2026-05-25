# aiagentbot-github-mcp

Provider-neutral GitHub MCP service scaffold for remote connector use.

The practical goal is simple: let an approved MCP client use GitHub through a custom tool surface with a constrained operator flow. Under the current design, this repo is the backend app that sits behind a shared HTTPS edge on ports 80 and 443, alongside the Yahoo MCP and future services.

## Current status

This is an active backend implementation, not a finished production service yet.

What is already in the repo:

- app entrypoint
- config loader
- provider abstraction
- mock GitHub provider for local development
- real GitHub provider using the GitHub REST API
- MCP server scaffold with write-path tools
- bearer-token gate in front of `/mcp`
- repo allowlist for live GitHub operations
- branch-prefix validation for generated branches
- basic blocked-path checks for automated file writes
- merge tool disabled by default
- app Dockerfile
- local compose file
- published Docker image

What still needs hands-on work:

- validate the full MCP tool flow through the shared 443 edge
- confirm live-token behavior under the backend-only model
- run dependency and repo-history scanning locally
- add `.dockerignore` to keep local-only files out of image build context
- align final deployment workflow with the shared infra stack

## Architecture

This repo is now a backend service, not a standalone public edge.

In plain English:

- clients connect over HTTPS on standard port 443
- public DNS subdomains point to the deployment edge
- one shared Caddy edge routes by hostname
- GitHub MCP runs as a backend container on port 3000
- Yahoo MCP and future services follow the same model

The current shared-edge source of truth lives in the `mcp-infra/` directory of the Yahoo MCP repo until a dedicated infra repo exists.

## Auth posture in the shared platform

The shared edge does not force every backend into the same auth style.

- GitHub MCP continues to use token-based GitHub API access
- Yahoo MCP is expected to move toward Yahoo developer access and OAuth as its preferred long-term live-auth path
- live use should include a private MCP bearer token configured outside the repo

That difference is intentional. The services share one front door, but each backend can keep the auth model that best fits its provider.

## Tool surface

The scaffold registers these MCP tools by default:

1. `get_repo`
2. `create_branch`
3. `create_file`
4. `open_pr`

`merge_pr` is available only when `ENABLE_MERGE_TOOL=true`.

## Published image

Published image:

```text
iwashuman2021/mcp:github-mcp-latest
```

Verify pull:

```bash
docker pull iwashuman2021/mcp:github-mcp-latest
```

## Environment example

```env
GITHUB_MODE=mock
GITHUB_TOKEN=set_when_live_mode_is_ready
GITHUB_ALLOWED_OWNER=example-owner
GITHUB_ALLOWED_REPOS=example-repo
GITHUB_ACTOR=automation-bot
ENABLE_MERGE_TOOL=false
MCP_BEARER_TOKEN=replace_with_a_private_local_value
PORT=3000
HOST_PORT=3002
HOSTNAME=github-mcp.example.com
PUBLIC_HTTPS_PORT=443
```

## Local development

Run locally with Docker:

```bash
docker compose up --build
```

Then test:

```bash
curl http://localhost:3002/health
```

Or run directly:

```bash
npm install
npm start
curl http://localhost:3000/health
```

## Operational notes

- This repo should be treated as a backend app repo, not as its own public TLS edge.
- Health checks intentionally avoid returning the configured actor, owner, hostname, or public port details.
- Direct writes to `main` should be avoided by workflow, even if the token technically allows them.
- Live mode should use a fine-grained GitHub token scoped only to the intended repository or repositories.

## What I would do next

1. add `.dockerignore` in a follow-up patch if the connector write path allows it
2. run local dependency and repo-history scanning
3. validate `initialize`, `tools/list`, and the write-path tool flow through the shared hostname
4. move from mock mode to live GitHub mode with the intended token and safety controls
