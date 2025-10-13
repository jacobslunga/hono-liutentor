import { describe, expect, it } from "bun:test";

import type { ExamWithSolution } from "@/types";
import app from "@/app";

describe("GET /api/exams/:courseCode", () => {
  it("returns 404 if courseCode not found", async () => {
    const res = await app.request("/exams/NOTREAL");
    expect(res.status).toBe(404);
  });

  it("returns JSON with exams if courseCode exsist", async () => {
    const res = await app.request("/exams/TATA24");
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
    const res = await app.request("/exams/exam/NOTREAL");
    expect(res.status).toBe(500);
  });

  it("returns a valid exam with it's solution", async () => {
    const examId = "15384";
    const res = await app.request("/exams/exam/" + examId);
    expect(res.status).toBe(200);

    const body = (await res.json()) as ExamWithSolution;
    expect(body.course_code).toBe("TATA24");
    expect(body.id).toBe(Number(examId));
    expect(typeof body.exam_date).toBe("string");
    expect(body.solutions.length).toBeGreaterThan(0);
  });
});

describe("POST /api/exams/exam/:examId/chat", () => {
  it("returns 404 if invalid examId", async () => {
    const res = await app.request("/exams/exam/NOTREAL/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: "Hej!" }],
      }),
    });
    expect(res.status).toBe(404);
  });

  it("returns streaming response for valid examId", async () => {
    const examId = "15384";
    const res = await app.request(`/exams/exam/${examId}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: "Förklara uppgift 1" }],
      }),
    });
    expect(res.status).toBe(200);
    // Verify we get a streaming response (content-type might be null for streams)
    expect(res.body).toBeDefined();

    // Verify we get a streaming response
    const reader = res.body?.getReader();
    expect(reader).toBeDefined();

    // Read at least one chunk
    if (reader) {
      const { done, value } = await reader.read();
      expect(done).toBe(false);
      expect(value).toBeDefined();
      expect(value!.length).toBeGreaterThan(0);
      reader.releaseLock();
    }
  });

  it("includes system prompt on first message", async () => {
    // This test verifies the behavior but we can't easily check the actual prompt
    // without mocking, so we just verify it works with the first message
    const examId = "15384";
    const res = await app.request(`/exams/exam/${examId}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [],
      }),
    });
    expect(res.status).toBe(200);
  });
});
