const MAX_ENTRIES=500;
const TTL_MS=15_000;

type Entry=Readonly<{expiresAt:number;value:unknown}>;
const entries=new Map<string,Entry>();

export function readCommunityContentCache<T>(key:string,load:()=>T):T{
 const now=Date.now();
 const cached=entries.get(key);
 if(cached&&cached.expiresAt>now){entries.delete(key);entries.set(key,cached);return cached.value as T;}
 if(cached)entries.delete(key);
 const value=load();entries.set(key,{expiresAt:now+TTL_MS,value});
 while(entries.size>MAX_ENTRIES)entries.delete(entries.keys().next().value as string);
 return value;
}

export function invalidateCommunityContentCache(scope:string):void{
 for(const key of entries.keys())if(key.startsWith(scope))entries.delete(key);
}

export function communityDestinationCacheScope(pageId:string):string{return `destination:${pageId}:`;}
export function communityHubCacheScope(communityId:string):string{return `hub:${communityId}:`;}
