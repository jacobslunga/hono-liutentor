import { rateLimiter } from "hono-rate-limiter";

/**
 * General API rate limiter - 60 requests per minute
 */
export const generalLimiter = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  limit: 60,
  standardHeaders: "draft-7",
  keyGenerator: (c) =>
    c.req.header("x-forwarded-for") ??
    c.req.header("cf-connecting-ip") ??
    "global",
});

/**
 * AI endpoint rate limiter - 10 requests per minute (more restrictive)
 */
export const aiLimiter = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  limit: 10,
  standardHeaders: "draft-7",
  keyGenerator: (c) =>
    c.req.header("x-forwarded-for") ??
    c.req.header("cf-connecting-ip") ??
    "global",
  message: "Too many AI requests, please try again later.",
});

/**
 * Strict rate limiter for expensive operations - 5 requests per minute
 */
export const strictLimiter = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  limit: 5,
  standardHeaders: "draft-7",
  keyGenerator: (c) =>
    c.req.header("x-forwarded-for") ??
    c.req.header("cf-connecting-ip") ??
    "global",
  message: "Rate limit exceeded. Please slow down.",
});
