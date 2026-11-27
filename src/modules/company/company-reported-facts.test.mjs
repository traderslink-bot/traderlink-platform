import { test } from "node:test";
import assert from "node:assert/strict";
import { extractReportedCompanyFacts, selectReportedStatements } from "./company-reported-facts.mjs";

const cutoff = "2026-11-26";
const original = { accession: "0001753926-26-000600", form: "10-K", date: "2026-03-31", reportDate: "2025-12-31" };
const old = { accession: "0000840715-18-000021", form: "10-K", date: "2018-04-02", reportDate: "2017-12-31" };
const amended = { ...original, accession: "0001753926-26-000801", form: "10-K/A", date: "2026-05-28" };
const laterQuarter = { accession: "0001753926-26-001010", form: "10-Q", date: "2026-08-12", reportDate: "2026-06-30" };

function point(filing, value, start, end = filing.reportDate) {
  return { accn: filing.accession, form: filing.form, filed: filing.date, start, end, val: value };
}

function evidence(filings, tags) {
  const facts = extractReportedCompanyFacts({ "us-gaap": tags }, filings, cutoff);
  return { facts, ...selectReportedStatements(facts, filings, cutoff, "USD") };
}

test("anchors CLRO to the FY2025 10-K and preserves the FY2017 observation", () => {
  const result = evidence([old, original], {
    SalesRevenueNet: { units: { USD: [point(old, 41_804_000, "2017-01-01")] } },
    RevenueFromContractWithCustomerIncludingAssessedTax: { units: { USD: [point(original, 0, "2025-01-01")] } },
    DisposalGroupIncludingDiscontinuedOperationRevenue: { units: { USD: [point(original, 6_009_000, "2025-01-01")] } },
  });
  assert.equal(result.annual.filing.reportDate, "2025-12-31");
  assert.deepEqual(result.annual.facts.map(({ metric, value }) => [metric, value]), [
    ["revenueIncludingAssessedTax", 0], ["discontinuedRevenue", 6_009_000],
  ]);
  assert.equal(result.facts.find(item => item.end === "2017-12-31").value, 41_804_000);
});

test("uses compatible periods and updates amended values individually", () => {
  const result = evidence([old, original, amended, laterQuarter], {
    Revenues: { units: { USD: [
      point(original, 12_000_000, "2025-01-01"), point(amended, 11_500_000, "2025-01-01"),
      point(laterQuarter, 6_000_000, "2026-01-01"), point(laterQuarter, 3_100_000, "2026-04-01"),
    ] } },
    EarningsPerShareDiluted: { units: { "USD/shares": [
      point(old, 2.10, "2017-01-01"), point(original, -1.43, "2025-01-01"),
    ] } },
  });
  assert.equal(result.annual.facts.find(item => item.metric === "revenue").value, 11_500_000);
  assert.equal(result.annual.facts.find(item => item.metric === "dilutedEps").value, -1.43);
  assert.equal(result.interim.facts.find(item => item.metric === "revenue").value, 3_100_000);
});

test("does not lift prior, conflicting or invalid evidence into the current statement", () => {
  const result = evidence([old, original], {
    Revenues: { units: { USD: [
      point(original, 12_000_000, "2025-01-01"),
      point(original, 20_000_000, "2025-01-01"),
      point(original, 9, "2025-00-01"),
    ] } },
    EarningsPerShareDiluted: { units: { "USD/shares": [point(old, 2.10, "2017-01-01")] } },
  });
  assert.deepEqual(result.annual.facts, []);
  assert.equal(result.facts.length, 3);
});
