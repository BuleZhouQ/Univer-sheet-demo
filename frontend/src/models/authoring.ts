import type { CellScalar } from "../adapters/univer-workbook-adapter";

export type GradingMode = "VALUE" | "FORMULA" | "TEXT";

export interface SelectionRange {
  sheetId: string;
  startRow: number;
  startColumn: number;
  endRow: number;
  endColumn: number;
}

export interface StandardCell {
  row: number;
  column: number;
  cellRef: string;
  value: CellScalar;
  formula?: string;
}

export interface GradingRule {
  id: string;
  sheetId: string;
  rangeLabel: string;
  mode: GradingMode;
  score: number;
  tolerance: number;
  partialCredit: boolean;
  cells: StandardCell[];
}

export interface QuestionConfig {
  title: string;
  difficulty: "简单" | "中等" | "困难";
  duration: number;
  background: string;
  objective: string;
  steps: string[];
}
