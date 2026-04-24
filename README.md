# aiagentbot-github-mcp

Provider-neutral GitHub MCP service scaffold for Claude-first remote connector use.

This repo mirrors the Yahoo MCP architecture, but targets GitHub operations instead of mail.

## Current status

Starter scaffold with provider abstraction.

- supports mock mode for local development
- GitHub mode will enable real API operations

## Architecture

```text
Claude
  |
  | HTTPS to public hostname on alternate port
  | Example: https://githubmcp.example.com:8444
  v
Public DNS record
  |
  v
Home router
  |
  v
Docker host
  |
  +----------------------------------------------+
  | Caddy HTTPS front end                        |
  | - alternate port                             |
  | - DNS-01 TLS                                 |
  | - reverse proxy                              |
  +-------------------+--------------------------+
                      |
                      v
        +------------------------------------+
        | GitHub MCP app container           |
        | - MCP SDK                          |
        | - Streamable HTTP                  |
        | - provider abstraction             |
        | - tools: repo / branch / PR        |
        +------------------------------------+
                      |
                      v
               GitHub API (REST)
```

## Provider model

- mock: local dev, no API calls
- github: real GitHub API via token

## Goal

Full parity with ChatGPT GitHub capabilities:

- read repos
- create branches
- create/update files
- open PRs
- merge PRs

## Next steps

1. complete GitHub provider
2. implement full tool surface
3. validate end-to-end from Claude

This repo is now structurally aligned with Yahoo MCP.
