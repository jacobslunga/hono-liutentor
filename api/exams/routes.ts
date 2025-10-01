import {
  generateAIResponse,
  getCourseExams,
  getExamWithSolutions,
} from "@/api/exams/handlers";

import { Hono } from "hono";

const exams = new Hono().basePath("/exams");

exams.get("/:courseCode", getCourseExams);
exams.get("/exam/:examId", getExamWithSolutions);
exams.post("/exam/:examId/chat", generateAIResponse);

export default exams;
