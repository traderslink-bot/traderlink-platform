/** Serializable authoring format. No raw HTML, provider secrets or public/private mixing. */
export type SwingText = { text: string; bold?: boolean; italic?: boolean; underline?: boolean; href?: string };
export type SwingBlock = { id: string; kind: "paragraph" | "heading" | "bullet" | "numbered"; runs: SwingText[] }
  | { id: string; kind: "image"; src: string; alt: string };
export type SwingSection = { id: string; title: string; visible: boolean; blocks: SwingBlock[] };
export type SwingPublicTeaser = { headline: string; title: string; description: string };
export type SwingPlanDocument = {
  ticker: string; title: string; status: "open" | "closed";
  teaser: SwingPublicTeaser;
  company: { visible: boolean; fields: { label: string; value: string }[]; fetchedAt: number | null };
  sections: SwingSection[];
  updates: { id: string; at: number; title: string; blocks: SwingBlock[] }[];
  closingSummary: SwingBlock[];
  premiumComment: string; freeComment: string;
};
export const SWING_DEFAULT_SECTION_TITLES = ["Trade thesis", "DD & research", "Entry & exit plan", "Key levels", "Risks"] as const;
export function newSwingPlan(): SwingPlanDocument {
  return { ticker: "", title: "", status: "open",
    teaser: {headline:"A swing trade plan for TradersLink Premium members.",title:"TradersLink Premium Swing Trade Plan",description:"Explore the research, trade thesis, planned entries and exits, key levels and risks."},
    company:{visible:true,fields:[],fetchedAt:null},
    sections:SWING_DEFAULT_SECTION_TITLES.map((title,index)=>({id:"section-"+index,title,visible:true,blocks:[]})),
    updates:[],closingSummary:[],premiumComment:"",freeComment:"" };
}
export function swingSafeUrl(value: string): string | null {
  try { const url=new URL(value);return url.protocol==="https:" && !url.username && !url.password ? url.href : null; } catch { return null; }
}
export function swingBlockText(blocks: readonly SwingBlock[]): string {
  return blocks.map(block=>block.kind==="image"?block.alt:block.runs.map(run=>run.text).join("")).join("\n");
}
/** The built-in thesis keeps its identity when renamed or reordered. */
export function swingPremiumComment(document: SwingPlanDocument): string {
  if(document.premiumComment.trim())return document.premiumComment;
  const thesis=document.sections.find(section=>section.id==='section-0');
  return thesis?.visible?swingBlockText(thesis.blocks):'';
}
export function hasSwingContent(blocks: readonly SwingBlock[]): boolean {
  return blocks.some(block=>block.kind==="image" ? Boolean(swingSafeUrl(block.src)) : block.runs.some(run=>run.text.trim()));
}
export function containsSwingTicker(text:string,ticker:string):boolean {
  if(!ticker)return false;
  const escaped=ticker.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  // Short symbols can also be ordinary words (A, I, IT). Match their uppercase
  // symbol or an explicit cashtag without rejecting ordinary sentence wording.
  return (ticker.length>1&&new RegExp('(^|[^A-Za-z0-9])'+escaped+'(?=$|[^A-Za-z0-9])',ticker.length>2?'i':'').test(text))
    || new RegExp('\\$'+escaped+'(?=$|[^A-Za-z0-9])','i').test(text);
}
function record(value:unknown):Record<string,unknown>{if(!value||typeof value!=="object"||Array.isArray(value))throw Error("Invalid plan content.");return value as Record<string,unknown>;}
function string(value:unknown,max:number):string{if(typeof value!=="string"||value.length>max)throw Error("A plan field is too long or invalid.");return value;}
function array(value:unknown,max:number):unknown[]{if(!Array.isArray(value)||value.length>max)throw Error("Too many plan items.");return value;}
function boolean(value:unknown):boolean{if(typeof value!=="boolean")throw Error("Invalid display setting.");return value;}
function identifier(value:unknown):string{const result=string(value,80);if(!/^[a-zA-Z0-9_-]+$/.test(result))throw Error("Invalid section identity.");return result;}
function unique<T extends {id:string}>(items:T[]):T[]{if(new Set(items.map(item=>item.id)).size!==items.length)throw Error("Duplicate section or update.");return items;}
export function validateSwingBlocks(value:unknown):SwingBlock[]{
  return unique(array(value,300).map(item=>{
    const b=record(item),id=identifier(b.id);
    if(b.kind==="image"){
      const raw=string(b.src,2000),src=raw?swingSafeUrl(raw):'';if(raw&&!src)throw Error("Images must use an HTTPS address.");
      return {id,kind:"image" as const,src:src??'',alt:string(b.alt,1000)};
    }
    if(!["paragraph","heading","bullet","numbered"].includes(String(b.kind)))throw Error("Invalid text block.");
    const runs=array(b.runs,300).map(value=>{
      const r=record(value),run:SwingText={text:string(r.text,20000)};
      for(const key of ["bold","italic","underline"] as const)if(r[key]!==undefined)run[key]=boolean(r[key]);
      if(r.href!==undefined){const href=swingSafeUrl(string(r.href,2000));if(!href)throw Error("Links must use an HTTPS address.");run.href=href;}
      return run;
    });
    return {id,kind:b.kind as "paragraph"|"heading"|"bullet"|"numbered",runs};
  }));
}
export function validateSwingPlan(value:unknown):SwingPlanDocument {
  const p=record(value),teaser=record(p.teaser),company=record(p.company);
  const ticker=string(p.ticker,15).trim().toUpperCase();
  if(ticker&&!/^[A-Z0-9][A-Z0-9.-]{0,14}$/.test(ticker))throw Error("Enter a valid ticker.");
  if(p.status!=="open"&&p.status!=="closed")throw Error("Invalid idea status.");
  const parsed:SwingPlanDocument={ticker,title:string(p.title,200),status:p.status,
    teaser:{headline:string(teaser.headline,500),title:string(teaser.title,200),description:string(teaser.description,1000)},
    company:{visible:boolean(company.visible),fetchedAt:typeof company.fetchedAt==="number"&&Number.isFinite(company.fetchedAt)?company.fetchedAt:null,
      fields:array(company.fields,30).map(v=>{const f=record(v);return {label:string(f.label,100),value:string(f.value,1000)};})},
    sections:unique(array(p.sections,40).map(v=>{const s=record(v);return {id:identifier(s.id),title:string(s.title,200),visible:boolean(s.visible),blocks:validateSwingBlocks(s.blocks)};})),
    updates:unique(array(p.updates,300).map(v=>{const u=record(v);if(typeof u.at!=="number"||!Number.isFinite(u.at)||u.at<=0||u.at>8640000000000000)throw Error("Invalid update date.");return {id:identifier(u.id),at:u.at,title:string(u.title,200),blocks:validateSwingBlocks(u.blocks)};})),
    closingSummary:validateSwingBlocks(p.closingSummary),premiumComment:string(p.premiumComment,1500),freeComment:string(p.freeComment,1500)};
  if(JSON.stringify(parsed).length>800000)throw Error("Plan is too large. Shorten it before saving.");
  return parsed;
}
