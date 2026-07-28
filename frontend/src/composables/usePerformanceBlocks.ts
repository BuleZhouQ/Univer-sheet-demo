import { ref } from "vue";
import { toCellKey, type CellPatch, type CellScalar, type UniverWorkbookAdapter } from "../adapters/univer-workbook-adapter";

export interface PerformanceRow { rowNumber: number; values: CellScalar[] }
export const blockStartForRow = (row: number, size = 200) => Math.max(0, Math.floor(row / size) * size);
export function blockStartsAroundRow(row: number, size = 200, totalRows = 100_000) {
  const current = blockStartForRow(Math.min(Math.max(row, 0), totalRows - 1), size);
  return [current - size, current, current + size]
    .filter((offset) => offset >= 0 && offset < totalRows);
}
export function mergeRowsWithDirtyCells(rows: PerformanceRow[], dirty: Map<string, CellScalar>) {
  return rows.map((row) => ({ ...row, values: row.values.map((value, column) => dirty.get(toCellKey(row.rowNumber, column)) ?? value) }));
}
export function usePerformanceBlocks(adapter: () => UniverWorkbookAdapter | undefined) {
  const loaded = new Set<number>(); const loading = new Set<number>(); const dirty = new Map<string, CellScalar>();
  const status = ref("性能数据未加载");
  const load = async (row: number) => {
    const offset = blockStartForRow(row);
    if (loaded.has(offset) || loading.has(offset)) return;
    loading.add(offset); status.value = `正在加载第 ${offset + 1}-${offset + 200} 行`;
    try {
      const response = await fetch(`/api/performance/rows?offset=${offset}&limit=200`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json() as { rows: PerformanceRow[] };
      const patches: CellPatch[] = mergeRowsWithDirtyCells(payload.rows, dirty).flatMap((item) =>
        item.values.map((value, column) => ({ row: item.rowNumber, column, value })));
      await adapter()?.setCells(patches); loaded.add(offset); status.value = `已加载 ${loaded.size * 200} 行`;
    } catch (e) { status.value = `加载失败：${e instanceof Error ? e.message : "未知错误"}`; }
    finally { loading.delete(offset); }
  };
  const loadAround = async (row: number) => {
    await Promise.all(blockStartsAroundRow(row).map((offset) => load(offset)));
  };
  return { status, load, loadAround, dirty };
}
