import app from "@/app";

const port = Bun.env.PORT || 4330;

Bun.serve({
  fetch: app.fetch,
  port,
});

console.log(`Server running on http://localhost:${port}`);
