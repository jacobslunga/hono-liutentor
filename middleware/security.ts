import type { Context, Next } from "hono";

/**
 * Security headers middleware
 */
export const securityHeaders = async (c: Context, next: Next) => {
  await next();

  // Prevent clickjacking
  c.header("X-Frame-Options", "DENY");

  // Prevent MIME type sniffing
  c.header("X-Content-Type-Options", "nosniff");

  // XSS Protection
  c.header("X-XSS-Protection", "1; mode=block");

  // Referrer Policy
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");

  // Content Security Policy
  c.header(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
  );

  // Strict Transport Security (HSTS) - only in production
  if (Bun.env.NODE_ENV === "production") {
    c.header(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
    );
  }

  // Permissions Policy
  c.header("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
};

/**
 * Request body size limiter middleware
 */
export const bodySizeLimit = (maxSize: number = 1024 * 1024) => {
  return async (c: Context, next: Next) => {
    const contentLength = c.req.header("content-length");

    if (contentLength && parseInt(contentLength) > maxSize) {
      return c.json(
        { error: "Request body too large", maxSize: `${maxSize / 1024}KB` },
        413
      );
    }

    await next();
  };
};

/**
 * Request timeout middleware
 */
export const requestTimeout = (timeoutMs: number = 30000) => {
  return async (_: Context, next: Next) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      await next();
    } finally {
      clearTimeout(timeoutId);
    }
  };
};
