import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import type { StatRow } from "@/types";
import { openai } from "@ai-sdk/openai";
import { stream } from "hono/streaming";
import { streamText, type ModelMessage } from "ai";
import supabase from "@/db/supabase";

type SolutionRow = {
  exam_id: number;
};

type SolutionPdfRow = {
  pdf_url: string;
};

const SYSTEM_PROMPT_WITH_SOLUTION = `Du är en hjälpsam studiementor för universitets studenter. Din uppgift är att hjälpa studenter att förstå tentafrågor och koncept genom att:

1. **Förklara koncept tydligt**: Ge klara, pedagogiska förklaringar av de koncept som tentafrågorna testar.
2. **Koppla till lösningen**: Du har tillgång till både tentan OCH lösningsförslagen. Referera alltid till lösningen när du förklarar hur man ska lösa en uppgift.
3. **Visa steg-för-steg**: Dela upp lösningar i logiska steg som är lätta att följa.
4. **Förklara varför**: Inte bara visa vad man ska göra, utan förklara VARFÖR varje steg är nödvändigt.
5. **Var pedagogisk**: Anpassa dina förklaringar efter studentens förståelsenivå.

Svara alltid på svenska. Var tålmodig och uppmuntrande. Om studenten har fel, förklara varför på ett konstruktivt sätt.`;

const SYSTEM_PROMPT_WITHOUT_SOLUTION = `Du är en hjälpsam studiementor för universitets studenter. Din uppgift är att hjälpa studenter att förstå tentafrågor och koncept genom att:

1. **Förklara koncept tydligt**: Ge klara, pedagogiska förklaringar av de koncept som tentafrågorna testar.
2. **Visa steg-för-steg**: Dela upp lösningar i logiska steg som är lätta att följa.
3. **Förklara varför**: Inte bara visa vad man ska göra, utan förklara VARFÖR varje steg är nödvändigt.
4. **Var pedagogisk**: Anpassa dina förklaringar efter studentens förståelsenivå.

OBS: Det finns ingen lösning tillgänglig för denna tenta, så du måste själv räkna ut lösningar baserat på dina kunskaper.

Svara alltid på svenska. Var tålmodig och uppmuntrande.`;

/**
 * Fetches all exams for a given course code
 * @param courseCode
 */
const getCourseExams = async (c: Context) => {
  const { courseCode } = c.req.param();

  if (!courseCode) {
    throw new HTTPException(404, { message: "Ingen kurskod angiven" });
  }

  const { data: examsData, error: examsError } = await supabase
    .from("exams")
    .select("id, course_code, exam_date, pdf_url, exam_name")
    .eq("course_code", courseCode)
    .order("exam_date", { ascending: false });

  if (examsError) {
    throw new HTTPException(500, { message: examsError.message });
  }
  if (!examsData || examsData.length === 0) {
    throw new HTTPException(404, {
      message: "No exam documents found for this course",
    });
  }

  const { data: statsResponse, error: statsError } = await supabase
    .from("exam_stats")
    .select(
      "exam_date, statistics, pass_rate, course_name_swe, course_name_eng"
    )
    .eq("course_code", courseCode);

  if (statsError) {
    throw new HTTPException(500, { message: statsError.message });
  }

  const statsMap = new Map<
    string,
    { statistics: unknown; pass_rate: number | null }
  >();
  for (const s of (statsResponse ?? []) as StatRow[]) {
    statsMap.set(s.exam_date, {
      statistics: s.statistics,
      pass_rate: s.pass_rate ?? null,
    });
  }

  const examIds = examsData.map((e) => e.id);
  const { data: solutions, error: solError } = await supabase
    .from("solutions")
    .select("exam_id")
    .in("exam_id", examIds);

  if (solError) {
    throw new HTTPException(500, { message: solError.message });
  }

  const solved = new Set<number>(
    (solutions ?? []).map((r: SolutionRow) => r.exam_id)
  );

  const exam_list = examsData.map((exam) => {
    const m = statsMap.get(exam.exam_date);
    return {
      id: exam.id,
      course_code: exam.course_code,
      exam_date: exam.exam_date,
      pdf_url: exam.pdf_url,
      exam_name: exam.exam_name,
      has_solution: solved.has(exam.id),
      statistics: m?.statistics,
      pass_rate: m?.pass_rate,
    };
  });

  const course_name_swe =
    (statsResponse &&
      statsResponse[0] &&
      (statsResponse[0] as StatRow).course_name_swe) ||
    "";
  const course_name_eng =
    (statsResponse &&
      statsResponse[0] &&
      (statsResponse[0] as StatRow).course_name_eng) ||
    "";

  return c.json({
    course_code: courseCode,
    course_name_swe,
    course_name_eng,
    exams: exam_list,
  });
};

/**
 * Fetches an exam given it's id with it's corresponding solutions
 * @param examId
 */
const getExamWithSolutions = async (c: Context) => {
  const { examId } = c.req.param();

  if (!examId) {
    throw new HTTPException(404, { message: "Inget tenta ID angivet" });
  }

  const { data: examData, error } = await supabase
    .from("exams")
    .select("id, course_code, pdf_url, exam_date, exam_name, solutions(*)")
    .eq("id", examId)
    .single();

  if (error) {
    throw new HTTPException(500, { message: error.message });
  }

  return c.json(examData);
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

  const body = await c.req.json<{ messages: ModelMessage[] }>();

  const recentMessages = body.messages.slice(-10);

  const systemPrompt = solution
    ? SYSTEM_PROMPT_WITH_SOLUTION
    : SYSTEM_PROMPT_WITHOUT_SOLUTION;

  const messages: ModelMessage[] =
    body.messages.length <= 1
      ? [
          { role: "system", content: systemPrompt },
          ...recentMessages,
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
            ],
          },
        ]
      : [{ role: "system", content: systemPrompt }, ...recentMessages];

  const result = streamText({
    model: openai("gpt-4.1-nano"),
    messages,
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

export { getCourseExams, getExamWithSolutions, generateAIResponse };
