import "server-only";

export function pressReleaseMarketCapValue(value:string|null):number|null{
  if(!value)return null;
  const normalized=value.trim().replace(/[$,\s]/gu,"").toUpperCase();
  const match=normalized.match(/^([0-9]+(?:\.[0-9]+)?)([KMBT])?$/u);
  if(!match)return null;
  const multiplier=match[2]==="K"?1e3:match[2]==="M"?1e6:match[2]==="B"?1e9:match[2]==="T"?1e12:1;
  const result=Number(match[1])*multiplier;
  return Number.isFinite(result)?result:null;
}
export function eligibleCompactMarketEvents<T extends { id: string; marketCap: string | null }>(rows: readonly T[], limit: number) {
  return rows.flatMap(row => {
    const cap = pressReleaseMarketCapValue(row.marketCap);
    return cap === null || cap < limit ? [row.id] : [];
  });
}
