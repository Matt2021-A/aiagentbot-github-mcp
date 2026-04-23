import 'dotenv/config';
import { app } from './src/server.js';
import { config } from './src/config.js';

app.listen(config.port, () => {
  console.log(`[github-mcp] listening on ${config.port}`);
});
