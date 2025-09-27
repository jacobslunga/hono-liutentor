import { Hono } from "hono";
import exams from "@/api/exams/routes";
import { logger } from "hono/logger";
import { rateLimiter } from "hono-rate-limiter";

const app = new Hono();

const limiter = rateLimiter({
  windowMs: 60 * 1000,
  limit: 100,
  standardHeaders: "draft-7",
  keyGenerator: (c) =>
    c.req.header("x-forwarded-for") ??
    c.req.header("cf-connecting-ip") ??
    "global",
});

app.use(logger());
app.use(limiter);
app.route("/api", exams);

export default app;
