import { requireTraderLinkPlatformBillingRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { MembershipAddonAmendmentRepository } from "@/src/modules/platform/server/membership/membership-addon-amendment-repository";
import { membershipAddonAmendmentView } from "@/src/modules/platform/server/membership/membership-addon-amendment-view";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(request: Request,{params}:{params:Promise<{id:string}>}): Promise<Response> {
  try {
    const {scope}=requireTraderLinkPlatformBillingRequestIdentity(request.headers),{id}=await params;
    const row=withReadonlyPlatformDatabase({},db=>new MembershipAddonAmendmentRepository(db).read(scope.userId,id));
    return Response.json({ok:true,amendment:membershipAddonAmendmentView(row)},{headers:{"cache-control":"private, no-store"}});
  }catch{return Response.json({ok:false,message:"This add-on change is unavailable."},{status:404,headers:{"cache-control":"private, no-store"}})}
}
