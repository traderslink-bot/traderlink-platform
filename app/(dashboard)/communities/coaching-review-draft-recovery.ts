/** Recovery is confined to this browser tab and never grants or writes Journal access. */
export function readCoachingDraftRecovery(key:string,saved:Readonly<Record<string,string>>,allowed:readonly string[]):Record<string,string>{
 try{
  const raw=sessionStorage.getItem(key);if(!raw||raw.length>2_000_000)return {};
  const recovery=JSON.parse(raw) as {version?:number;entries?:unknown};
  if(recovery.version!==1||!recovery.entries||typeof recovery.entries!=='object'||Array.isArray(recovery.entries))return {};
  const permitted=new Set(allowed),restored:Record<string,string>={};
  for(const [id,entry] of Object.entries(recovery.entries)){
   if(!permitted.has(id)||!entry||typeof entry!=='object')continue;
   const item=entry as {baseline?:unknown;draft?:unknown};
   if(typeof item.baseline==='string'&&typeof item.draft==='string'&&item.draft.length<=100_000&&item.baseline===(saved[id]??'')&&item.draft!==item.baseline)restored[id]=item.draft;
  }
  return restored;
 }catch{return {};}
}

export function storeCoachingDraftRecovery(key:string,drafts:Readonly<Record<string,string>>,saved:Readonly<Record<string,string>>):void{
 try{
  const entries=Object.fromEntries(Object.entries(drafts).filter(([id,draft])=>draft!==(saved[id]??'')).map(([id,draft])=>[id,{baseline:saved[id]??'',draft}]));
  if(Object.keys(entries).length)sessionStorage.setItem(key,JSON.stringify({version:1,entries}));else sessionStorage.removeItem(key);
 }catch{/* The navigation warning still applies if browser storage is unavailable. */}
}

export function clearCoachingDraftRecovery(key:string):void{try{sessionStorage.removeItem(key);}catch{/* No browser storage. */}}
