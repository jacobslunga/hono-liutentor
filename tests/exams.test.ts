import { describe, expect, it } from "bun:test";

import type { ExamWithSolution } from "@/types";
import app from "@/app";

describe("GET /api/exams/:courseCode", () => {
  it("returns 404 if courseCode not found", async () => {
    const res = await app.request("/api/exams/NOTREAL");
    expect(res.status).toBe(404);
  });

  it("returns JSON with exams if courseCode exsist", async () => {
    const res = await app.request("/api/exams/TATA24");
    expect(res.status).toBe(200);

    const body = (await res.json()) as {
      course_code: string;
      course_name_swe: string;
      exams: unknown[];
    };
    expect(body).toHaveProperty("course_code", "TATA24");
    expect(body).toHaveProperty("course_name_swe", "Linjär algebra");
    expect(body).toHaveProperty("exams");
    expect(Array.isArray(body.exams)).toBe(true);
  });
});

describe("GET /api/exams/exam/:examId", () => {
  it("returns 500 if invalid examId", async () => {
    const res = await app.request("/api/exams/exam/NOTREAL");
    expect(res.status).toBe(500);
  });

  it("returns a valid exam with it's solution", async () => {
    const examId = "15384";
    const res = await app.request("/api/exams/exam/" + examId);
    expect(res.status).toBe(200);

    const body = (await res.json()) as ExamWithSolution;
    expect(body.course_code).toBe("TATA24");
    expect(body.id).toBe(Number(examId));
    expect(typeof body.exam_date).toBe("string");
    expect(body.solutions.length).toBeGreaterThan(0);
  });
});
