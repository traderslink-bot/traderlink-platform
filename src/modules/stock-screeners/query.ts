import { type Candidate, type Definition, type Rule, type Snapshot } from "./contracts";

export const PAGE_SIZE = 50;

export function matchesRule(row: Candidate, rule: Rule): boolean | null {
  const actual = row.values[rule.metric];
  if (actual === undefined) return null;
  switch (rule.operator) {
    case "gte": return actual >= rule.value;
    case "lte": return actual <= rule.value;
    case "gt": return actual > rule.value;
    case "lt": return actual < rule.value;
    case "eq": return actual === rule.value;
    case "between": return actual >= rule.value && actual <= rule.upper!;
  }
}

export function querySnapshot(snapshot: Snapshot, definition: Definition) {
  const selected = new Set(definition.tickers);
  const scoped = snapshot.rows.filter(row =>
    (!definition.exchanges.length || definition.exchanges.includes(row.exchange))
    && (definition.universe !== "list" || selected.has(row.symbol)));
  const seen = new Set(snapshot.rows.map(row => row.symbol));
  const missingTickers = definition.universe === "list" ? definition.tickers.filter(ticker => !seen.has(ticker)) : [];
  const rows: Candidate[] = [];
  let unavailable = 0;
  for (const row of scoped) {
    const rules = definition.rules.map(rule => matchesRule(row, rule));
    if (rules.includes(false)) continue;
    if (row.values.price === undefined || rules.includes(null)) unavailable++;
    else rows.push(row);
  }
  return { rows, eligible: scoped.length, evaluated: scoped.length - unavailable, unavailable, missingTickers };
}

export function sortRows(rows: readonly Candidate[], sort: Definition["sort"]): Candidate[] {
  const { metric, dir } = sort;
  const direction = dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const symbolOrder = a.symbol.localeCompare(b.symbol);
    if (metric === "ticker") return direction * symbolOrder;
    const av = a.values[metric], bv = b.values[metric];
    if (av === undefined || bv === undefined) return Number(av === undefined) - Number(bv === undefined) || symbolOrder;
    return (av - bv) * direction || symbolOrder;
  });
}
