import type {NextRequest} from "next/server";
import {startSharedFixture} from "@/src/modules/communities/server/shared-alerts-staging-fixture-controller";
export const runtime="nodejs";
export async function POST(request:NextRequest,{params}:{params:Promise<{nonce:string}>}){try{return await startSharedFixture(request,(await params).nonce);}catch{return new Response("Private test unavailable.",{status:404,headers:{"Cache-Control":"no-store"}});}}
