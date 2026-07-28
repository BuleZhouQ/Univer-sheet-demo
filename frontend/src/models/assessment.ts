export type AssessmentStatus = "UNCHECKED" | "CORRECT" | "RED_ERROR" | "YELLOW_ANALYZED";
export interface CellAssessmentResult {
  row?: number; column?: number; cellRef: string; title?: string;
  earnedScore: number; scoreWeight: number; status: AssessmentStatus;
  studentValue?: string | number; studentFormula?: string;
  standardValue?: string | number; standardFormula?: string; errorAnalysisPrompt?: string;
}
export interface AssessmentResponse { totalScore: number; maxPossibleScore: number; results: CellAssessmentResult[] }
