export function membershipOwnerGrantRecurrence(unit: string | null, count: number | null): string | null {
  if (!unit || count === null) return null;
  return `Recurring owner access every ${count} ${unit}${count === 1 ? "" : "s"} · no payment charged`;
}
