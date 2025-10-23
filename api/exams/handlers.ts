import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import type { StatRow } from "@/types";
import { openai } from "@ai-sdk/openai";
import { stream } from "hono/streaming";
import { streamText, type ModelMessage } from "ai";
import supabase from "@/db/supabase";

type SolutionPdfRow = {
  pdf_url: string;
};

const SYSTEM_PROMPT_WITH_SOLUTION = `Du är en studiementor som hjälper studenter förstå tentafrågor. Du har tillgång till både tentan och lösningen. Förklara steg-för-steg och referera till lösningen. Svara på svenska.`;

const SYSTEM_PROMPT_WITHOUT_SOLUTION = `Du är en studiementor som hjälper studenter förstå tentafrågor. Det finns ingen lösning tillgänglig. Förklara steg-för-steg baserat på dina kunskaper. Svara på svenska.`;

/**
 * Streams back response for a given exam
 * @param examId
 */
const generateAIResponse = async (c: Context) => {
  const { examId } = c.req.param();

  if (!examId) {
    throw new HTTPException(404, {
      message: `Hitta ingen tenta med ID: ${examId}`,
    });
  }

  const { data: exam, error } = await supabase
    .from("exams")
    .select("id, pdf_url")
    .eq("id", examId)
    .single();

  if (error || !exam) {
    throw new HTTPException(404, {
      message: `Kunde inte hitta tenta med ID: ${examId}`,
    });
  }

  const { data: solutions } = await supabase
    .from("solutions")
    .select("pdf_url")
    .eq("exam_id", examId)
    .limit(1);

  const solution: SolutionPdfRow | null = solutions?.[0] ?? null;

  const body = await c.req.json<{ messages: ModelMessage[] }>();

  const recentMessages = body.messages.slice(-10);

  const systemPrompt = solution
    ? SYSTEM_PROMPT_WITH_SOLUTION
    : SYSTEM_PROMPT_WITHOUT_SOLUTION;

  const messages: ModelMessage[] = [
    {
      role: "user",
      content: [
        {
          type: "file",
          data: new URL(exam.pdf_url),
          mediaType: "application/pdf",
        },
        ...(solution
          ? [
              {
                type: "file" as const,
                data: new URL(solution.pdf_url),
                mediaType: "application/pdf" as const,
              },
            ]
          : []),
        {
          type: "text" as const,
          text: "Här är tentamen" + (solution ? " och lösningen" : "") + ".",
        },
      ],
    },
    ...recentMessages,
  ];

  const result = streamText({
    model: openai("gpt-4.1-nano"),
    messages,
    system: systemPrompt,
  });

  return stream(c, async (s) => {
    s.onAbort(() => {
      console.log("Client aborted");
    });

    for await (const delta of result.textStream) {
      await s.write(delta);
    }
  });
};

export { generateAIResponse };
