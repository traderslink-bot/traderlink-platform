import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Public copies exist only after explicit owner X selection and verified publication. */
export async function GET(_request: Request, context: {params:Promise<{token:string}>}) {
  const {token}=await context.params;
  const headers={'cache-control':'no-store','x-content-type-options':'nosniff','x-robots-tag':'noindex, nofollow','referrer-policy':'no-referrer'};
  if(!/^[a-f0-9]{48}$/.test(token))return new Response(null,{status:404,headers});
  const image=withPlatformDatabase({mode:'runtime'},db=>db.prepare<[string],{png:Buffer}>(`SELECT i.png FROM platform_watchlist_x_images i
    JOIN platform_watchlist_x_posts p ON p.post_key=i.post_key WHERE i.token=? AND p.approval_revision IS NOT NULL
    AND p.state IN ('sending','accepted','sent','uncertain')`).get(token));
  if(!image)return new Response(null,{status:404,headers});
  return new Response(new Uint8Array(image.png),{headers:{...headers,'content-type':'image/png','content-disposition':'inline; filename="traderslink-analysis.png"'}});
}
