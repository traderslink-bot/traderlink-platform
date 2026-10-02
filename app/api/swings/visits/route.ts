import { createHash } from "node:crypto";
import { isSwingIdeaId, SWING_IDEA } from "@/src/modules/swings/swing-idea-catalog";
import { readSwingIdeaAccess } from "@/src/modules/swings/server/swing-idea-access";
import { recordSwingVisit } from "@/src/modules/swings/server/swing-idea-visits";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { requirePlatformMutationRequest } from "@/src/modules/platform/server/authentication/platform-mutation-request-security";
import { SwingPlanStore } from "@/src/modules/swings/server/swing-plan-store";

export const runtime = "nodejs";
const buckets = new Map<string, { count: number; until: number }>();
const response = (status: number) => new Response(null,{status,headers:{"Cache-Control":"private, no-store"}});
export async function POST(request: Request) {
  // Existing proxy-aware same-origin protection, including the mutation header.
  try { requirePlatformMutationRequest(request); } catch { return response(403); }
  if (Number(request.headers.get("content-length")) > 512) return response(413);
  const now = Date.now();
  for (const [key,value] of buckets) if (value.until < now) buckets.delete(key);
  // Transient hash for abuse limiting only; never stored or used to identify visitors.
  const key = createHash("sha256").update(request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown").digest("hex");
  const bucket = buckets.get(key) ?? {count:0,until:now+60000};
  if ((buckets.size >= 1000 && !buckets.has(key)) || ++bucket.count > 30) return response(429);
  buckets.set(key,bucket);
  try {
    const reader = request.body?.getReader();
    if (!reader) return response(400);
    let text = ""; let bytes = 0; const decoder = new TextDecoder();
    while (true) {
      const chunk = await reader.read(); if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > 512) { await reader.cancel(); return response(413); }
      text += decoder.decode(chunk.value,{stream:true});
    }
    text += decoder.decode();
    let body: {ideaId?:unknown; eventId?:unknown;revision?:unknown};
    try { body = JSON.parse(text); } catch { return response(400); }
    if (!body || typeof body !== "object") return response(400);
    if (typeof body.ideaId!=="string"||!/^[a-f0-9]{32}$/.test(body.ideaId) || typeof body.eventId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.eventId)) return response(400);
    const info=withPlatformDatabase({mode:"runtime"},db=>new SwingPlanStore(db).publicInfo(body.ideaId as string));
    if(!isSwingIdeaId(body.ideaId)&&!info)return response(404);
    let revision=info?String(info.version):SWING_IDEA.revision;
    if(body.revision!==undefined){
      if(body.revision===SWING_IDEA.revision&&isSwingIdeaId(body.ideaId))revision=SWING_IDEA.revision;
      else if(typeof body.revision==='number'&&Number.isSafeInteger(body.revision)&&body.revision>0){
        const exists=withPlatformDatabase({mode:'runtime'},db=>db.prepare('SELECT 1 FROM platform_swing_plan_publications WHERE idea_id=? AND version=?').get(body.ideaId,body.revision));
        if(!exists)return response(400);revision=String(body.revision);
      }else return response(400);
    }
    const access = await readSwingIdeaAccess(request.headers);
    withPlatformDatabase({mode:"runtime"},db=>recordSwingVisit(db,{eventId:body.eventId as string,userId:access.identity?.scope.userId ?? null,premium:access.premium,now,ideaId:info?.id,revision}));
    return response(204);
  } catch {
    console.error("swing_idea_visit_recording_failed");
    return response(503);
  }
}
