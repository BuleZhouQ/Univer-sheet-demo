import type { CellScalar } from "../adapters/univer-workbook-adapter";

export interface RangeOperationPayload {
  startRow: number;
  startColumn: number;
  values: CellScalar[][];
  formulas: string[][];
}
export interface CollaborationOperation {
  operationId: string;
  type: "SET_RANGE";
  baseRevision: number;
  payload: RangeOperationPayload;
  revision?: number;
  user?: string;
}
export interface RemoteSelection {
  userId: string;
  userName: string;
  sheetId: string;
  startRow: number;
  startColumn: number;
  endRow: number;
  endColumn: number;
  color: string;
}
