import { z } from "zod";

/**
 * Schema for AI chat messages
 */
export const chatMessageSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant", "system"]),
        content: z.union([
          z.string(),
          z.array(
            z.union([
              z.object({
                type: z.literal("text"),
                text: z.string(),
              }),
              z.object({
                type: z.literal("file"),
                data: z.any(),
                mediaType: z.string(),
              }),
            ])
          ),
        ]),
      })
    )
    .min(1, "At least one message is required")
    .max(50, "Too many messages in conversation"),
});

/**
 * Schema for course code parameter
 */
export const courseCodeSchema = z.object({
  courseCode: z
    .string()
    .min(1, "Course code is required")
    .max(6, "Course code too long")
    .regex(/^[A-Z0-9]+$/i, "Invalid course code format"),
});

/**
 * Schema for exam ID parameter
 */
export const examIdSchema = z.object({
  examId: z
    .string()
    .min(1, "Exam ID is required")
    .regex(/^\d+$/, "Exam ID must be a number"),
});
