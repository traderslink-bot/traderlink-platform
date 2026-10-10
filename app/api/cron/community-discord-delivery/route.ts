import { timingSafeEqual } from "node:crypto";

import { runHostedCommunityDiscordDelivery } from "@/src/modules/communities/server/community-discord-delivery-runtime";

export const runtime="nodejs"; export const dynamic="force-dynamic"; export const revalidate=0;
function authorized(request:Request){const secret=process.env.CRON_SECRET?.trim();const supplied=request.headers.get("authorization");if(!secret||!supplied)return false;const a=Buffer.from(`Bearer ${secret}`),b=Buffer.from(supplied);return a.length===b.length&&timingSafeEqual(a,b);}
export async function GET(request:Request):Promise<Response>{if(!authorized(request))return Response.json({ok:false},{status:401});if(!process.env.TRADERLINK_DISCORD_BOT_TOKEN?.trim()||!process.env.TRADERLINK_PLATFORM_PUBLIC_ORIGIN?.trim())return Response.json({ok:false,reason:"not_configured"},{status:503});try{const result=await runHostedCommunityDiscordDelivery();return Response.json({ok:true,...(result??{skipped:true})});}catch{return Response.json({ok:false},{status:503});}}
