import { Hono } from "hono";
import chat from "@/api/chat/routes";
import health from "@/api/health/routes";
import { logger } from "hono/logger";
import { securityHeaders } from "@/middleware/security";
import { cors } from "hono/cors";

const app = new Hono();

// CORS configuration
app.use(
  "/*",
  cors({
    origin: ["http://localhost:5173", "https://liutentor.se"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: ["Content-Length", "X-Request-Id"],
    maxAge: 600,
    credentials: true,
  })
);

// Security headers
app.use("/*", securityHeaders);

// Logger
app.use(logger());

// Routes
app.route("/", health);
app.route("/", chat);

// 404 handler
app.notFound((c) => {
  return c.json({ error: "Not Found", path: c.req.path }, 404);
});

// Global error handler
app.onError((err, c) => {
  console.error(`Error: ${err.message}`, err);

  return c.json(
    {
      error: err.message || "Internal Server Error",
      ...(Bun.env.NODE_ENV === "development" && { stack: err.stack }),
    },
    500
  );
});

export default app;
