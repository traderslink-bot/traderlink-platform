import { requireTraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { requirePlatformMutationRequest } from "@/src/modules/platform/server/authentication/platform-mutation-request-security";
import { hasWatchlistDashboardNavigationAccess } from "@/src/modules/watchlist/server/access/watchlist-dashboard-navigation-access";
import { resolveFinnhubExchange } from "@/src/modules/scanner/live/server/finnhub-exchange";
import { scannerManualTickerStore } from "@/src/modules/scanner/live/server/runtime";

export const runtime="nodejs";export const dynamic="force-dynamic";
function allowed(request:Request,mutation=false){try{const identity=requireTraderLinkPlatformRequestIdentity(request.headers);if(!hasWatchlistDashboardNavigationAccess(identity))return false;if(mutation)requirePlatformMutationRequest(request);return true;}catch{return false;}}
const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{"cache-control":"no-store"}});
export async function GET(request:Request){if(!allowed(request))return json({code:"forbidden"},403);try{return json({tickers:await scannerManualTickerStore().list()});}catch{return json({code:"manual_tickers_unavailable"},503);}}
export async function POST(request:Request){if(!allowed(request,true))return json({code:"forbidden"},403);try{const body=await request.json() as {symbol?:unknown},symbol=typeof body.symbol==="string"?body.symbol.trim().toUpperCase():"";const exchange=await resolveFinnhubExchange(symbol,process.env.FINNHUB_API_KEY);if(!exchange)return json({code:"ticker_not_found"},400);return json({tickers:await scannerManualTickerStore().add(symbol,exchange)},201);}catch(error){const code=error instanceof Error?error.message:"";return json({code:/^scanner_manual_ticker_/u.test(code)?code:"manual_tickers_unavailable"},code.includes("invalid")?400:503);}}
export async function DELETE(request:Request){if(!allowed(request,true))return json({code:"forbidden"},403);try{const symbol=new URL(request.url).searchParams.get("symbol")??"";return json({tickers:await scannerManualTickerStore().remove(symbol)});}catch(error){const code=error instanceof Error?error.message:"";return json({code:/^scanner_manual_ticker_/u.test(code)?code:"manual_tickers_unavailable"},code.includes("invalid")?400:503);}}
