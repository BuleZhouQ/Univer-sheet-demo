export function validateOperation(value) {
  if (!value || typeof value !== "object") return "operation required";
  if (typeof value.operationId !== "string" || !value.operationId) return "operationId required";
  if (value.type !== "SET_RANGE") return "unsupported operation type";
  const range = value.payload;
  if (!Number.isInteger(range?.startRow) || !Number.isInteger(range?.startColumn)) return "invalid range";
  if (!Array.isArray(range.values) || !range.values.every(Array.isArray)) return "values matrix required";
  if (range.values.length > 1000 || range.values.some((row) => row.length > 100)) return "range too large";
  return "";
}
