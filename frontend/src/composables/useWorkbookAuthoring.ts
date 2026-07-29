import { computed, ref } from "vue";
import type { CellPatch, CellScalar, UniverWorkbookAdapter } from "../adapters/univer-workbook-adapter";
import type { GradingRule, SelectionRange } from "../models/authoring";
import type { CellAssessmentResult } from "../models/assessment";

export function columnName(index: number) {
  let value = index + 1;
  let name = "";
  while (value > 0) {
    const remainder = (value - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    value = Math.floor((value - 1) / 26);
  }
  return name;
}

export function selectionLabel(selection: SelectionRange) {
  const start = `${columnName(selection.startColumn)}${selection.startRow + 1}`;
  const end = `${columnName(selection.endColumn)}${selection.endRow + 1}`;
  return start === end ? start : `${start}:${end}`;
}

export function createRule(
  selection: SelectionRange,
  readCell: (row: number, column: number) => { value: CellScalar; formula?: string },
): GradingRule {
  const cells = [];
  for (let row = selection.startRow; row <= selection.endRow; row += 1) {
    for (let column = selection.startColumn; column <= selection.endColumn; column += 1) {
      const read = readCell(row, column);
      cells.push({ row, column, cellRef: `${columnName(column)}${row + 1}`, ...read });
    }
  }
  const hasFormula = cells.some((cell) => Boolean(cell.formula));
  const isNumber = cells.every((cell) => cell.value !== null && cell.value !== "" && Number.isFinite(Number(cell.value)));
  return {
    id: `rule-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    sheetId: selection.sheetId,
    rangeLabel: selectionLabel(selection),
    mode: hasFormula ? "FORMULA" : isNumber ? "VALUE" : "TEXT",
    score: 10,
    tolerance: isNumber ? 0.01 : 0,
    partialCredit: true,
    cells,
  };
}

export function studentPatches(rules: GradingRule[]): CellPatch[] {
  return rules.flatMap((rule) => rule.cells.map((cell) => ({ row: cell.row, column: cell.column, value: null })));
}

export function useWorkbookAuthoring(adapter: () => UniverWorkbookAdapter | undefined) {
  const rules = ref<GradingRule[]>([]);
  const selection = ref<SelectionRange>();
  const preview = ref(false);
  const savedValues = new Map<string, { value: CellScalar; formula?: string }>();
  const totalScore = computed(() => rules.value.reduce((sum, rule) => sum + rule.score, 0));

  const start = () => {
    const editor = adapter();
    if (!editor) return () => undefined;
    return editor.onSelectionChanged((next) => { selection.value = next; });
  };

  const markSelection = () => {
    const editor = adapter();
    const next = selection.value;
    if (!editor || !next) return;
    const rule = createRule(next, (row, column) => ({
      value: editor.getCellValue(row, column),
      formula: editor.getCellFormula(row, column),
    }));
    if (!rules.value.some((item) => item.sheetId === rule.sheetId && item.rangeLabel === rule.rangeLabel)) {
      rules.value = [...rules.value, rule];
    }
  };

  const togglePreview = async () => {
    const editor = adapter();
    if (!editor) return;
    if (!preview.value) {
      savedValues.clear();
      rules.value.forEach((rule) => rule.cells.forEach((cell) => savedValues.set(`${cell.row}:${cell.column}`, {
        value: editor.getCellValue(cell.row, cell.column),
        formula: editor.getCellFormula(cell.row, cell.column),
      })));
      await editor.setCells(studentPatches(rules.value));
      preview.value = true;
    } else {
      const patches: CellPatch[] = [];
      savedValues.forEach((saved, key) => {
        const [row, column] = key.split(":").map(Number);
        patches.push({ row, column, value: saved.value, formula: saved.formula });
      });
      await editor.setCells(patches);
      preview.value = false;
    }
  };

  const removeRule = async (id: string) => {
    rules.value = rules.value.filter((rule) => rule.id !== id);
  };

  const grade = async () => {
    const editor = adapter();
    if (!editor) return;
    const payload = rules.value.flatMap((rule) => rule.cells.map((cell) => ({
      row: cell.row, column: cell.column, cellRef: cell.cellRef,
      value: editor.getCellValue(cell.row, cell.column),
      formula: editor.getCellFormula(cell.row, cell.column),
    })));
    return payload;
  };

  const applyResults = (results: CellAssessmentResult[]) => adapter()?.setAssessmentStyles(results);
  return { rules, selection, preview, totalScore, start, markSelection, togglePreview, removeRule, grade, applyResults };
}
