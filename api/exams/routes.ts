import {
  generateAIResponse,
  getCourseExams,
  getExamWithSolutions,
} from "@/api/exams/handlers";
import {
  chatMessageSchema,
  courseCodeSchema,
  examIdSchema,
} from "@/api/exams/schemas";
import { zValidator } from "@hono/zod-validator";
import { aiLimiter } from "@/middleware/rate-limiters";
import { bodySizeLimit, requestTimeout } from "@/middleware/security";

import { Hono } from "hono";

const exams = new Hono().basePath("/exams");

exams.get(
  "/:courseCode",
  zValidator("param", courseCodeSchema),
  getCourseExams
);

exams.get(
  "/exam/:examId",
  zValidator("param", examIdSchema),
  getExamWithSolutions
);

exams.post(
  "/exam/:examId/chat",
  zValidator("param", examIdSchema),
  zValidator("json", chatMessageSchema),
  aiLimiter,
  bodySizeLimit(2 * 1024 * 1024), // 2MB limit for AI requests
  requestTimeout(120000), // 2 minutes timeout for AI streaming
  generateAIResponse
);

export default exams;
