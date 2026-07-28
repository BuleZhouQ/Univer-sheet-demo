import type { IWorkbookData } from "@univerjs/core";

export type CellScalar = string | number | boolean | null;
export type CellPatch = { row: number; column: number; value: CellScalar; formula?: string };
export type CellBatch = { startRow: number; startColumn: number; values: CellScalar[][] };
export type PerformanceSnapshotPayload = { totalRows: number; columns: number; rows: Array<{ rowNumber: number; values: CellScalar[] }> };

export const toCellKey = (row: number, column: number) => `${row}:${column}`;

export function patchesToBatches(cells: CellPatch[]): CellBatch[] {
  const valueCells = cells.filter((cell) => !cell.formula).sort((a, b) => a.row - b.row || a.column - b.column);
  if (!valueCells.length) return [];
  const rows = new Map<number, CellPatch[]>();
  for (const cell of valueCells) {
    const row = rows.get(cell.row) ?? [];
    row.push(cell);
    rows.set(cell.row, row);
  }
  const batches: CellBatch[] = [];
  for (const [rowNumber, rowCells] of rows) {
    const startColumn = rowCells[0].column;
    const values = rowCells.map((cell) => cell.value);
    const previous = batches.at(-1);
    if (previous && rowNumber === previous.startRow + previous.values.length &&
      startColumn === previous.startColumn && values.length === previous.values[0].length) {
      previous.values.push(values);
    } else {
      batches.push({ startRow: rowNumber, startColumn, values: [values] });
    }
  }
  return batches;
}

export function createAssessmentWorkbookData(rows = 100, columns = 26): IWorkbookData {
  return {
    id: "assessment-workbook",
    name: "Univer 在线表格考核",
    appVersion: "1.0.0",
    locale: "zhCN",
    styles: {},
    sheetOrder: ["assessment-sheet"],
    sheets: {
      "assessment-sheet": {
        id: "assessment-sheet",
        name: "财务季度考核表",
        rowCount: rows,
        columnCount: columns,
        cellData: {
          0: {
            0: { v: "编号", s: { bl: 1, bg: { rgb: "#F4F6F8" } } },
            1: { v: "考核项目名称", s: { bl: 1, bg: { rgb: "#F4F6F8" } } },
            2: { v: "数值 / 公式填写区", s: { bl: 1, bg: { rgb: "#F4F6F8" } } },
            3: { v: "备注说明", s: { bl: 1, bg: { rgb: "#F4F6F8" } } },
          },
          2: { 0: { v: "A-01" }, 1: { v: "一季度销售额" }, 2: { v: 35000 }, 3: { v: "基础原始数据" } },
          3: { 0: { v: "A-02" }, 1: { v: "二季度销售额" }, 2: { v: 42000 }, 3: { v: "基础原始数据" } },
          4: { 0: { v: "A-03" }, 1: { v: "三季度销售额" }, 2: { v: 38000 }, 3: { v: "基础原始数据" } },
          5: { 0: { v: "A-04" }, 1: { v: "四季度销售额" }, 2: { v: 43000 }, 3: { v: "基础原始数据" } },
          6: { 0: { v: "T-01" }, 1: { v: "季度销售总额 (SUM)" }, 2: { v: "" }, 3: { v: "使用 SUM 计算 C3:C6" } },
          7: { 0: { v: "T-02" }, 1: { v: "季度平均销售额 (AVERAGE)" }, 2: { v: "" }, 3: { v: "使用 AVERAGE 计算 C3:C6" } },
          8: { 0: { v: "T-03" }, 1: { v: "应缴增值税额 (13%)" }, 2: { v: "" }, 3: { v: "基于 C7 乘以 0.13" } },
          9: { 0: { v: "T-04" }, 1: { v: "销售额达标判断" }, 2: { v: "" }, 3: { v: "使用 IF 判断 C7 > 100000" } },
        },
        columnData: { 0: { w: 100 }, 1: { w: 210 }, 2: { w: 190 }, 3: { w: 260 } },
      },
    },
  } as IWorkbookData;
}

export function performanceRowsToWorkbookData(payload: PerformanceSnapshotPayload): IWorkbookData {
  const cellData: Record<number, Record<number, { v: CellScalar }>> = {};
  for (const row of payload.rows) {
    cellData[row.rowNumber] = Object.fromEntries(row.values.map((value, column) => [column, { v: value }]));
  }
  return {
    id: "performance-workbook",
    name: "10万行性能测试",
    appVersion: "1.0.0",
    locale: "zhCN",
    styles: {},
    sheetOrder: ["performance-sheet"],
    sheets: {
      "performance-sheet": {
        id: "performance-sheet",
        name: "性能数据",
        rowCount: payload.totalRows,
        columnCount: payload.columns,
        cellData,
      },
    },
  } as IWorkbookData;
}

export class UniverWorkbookAdapter {
  constructor(private readonly api: any) {}

  private sheet() {
    return this.api.getActiveWorkbook()?.getActiveSheet();
  }

  getCellValue(row: number, column: number): CellScalar {
    return this.sheet()?.getRange(row, column, 1, 1).getValue() ?? null;
  }

  getCellFormula(row: number, column: number): string | undefined {
    return this.sheet()?.getRange(row, column, 1, 1).getFormula() || undefined;
  }

  async setCells(cells: CellPatch[]) {
    const sheet = this.sheet();
    for (const batch of patchesToBatches(cells)) {
      await sheet?.getRange(batch.startRow, batch.startColumn, batch.values.length, batch.values[0].length)
        .setValues(batch.values);
    }
    for (const cell of cells.filter((item) => item.formula)) {
      await sheet?.getRange(cell.row, cell.column, 1, 1).setFormula(cell.formula!);
    }
  }

  focusCell(row: number, column: number) {
    this.sheet()?.setActiveRange(this.sheet().getRange(row, column, 1, 1));
  }

  setAssessmentStyles(results: Array<{ row?: number; column?: number; status: string }>) {
    for (const item of results) {
      if (item.row === undefined || item.column === undefined) continue;
      const color = item.status === "CORRECT" ? "#DCFCE7" : item.status === "YELLOW_ANALYZED" ? "#FEF9C3" : "#FEE2E2";
      this.sheet()?.getRange(item.row, item.column, 1, 1).setBackgroundColor(color);
    }
  }

  onViewportRowChange(callback: (row: number) => void) {
    let scheduled = false;
    let pendingRow = 0;
    const emit = (row: number) => {
      pendingRow = Math.max(0, row);
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        callback(pendingRow);
      });
    };
    const scrollDisposable = this.api.addEvent(this.api.Event.Scroll, ({ worksheet }: any) => {
      emit(worksheet.getScrollState()?.sheetViewStartRow ?? 0);
    });
    const selectionDisposable = this.api.addEvent(this.api.Event.SelectionChanged, ({ selections }: any) => {
      const row = selections?.[0]?.startRow;
      if (typeof row === "number") emit(row);
    });
    return () => {
      scrollDisposable.dispose();
      selectionDisposable.dispose();
    };
  }
}
