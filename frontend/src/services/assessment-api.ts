import type { AssessmentResponse } from "../models/assessment";

export async function submitAssessment(cells: unknown[]): Promise<AssessmentResponse> {
  const response = await fetch("/api/assessment/submit", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cells }),
  });
  if (!response.ok) throw new Error(`提交失败：HTTP ${response.status}`);
  return response.json();
}
