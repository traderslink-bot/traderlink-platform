export type CommunityTickerResearch = Readonly<{ notes: string; research: string; sources: readonly string[];priceTarget?:string;supportLevels?:readonly string[];stopLoss?:string;publisherTake?:string }>;
export type CommunityWatchlistResearch = Readonly<Record<string, CommunityTickerResearch>>;

export function parseWatchlistResearch(raw: string, symbols: readonly string[]): CommunityWatchlistResearch {
  const parsed: unknown = JSON.parse(raw || "{}");
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Check your ticker notes and research.");
  const result: Record<string, CommunityTickerResearch> = Object.create(null);
  for (const symbol of symbols) {
    const value = (parsed as Record<string, unknown>)[symbol];
    if (value === undefined) continue;
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Check your ticker notes and research.");
    const item = value as Record<string, unknown>;
    if (typeof item.notes !== "string" || typeof item.research !== "string" || !Array.isArray(item.sources) || item.sources.some(source => typeof source !== "string")) throw new Error("Check your ticker notes and research.");
    const sources = (item.sources as string[]).map(source => source.trim()).filter(Boolean);
    for (const source of sources) {
      let url: URL;
      try { url = new URL(source); } catch { throw new Error("Source links must be complete http or https URLs."); }
      if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) throw new Error("Source links must be complete http or https URLs.");
    }
    const optional=(key:string,max:number)=>{const value=item[key];if(value===undefined)return undefined;if(typeof value!=="string"||value.length>max)throw new Error("Check your ticker notes and research.");return value.trim();};
    const supportLevels=item.supportLevels===undefined?undefined:Array.isArray(item.supportLevels)&&item.supportLevels.every(level=>typeof level==="string")?(item.supportLevels as string[]).map(level=>level.trim()).filter(Boolean):null;
    if(supportLevels===null||(supportLevels!==undefined&&supportLevels.length>20))throw new Error("Check your support levels.");
    result[symbol] = { notes: item.notes, research: item.research, sources,priceTarget:optional("priceTarget",80),supportLevels,stopLoss:optional("stopLoss",80),publisherTake:optional("publisherTake",2000) };
  }
  return result;
}
