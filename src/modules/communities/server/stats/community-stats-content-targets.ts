import "server-only";
import type Database from "better-sqlite3";
import type {CommunityStatsContent,CommunityStatsRequestScope} from "../../contracts/community-stats-contracts";

type Page={page_id:string;page_type:string;slug:string;secondary_slug:string|null;title:string;status:string;feed_kind:string;publisher_user_id:string|null;category_id:string|null;discord_destination_id:string|null};
type Revision={revision:number;actor_user_id:string|null;status:string;changed_at_utc:string};
const canonicalDate=(value:string)=>Number.isFinite(Date.parse(value))&&new Date(value).toISOString()===value;

/** A complete native metadata prefix, never a reconstruction from private bodies. */
export function readWatchlistFirstPublisher(db:Database.Database,itemId:string,publishedAtUtc:string|null,currentRevision:number):{userId:string;name:string}|null{
  if(!publishedAtUtc||!canonicalDate(publishedAtUtc)||!Number.isSafeInteger(currentRevision)||currentRevision<1)return null;
  const rows=db.prepare(`SELECT revision,actor_user_id,status,changed_at_utc FROM traderlink_community_watchlist_item_revisions
    WHERE item_id=? ORDER BY revision LIMIT 513`).all(itemId) as Revision[];
  if(!rows.length||rows.length>512||rows.some(row=>row.revision>currentRevision))return null;
  const first=rows.findIndex(row=>row.status==="published");
  if(first<0||rows[first].changed_at_utc!==publishedAtUtc)return null;
  if(rows.filter(row=>row.status==="published"&&row.changed_at_utc===publishedAtUtc).length!==1)return null;
  for(let i=0;i<=first;i++)if(rows[i].revision!==i+1||!canonicalDate(rows[i].changed_at_utc)
    ||rows[i].changed_at_utc>publishedAtUtc||(i>0&&rows[i].changed_at_utc<rows[i-1].changed_at_utc))return null;
  const userId=rows[first].actor_user_id;
  if(!userId)return null;
  const user=db.prepare("SELECT display_name FROM platform_users WHERE user_id=? AND status='active'").get(userId) as {display_name:string}|undefined;
  return user?{userId,name:user.display_name}:null;
}

/** Reader metadata only. Publication associations are never publishing grants. */
export function readCanonicalStatsTargets(db:Database.Database,scope:CommunityStatsRequestScope):CommunityStatsContent[]{
  if(!db.prepare("SELECT 1 FROM sqlite_schema WHERE type='table' AND name='traderlink_community_content_pages'").get())return [];
  const pages=db.prepare(`SELECT page_id,page_type,slug,secondary_slug,title,status,feed_kind,publisher_user_id,category_id,discord_destination_id
    FROM traderlink_community_content_pages WHERE community_id=? AND (status='active' OR (?=1 AND status='archived')) ORDER BY page_id`).all(scope.communityId,scope.isOwner?1:0) as Page[];
  const result:CommunityStatsContent[]=[];
  for(const page of pages){
    if(!scope.isOwner&&page.discord_destination_id){
      const channel=db.prepare("SELECT discord_channel_id FROM traderlink_community_discord_destinations WHERE community_id=? AND destination_id=?").get(scope.communityId,page.discord_destination_id) as {discord_channel_id:string}|undefined;
      if(!channel||!scope.readableChannelIds.includes(channel.discord_channel_id))continue;
    }
    const path=`/communities/${scope.slug}/${page.page_type}/${[page.slug,page.secondary_slug].filter(Boolean).join("/")}`;
    const common={pageId:page.page_id,categoryId:page.category_id,state:page.status==="active"?"published" as const:"archived" as const,mode:page.status==="active"?"tracked_page" as const:"not_collected" as const};
    const matches=(publisher:string,category:string|null)=>(!["publisher","publisher_category"].includes(page.feed_kind)||publisher===page.publisher_user_id)
      &&(!["category","publisher_category"].includes(page.feed_kind)||category===page.category_id);
    result.push({...common,id:page.page_id,type:page.page_type==="alert"?"alerts":page.page_type==="watchlist"?"watchlists":"community",title:page.title,path,authorUserId:null,authorName:null,targetKind:"page"});
    let nativeRowsVisible=false;
    if(page.page_type==="watchlist"){
      const items=db.prepare(`SELECT item_id,symbol,publisher_user_id,category_id,status,published_at_utc,revision FROM traderlink_community_watchlist_items
        WHERE community_id=? AND page_id=? AND status IN('published','removed') ORDER BY item_id`).all(scope.communityId,page.page_id) as {item_id:string;symbol:string;publisher_user_id:string;category_id:string|null;status:string;published_at_utc:string|null;revision:number}[];
      nativeRowsVisible=items.some(item=>item.status==="published");
      for(const item of items){
        if(!matches(item.publisher_user_id,item.category_id))continue;
        const contributor=readWatchlistFirstPublisher(db,item.item_id,item.published_at_utc,item.revision);
        result.push({...common,id:`watchlist-item:${item.item_id}`,canonicalId:item.item_id,type:"watchlist",targetKind:"watchlist_item",title:item.symbol,
          path:`${path}?focus=${item.item_id}`,authorUserId:null,authorName:null,publisherUserId:item.publisher_user_id,categoryId:item.category_id,
          contributorUserId:contributor?.userId??null,contributorName:contributor?.name??null,contributorProvenance:contributor?"first_published_by":"unknown",
          publishedAtUtc:item.published_at_utc,state:item.status==="published"&&page.status==="active"?"published":"archived",mode:item.status==="published"&&page.status==="active"?"tracked_page":"not_collected"});
      }
    }
    if(page.page_type==="content"){
      const documents=db.prepare(`SELECT d.document_id,d.slug,d.title,d.author_user_id,u.display_name,d.category_id,d.status,d.published_at_utc
        FROM traderlink_community_content_documents d LEFT JOIN platform_users u ON u.user_id=d.author_user_id AND u.status='active'
        WHERE d.community_id=? AND d.page_id=? AND d.status IN('published','archived') ORDER BY d.document_id`).all(scope.communityId,page.page_id) as {document_id:string;slug:string;title:string;author_user_id:string;display_name:string|null;category_id:string|null;status:string;published_at_utc:string|null}[];
      nativeRowsVisible=documents.some(doc=>doc.status==="published");
      for(const doc of documents)if(matches(doc.author_user_id,doc.category_id))result.push({...common,id:`document:${doc.document_id}`,canonicalId:doc.document_id,
        targetKind:"document",type:"community",title:doc.title,path:`${path}/${doc.slug}`,authorUserId:doc.display_name?doc.author_user_id:null,authorName:doc.display_name,
        contributorUserId:doc.display_name?doc.author_user_id:null,contributorName:doc.display_name,contributorProvenance:doc.display_name?"native_author":"unknown",
        categoryId:doc.category_id,publishedAtUtc:doc.published_at_utc,state:doc.status==="published"&&page.status==="active"?"published":"archived",mode:doc.status==="published"&&page.status==="active"?"tracked_page":"not_collected"});
    }
    if(nativeRowsVisible)continue;
    const placements=db.prepare(`SELECT placement_id,content_type,content_id,publisher_user_id,category_id FROM traderlink_community_content_placements
      WHERE community_id=? AND page_id=? AND status='published' ORDER BY placement_id`).all(scope.communityId,page.page_id) as {placement_id:string;content_type:string;content_id:string;publisher_user_id:string;category_id:string|null}[];
    for(const place of placements){
      if(!matches(place.publisher_user_id,place.category_id))continue;
      const table=place.content_type==="alert"?["traderlink_community_alerts","alert_id"]:place.content_type==="watchlist"?["traderlink_community_server_watchlists","watchlist_id"]:place.content_type==="swing"?["traderlink_community_swing_posts","swing_id"]:place.content_type==="content"?["traderlink_community_general_content","content_id"]:null;
      if(!table)continue;
      const native=db.prepare(`SELECT n.title,n.author_user_id,u.display_name,n.published_at_utc FROM ${table[0]} n LEFT JOIN platform_users u ON u.user_id=n.author_user_id AND u.status='active'
        WHERE n.community_id=? AND n.${table[1]}=? AND n.status='published'`).get(scope.communityId,place.content_id) as {title:string;author_user_id:string;display_name:string|null;published_at_utc:string|null}|undefined;
      if(!native)continue;
      result.push({...common,id:place.content_id,canonicalId:place.content_id,placementId:place.placement_id,targetKind:"alert",type:place.content_type==="alert"?"alert":place.content_type==="watchlist"?"watchlist":"community",
        title:native.title,path:`${path}?focus=${place.placement_id}`,authorUserId:native.display_name?native.author_user_id:null,authorName:native.display_name,
        contributorUserId:native.display_name?native.author_user_id:null,contributorName:native.display_name,contributorProvenance:native.display_name?"native_author":"unknown",
        publisherUserId:place.publisher_user_id,categoryId:place.category_id,publishedAtUtc:native.published_at_utc});
    }
  }
  // Existing own-author policy is deliberately not expanded to contributor-only units.
  return scope.ownContentOnly?result.filter(row=>row.authorUserId===scope.actorUserId):result;
}

export function resolveCanonicalStatsTarget(targets:readonly CommunityStatsContent[],path:string,focus?:unknown):CommunityStatsContent|null{
  if(typeof focus!=="undefined"&&focus!==null&&(typeof focus!=="string"||!focus))return null;
  const rows=targets.filter(row=>row.state==="published"&&row.mode==="tracked_page"&&row.path.split("?")[0]===path);
  if(focus)return rows.find(row=>row.targetKind!=="page"&&(row.placementId===focus||row.canonicalId===focus))??null;
  return rows.find(row=>row.targetKind==="page"||row.targetKind==="document")??null;
}

/** Parent-page reports include eligible focused opens on that page. Each event
 * remains one global navigation; parent and child table rows are not additive. */
export function statsEventContentIds(catalog:readonly CommunityStatsContent[],selected:readonly CommunityStatsContent[]):string[]{
  const pages=new Set(selected.filter(row=>row.targetKind==="page").map(row=>row.pageId??row.id));
  return [...new Set([...selected,...catalog.filter(row=>row.occurrences?.some(occurrence=>pages.has(occurrence.pageId))||(row.pageId&&pages.has(row.pageId)))].map(row=>row.id))];
}

/** SQL parameters keep selected parent-page occurrences separate from canonical
 * post totals; a post opened on another page is not a visit to this page. */
export function statsEventSelection(catalog:readonly CommunityStatsContent[],selected:readonly CommunityStatsContent[]):{contentIds:string;pageIds:string;pageContentIds:string}{
  return {contentIds:JSON.stringify([...new Set(selected.map(item=>item.id))]),
    pageIds:JSON.stringify([...new Set(selected.filter(item=>item.targetKind==="page").map(item=>item.pageId??item.id))]),
    pageContentIds:JSON.stringify(statsEventContentIds(catalog,selected))};
}
