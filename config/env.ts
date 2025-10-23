import { z } from "zod";

const envSchema = z.object({
  SUPABASE_URL: z.url("Invalid Supabase URL"),
  SUPABASE_ANON_KEY: z.string().min(1, "Supabase anon key is required"),
  OPENAI_API_KEY: z.string().min(1, "OpenAI API key is required"),
  PORT: z.string().optional().default("4330"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .optional()
    .default("development"),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validates environment variables at startup
 * Throws an error if validation fails
 */
export function validateEnv(): Env {
  try {
    const env = envSchema.parse(Bun.env);
    console.log("Environment variables validated successfully");
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Environment validation failed:");
      error.issues.forEach((issue) => {
        console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
      });
      throw new Error(
        "Invalid environment configuration. Check your .env file."
      );
    }
    throw error;
  }
}

// Validate and export environment variables
export const env = validateEnv();
