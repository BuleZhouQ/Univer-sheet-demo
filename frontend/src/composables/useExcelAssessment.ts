import { computed, ref } from "vue";
import type { UniverWorkbookAdapter } from "../adapters/univer-workbook-adapter";
import type { CellAssessmentResult } from "../models/assessment";
import { submitAssessment } from "../services/assessment-api";

export const TARGETS = [
  { row: 6, column: 2, cellRef: "C7" }, { row: 7, column: 2, cellRef: "C8" },
  { row: 8, column: 2, cellRef: "C9" }, { row: 9, column: 2, cellRef: "C10" },
];
export function summarizeAssessment(results: Pick<CellAssessmentResult, "earnedScore" | "scoreWeight" | "status">[]) {
  return {
    totalScore: results.reduce((sum, item) => sum + item.earnedScore, 0),
    maxScore: results.reduce((sum, item) => sum + item.scoreWeight, 0),
    correctCount: results.filter((item) => item.status === "CORRECT").length,
    errorCount: results.filter((item) => item.status !== "CORRECT").length,
  };
}
export function useExcelAssessment(adapter: () => UniverWorkbookAdapter | undefined) {
  const results = ref<CellAssessmentResult[]>([]);
  const loading = ref(false);
  const error = ref("");
  const summary = computed(() => summarizeAssessment(results.value));
  const submit = async () => {
    const editor = adapter(); if (!editor) return;
    loading.value = true; error.value = "";
    try {
      const response = await submitAssessment(TARGETS.map((target) => ({
        ...target, value: editor.getCellValue(target.row, target.column),
        formula: editor.getCellFormula(target.row, target.column),
      })));
      results.value = response.results;
      editor.setAssessmentStyles(results.value);
    } catch (reason) { error.value = reason instanceof Error ? reason.message : "提交失败"; }
    finally { loading.value = false; }
  };
  const inspect = (item: CellAssessmentResult) => {
    if (item.row !== undefined && item.column !== undefined) adapter()?.focusCell(item.row, item.column);
    if (item.status === "RED_ERROR") item.status = "YELLOW_ANALYZED";
  };
  return { results, loading, error, summary, submit, inspect };
}
