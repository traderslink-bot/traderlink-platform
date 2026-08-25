import { NextResponse } from "next/server";

import { getCommunityTickerCompanyFacts } from "@/src/modules/community/server/community-ticker-company-facts-service";
import { requireTraderLinkPlatformPageScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";

export const dynamic = "force-dynamic";

function symbolsFromRequest(request: Request): readonly string[] {
  const source = new URL(request.url).searchParams.get("symbols") ?? "";
  const symbols = source.split(",").map((symbol) => symbol.trim().toUpperCase()).filter(Boolean);
  return Object.freeze([...new Set(symbols.filter((symbol) => /^[A-Z0-9][A-Z0-9.-]{0,14}$/u.test(symbol)))].slice(0, 50));
}

export async function GET(request: Request) {
  await requireTraderLinkPlatformPageScope();
  const symbols = symbolsFromRequest(request);
  return NextResponse.json(await getCommunityTickerCompanyFacts(symbols));
}
