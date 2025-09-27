interface Exam {
  id: number;
  course_code: string;
  exam_date: string;
  pdf_url: string;
  created_at: Date;
  exam_name: string;
}

interface Solution {
  id: number;
  exam_id: number;
  pdf_url: string;
  created_at: Date;
  solution_name: string;
}

interface StatRow {
  exam_date: string;
  statistics: unknown;
  pass_rate: number | null;
  course_name_swe?: string | null;
  course_name_eng?: string | null;
}

interface ExamWithSolution {
  id: number;
  course_code: string;
  exam_date: string;
  exam_name: string;
  pdf_url: string;
  solutions: Solution[];
}

export type { Exam, Solution, StatRow, ExamWithSolution };
