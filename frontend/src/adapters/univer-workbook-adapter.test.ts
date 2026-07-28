import { describe, expect, it } from "vitest";
import { createAssessmentWorkbookData, patchesToBatches, performanceRowsToWorkbookData, toCellKey } from "./univer-workbook-adapter";

describe("Univer workbook adapter helpers", () => {
  it("creates stable workbook and worksheet identities", () => {
    const workbook = createAssessmentWorkbookData();

    expect(workbook.id).toBe("assessment-workbook");
    expect(workbook.sheets["assessment-sheet"]?.id).toBe("assessment-sheet");
    expect(workbook.sheetOrder).toEqual(["assessment-sheet"]);
  });

  it("creates an unambiguous cell key", () => {
    expect(toCellKey(12, 3)).toBe("12:3");
  });

  it("turns a contiguous block into one matrix write", () => {
    const batches = patchesToBatches([
      { row: 200, column: 0, value: "A" },
      { row: 200, column: 1, value: 1 },
      { row: 201, column: 0, value: "B" },
      { row: 201, column: 1, value: 2 },
    ]);

    expect(batches).toEqual([{
      startRow: 200,
      startColumn: 0,
      values: [["A", 1], ["B", 2]],
    }]);
  });

  it("converts a complete performance payload into one workbook snapshot", () => {
    const workbook = performanceRowsToWorkbookData({
      totalRows: 100_000,
      columns: 20,
      rows: [{ rowNumber: 0, values: ["ROW-000000", 1] }],
    });
    expect(workbook.sheets["performance-sheet"]?.rowCount).toBe(100_000);
    expect(workbook.sheets["performance-sheet"]?.cellData?.[0]?.[0]?.v).toBe("ROW-000000");
  });
});
