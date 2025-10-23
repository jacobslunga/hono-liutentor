import { Hono } from "hono";
import supabase from "@/db/supabase";

const health = new Hono();

/**
 * Basic health check endpoint for monitoring
 */
health.get("/health", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * Detailed readiness check - verifies database connection
 */
health.get("/ready", async (c) => {
  try {
    // Check database connection
    const { error } = await supabase.from("exams").select("id").limit(1);

    if (error) {
      return c.json(
        {
          status: "error",
          database: "disconnected",
          error: error.message,
        },
        503
      );
    }

    return c.json({
      status: "ready",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return c.json(
      {
        status: "error",
        database: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      503
    );
  }
});

export default health;
