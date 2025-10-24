import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { openai } from "@ai-sdk/openai";
import { stream } from "hono/streaming";
import { streamText, type ModelMessage } from "ai";
import supabase from "@/db/supabase";
import { downloadAndCompressPdf } from "@/utils/pdf-compression";

type SolutionPdfRow = {
  pdf_url: string;
};

const MATH_FORMATTING_INSTRUCTIONS = `
VIKTIGT - Matematisk formattering:
- Använd ALLTID LaTeX-syntax för ALL matematik
- För inline-matematik: använd $...$, exempel: $x^2 + y^2 = z^2$
- För block-matematik: använd $$...$$, exempel:
$$
f(x) = \\int_{a}^{b} x^2 dx
$$
- Använd ALDRIG \\[...\\] eller \\(...\\) syntax
- Alla formler, ekvationer, variabler och matematiska uttryck måste vara i LaTeX
- Exempel på korrekt formatering:
  * "Lös ekvationen $ax^2 + bx + c = 0$ med hjälp av formeln:"
  * "$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$"`;

/**
 * Generates system prompt based on available resources and teaching mode
 */
const getSystemPrompt = (
  hasSolution: boolean,
  giveDirectAnswer: boolean
): string => {
  const baseRole =
    "Du är en studiementor som hjälper studenter förstå tentafrågor.";
  const solutionAccess = hasSolution
    ? "Du har tillgång till både tentan och lösningen."
    : "Det finns ingen lösning tillgänglig.";

  const teachingStyle = giveDirectAnswer
    ? "Ge tydliga, direkta svar och förklaringar. Förklara steg-för-steg och visa den fullständiga lösningen. Om lösning finns, referera till den."
    : "Utmana studenten att tänka själv. Ställ ledande frågor, ge tips och vägledning, men ge INTE det direkta svaret. Guida studenten att komma fram till lösningen på egen hand genom att ge hints och förklaringar av relevanta koncept.";

  return `${baseRole} ${solutionAccess} ${teachingStyle} Svara på svenska.${MATH_FORMATTING_INSTRUCTIONS}`;
};

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

  const body = await c.req.json<{
    messages: ModelMessage[];
    giveDirectAnswer?: boolean;
  }>();

  const recentMessages = body.messages.slice(-10);
  const giveDirectAnswer = body.giveDirectAnswer ?? true;

  const systemPrompt = getSystemPrompt(!!solution, giveDirectAnswer);

  const compressedExamPdf = await downloadAndCompressPdf(exam.pdf_url);

  let compressedSolutionPdf: string | null = null;
  if (solution) {
    compressedSolutionPdf = await downloadAndCompressPdf(solution.pdf_url);
  }

  const messages: ModelMessage[] = [
    {
      role: "user",
      content: [
        {
          type: "file",
          data: compressedExamPdf,
          mediaType: "application/pdf",
        },
        ...(compressedSolutionPdf
          ? [
              {
                type: "file" as const,
                data: compressedSolutionPdf,
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
