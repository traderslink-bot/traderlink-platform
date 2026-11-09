"use client";

import "flag-icons/css/flag-icons.min.css";
import { getWatchlistCountryFlag } from "@/src/lib/live-watchlist/watchlist-country-flag";

export function ScannerCountryFlag({country}:{country:unknown}) {
  const flag=getWatchlistCountryFlag(country);
  return flag?<span className={`fi fi-${flag.code.toLowerCase()}`} role="img" aria-label={`${flag.label} flag`} title={flag.label} style={{fontSize:12,verticalAlign:"middle"}}/>
    :<span aria-label="Country unavailable" title="Country unavailable">—</span>;
}
