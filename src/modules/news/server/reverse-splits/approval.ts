import { isoDate } from "./contracts";

const months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
export const writtenDatePattern = "(?:January|February|March|April|May|June|July|August|September|October|November|December)\\s+\\d{1,2},?\\s+20\\d{2}";
export const splitPattern = "reverse[ -](?:(?:stock|share)[ -])?split";
const ratioPattern = /\b1\s*(?:-\s*(?:for\s*-\s*)?|for\s+|:\s*)(\d+(?:\.\d+)?)\b/giu;

export function parseWrittenDate(value: string): string | null {
  const match = new RegExp(`(${writtenDatePattern})`, "iu").exec(value);
  if (!match) return null;
  const parts = /^(\w+)\s+(\d{1,2}),?\s+(20\d{2})$/u.exec(match[1]);
  if (!parts) return null;
  const result = `${parts[3]}-${String(months.indexOf(parts[1].toLowerCase()) + 1).padStart(2, "0")}-${parts[2].padStart(2, "0")}`;
  return isoDate(result) ? result : null;
}

function datesIn(value: string): string[] {
  return [...new Set([...value.matchAll(new RegExp(writtenDatePattern, "giu"))].flatMap((match) => {
    const date = parseWrittenDate(match[0]);
    return date ? [date] : [];
  }))];
}

export function splitRatios(value: string): number[] {
  return [...new Set([...value.matchAll(ratioPattern)].map((match) => Number(match[1])).filter((n) => n > 1 && n <= 1_000_000))];
}

export function shareholderApproval(parts: readonly string[], published: string): Readonly<{
  evidence: string; date: string | null; expires: string | null; authorizedRatio: string | null;
}> | null {
  const active = new RegExp(`(?:shareholders|stockholders)[^.]{0,180}?\\b(?:approved|adopted)\\b[\\s\\S]{0,650}?${splitPattern}`, "iu");
  const passive = new RegExp(`${splitPattern}[\\s\\S]{0,400}?\\b(?:approved|adopted)\\b[^.]{0,120}?by (?:the )?(?:shareholders|stockholders)`, "iu");
  const candidates = parts.flatMap((part, index) => {
    const match = active.exec(part) ?? passive.exec(part);
    if (!match || /\b(?:if|unless|when|once)\s+(?:the\s+)?(?:shareholders|stockholders)|\b(?:not|never)\s+approved|did not approve|has not|have not|subject to[^.]{0,70}approval|approval[^.]{0,30}(?:not required|is required)/iu.test(part)) return [];
    const previous = parts[index - 1] ?? "";
    const approvalOffset = match[0].search(/\b(?:approved|adopted)\b/iu);
    const prefix = part.slice(0, match.index + approvalOffset);
    const context = /\b(?:meeting|written consent)\b/iu.test(previous) && !new RegExp(splitPattern, "iu").test(previous) ? previous : "";
    const beforeDates = datesIn(`${context} ${prefix}`);
    const inlineDate = new RegExp(`(?:approved|adopted)(?: on)?\\s+(${writtenDatePattern})`, "iu").exec(part)?.[1];
    const date = inlineDate ? parseWrittenDate(inlineDate) : beforeDates.length === 1 ? beforeDates[0] : null;
    if (date && date > published) return [];
    const expiryMatches = [...part.matchAll(new RegExp(`(?:on or before|no later than|until|prior to)\\s+(${writtenDatePattern})`, "giu"))];
    const expiryDates = [...new Set(expiryMatches.map((item) => parseWrittenDate(item[1])).filter((item): item is string => item !== null))];
    const values = splitRatios(part.slice(match.index));
    const range = /\b(?:between|ranging|range|through|up to|not more than|not greater than)\b/iu.test(part);
    const authorizedRatio = values.length === 1
      ? `${/up to|not more than|not greater than/iu.test(part) ? "Up to " : ""}1-for-${values[0]}`
      : values.length === 2 && range ? `1-for-${Math.min(...values)} to 1-for-${Math.max(...values)}` : null;
    return [{ evidence: `${context} ${part}`.trim(), date, expires: expiryDates.length === 1 ? expiryDates[0] : null, authorizedRatio }];
  });
  const dated = candidates.filter((candidate) => candidate.date !== null).sort((a, b) => b.date!.localeCompare(a.date!));
  const latest = dated[0] ?? candidates[0];
  if (!latest) return null;
  const sameDate = candidates.filter((candidate) => candidate.date === latest.date);
  if (sameDate.some((candidate) => candidate.authorizedRatio && latest.authorizedRatio && candidate.authorizedRatio !== latest.authorizedRatio)) return null;
  return latest;
}
