import { Hono } from "hono";
import exams from "@/api/exams/routes";
import health from "@/api/health/routes";
import { logger } from "hono/logger";
import { generalLimiter } from "@/middleware/rate-limiters";
import { securityHeaders } from "@/middleware/security";
import { cors } from "hono/cors";
import { compress } from "hono/compress";

const app = new Hono();

app.use("/*", compress());

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

app.use("/*", securityHeaders);

app.use(logger());

app.use(generalLimiter);

app.route("/", health);
app.route("/", exams);

app.notFound((c) => {
  return c.json({ error: "Not Found", path: c.req.path }, 404);
});

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
