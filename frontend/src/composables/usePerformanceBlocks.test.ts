import { describe, expect, it } from "vitest";
import { blockStartForRow, blockStartsAroundRow, mergeRowsWithDirtyCells } from "./usePerformanceBlocks";

describe("performance block helpers", () => {
  it("aligns rows to 200-row blocks", () => {
    expect(blockStartForRow(0)).toBe(0);
    expect(blockStartForRow(399)).toBe(200);
  });

  it("keeps dirty values when merging server rows", () => {
    const rows = [{ rowNumber: 201, values: ["server", 2] }];
    const dirty = new Map([["201:0", "local"]]);
    expect(mergeRowsWithDirtyCells(rows, dirty)[0].values).toEqual(["local", 2]);
  });

  it("preloads the current block and its neighbors without leaving the sheet", () => {
    expect(blockStartsAroundRow(450)).toEqual([200, 400, 600]);
    expect(blockStartsAroundRow(20)).toEqual([0, 200]);
    expect(blockStartsAroundRow(99_999)).toEqual([99_600, 99_800]);
  });
});
