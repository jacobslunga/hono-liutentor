import { generateAIResponse } from "@/api/chat/handlers";
import { chatMessageSchema, examIdSchema } from "@/api/chat/schemas";
import { zValidator } from "@hono/zod-validator";
import { chatLimiter } from "@/middleware/rate-limiters";
import { bodySizeLimit, requestTimeout } from "@/middleware/security";

import { Hono } from "hono";

const chat = new Hono().basePath("/chat");

chat.post(
  "/completion/:examId",
  zValidator("param", examIdSchema),
  zValidator("json", chatMessageSchema),
  chatLimiter,
  bodySizeLimit(2 * 1024 * 1024), // 2MB limit
  requestTimeout(120000), // 2 minutes timeout
  generateAIResponse
);

export default chat;
