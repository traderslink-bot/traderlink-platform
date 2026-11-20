/** Portable public-data contract shared by the VPS gateway and Railway. */
export const COMPANY_WIRE_SCHEMA = 'traderslink.company.1';
export const COMPANY_WIRE_RESOURCES = Object.freeze({directory:'issuer-directory',profile:'issuer-identity',metrics:'issuer-statistics',submissions:'filing-register',facts:'reported-accounts'});
/** @typedef {'directory'|'profile'|'metrics'|'submissions'|'facts'} CompanyResource */

const scalar='scalar';
const record=fields=>({fields});
const array=each=>({each});
const dictionary=values=>({values});
const fields=table=>record(Object.fromEntries(Object.entries(table).map(([key,name])=>[key,[name,scalar]])));
const profile=fields({country:'domicile',currency:'moneyCode',exchange:'listingVenue',ipo:'listingDate',marketCapitalization:'equityValueMillions',name:'legalName',phone:'telephone',shareOutstanding:'issuedSharesMillions',floatingShare:'tradableSharesMillions',ticker:'symbol',weburl:'issuerWebsite',finnhubIndustry:'industry',industry:'industryName',sector:'sector',description:'businessDescription',fullTimeEmployees:'employeeCount'});
const point=fields({start:'periodFrom',end:'periodThrough',val:'amount',accn:'accession',fy:'fiscalYear',fp:'fiscalPeriod',form:'reportType',filed:'reportedOn',frame:'reportingFrame'});
const concept=record({label:['caption',scalar],description:['meaning',scalar],units:['measurements',dictionary(array(point))]});
const facts=record({cik:['registryNumber',scalar],entityName:['legalName',scalar],facts:['accounts',dictionary(dictionary(concept))]});
const metrics=record({symbol:['symbol',scalar],metricType:['scope',scalar],metric:['statistics',{metrics:true}],series:['history',dictionary(dictionary(array(fields({period:'date',v:'amount'}))))]});
const filingNames={accessionNumber:'accessions',filingDate:'filingDates',reportDate:'reportDates',acceptanceDateTime:'acceptedAt',act:'acts',form:'forms',fileNumber:'fileNumbers',filmNumber:'filmNumbers',items:'items',size:'documentBytes',isXBRL:'structured',isInlineXBRL:'inlineStructured',primaryDocument:'documents',primaryDocDescription:'documentDescriptions'};
const filingRows=record(Object.fromEntries(Object.entries(filingNames).map(([key,name])=>[key,[name,array(scalar)]])));
const address=fields({street1:'street',street2:'additionalStreet',city:'city',stateOrCountry:'regionCode',zipCode:'postalCode',stateOrCountryDescription:'region'});
const submissionFields={cik:'registryNumber',entityType:'entityCategory',sic:'industryCode',sicDescription:'industryDescription',ownerOrg:'registrantCategory',insiderTransactionForOwnerExists:'hasOwnerTransactions',insiderTransactionForIssuerExists:'hasIssuerTransactions',name:'legalName',ein:'taxIdentifier',description:'businessDescription',website:'issuerWebsite',investorWebsite:'investorWebsite',category:'issuerCategory',fiscalYearEnd:'fiscalClose',stateOfIncorporation:'incorporationCode',stateOfIncorporationDescription:'incorporationRegion',phone:'telephone'};
const filingRegister=record({
 recent:['latest',filingRows],
 files:['historyDocuments',array(fields({name:'document',filingCount:'count',filingFrom:'coversFrom',filingTo:'coversThrough'}))],
});
const submissions=record({
 ...Object.fromEntries(Object.entries(submissionFields).map(([key,name])=>[key,[name,scalar]])),
 tickers:['symbols',array(scalar)], exchanges:['listingVenues',array(scalar)],
 addresses:['locations',record({mailing:['mailing',address],business:['business',address]})],
 formerNames:['previousNames',array(fields({name:'name',from:'from',to:'through'}))],
 filings:['filingRegister',filingRegister],
});
const directory=dictionary(fields({cik_str:'registryNumber',ticker:'symbol',title:'legalName'}));
const schemas={profile,metrics,facts,submissions,directory};

function transform(spec,value,decode,budget,depth=0){
 if(++budget.nodes>4_000_000||depth>32)throw Error('company_contract_invalid');
 if(value===null)return null;
 if(spec===scalar){if(typeof value!=='string'&&typeof value!=='boolean'&&!(typeof value==='number'&&Number.isFinite(value)))throw Error('company_contract_invalid');return value;}
 if('each' in spec){if(!Array.isArray(value))throw Error('company_contract_invalid');return value.map(item=>transform(spec.each,item,decode,budget,depth+1));}
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('company_contract_invalid');
 if('metrics' in spec)return companyMetricFacts(value);
 if('values' in spec)return Object.fromEntries(Object.entries(value).map(([key,item])=>{if(key.length>256||['__proto__','constructor','prototype'].includes(key))throw Error('company_contract_invalid');return[key,transform(spec.values,item,decode,budget,depth+1)];}));
 const result={};
 for(const [domain,[wire,child]] of Object.entries(spec.fields)){const key=decode?wire:domain;if(Object.hasOwn(value,key)&&value[key]!==undefined)result[decode?domain:wire]=transform(child,value[key],decode,budget,depth+1);}
 return result;
}
/** @param {CompanyResource} kind @param {unknown} value */
export function encodeCompanyData(kind,value){
 if(!Object.hasOwn(schemas,kind))throw Error('company_contract_invalid');
 const archive=kind==='submissions'&&value&&typeof value==='object'&&Object.hasOwn(value,'filingDate');
 return {schema:COMPANY_WIRE_SCHEMA,resource:COMPANY_WIRE_RESOURCES[kind],...(kind==='submissions'?{part:archive?'archive':'issuer'}:{}),data:transform(archive?filingRows:schemas[kind],value,false,{nodes:0})};
}
/** @param {CompanyResource} kind @param {unknown} value @returns {unknown} */
export function decodeCompanyData(kind,value){
 if(!Object.hasOwn(schemas,kind)||!value||typeof value!=='object'||Array.isArray(value)||value.schema!==COMPANY_WIRE_SCHEMA||value.resource!==COMPANY_WIRE_RESOURCES[kind])throw Error('company_contract_invalid');
 if(kind==='submissions'&&!['archive','issuer'].includes(value.part))throw Error('company_contract_invalid');
 return transform(kind==='submissions'&&value.part==='archive'?filingRows:schemas[kind],value.data,true,{nodes:0});
}
/** @param {string} pathname @returns {CompanyResource|null} */
export function companyWireResource(pathname){return Object.keys(COMPANY_WIRE_RESOURCES).find(key=>pathname===`/traderslink/v1/company/${COMPANY_WIRE_RESOURCES[key]}`)??null;}
/** @param {string} base @param {CompanyResource} kind @param {string} key */
export function companyWireUrl(base,kind,key=''){
 if(!Object.hasOwn(schemas,kind))throw Error('company_contract_invalid');
 const url=new URL(base);url.pathname=url.pathname.replace(/\/company-data\/?$/,'').replace(/\/$/,'')+`/traderslink/v1/company/${COMPANY_WIRE_RESOURCES[kind]}`;url.search=new URLSearchParams(key?{id:key}:{}).toString();return url;
}
/** @param {Record<string,string|undefined>} environment */
export function companyWireEnabled(environment){return environment.TRADERLINK_COMPANY_GATEWAY_CONTRACT===COMPANY_WIRE_SCHEMA;}

/** Financial dictionary values are numbers/dates, never diagnostics or transport envelopes. */
export function companyMetricFacts(value){
 if(!value||typeof value!=='object'||Array.isArray(value))return {};
 const metadata=/^(provider|providerSymbol|source|sourceUrl|origin|transport|metadata|debug|requestId|traceId|apiKey|api_key|token|authorization|headers)$/i;
 const supplier=/alpaca|moomoo|finnhub|eodhd|tiingo|databento/i;
 return Object.fromEntries(Object.entries(value).filter(([key,item])=>{
  if(key.length>256||metadata.test(key)||supplier.test(key)||['__proto__','constructor','prototype'].includes(key))return false;
  if(item===null||typeof item==='boolean')return true;
  if(typeof item==='number')return Number.isFinite(item);
  return typeof item==='string'&&(/^[+-]?[\d.,]+(?:[eE][+-]?\d+|[KMBTkmbt%])?$/.test(item)||/^\d{4}[-/]\d{2}[-/]\d{2}(?:T[\d:.+-]+Z?)?$/.test(item)||['','-','—','N/A','n/a'].includes(item));
 }));
}
/** Ordinary profile projection also protects existing warm/legacy cache entries. */
export function companyProfileFacts(value){
 if(!value||typeof value!=='object'||Array.isArray(value))return null;
 return Object.fromEntries(Object.keys(profile.fields).flatMap(key=>{
  if(!Object.hasOwn(value,key))return [];
  const item=value[key];return item===null||typeof item==='string'||typeof item==='boolean'||typeof item==='number'&&Number.isFinite(item)?[[key,item]]:[];
 }));
}
