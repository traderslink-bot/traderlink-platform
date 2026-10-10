import {requireTraderLinkPlatformRequestIdentity} from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import {withReadonlyPlatformDatabase} from "@/src/modules/platform/server/database/open-readonly-platform-database";
import {resolveTraderLinkCommunityViewer} from "@/src/modules/communities/server/traderlink-community-viewer";
import {TraderLinkCommunityCoachingProgramService} from "@/src/modules/communities/server/traderlink-community-coaching-program-service";
import {isTraderLinkPlatformError} from "@/src/modules/platform/server/database/platform-migration-contract";

export const dynamic="force-dynamic";
const unavailable = () => new Response(null, {
  status: 404,
  headers: {"Cache-Control":"private, no-store"},
});

export async function GET(request:Request,{params}:{params:Promise<{communitySlug:string;attachmentId:string}>}){
  try {
    const {communitySlug,attachmentId}=await params;
    const identity=requireTraderLinkPlatformRequestIdentity(request.headers);
    const image=withReadonlyPlatformDatabase({},database=>{
      const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug);
      const community=database.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(communitySlug) as {community_id:string}|undefined;
      if(!community)return null;
      return new TraderLinkCommunityCoachingProgramService(database).readImage({communityId:community.community_id,actor,attachmentId});
    });
    if(!image)return unavailable();
    const fallbackName=image.filename.replace(/[^\x20-\x7e]|["\\]/g,"_");
    const encodedName=encodeURIComponent(image.filename).replace(/['()*]/g,character=>`%${character.charCodeAt(0).toString(16).toUpperCase()}`);
    return new Response(new Uint8Array(image.content),{headers:{"Content-Type":image.mediaType,"Content-Disposition":`inline; filename="${fallbackName}"; filename*=UTF-8''${encodedName}`,"Cache-Control":"private, no-store"}});
  } catch (error) {
    // Use one non-disclosing response for absent, invalid and inaccessible images.
    // Unexpected database/runtime failures still propagate for operational diagnosis.
    if(isTraderLinkPlatformError(error) && [
      "TRADERLINK_WORKSPACE_ACCESS_DENIED",
      "TRADERLINK_DASHBOARD_ACCESS_DENIED",
      "TRADERLINK_ACCOUNT_ACCESS_DENIED",
      "TRADERLINK_AUTH_SESSION_INVALID",
      "TRADERLINK_WORKSPACE_NOT_FOUND",
      "TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED",
    ].includes(error.code))return unavailable();
    throw error;
  }
}
