import { type Candidate, type Definition, type Rule, type Snapshot, type Sort, type SortKey } from "./contracts";

export const PAGE_SIZE = 50;

export function matchesRule(row: Candidate, rule: Rule): boolean | null {
  const actual = row.values[rule.metric];
  if (actual === undefined) return null;
  const matches = compareValue(actual, rule);
  return rule.exclude ? !matches : matches;
}

function compareValue(actual: number, rule: Rule): boolean {
  switch (rule.operator) {
    case "gte": return actual >= rule.value;
    case "lte": return actual <= rule.value;
    case "gt": return actual > rule.value;
    case "lt": return actual < rule.value;
    case "eq": return actual === rule.value;
    case "between": return actual >= rule.value && actual <= rule.upper!;
  }
}

function matchesGroup(row: Candidate, group: Rule[]): boolean | null {
  let unknown = false;
  for (const rule of group) {
    const result = matchesRule(row, rule);
    if (result === true) return true;
    if (result === null) unknown = true;
  }
  return unknown ? null : false;
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
    for (const group of definition.groups ?? []) rules.push(matchesGroup(row, group));
    if (rules.includes(false)) continue;
    if (row.values.price === undefined || rules.includes(null)) unavailable++;
    else rows.push(row);
  }
  return { rows, eligible: scoped.length, evaluated: scoped.length - unavailable, unavailable, missingTickers };
}

function compareRows(a: Candidate, b: Candidate, { metric, dir }: SortKey): number {
  const direction = dir === "asc" ? 1 : -1;
  if (metric === "ticker") return direction * a.symbol.localeCompare(b.symbol);
  const av = a.values[metric], bv = b.values[metric];
  if (av === undefined || bv === undefined) return Number(av === undefined) - Number(bv === undefined);
  return (av - bv) * direction;
}

export function sortRows(rows: readonly Candidate[], sort: Sort): Candidate[] {
  return [...rows].sort((a, b) => compareRows(a, b, sort)
    || (sort.secondary ? compareRows(a, b, sort.secondary) : 0)
    || a.symbol.localeCompare(b.symbol));
}
