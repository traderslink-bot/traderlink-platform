const annualForm = /^(?:10-K|10-KT|20-F|40-F)$/;
const interimForm = /^10-Q$/;
const statementForm = /^(?:10-K|10-KT|10-Q|20-F|40-F)(?:\/A)?$/;
const accessionPattern = /^\d{10}-\d{2}-\d{6}$/;
const isoDate = /^\d{4}-\d{2}-\d{2}$/;
const dayMs = 86_400_000;

/** @type {Array<[string,string,string,string,string,string[]]>} */
const definitions = [
  ["revenue", "Revenue", "operating", "currency", "duration", ["RevenueFromContractWithCustomerExcludingAssessedTax", "Revenues", "Revenue", "SalesRevenueNet"]],
  ["revenueIncludingAssessedTax", "Revenue including assessed tax", "operating", "currency", "duration", ["RevenueFromContractWithCustomerIncludingAssessedTax"]],
  ["discontinuedRevenue", "Discontinued operations revenue", "discontinued", "currency", "duration", ["DisposalGroupIncludingDiscontinuedOperationRevenue", "RevenueFromDiscontinuedOperations"]],
  ["grossProfit", "Gross profit", "operating", "currency", "duration", ["GrossProfit"]],
  ["netIncome", "Net income / loss", "parent", "currency", "duration", ["NetIncomeLoss", "ProfitLossAttributableToOwnersOfParent"]],
  ["totalNetIncome", "Consolidated net income / loss", "consolidated", "currency", "duration", ["ProfitLoss"]],
  ["continuingIncome", "Income / loss from continuing operations", "continuing", "currency", "duration", ["IncomeLossFromContinuingOperations", "IncomeLossFromContinuingOperationsIncludingPortionAttributableToNoncontrollingInterest"]],
  ["dilutedEps", "Diluted earnings per share", "issuerCommon", "perShare", "duration", ["EarningsPerShareDiluted", "DilutedEarningsLossPerShare"]],
  ["cash", "Cash and equivalents", "consolidated", "currency", "instant", ["CashAndCashEquivalentsAtCarryingValue", "CashAndCashEquivalents"]],
  ["assets", "Total assets", "consolidated", "currency", "instant", ["Assets"]],
  ["liabilities", "Total liabilities", "consolidated", "currency", "instant", ["Liabilities"]],
  ["operatingCashFlow", "Operating cash flow", "consolidated", "currency", "duration", ["NetCashProvidedByUsedInOperatingActivities", "CashFlowsFromUsedInOperatingActivities"]],
  ["sharesOutstanding", "Shares outstanding", "issuerCommon", "shares", "instant", ["EntityCommonStockSharesOutstanding", "CommonStockSharesOutstanding"]],
];

/**
 * @typedef {{date:string, form:string, accession:string, href:string, reportDate?:string, acceptedAt?:string}} Filing
 * @typedef {{val:number, start?:string, end:string, filed:string, accn:string, form:string, fy?:number, fp?:string}} Point
 * @typedef {Record<string, Record<string, {units:Record<string, Point[]>}>>} Taxonomies
 * @typedef {{metric:string,label:string,scope:string,periodKind:string,value:number,unit:string,currency:string|null,
 * start?:string,end:string,filed:string,accession:string,acceptedAt?:string,href?:string,form:string,
 * filingFiscalYear?:number,filingFiscalPeriod?:string,taxonomy:string,concept:string,source:"sec",status:"filed"|"amended"}} Observation
 */

/** @param {string | undefined} value */
function validDate(value) {
  if (typeof value !== "string" || !isoDate.test(value)) return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && new Date(parsed).toISOString().slice(0, 10) === value;
}

/** @param {string} unit @param {string} kind */
function validUnit(unit, kind) {
  if (kind === "shares") return unit === "shares";
  return kind === "perShare" ? /^[A-Z]{3}\/shares$/.test(unit) : /^[A-Z]{3}$/.test(unit);
}

/**
 * Preserve dated observations independently of which filing currently anchors a read.
 * Company Facts contains entity-wide observations. Dimensional evidence from a
 * filing document must carry its verified dimensions before entering this store.
 * @param {Taxonomies} facts @param {Filing[]} filings @param {string} today
 * @returns {Observation[]}
 */
export function extractReportedCompanyFacts(facts, filings, today) {
  const metadata = new Map(filings.map(filing => [filing.accession, filing]));
  /** @type {Map<string, Observation>} */
  const observations = new Map();
  for (const [metric, label, scope, unitKind, periodKind, tags] of definitions) {
    for (const taxonomy of ["us-gaap", "ifrs-full", "dei"]) {
      for (const concept of tags) {
        for (const [unit, points] of Object.entries(facts[taxonomy]?.[concept]?.units ?? {})) {
          if (!validUnit(unit, unitKind) || !Array.isArray(points)) continue;
          for (const point of points) {
            if (!statementForm.test(point?.form) || !accessionPattern.test(point.accn) ||
                !Number.isFinite(point.val) || !validDate(point.end) || point.end > today ||
                !validDate(point.filed) || point.filed > today) continue;
            if (periodKind === "duration" ? !point.start || !validDate(point.start) || point.start >= point.end : point.start) continue;
            const filing = metadata.get(point.accn);
            const key = [metric, taxonomy, concept, unit, point.start, point.end, point.accn, point.val].join("|");
            observations.set(key, {
              metric, label, scope, periodKind, value: point.val, unit,
              currency: unitKind === "shares" ? null : unit.slice(0, 3),
              start: point.start, end: point.end, filed: point.filed, accession: point.accn,
              acceptedAt: filing?.acceptedAt, href: filing?.href, form: point.form,
              filingFiscalYear: point.fy, filingFiscalPeriod: point.fp,
              taxonomy, concept, source: "sec", status: point.form.endsWith("/A") ? "amended" : "filed",
            });
          }
        }
      }
    }
  }
  return [...observations.values()];
}

/** @param {Filing[]} filings @param {RegExp} forms @param {string} today */
function targets(filings, forms, today) {
  /** @type {Map<string, Filing & {reportDate:string}>} */
  const periods = new Map();
  for (const filing of filings) {
    const end = filing.reportDate;
    if (!end || !validDate(end) || end > today || !validDate(filing.date) || filing.date > today ||
        !forms.test(filing.form) || !accessionPattern.test(filing.accession)) continue;
    const previous = periods.get(end);
    if (!previous || compareFilings(filing, previous) > 0) periods.set(end, { ...filing, reportDate: end });
  }
  return [...periods.values()].sort((a, b) => b.reportDate.localeCompare(a.reportDate));
}

/** @param {Filing} a @param {Filing} b */
function compareFilings(a, b) {
  return a.date.localeCompare(b.date) ||
    (a.acceptedAt ?? "").localeCompare(b.acceptedAt ?? "") ||
    a.accession.localeCompare(b.accession);
}

/**
 * Accept one unambiguous observation from the newest filing with evidence for
 * the field. The original supplies fields an exhibit-only amendment omits.
 * @param {Observation[]} candidates @param {unknown} currency
 */
function choose(candidates, currency) {
  const newest = [...candidates].sort((a, b) => b.filed.localeCompare(a.filed) ||
    (b.acceptedAt ?? "").localeCompare(a.acceptedAt ?? "") ||
    Number(b.status === "amended") - Number(a.status === "amended") ||
    b.accession.localeCompare(a.accession))[0];
  if (!newest) return;
  const latest = candidates.filter(item => item.accession === newest.accession);
  const preferred = latest.filter(item => item.currency === currency);
  const comparable = preferred.length > 0 ? preferred : latest;
  const selected = comparable[0];
  if (comparable.every(item =>
    item.unit === selected.unit && item.value === selected.value && item.start === selected.start)) return selected;
}

/**
 * @param {Observation[]} observations
 * @param {Filing & {reportDate:string}} target
 * @param {Filing[]} filings
 * @param {RegExp} forms
 * @param {boolean} annual
 * @param {string} today
 * @param {unknown} preferredCurrency
 */
function forTarget(observations, target, filings, forms, annual, today, preferredCurrency) {
  const accessions = new Set(filings.filter(filing => filing.reportDate === target.reportDate &&
    filing.date <= today && forms.test(filing.form.replace(/\/A$/, ""))).map(filing => filing.accession));
  const candidates = observations.filter(item => {
    if (item.end !== target.reportDate || !accessions.has(item.accession)) return false;
    if (!item.start) return true;
    const days = (Date.parse(item.end) - Date.parse(item.start)) / dayMs + 1;
    return annual ? (days >= 350 && days <= 378) || (target.form === "10-KT" && days <= 378) : days >= 77 && days <= 105;
  });
  return definitions.flatMap(([metric]) => {
    const chosen = choose(candidates.filter(item => item.metric === metric), preferredCurrency);
    return chosen ? [{
      ...chosen,
      fiscalYear: chosen.filingFiscalYear,
      fiscalPeriod: annual ? "FY" : chosen.filingFiscalPeriod,
    }] : [];
  });
}

/**
 * @param {Observation[]} observations @param {Filing[]} filings
 * @param {string} today @param {unknown} preferredCurrency
 */
export function selectReportedStatements(observations, filings, today, preferredCurrency) {
  const [annual, previousAnnual] = targets(filings, annualForm, today);
  const [latestInterim] = targets(filings, interimForm, today);
  const interim = latestInterim && (!annual || latestInterim.reportDate > annual.reportDate) ? latestInterim : undefined;
  return {
    annual: annual && { filing: annual, facts: forTarget(observations, annual, filings, annualForm, true, today, preferredCurrency) },
    previousAnnual: previousAnnual && { filing: previousAnnual, facts: forTarget(observations, previousAnnual, filings, annualForm, true, today, preferredCurrency) },
    interim: interim && { filing: interim, facts: forTarget(observations, interim, filings, interimForm, false, today, preferredCurrency) },
  };
}
