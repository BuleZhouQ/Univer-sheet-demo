import type { IWorkbookData } from "@univerjs/core";
import type { RemoteSelection } from "../models/collaboration";

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
  private applyingRemote = false;
  private initializing = true;
  private remoteSelections = new Map<string, RemoteSelection>();
  private cursorRenderer: { dispose: () => void };

  constructor(private readonly api: any) {
    this.cursorRenderer = api.getSheetHooks().onCellRender([{
      zIndex: 100,
      drawWith: (ctx: CanvasRenderingContext2D, info: any) => {
        for (const selection of this.remoteSelections.values()) {
          if (selection.sheetId && selection.sheetId !== info.subUnitId) continue;
          if (info.row < selection.startRow || info.row > selection.endRow ||
              info.col < selection.startColumn || info.col > selection.endColumn) continue;
          const { startX, startY, endX, endY } = info.primaryWithCoord;
          ctx.save();
          ctx.fillStyle = `${selection.color}22`;
          ctx.fillRect(startX, startY, endX - startX, endY - startY);
          ctx.strokeStyle = selection.color;
          ctx.lineWidth = 2;
          ctx.strokeRect(startX + 1, startY + 1, endX - startX - 2, endY - startY - 2);
          if (info.row === selection.startRow && info.col === selection.startColumn) {
            ctx.font = "12px sans-serif";
            const labelWidth = Math.max(44, ctx.measureText(selection.userName).width + 12);
            ctx.fillStyle = selection.color;
            ctx.fillRect(startX, Math.max(0, startY - 20), labelWidth, 20);
            ctx.fillStyle = "#fff";
            ctx.fillText(selection.userName, startX + 6, Math.max(13, startY - 6));
          }
          ctx.restore();
        }
      },
    }]);
  }

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

  onRangeChanged(callback: (payload: { startRow: number; startColumn: number; values: CellScalar[][]; formulas: string[][] }) => void) {
    const disposable = this.api.addEvent(this.api.Event.SheetValueChanged, ({ effectedRanges }: any) => {
      if (this.applyingRemote || this.initializing) return;
      for (const range of effectedRanges ?? []) {
        const raw = range.getRange();
        callback({
          startRow: raw.startRow,
          startColumn: raw.startColumn,
          values: range.getValues(),
          formulas: range.getFormulas(),
        });
      }
    });
    return () => disposable.dispose();
  }

  markReady() {
    this.initializing = false;
  }

  async applyRemoteRange(payload: { startRow: number; startColumn: number; values: CellScalar[][]; formulas: string[][] }) {
    const rowCount = payload.values.length;
    const columnCount = payload.values[0]?.length ?? 0;
    if (!rowCount || !columnCount) return;
    const range = this.sheet()?.getRange(payload.startRow, payload.startColumn, rowCount, columnCount);
    this.applyingRemote = true;
    try {
      await range?.setValues(payload.values);
      if (payload.formulas.some((row) => row.some(Boolean))) await range?.setFormulas(payload.formulas);
    } finally {
      this.applyingRemote = false;
    }
  }

  onSelectionChanged(callback: (selection: Omit<RemoteSelection, "userId" | "userName" | "color">) => void) {
    const disposable = this.api.addEvent(this.api.Event.SelectionChanged, ({ worksheet, selections }: any) => {
      const selection = selections?.[0];
      if (!selection) return;
      callback({
        sheetId: worksheet.getSheetId(),
        startRow: selection.startRow,
        startColumn: selection.startColumn,
        endRow: selection.endRow,
        endColumn: selection.endColumn,
      });
    });
    return () => disposable.dispose();
  }

  setRemoteSelection(selection: RemoteSelection) {
    this.remoteSelections.set(selection.userId, selection);
    this.sheet()?.refreshCanvas();
  }

  removeRemoteSelection(userId: string) {
    this.remoteSelections.delete(userId);
    this.sheet()?.refreshCanvas();
  }

  dispose() {
    this.cursorRenderer.dispose();
    this.remoteSelections.clear();
  }
}
