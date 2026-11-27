import {
  isCompanyMetric,
  type CompanyMetric,
  type CompanyFilingOperand,
  type CompanyReadings,
} from "./audited-filters";
import type { ScanRule } from "./definition";

export const companyMatchEvidence = Symbol("company-match-evidence");
export type CompanyMatchPin = {
  revision: number;
  asOf: number;
  fields: {
    metric: CompanyMetric;
    value: number | string[];
    accessions: string[];
    operands?: CompanyFilingOperand[];
  }[];
};
export function pinMatchedCompanyFields(
  reading: CompanyReadings | undefined,
  rules: readonly ScanRule[],
  matches: readonly (number | null | undefined)[],
): CompanyMatchPin | undefined {
  if (!reading?.evidence) return;
  const { revision, asOf, filingsByMetric } = reading.evidence;
  const fields: CompanyMatchPin["fields"] = [];
  for (const [index, rule] of rules.entries()) {
    if (matches[index] === undefined || !isCompanyMetric(rule.metric)) continue;
    const key = rule.metric;
    const value = key === "recentFiling" ? reading.forms : reading.values[key];
    if (value !== undefined && !fields.some((f) => f.metric === key))
      fields.push({
        metric: key,
        value,
        accessions: filingsByMetric[key] ?? [],
        operands: reading.evidence.operands[key],
      });
  }
  if (fields.length) return { revision, asOf, fields };
}
