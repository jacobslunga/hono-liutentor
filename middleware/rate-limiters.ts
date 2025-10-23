import { rateLimiter } from "hono-rate-limiter";

/**
 * Chat endpoint rate limiter - 10 requests per minute
 */
export const chatLimiter = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  limit: 10,
  standardHeaders: "draft-7",
  keyGenerator: (c) =>
    c.req.header("x-forwarded-for") ??
    c.req.header("cf-connecting-ip") ??
    "global",
  message: "Too many requests, please try again later.",
});
