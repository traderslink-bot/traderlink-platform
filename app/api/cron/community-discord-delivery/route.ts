import { timingSafeEqual } from "node:crypto";

import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { TraderLinkCommunityDiscordDeliveryService } from "@/src/modules/communities/server/traderlink-community-discord-delivery-service";

export const runtime="nodejs"; export const dynamic="force-dynamic"; export const revalidate=0;
function authorized(request:Request){const secret=process.env.CRON_SECRET?.trim();const supplied=request.headers.get("authorization");if(!secret||!supplied)return false;const a=Buffer.from(`Bearer ${secret}`),b=Buffer.from(supplied);return a.length===b.length&&timingSafeEqual(a,b);}
export async function GET(request:Request):Promise<Response>{if(!authorized(request))return Response.json({ok:false},{status:401});const token=process.env.TRADERLINK_DISCORD_BOT_TOKEN?.trim();const publicOrigin=process.env.TRADERLINK_PLATFORM_PUBLIC_ORIGIN?.trim();if(!token||!publicOrigin)return Response.json({ok:false,reason:"not_configured"},{status:503});const database=openPlatformDatabase({mode:"runtime"});try{const result=await new TraderLinkCommunityDiscordDeliveryService(database,{botToken:token,publicOrigin:new URL(publicOrigin).origin}).runAvailable(25);return Response.json({ok:true,...result});}catch{return Response.json({ok:false},{status:503});}finally{database.close();}}
