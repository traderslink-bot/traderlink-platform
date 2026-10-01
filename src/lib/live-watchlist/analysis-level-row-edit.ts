import { editRecord, type EditValue } from "./analysis-inline-edit";

export type LevelRowAction = "insert-above" | "insert-below" | "up" | "down" | "sort";

/** Explicit owner actions only: move whole records without altering their contents. */
export function editLevelRows(rows: EditValue[], action: LevelRowAction, index: number, blank: EditValue, maximum: number, priceKey = "price"): EditValue[] {
  const next = rows.slice();
  if (action === "sort") {
    const price = (row: EditValue) => { const value = editRecord(row)[priceKey]; return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : Infinity; };
    return next.sort((a,b) => price(a) - price(b));
  }
  if (!Number.isInteger(index) || index < 0 || index >= rows.length) return next;
  if (action === "insert-above" || action === "insert-below") {
    if (next.length < maximum) next.splice(index + (action === "insert-below" ? 1 : 0), 0, structuredClone(blank));
    return next;
  }
  const destination = index + (action === "up" ? -1 : 1);
  if (destination >= 0 && destination < next.length) [next[index], next[destination]] = [next[destination], next[index]];
  return next;
}
