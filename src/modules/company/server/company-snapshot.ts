import "server-only";
import { readCompanyData as json } from "@/src/lib/news/company-data-gateway";
import { readCompanyProfileSample, previewCompanyCik } from "./company-profile-samples";

const DAY = 86_400;

export type Filing = { date: string; form: string; accession: string; href: string };
export type ReportedFact = {
  label: string; value: number; unit: string; start?: string; end: string; filed: string; accession: string; href?: string;
};
type Fact = { val: number; start?: string; end: string; filed: string; accn: string; form: string };
type Concepts = Record<string, { units: Record<string, Fact[]> }>;
type Submissions = { name?: string; sicDescription?: string; fiscalYearEnd?:string; addresses?:{business?:{city?:string;stateOrCountry?:string;stateOrCountryDescription?:string}}; filings: {
  recent: { filingDate: string[]; form: string[]; accessionNumber: string[]; primaryDocument: string[] };
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
    return [{date,form,accession,href}];
  });
}

const concepts = [
  ["Revenue","RevenueFromContractWithCustomerExcludingAssessedTax","Revenues","Revenue","SalesRevenueNet"],
  ["Net income / loss","NetIncomeLoss","ProfitLoss"],
  ["Cash and equivalents","CashAndCashEquivalentsAtCarryingValue","CashAndCashEquivalents"],
  ["Total assets","Assets"], ["Total liabilities","Liabilities"],
  ["Operating cash flow","NetCashProvidedByUsedInOperatingActivities","CashFlowsFromUsedInOperatingActivities"],
  ["Shares outstanding","EntityCommonStockSharesOutstanding","CommonStockSharesOutstanding"],
] as const;

export function reportedFacts(facts:Record<string,Concepts>, preferredCurrency:unknown, filings:Filing[], today:string):ReportedFact[] {
  const links=new Map(filings.map(f=>[f.accession,f.href]));
  return concepts.flatMap(([label,...keys])=>{
    const candidates:ReportedFact[]=[];
    for(const namespace of ["us-gaap","ifrs-full","dei"])for(const key of keys){
      for(const [unit, entries] of Object.entries(facts[namespace]?.[key]?.units??{})){
        if(label==="Shares outstanding" ? unit!=="shares" : !/^[A-Z]{3}$/.test(unit))continue;
        for(const item of entries){
          if(!/^(10-K|10-Q|20-F|40-F|6-K)(\/A)?$/.test(item.form)||!Number.isFinite(item.val)||item.end>today||item.filed>today)continue;
          candidates.push({label,value:item.val,unit,start:item.start,end:item.end,filed:item.filed,accession:item.accn,href:links.get(item.accn)});
        }
      }
    }
    candidates.sort((a,b)=>b.end.localeCompare(a.end)||Number(b.unit===preferredCurrency)-Number(a.unit===preferredCurrency)||b.filed.localeCompare(a.filed));
    const latest=candidates[0];
    if(!latest)return [];
    const annual=candidates.find(item=>item.unit===latest.unit&&item.start&&
      Date.parse(item.end)-Date.parse(item.start)>=350*DAY*1000);
    return annual&&(annual.end!==latest.end||annual.start!==latest.start)?[latest,annual]:[latest];
  });
}

export async function readCompanySnapshot(symbol:string) {
  const profileRequest=json<Record<string,unknown>>("profile",symbol);
  const metricsRequest=json<{metric?:Record<string,unknown>}>("metrics",symbol);
  const directory=await json<Record<string,{ticker:string;cik_str:number;title:string}>>("directory");
  const company=Object.values(directory??{}).find(item=>item.ticker===symbol);
  const cik=company?.cik_str??(process.env.NODE_ENV!=="production"?previewCompanyCik(symbol):undefined);
  const id=cik?.toString().padStart(10,"0");
  const [profile,metrics,submissions,data]=await Promise.all([profileRequest,metricsRequest,
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
  const companyProfile=process.env.NODE_ENV!=="production"?readCompanyProfileSample(cik):undefined;
  const business=submissions?.addresses?.business;
  const headquarters=[business?.city,business?.stateOrCountryDescription||business?.stateOrCountry].filter(Boolean).join(", ");
  const fiscalYearEnd=submissions?.fiscalYearEnd;
  const fiscalDate=fiscalYearEnd&&/^\d{4}$/.test(fiscalYearEnd)?new Date(`2000-${fiscalYearEnd.slice(0,2)}-${fiscalYearEnd.slice(2)}T12:00:00Z`):null;
  const fiscalYearEndLabel=fiscalDate&&Number.isFinite(fiscalDate.getTime())
    ? new Intl.DateTimeFormat("en-US",{month:"long",day:"numeric",timeZone:"UTC"}).format(fiscalDate):undefined;
  return {symbol,cik,companyProfile,headquarters,fiscalYearEndLabel,name:submissions?.name??company?.title,sic:submissions?.sicDescription,profile,metrics:metrics?.metric??null,
    filings:unique, filingsAvailable:Boolean(submissions),financials:reportedFacts(data?.facts??{},profile?.currency,unique,today)};
}
