import { describe, expect, it } from "vitest";
import { summarizeAssessment } from "./useExcelAssessment";

describe("summarizeAssessment", () => {
  it("sums scores and counts result states", () => {
    const summary = summarizeAssessment([
      { earnedScore: 30, scoreWeight: 30, status: "CORRECT" },
      { earnedScore: 0, scoreWeight: 20, status: "RED_ERROR" },
    ]);
    expect(summary).toEqual({ totalScore: 30, maxScore: 50, correctCount: 1, errorCount: 1 });
  });
});
