import type Database from "better-sqlite3";

export function communityPublicationDestinationUrl(db:Database.Database,input:{publicOrigin:string;communityId:string;communitySlug:string;kind:"alert"|"watchlist";objectId:string}):string{
 const page=db.prepare(`SELECT page.slug,page.secondary_slug FROM traderlink_community_content_placements placement
  JOIN traderlink_community_content_pages page ON page.page_id=placement.page_id AND page.community_id=placement.community_id
  WHERE placement.community_id=? AND placement.content_type=? AND placement.content_id=? AND placement.status='published'
   AND page.page_type=? AND page.status='active'
  ORDER BY placement.published_at_utc,placement.placement_id LIMIT 1`).get(input.communityId,input.kind,input.objectId,input.kind) as {slug:string;secondary_slug:string|null}|undefined;
 if(page){const segments=[page.slug,page.secondary_slug].filter((value):value is string=>Boolean(value)).map(encodeURIComponent).join("/");const url=new URL(`/communities/${encodeURIComponent(input.communitySlug)}/${input.kind}/${segments}`,input.publicOrigin);if(input.kind==="alert")url.searchParams.set("focus",input.objectId);return url.toString();}
 return new URL(input.kind==="alert"?`/communities/${encodeURIComponent(input.communitySlug)}/alerts/${encodeURIComponent(input.objectId)}`:`/communities/${encodeURIComponent(input.communitySlug)}/server-watchlists/${encodeURIComponent(input.objectId)}`,input.publicOrigin).toString();
}
