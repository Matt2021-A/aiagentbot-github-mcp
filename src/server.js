import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import * as z from 'zod/v4';

import { config } from './config.js';
import { getRepo } from './github.js';

function buildToolResponse(data) {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }], structuredContent: data };
}

function buildErrorResponse(error) {
  return { content: [{ type: 'text', text: `Error: ${error.message}` }], isError: true };
}

function createServer() {
  const server = new McpServer({ name: 'github-mcp', version: '0.1.0' });

  server.registerTool('get_repo', {
    title: 'Get Repo',
    description: 'Fetch repository details',
    inputSchema: { repo: z.string() }
  }, async ({ repo }) => {
    try {
      const data = await getRepo(config.allowedOwner, repo);
      return buildToolResponse(data);
    } catch (e) {
      return buildErrorResponse(e);
    }
  });

  return server;
}

export const app = createMcpExpressApp();

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'github-mcp' });
});

app.post('/mcp', async (req, res) => {
  const server = createServer();
  const transport = new StreamableHTTPServerTransport({});
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});
