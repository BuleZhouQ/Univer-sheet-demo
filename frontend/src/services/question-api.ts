import type { GradingRule, QuestionConfig } from "../models/authoring";

export interface TeacherQuestion extends QuestionConfig {
  id: string;
  rules: GradingRule[];
}

export interface StudentAnswerTarget {
  ruleId: string;
  sheetId: string;
  rangeLabel: string;
  row: number;
  column: number;
  cellRef: string;
  score: number;
}

export interface StudentQuestion extends QuestionConfig {
  id: string;
  answerTargets: StudentAnswerTarget[];
}

async function json<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export const getTeacherQuestion = (id: string) =>
  fetch(`/api/assessment/questions/${encodeURIComponent(id)}`).then(json<TeacherQuestion>);

export const getStudentQuestion = (id: string) =>
  fetch(`/api/assessment/questions/${encodeURIComponent(id)}/student`).then(json<StudentQuestion>);

export const saveTeacherQuestion = (id: string, question: TeacherQuestion) =>
  fetch(`/api/assessment/questions/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(question),
  }).then(json<TeacherQuestion>);

export const submitStudentQuestion = (questionId: string, cells: unknown[]) =>
  fetch("/api/assessment/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ questionId, cells }),
  }).then(json<{ totalScore: number; maxPossibleScore: number }>);
