import {timingSafeEqual} from "node:crypto";
import {runHostedCoachingMaintenance} from "@/src/modules/communities/server/coaching-maintenance-runtime";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(request:Request){
 const secret=process.env.CRON_SECRET?.trim(),authorization=request.headers.get("authorization");
 if(!secret||!authorization)return Response.json({ok:false},{status:401});
 const expected=Buffer.from(`Bearer ${secret}`),actual=Buffer.from(authorization);
 if(actual.length!==expected.length||!timingSafeEqual(actual,expected))return Response.json({ok:false},{status:401});
 const result=await runHostedCoachingMaintenance();
 return Response.json(result??{ok:true,busy:true},{headers:{"Cache-Control":"no-store"}});
}
