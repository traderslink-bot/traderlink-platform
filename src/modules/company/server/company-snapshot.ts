import { companyProfileFacts, companyMetricFacts } from "../company-data-wire.mjs";
import "server-only";
import { extractReportedCompanyFacts, selectReportedStatements } from "../company-reported-facts.mjs";
import { readCompanyData as json, readCompanyRecords } from "@/src/lib/news/company-data-gateway";
import { readCompanyProfileSample, previewCompanyCik } from "./company-profile-samples";

export type Filing = { date: string; form: string; accession: string; href: string; reportDate?: string; acceptedAt?: string; earningsAnnouncement?: boolean; earningsHref?: string };
type Fact = { val: number; start?: string; end: string; filed: string; accn: string; form: string; fy?: number; fp?: string };
type CompanyDirectory = Record<string,{ticker:string;cik_str:number;title:string}>;
type Concepts = Record<string, { units: Record<string, Fact[]> }>;
type Submissions = { name?: string; sicDescription?: string; fiscalYearEnd?:string; addresses?:{business?:{city?:string;stateOrCountry?:string;stateOrCountryDescription?:string}}; filings: {
  recent: { filingDate: string[]; reportDate?: string[]; acceptanceDateTime?: string[]; form: string[]; accessionNumber: string[]; primaryDocument: string[] };
  files?: { name: string; filingTo: string; filingFrom: string }[];
} };

export function companySymbol(value: string) {
  const symbol = value.trim().toUpperCase();
  return /^[A-Z][A-Z0-9.-]{0,14}$/.test(symbol) ? symbol : null;
}

export function filingRows(cik:number, recent:Submissions["filings"]["recent"], since:string, today:string):Filing[] {
  return recent.filingDate.flatMap((date,i)=>{
    const accession=recent.accessionNumber[i], document=recent.primaryDocument[i], form=recent.form[i];
    if(date<since||date>today||!/^\d{10}-\d{2}-\d{6}$/.test(accession)||!form)return [];
    const base=`https://www.sec.gov/Archives/edgar/data/${cik}/${accession.replaceAll("-","")}`;
    const href=/^[\w.-]+(?:\/[\w.-]+)*$/.test(document)&&!document.split("/").some(part=>part===".."||part===".") ? `${base}/${document}` : `${base}/${accession}-index.htm`;
    return [{date,form,accession,href,reportDate:recent.reportDate?.[i]||undefined,acceptedAt:recent.acceptanceDateTime?.[i]||undefined}];
  });
}

export function reportedFacts(facts:Record<string,Concepts>, preferredCurrency:unknown, filings:Filing[], today:string) {
  const observations = extractReportedCompanyFacts(facts, filings, today);
  const statements = selectReportedStatements(observations, filings, today, preferredCurrency);
  return [...(statements.interim?.facts ?? []), ...(statements.annual?.facts ?? [])];
}

type SelectedStatements = ReturnType<typeof selectReportedStatements>;
type PreliminaryFigure = {
  tag: string;
  value: number;
  unit: string;
  start: string;
  end: string;
  filed: string;
  accession: string;
  href: string;
  dimensions: { member: string }[];
  reconciledFiling?: string;
  filedValue?: number;
};
type PersistedCompany = {
  background?: boolean;
  cik?: string | null;
  profile?: { value?: Record<string, unknown> | null };
  metrics?: { value?: { metrics?: Record<string, unknown> } | null };
  sec?: {
    value?: {
      statements: SelectedStatements;
      filings: Filing[];
      earnings?: { figures: PreliminaryFigure[] }[];
      filingCoverage?: { complete: boolean };
      name?: string;
      sic?: string;
      fiscalYearEnd?: string;
      headquarters?: string;
    } | null;
  };
};

function formatFiscalYearEnd(fiscalYearEnd?: string) {
  const fiscalDate = fiscalYearEnd && /^\d{4}$/.test(fiscalYearEnd)
    ? new Date(`2000-${fiscalYearEnd.slice(0,2)}-${fiscalYearEnd.slice(2)}T12:00:00Z`)
    : null;
  return fiscalDate && Number.isFinite(fiscalDate.getTime())
    ? new Intl.DateTimeFormat("en-US", { month:"long", day:"numeric", timeZone:"UTC" }).format(fiscalDate)
    : undefined;
}

async function readPersistedCompanySnapshot(symbol: string, view: "full" | "overview") {
  const record = await readCompanyRecords<{ companies: PersistedCompany[] }>([symbol]);
  const snapshot = record?.companies[0];
  const sec = snapshot?.sec?.value;
  const profile = snapshot?.profile?.value ?? null;
  const metrics = snapshot?.metrics?.value?.metrics ?? null;
  const cik = snapshot?.cik ? Number(snapshot.cik) : undefined;
  const companyProfile = process.env.NODE_ENV !== "production" ? readCompanyProfileSample(cik ?? previewCompanyCik(symbol)) : undefined;
  return { company: {
    symbol, cik, companyProfile, headquarters: sec?.headquarters ?? "",
    fiscalYearEndLabel: formatFiscalYearEnd(sec?.fiscalYearEnd), name: sec?.name, sic: sec?.sic,
    profile, metrics, filings: view === "full" ? sec?.filings ?? [] : [],
    filingsAvailable: view === "full" && Boolean(sec?.filingCoverage?.complete),
    preliminary: view === "full" ? sec?.earnings?.flatMap(release => release.figures) ?? [] : [],
    financials: view === "full" ? [...(sec?.statements.interim?.facts ?? []), ...(sec?.statements.annual?.facts ?? [])] : [],
  }, background: snapshot?.background === true };
}

export async function readCompanySnapshot(symbol:string, view:"full"|"overview"="full", onDemand=false) {
  const persisted = process.env.TRADERLINK_COMPANY_PERSISTED_READS === "1" ? await readPersistedCompanySnapshot(symbol, view) : undefined;
  if (persisted && !onDemand) return persisted.company;
  const saved = persisted?.background ? persisted.company : undefined;
  if (saved?.profile && saved.metrics && (view === "overview" || saved.filingsAvailable)) return saved;

  const profileRequest=saved?.profile ?? json<Record<string,unknown>>("profile",symbol);
  const directoryRequest=!saved?.cik&&(view==="full"||onDemand)?json<CompanyDirectory>("directory"):null;
  const legacyMetrics=onDemand?null:json<{metric?:Record<string,unknown>}>("metrics",symbol);
  const [rawProfile,directory]=await Promise.all([profileRequest,directoryRequest]);
  const profile=!onDemand||rawProfile?.ticker===symbol?rawProfile:null;
  const company=Object.values(directory??{}).find(item=>item.ticker===symbol);
  const metricsRequest=onDemand&&!saved?.metrics&&(company||profile||saved?.cik)?json<{metric?:Record<string,unknown>}>("metrics",symbol):legacyMetrics;
  const cik=saved?.cik??company?.cik_str??(view==="full"&&process.env.NODE_ENV!=="production"?previewCompanyCik(symbol):undefined);
  const id=view==="full"&&!saved?.filingsAvailable?cik?.toString().padStart(10,"0"):undefined;
  const [metrics,submissions,data]=await Promise.all([metricsRequest,
    id ? json<Submissions>("submissions",`CIK${id}.json`,3600) : null,
    id ? json<{facts:Record<string,Concepts>}>("facts",`CIK${id}.json`) : null,
  ]);
  const today=new Date().toISOString().slice(0,10);
  const cutoff=new Date(today);
  cutoff.setUTCFullYear(cutoff.getUTCFullYear()-1);
  const since=cutoff.toISOString().slice(0,10);
  const filings=cik&&submissions ? filingRows(cik,submissions.filings.recent,since,today) : [];
  if(cik&&submissions){
    const shards=await Promise.all((submissions.filings.files??[]).filter(x=>x.filingTo>=since&&x.filingFrom<=today&&/^CIK\d+-submissions-\d+\.json$/.test(x.name))
      .map(x=>json<Submissions["filings"]["recent"]>("submissions",x.name)));
    for(const shard of shards)if(shard)filings.push(...filingRows(cik,shard,since,today));
  }
  const unique=[...new Map(filings.map(f=>[f.accession,f])).values()].sort((a,b)=>b.date.localeCompare(a.date)||b.accession.localeCompare(a.accession));
  const statementFilings = cik && submissions ? [...unique, ...filingRows(cik, submissions.filings.recent, "", today)] : [];
  const companyProfile=process.env.NODE_ENV!=="production"?readCompanyProfileSample(cik):undefined;
  const business=submissions?.addresses?.business;
  const headquarters=[business?.city,business?.stateOrCountryDescription||business?.stateOrCountry].filter(Boolean).join(", ");
  const fiscalYearEndLabel = formatFiscalYearEnd(submissions?.fiscalYearEnd);
  // The UI does not use upstream logo assets. Keep its profile facts neutral,
  // without exposing vendor-specific field names or unused asset URLs.
  const profileFacts=companyProfileFacts(profile);
  const publicProfile:Record<string,unknown>|null=saved?.profile??(profileFacts?{...profileFacts,industry:profileFacts.industry??profileFacts.finnhubIndustry}:null);
  if(publicProfile){delete publicProfile.finnhubIndustry;delete publicProfile.logo;}
  return {symbol,cik,companyProfile,headquarters:headquarters||saved?.headquarters||"",fiscalYearEndLabel:fiscalYearEndLabel??saved?.fiscalYearEndLabel,
    name:submissions?.name??saved?.name??company?.title,sic:submissions?.sicDescription??saved?.sic,profile:publicProfile,
    metrics:saved?.metrics??(metrics?.metric?companyMetricFacts(metrics.metric):null),
    filings:saved?.filingsAvailable?saved.filings:unique,filingsAvailable:Boolean(saved?.filingsAvailable||submissions),
    preliminary:saved?.preliminary??[] as PreliminaryFigure[],
    financials:saved?.filingsAvailable?saved.financials:reportedFacts(data?.facts??{},profile?.currency,statementFilings,today)};
}
