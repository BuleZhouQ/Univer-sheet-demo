import { describe, expect, it } from "vitest";
import { columnName, createRule, selectionLabel, studentPatches } from "./useWorkbookAuthoring";

describe("workbook authoring helpers", () => {
  it("converts zero-based columns to spreadsheet names", () => {
    expect(columnName(0)).toBe("A");
    expect(columnName(25)).toBe("Z");
    expect(columnName(26)).toBe("AA");
  });

  it("creates a grading rule from a selected range", () => {
    const selection = { sheetId: "sheet-1", startRow: 1, startColumn: 2, endRow: 2, endColumn: 3 };
    const rule = createRule(selection, (row, column) => ({
      value: `${row}:${column}`,
      formula: row === 1 ? "=A1" : undefined,
    }));
    expect(rule.rangeLabel).toBe("C2:D3");
    expect(rule.cells).toHaveLength(4);
    expect(rule.cells[0].cellRef).toBe("C2");
  });

  it("builds blank student patches without exposing expected values", () => {
    const rule = createRule(
      { sheetId: "s", startRow: 0, startColumn: 0, endRow: 0, endColumn: 0 },
      () => ({ value: 42, formula: "=SUM(B1:B2)" }),
    );
    expect(studentPatches([rule])).toEqual([{ row: 0, column: 0, value: null }]);
    expect(selectionLabel({ sheetId: "s", startRow: 0, startColumn: 0, endRow: 0, endColumn: 0 })).toBe("A1");
  });
});
