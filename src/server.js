import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import * as z from 'zod/v4';

import { config } from './config.js';
import { createGitHubProviderSelector } from './providers/index.js';

const githubProvider = createGitHubProviderSelector();

function buildToolResponse(data) {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }], structuredContent: data };
}

function buildErrorResponse(error) {
  console.error('[mcp] tool failure', error);
  return { content: [{ type: 'text', text: 'Error: request failed' }], isError: true };
}

function requireBearerToken(req, res, next) {
  if (!config.mcpBearerToken) {
    res.status(500).json({ error: 'MCP auth is not configured' });
    return;
  }

  const actual = req.headers.authorization?.replace(/^Bearer\s+/i, '');

  if (!actual || actual !== config.mcpBearerToken) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  next();
}

function createServer() {
  const server = new McpServer({ name: 'github-mcp', version: '0.1.0' });

  server.registerTool('get_repo', {
    title: 'Get Repo',
    description: 'Fetch repository details',
    inputSchema: { repo: z.string().min(1).max(100) }
  }, async ({ repo }) => {
    try {
      const data = await githubProvider.getRepo(repo);
      return buildToolResponse({ provider: githubProvider.name, data });
    } catch (e) {
      return buildErrorResponse(e);
    }
  });

  server.registerTool('create_branch', {
    title: 'Create Branch',
    description: 'Create a new branch from default branch',
    inputSchema: {
      repo: z.string().min(1).max(100),
      branch: z.string().min(1).max(150).regex(/^aiagentbot\/[A-Za-z0-9._-]+$/)
    }
  }, async ({ repo, branch }) => {
    try {
      const base = await githubProvider.getDefaultBranch(repo);
      const result = await githubProvider.createBranch(repo, branch, base.sha);
      return buildToolResponse({ provider: githubProvider.name, result });
    } catch (e) {
      return buildErrorResponse(e);
    }
  });

  server.registerTool('create_file', {
    title: 'Create or Update File',
    description: 'Create or update file in repo',
    inputSchema: {
      repo: z.string().min(1).max(100),
      branch: z.string().min(1).max(150).regex(/^aiagentbot\/[A-Za-z0-9._-]+$/),
      path: z.string().min(1).max(500),
      content: z.string().max(100000),
      message: z.string().max(200).optional()
    }
  }, async ({ repo, branch, path, content, message }) => {
    try {
      const result = await githubProvider.createOrUpdateFile(repo, branch, path, content, message);
      return buildToolResponse({ provider: githubProvider.name, result });
    } catch (e) {
      return buildErrorResponse(e);
    }
  });

  server.registerTool('open_pr', {
    title: 'Open PR',
    description: 'Open pull request',
    inputSchema: {
      repo: z.string().min(1).max(100),
      head: z.string().min(1).max(150).regex(/^aiagentbot\/[A-Za-z0-9._-]+$/),
      base: z.string().min(1).max(150),
      title: z.string().min(1).max(200),
      body: z.string().max(10000).optional()
    }
  }, async ({ repo, head, base, title, body }) => {
    try {
      const result = await githubProvider.openPr(repo, head, base, title, body);
      return buildToolResponse({ provider: githubProvider.name, result });
    } catch (e) {
      return buildErrorResponse(e);
    }
  });

  if (config.enableMergeTool) {
    server.registerTool('merge_pr', {
      title: 'Merge PR',
      description: 'Merge pull request',
      inputSchema: {
        repo: z.string().min(1).max(100),
        pullNumber: z.number().int().positive()
      }
    }, async ({ repo, pullNumber }) => {
      try {
        const result = await githubProvider.mergePr(repo, pullNumber);
        return buildToolResponse({ provider: githubProvider.name, result });
      } catch (e) {
        return buildErrorResponse(e);
      }
    });
  }

  return server;
}

const allowedHosts = [config.hostname, 'localhost', '127.0.0.1', '::1'];

export const app = createMcpExpressApp({
  host: '0.0.0.0',
  allowedHosts
});

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'github-mcp',
    githubMode: config.githubMode,
    provider: githubProvider.name,
    mergeToolEnabled: config.enableMergeTool
  });
});

app.post('/mcp', requireBearerToken, async (req, res) => {
  const server = createServer();

  try {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined
    });

    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);

    res.on('close', () => {
      transport.close();
      server.close();
    });
  } catch (error) {
    console.error('[mcp] request failure', error);

    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error'
        },
        id: null
      });
    }
  }
});

app.get('/mcp', (_req, res) => {
  res.status(405).json({
    error: 'GET is not enabled in this starter scaffold. Use POST for Streamable HTTP requests.'
  });
});

app.delete('/mcp', (_req, res) => {
  res.status(405).json({
    error: 'DELETE is not enabled in this starter scaffold.'
  });
});
