import { env } from "@/config/env";
import app from "@/app";

const port = parseInt(env.PORT);

Bun.serve({
  fetch: app.fetch,
  port,
  idleTimeout: 60,
});

console.log(`Server running on http://localhost:${port}`);
console.log(`Environment: ${env.NODE_ENV}`);
console.log(`Health check: http://localhost:${port}/health`);
