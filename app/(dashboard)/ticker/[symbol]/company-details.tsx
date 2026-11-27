"use client";

import { useState, type ReactNode } from "react";
import { Box, Button, Link, Stack, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tabs, Typography } from "@mui/material";
import { DashboardPanel } from "@/app/dashboard-ui";
import type { readCompanySnapshot } from "@/src/modules/company/server/company-snapshot";

import type { CompanyTechnicals } from "@/src/modules/company/company-technicals";
import { CompanyTechnicalsPanel } from "./company-technicals-panel";

type Company = Awaited<ReturnType<typeof readCompanySnapshot>>;
type News = {id:string;title:string;date:string;href:string};
const companyTabs = [
  ["technicals", "Technicals"], ["levels", "Levels"], ["chart", "Chart"],
  ["profile", "Profile"], ["financials", "Financials"],
  ["filings", "SEC Filings"], ["news", "News"],
] as const;
export type CompanyTab = typeof companyTabs[number][0];
const number=new Intl.NumberFormat("en-US",{maximumFractionDigits:4});
const profileFields=[
  ["Exchange","exchange"],["Country","country"],["Industry","industry"],["Reported currency","currency"],
  ["IPO date","ipo"],["Phone","phone"],["Float","floatingShare"],["Shares outstanding","shareOutstanding"],["Market cap","marketCapitalization"],
] as const;
const formNames:Record<string,string>={"10-K":"Annual report","10-Q":"Quarterly report","8-K":"Current report","20-F":"Foreign issuer annual report","40-F":"Canadian issuer annual report","6-K":"Foreign issuer update","S-1":"Registration statement","F-1":"Foreign issuer registration statement","4":"Insider transaction"};
const preliminaryNames: Record<string, string> = {
  revenuefromcontractwithcustomerincludingassessedtax: "Revenue including assessed tax",
  revenuefromcontractwithcustomerexcludingassessedtax: "Revenue",
  revenue: "Revenue",
  disposalgroupincludingdiscontinuedoperationrevenue: "Discontinued operations revenue",
  earningspersharediluted: "Diluted earnings per share",
  dilutedearningslosspershare: "Diluted earnings per share",
  netincomeloss: "Net income / loss",
  profitloss: "Consolidated net income / loss",
};
const humanize=(value:string)=>value.replace(/([a-z0-9])([A-Z])/g,"$1 $2").replace(/([A-Z])([A-Z][a-z])/g,"$1 $2")
  .replace(/^./,first=>first.toUpperCase());

function formatProfileName(value:string) {
  if(value!==value.toUpperCase())return value;
  return value.replace(/[A-Z]+/g,word=>word.length<=2||["USA","UK","UAE","NYSE","AMEX","SEC","OTC"].includes(word)
    ?word:word==="NASDAQ"?"Nasdaq":word[0]+word.slice(1).toLowerCase());
}

function Fields({rows}:{rows:readonly (readonly [string,ReactNode])[]}){
  return <Box component="dl" sx={{m:0,display:"grid",gridTemplateColumns:"minmax(0,1fr) auto",gap:0.75}}>
    {rows.map(([label,value])=><Box key={label} sx={{display:"contents"}}>
      <Typography component="dt" variant="body2" color="text.secondary">{label}</Typography>
      <Typography component="dd" variant="body2" sx={{m:0,textAlign:"right",overflowWrap:"anywhere",maxWidth:"35ch"}}>{value}</Typography>
    </Box>)}
  </Box>;
}

function MetricColumns({rows}:{rows:readonly (readonly [string,ReactNode])[]}){
  const columnSize=Math.ceil(rows.length/2);
  return <Box sx={{display:"grid",gridTemplateColumns:{xs:"minmax(0,1fr)",xl:"repeat(2,minmax(0,1fr))"},gap:2}}>
    <Fields rows={rows.slice(0,columnSize)}/>
    {rows.length>columnSize&&<Fields rows={rows.slice(columnSize)}/>}
  </Box>;
}

export function CompanyDetails({company,news,technicalSample,levels,chart,onTabChange,deferredCompany,deferredNews,allowSupplementalReads=true,broker=false}:{
  company:Pick<Company,"symbol">&Partial<Omit<Company,"symbol">>;news:News[];technicalSample?:CompanyTechnicals;
  levels?:ReactNode;chart?:ReactNode;onTabChange?:(tab:CompanyTab)=>void;deferredCompany?:ReactNode;deferredNews?:ReactNode;
  allowSupplementalReads?:boolean;broker?:boolean;
}){
  const [tab,setTab]=useState<CompanyTab>("technicals");
  const [limit,setLimit]=useState(10);
  const profile=company.profile;
  const enriched=company.companyProfile;
  const name=typeof profile?.name==="string"?profile.name:company.name;
  const website=typeof profile?.weburl==="string"&&/^https?:\/\//i.test(profile.weburl)?profile.weburl:enriched?.website;
  const profileRows: [string,ReactNode][]=profileFields.flatMap(([label,key])=>{
    if(key==="industry"&&enriched?.industry)return [];
    const value=profile?.[key];
    return typeof value==="number"?[[label,`${number.format(value)}${["floatingShare","shareOutstanding","marketCapitalization"].includes(key)?"M":""}`]]:
      typeof value==="string"&&value.trim()?[[label,key==="currency"?value.trim().toUpperCase():["exchange","country","industry"].includes(key)?formatProfileName(value.trim()):value.trim()]]:[];
  });
  if(enriched){
    profileRows.unshift(["Sector",enriched.sector],["Industry",enriched.industry]);
    if(enriched.employees!==undefined)profileRows.push(["Employees",number.format(enriched.employees)]);
    if(enriched.founded)profileRows.push(["Founded",enriched.founded]);

  }
  const headquarters=company.headquarters||enriched?.headquarters;
  const fiscalYearEnd=company.fiscalYearEndLabel||enriched?.fiscalYearEnd;
  if(headquarters)profileRows.push(["Headquarters",headquarters.split(",").map(part=>formatProfileName(part.trim())).join(", ")]);
  if(fiscalYearEnd)profileRows.push(["Fiscal year end",fiscalYearEnd]);
  if(company.sic)profileRows.push(["SEC business classification",formatProfileName(company.sic)]);
  if(company.cik)profileRows.push(["SEC CIK",String(company.cik)]);
  if(website)profileRows.push(["Website",<Link key="website" href={website} target="_blank" rel="noopener noreferrer">Company website</Link>]);
  const metrics=Object.entries(company.metrics??{}).filter(([,value])=>typeof value==="number"&&Number.isFinite(value)||typeof value==="string"&&value.trim());
  const marketMetric = /^(?:52week|\d+day|\d+d|\d+week|\d+month|beta$|priceRelative|priceReturn|averageVolume)/i;
  const averageVolumeKeys=["10DayAverageTradingVolume","3MonthAverageTradingVolume"] as const;
  const averageVolumes=averageVolumeKeys.map(key=>{
    const amount=company.metrics?.[key];
    return typeof amount==="number"&&Number.isFinite(amount)?amount*1_000_000:null;
  });
  const rowsFor=(market:boolean)=>metrics
    .filter(([key])=>!/^52week(?:high|low)(?:date)?$/i.test(key)&&!averageVolumeKeys.some(volumeKey=>volumeKey===key)&&marketMetric.test(key)===market && !(key==="marketCapitalization"&&typeof profile?.marketCapitalization==="number"))
    .map(([key,value])=>[humanize(key),typeof value==="number"?number.format(value):String(value)] as const);
  const technicals=broker?[]:rowsFor(true);
  const financialMetrics=rowsFor(false);
  const brokerProfileFacts = broker ? {
    float: typeof profile?.floatingShare === "number" ? profile.floatingShare * 1_000_000 : null,
    marketCap: typeof profile?.marketCapitalization === "number" ? profile.marketCapitalization * 1_000_000 : null,
  } : undefined;
  const financials=company.financials??[];
  const preliminary=company.preliminary??[];
  const visible=tab==="filings"?company.filings??[]:news;
  return <Stack spacing={1.5} sx={{minWidth:0}}>
    <CompanyTechnicalsPanel key={company.symbol} symbol={company.symbol} sample={technicalSample} broker={broker} brokerProfileFacts={brokerProfileFacts} active={tab==="technicals"}
      inDrawer={Boolean(chart)} averageVolumes={averageVolumes} allowSupplementalReads={allowSupplementalReads}
      header={(latestPrice, change)=><>
        <Stack direction="row" sx={theme=>({alignItems:"baseline",gap:1,flexWrap:"wrap",...theme.applyStyles("dark",{"& .company-identity":{color:"#fff"}})})}>
          <Typography className="company-identity" component="h1" variant="h4" color="warning.main">{company.symbol}</Typography>
          {name&&<Typography className="company-identity" variant="h6">{name}</Typography>}
          {latestPrice&&<Typography sx={{fontWeight:700,color:change!=null&&change>0?"success.main":change!=null&&change<0?"error.main":"text.primary"}}>{latestPrice}</Typography>}
          {change!=null&&<Typography sx={{fontWeight:700,color:change>0?"success.main":change<0?"error.main":"text.secondary"}}
            title="Change from previous regular close">{change>0?"+":""}{number.format(change)}%</Typography>}
        </Stack>
        <Tabs value={tab} onChange={(_,value:CompanyTab)=>{setTab(value);setLimit(10);onTabChange?.(value);}}
          variant="scrollable" scrollButtons={false} aria-label="Company details"
          sx={{minHeight:42,"& .MuiTab-root":{minHeight:42,minWidth:0,px:{xs:1.25,sm:2},textTransform:"none"}}}>
          {companyTabs.filter(([value])=>{
            if(value==="levels")return Boolean(levels);
            if(value==="chart")return Boolean(chart);
            return true;
          }).map(([value,label])=><Tab key={value} id={`company-${value}-tab`}
            aria-controls={`company-${value}-panel`} value={value} label={value==="profile"&&!chart?"Company Profile":label}/>)}
        </Tabs>
      </>}>
      {technicals.length>0&&<MetricColumns rows={technicals}/>}
    </CompanyTechnicalsPanel>
    <Box role="tabpanel" id="company-profile-panel" aria-labelledby="company-profile-tab" hidden={tab!=="profile"} sx={{width:"100%",maxWidth:{md:460}}}>
    {tab==="profile"&&(deferredCompany??
      <DashboardPanel title="Company profile">
        {enriched&&<Typography variant="body2" sx={{mb:1.5}}>{enriched.description}</Typography>}
        {profileRows.length>0&&<Stack component="dl" spacing={0.75} sx={{m:0}}>
          {profileRows.map(([label,value])=><Box key={label} sx={{typography:"body2",overflowWrap:"anywhere"}}>
            <Box component="dt" sx={{display:"inline",fontWeight:700}}>{label}:</Box>{" "}
            <Box component="dd" sx={{display:"inline",m:0}}>{value}</Box>
          </Box>)}
        </Stack>}
      </DashboardPanel>)}
    </Box>
    <Box role="tabpanel" id="company-financials-panel" aria-labelledby="company-financials-tab" hidden={tab!=="financials"}>
      {tab==="financials"&&(deferredCompany??<DashboardPanel title="Financials">
        <Typography component="h3" variant="subtitle2" sx={{mb:1}}>Reported financials</Typography>
        {(financials.length>0||preliminary.length>0)?<TableContainer><Table size="small" aria-label="SEC reported financials">
          <TableHead><TableRow>{["Metric","Reported value","Period","Filed"].map(label=><TableCell key={label}>{label}</TableCell>)}</TableRow></TableHead>
          <TableBody>{financials.map(f=><TableRow key={f.label+f.accession+(f.start??"")}>
            <TableCell>{f.label}</TableCell><TableCell sx={{whiteSpace:"nowrap"}}>{number.format(f.value)} {f.unit}</TableCell>
            <TableCell sx={{whiteSpace:"nowrap"}}>{f.start?`${f.start} – `:""}{f.end}</TableCell>
            <TableCell>{f.href?<Link href={f.href} target="_blank" rel="noopener noreferrer">{f.filed}</Link>:f.filed}</TableCell>
          </TableRow>)}{preliminary.map(f=>{
            const concept=f.tag.split(":").at(-1)?.toLowerCase()??"";
            const qualifiers=f.dimensions.map(({member})=>humanize(member.split(":").at(-1)?.replace(/Member$/,"")??""));
            const label=[preliminaryNames[concept]??humanize(concept),...qualifiers].join(" · ");
            return <TableRow key={JSON.stringify([f.tag,f.accession,f.start,f.end,f.unit,f.value,f.dimensions])}>
              <TableCell>Preliminary · {label}{f.reconciledFiling&&typeof f.filedValue==="number"&&
                <Typography variant="caption" component="div" color="text.secondary">Filed value {number.format(f.filedValue)} {f.unit}</Typography>}
              </TableCell>
              <TableCell sx={{whiteSpace:"nowrap"}}>{number.format(f.value)} {f.unit}</TableCell>
              <TableCell sx={{whiteSpace:"nowrap"}}>{f.start} – {f.end}</TableCell>
              <TableCell><Link href={f.href} target="_blank" rel="noopener noreferrer">{f.filed}</Link></TableCell>
            </TableRow>;
          })}</TableBody>
        </Table></TableContainer>:<Typography variant="body2">—</Typography>}
        {financialMetrics.length>0&&<Box sx={{mt:2}}>
          <Typography component="h3" variant="subtitle2" sx={{mb:1}}>Ratios and valuation</Typography>
          <MetricColumns rows={financialMetrics}/>
        </Box>}
      </DashboardPanel>)}
    </Box>
    {levels&&<Box id="company-levels-panel" role="tabpanel" aria-labelledby="company-levels-tab" hidden={tab!=="levels"}>{levels}</Box>}
    {chart&&<Box id="company-chart-panel" role="tabpanel" aria-labelledby="company-chart-tab" hidden={tab!=="chart"}>
      {tab==="chart"&&chart}
    </Box>}
    {(["filings","news"] as const).map(section=><Box key={section} id={`company-${section}-panel`}
      role="tabpanel" aria-labelledby={`company-${section}-tab`} hidden={tab!==section}>
      {tab===section&&((section==="filings"?deferredCompany:deferredNews)??<DashboardPanel title={section==="filings"?"SEC Filings":"News"}>
        {tab==="filings"&&<Typography variant="caption" color="text.secondary">Last 12 months</Typography>}
        {visible.slice(0,limit).map(item=>{
          const filing="form" in item;
          const description=filing?(item.earningsAnnouncement?"Earnings announcement":formNames[item.form.replace(/\/A$/,"")]):null;
          return <Stack key={filing?item.accession:item.id} direction="row" sx={{gap:1,py:0.75,borderBottom:1,borderColor:"divider",alignItems:"baseline"}}>
            <Typography component="time" dateTime={item.date} variant="caption" color="text.secondary" sx={{whiteSpace:"nowrap"}}>{item.date.slice(0,10)}</Typography>
            <Link href={filing?(item.earningsHref??item.href):item.href} target={filing?"_blank":undefined} rel={filing?"noopener noreferrer":undefined} variant="body2">
              {filing?[item.form,description].filter(Boolean).join(" · "):item.title}
            </Link>
          </Stack>;
        })}
        {visible.length>limit&&<Button variant="outlined" size="small" sx={{mt:1}} onClick={()=>setLimit(value=>value+10)}>Load more</Button>}
        {tab==="filings"&&company.cik&&<Link sx={{display:"inline-block",ml:visible.length>limit?1.5:0,mt:1}} variant="body2"
          href={`https://www.sec.gov/edgar/browse/?CIK=${company.cik}`} target="_blank" rel="noopener noreferrer">View all filings on SEC</Link>}
      </DashboardPanel>)}
    </Box>)}
  </Stack>;
}
