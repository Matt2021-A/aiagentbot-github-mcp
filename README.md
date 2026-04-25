# aiagentbot-github-mcp

Provider-neutral GitHub MCP service scaffold.

This repo now tracks the GitHub MCP as a backend application that is intended to sit behind a shared HTTPS edge on ports 80 and 443, alongside the Yahoo MCP and future services.

## Current status

This is an active backend implementation, not a finished production service yet.

What is already in the repo:

- app entrypoint
- config loader
- provider abstraction
- mock GitHub provider for local development
- real GitHub provider using the GitHub REST API
- MCP server scaffold with write-path tools
- app Dockerfile
- local compose file
- published Docker image

What still needs hands-on work:

- validate the full MCP tool flow through the shared 443 edge
- confirm live-token behavior under the backend-only model
- harden branch and PR safety behavior after first live test
- align final deployment workflow with the shared infra stack

## Architecture

This repo is now a backend service, not a standalone public edge.

In plain English:

- clients connect over HTTPS on standard port 443
- public DNS subdomains point to the home public IP
- the router forwards 80 and 443 to the Windows 11 Docker host
- one shared Caddy edge routes by hostname
- GitHub MCP runs as a backend container on port 3000
- Yahoo MCP and future services follow the same model

The current shared-edge source of truth lives in the `mcp-infra/` directory of the Yahoo MCP repo until a dedicated infra repo exists.

## Tool surface

The scaffold registers these MCP tools:

1. `get_repo`
2. `create_branch`
3. `create_file`
4. `open_pr`
5. `merge_pr`

## Published image

Published image:

```text
iwashuman2021/mcp:github-mcp-latest
```

Verify pull:

```bash
docker pull iwashuman2021/mcp:github-mcp-latest
```

## Repo layout

```text
.
├── .env.example
├── Dockerfile
├── README.md
├── compose.yaml
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

## Environment example

```env
GITHUB_MODE=mock
GITHUB_TOKEN=set_when_live_mode_is_ready
GITHUB_ALLOWED_OWNER=Matt2021-A
GITHUB_ACTOR=ClaudeBot-MattR
PORT=3000
HOST_PORT=3002
HOSTNAME=githubmcp.techthatmattrs.net
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
- Host validation should trust the configured public hostname routed through the shared edge.
- The shared edge is what satisfies the standard 443 requirement.

## What I would do next

1. finish aligning the Yahoo MCP and GitHub MCP deployment stories around the same shared edge
2. run the GitHub MCP behind the shared 443 stack
3. validate `initialize`, `tools/list`, and the write-path tool flow through the shared hostname
4. then move from mock mode to live GitHub mode with the intended token and safety controls
