"use server";
import {PublishingAccessError} from "@/src/modules/communities/server/community-publishing-access";


import { revalidatePath } from "next/cache";
import { requireCommunityOwnerReviewPageIdentity } from "@/src/modules/communities/server/community-owner-review-request-identity";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { TraderLinkPlatformError } from "@/src/modules/platform/server/database/platform-migration-contract";
import { requireCommunityRequestAccess } from "@/src/modules/communities/server/community-request-access";
import { resolveTraderLinkCommunityViewer } from "@/src/modules/communities/server/traderlink-community-viewer";
import { CommunityPublicationInputError, saveCommunityPublication } from "@/src/modules/communities/server/community-publication-service";
import type { CommunityPublicationFeedback } from "@/src/modules/communities/contracts/community-publication-feedback";
import type {CommunityTickerAuthoredFields} from "@/src/modules/communities/contracts/community-branded-content";
import {parseWatchlistResearch} from "@/src/modules/communities/contracts/community-watchlist-research";
import {captureCommunityTickerSnapshot} from "@/src/modules/communities/server/community-content-market-snapshot";
import {CommunityBrandedContentRepository} from "@/src/modules/communities/server/community-branded-content-repository";
import {communityDestinationCacheScope,invalidateCommunityContentCache} from "@/src/modules/communities/server/community-content-read-cache";

async function save(kind: "alert" | "watchlist", form: FormData): Promise<CommunityPublicationFeedback> {
  const identity = await requireCommunityOwnerReviewPageIdentity();
  const slug = String(form.get("communitySlug") ?? "");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return { status: "error", message: "Community unavailable. Refresh this page." };
  try { await requireCommunityRequestAccess({ userId: identity.scope.userId, slug }); }
  catch { return { status: "error", message: "We couldn't verify your Discord access. Your entries are still here. Reconnect Discord or try again shortly." }; }
  let result: CommunityPublicationFeedback;
  try {
    result = withPlatformDatabase({ mode: "runtime" }, db => {
      const actor = resolveTraderLinkCommunityViewer(db, identity, slug);
      const community = db.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(slug) as { community_id: string } | undefined;
      if (!community) throw new CommunityPublicationInputError("Community unavailable.");
      return saveCommunityPublication(db, { communityId: community.community_id, communitySlug: slug, actor, kind, form, atUtc: new Date().toISOString() });
    });
  } catch (error) {
    const message = error instanceof CommunityPublicationInputError || error instanceof PublishingAccessError ? error.message
      : error instanceof TraderLinkPlatformError && error.code === "TRADERLINK_WORKSPACE_ACCESS_DENIED" ? "You no longer have permission to publish here. Your entries are still here."
        : error instanceof TraderLinkPlatformError && error.code === "TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED" ? "Check the title, ticker and required fields before saving."
          : "We couldn't save this item. Your entries are still here. Please try again.";
    return { status: "error", message };
  }
  if(result.status==="success"){
    for(const pageId of new Set(form.getAll("contentPageId").map(String).filter(Boolean)))invalidateCommunityContentCache(communityDestinationCacheScope(pageId));
    const saved=withPlatformDatabase({mode:"runtime"},db=>{
      const community=db.prepare("SELECT community_id FROM traderlink_communities WHERE slug=?").get(slug) as {community_id:string};
      if(kind==="alert"){
        const row=db.prepare("SELECT alert_id id,symbol FROM traderlink_community_alerts WHERE community_id=? AND alert_id=?").get(community.community_id,result.objectId??"") as {id:string;symbol:string|null}|undefined;
        return {communityId:community.community_id,contentId:row?.id??null,tickers:row?.symbol?[{symbol:row.symbol,priceTarget:text(form,"priceTarget"),supportLevels:lines(form,"supportLevels"),stopLoss:text(form,"stopLoss"),publisherTake:text(form,"publisherTake")??""}]:[]};
      }
      const contentId=result.objectId??"";const row=db.prepare("SELECT ticker_research_json FROM traderlink_community_server_watchlists WHERE community_id=? AND watchlist_id=?").get(community.community_id,contentId) as {ticker_research_json:string}|undefined;const symbols=(db.prepare("SELECT symbol FROM traderlink_community_server_watchlist_symbols WHERE watchlist_id=? ORDER BY ordinal").all(contentId) as Array<{symbol:string}>).map(item=>item.symbol);const research=parseWatchlistResearch(row?.ticker_research_json??"{}",symbols);
      return {communityId:community.community_id,contentId,tickers:symbols.map(symbol=>({symbol,priceTarget:research[symbol]?.priceTarget||null,supportLevels:research[symbol]?.supportLevels??[],stopLoss:research[symbol]?.stopLoss||null,publisherTake:research[symbol]?.publisherTake??research[symbol]?.notes??""}))};
    });
    if(saved.contentId&&saved.tickers.length){const capturedAt=new Date().toISOString();const snapshots=await Promise.all(saved.tickers.map(ticker=>captureCommunityTickerSnapshot(ticker as CommunityTickerAuthoredFields,capturedAt)));withPlatformDatabase({mode:"runtime"},db=>{const repository=new CommunityBrandedContentRepository(db);for(const snapshot of snapshots)repository.saveTickerSnapshot({communityId:saved.communityId,contentType:kind,contentId:saved.contentId!,snapshot});});}
  }
  // Persistence is already committed. A refresh failure must not turn success into
  // an ambiguous error or encourage a second publication.
  try {
    revalidatePath(`/communities/${slug}`);
    revalidatePath(`/communities/${slug}/${kind === "alert" ? "alerts" : "watchlists"}`);
    if (result.href) revalidatePath(result.href);
  } catch { /* Return the committed receipt and direct link. */ }
  return result;
}

function text(form:FormData,key:string):string|null{return String(form.get(key)??"").trim()||null;}
function lines(form:FormData,key:string):string[]{return String(form.get(key)??"").split(/\r?\n/u).map(value=>value.trim()).filter(Boolean).slice(0,20);}

export async function saveCommunityAlertWithFeedback(form: FormData) { return save("alert", form); }
export async function saveCommunityWatchlistWithFeedback(form: FormData) { return save("watchlist", form); }
