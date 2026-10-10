import { createHash } from "node:crypto";
import type Database from "better-sqlite3";
import type { CommunityPublicationFeedback } from "../contracts/community-publication-feedback";
import { parseWatchlistResearch } from "../contracts/community-watchlist-research";
import { TraderLinkCommunityPlatformRepository } from "./traderlink-community-platform-repository";
import { TraderLinkCommunityRepository } from "./traderlink-community-repository";
import type { resolveTraderLinkCommunityViewer } from "./traderlink-community-viewer";

export class CommunityPublicationInputError extends Error {}

function field(form: FormData, name: string, label: string, max?: number): string {
  const value = String(form.get(name) ?? "").trim();
  if (!value) throw new CommunityPublicationInputError(`${label} is required.`);
  if (max && value.length > max) throw new CommunityPublicationInputError(`${label} must be ${max} characters or fewer.`);
  return value;
}

/** Atomic content + receipt; only queues delivery. Never invokes Discord or AI. */
export function saveCommunityPublication(db: Database.Database, input: {
  communityId: string; communitySlug: string;
  actor: ReturnType<typeof resolveTraderLinkCommunityViewer>;
  kind: "alert" | "watchlist"; form: FormData; atUtc: string;
}): CommunityPublicationFeedback {
  const { form, actor, communityId, kind, atUtc } = input;
  const requestId = field(form, "requestId", "Request");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)) throw new CommunityPublicationInputError("Refresh this page before saving.");
  const payload = [...form.entries()].filter(([key]) => key !== "requestId" && !key.startsWith("$ACTION_")).sort(([a], [b]) => a.localeCompare(b));
  const hash = createHash("sha256").update(JSON.stringify([kind, payload])).digest("hex");
  const capability = kind === "alert" ? "community.alerts.create" : "community.watchlists.publish_staff";
  return db.transaction(() => {
    new TraderLinkCommunityRepository(db).requireCapability(communityId, actor.userId, capability);
    const receipt = db.prepare(`SELECT payload_hash,result_json FROM traderlink_community_publication_receipts WHERE community_id=? AND user_id=? AND request_id=?`).get(communityId, actor.userId, requestId) as { payload_hash: string; result_json: string } | undefined;
    if (receipt) {
      if (receipt.payload_hash !== hash) throw new CommunityPublicationInputError("This save request has changed. Refresh the page before saving again.");
      return JSON.parse(receipt.result_json) as CommunityPublicationFeedback;
    }
    const repository = new TraderLinkCommunityPlatformRepository(db);
    const mode = String(form.get("publishingMode") ?? "tracked_page");
    if (mode !== "tracked_page" && mode !== "discord_post") throw new CommunityPublicationInputError("Choose a publishing option.");
    const status = String(form.get("status") ?? (form.get("intent") === "draft" ? "draft" : "published"));
    if (status !== "draft" && status !== "published" && status !== "archived") throw new CommunityPublicationInputError("Choose a save or publish action.");
    let id: string, href: string;
    const existingId = String(form.get(kind === "alert" ? "alertId" : "watchlistId") ?? "");
    if (kind === "alert") {
      const title = field(form, "title", "Title", 140);
      let symbol = String(form.get("symbol") ?? "").trim().toUpperCase();
      let body = String(form.get("body") ?? "").trim();
      const templateId = String(form.get("templateId") ?? "");
      if (templateId) {
        const fields = db.prepare(`SELECT f.field_key,f.label,f.field_type,f.required FROM traderlink_community_alert_template_fields f JOIN traderlink_community_alert_templates t ON t.template_id=f.template_id AND t.community_id=f.community_id WHERE f.template_id=? AND f.community_id=? AND t.status='active' AND (t.scope='community' OR t.owner_user_id=?) ORDER BY f.ordinal`).all(templateId, communityId, actor.userId) as { field_key: string; label: string; field_type: string; required: number }[];
        if (!fields.length) throw new CommunityPublicationInputError("That template is no longer available. Choose another template.");
        body = fields.map(item => {
          const value = String(form.get(`template:${item.field_key}`) ?? "").trim();
          if (item.required && !value) throw new CommunityPublicationInputError(`${item.label} is required.`);
          if (item.field_type === "ticker" && value) symbol = value.toUpperCase();
          return value ? `${item.label}: ${value}` : "";
        }).filter(Boolean).join("\n");
      }
      if (!body || body.length > 8000) throw new CommunityPublicationInputError("Enter alert text of 8,000 characters or fewer.");
      if (symbol && !/^[A-Z0-9][A-Z0-9.-]{0,14}$/.test(symbol)) throw new CommunityPublicationInputError("Check the ticker symbol.");
      const audienceId = String(form.get("audienceId") ?? "") || repository.ensureDefaultAudience({ communityId, actorUserId: actor.userId, atUtc });
      if (!db.prepare(`SELECT 1 FROM traderlink_community_audiences WHERE audience_id=? AND community_id=? AND status='active'`).get(audienceId, communityId)) throw new CommunityPublicationInputError("Choose an available audience for this server.");
      const details = { communityId, actor, title, symbol, body, audienceId, publishingMode: mode, atUtc };
      if (existingId) { repository.updateAlert({ ...details, alertId: existingId, status }); id = existingId; }
      else { id = repository.createAlert({ ...details, publish: status === "published" }); }
      const row = db.prepare(`SELECT slug FROM traderlink_community_alerts WHERE alert_id=? AND community_id=?`).get(id, communityId) as { slug: string };
      href = `/communities/${encodeURIComponent(input.communitySlug)}/alerts/${encodeURIComponent(row.slug)}`;
    } else {
      const title = field(form, "title", "Watchlist title", 120);
      const description = String(form.get("description") ?? "");
      if (description.length > 1200) throw new CommunityPublicationInputError("Watchlist notes must be 1,200 characters or fewer.");
      const symbols = [...new Set(String(form.get("symbols") ?? "").normalize("NFKC").toUpperCase().split(/[\s,]+/u).filter(Boolean))];
      if (symbols.length > 100 || symbols.some(symbol => !/^[A-Z0-9][A-Z0-9.-]{0,14}$/.test(symbol))) throw new CommunityPublicationInputError("Use up to 100 valid ticker symbols.");
      if (!form.has("tickerResearch")) throw new CommunityPublicationInputError("Refresh this page to load the ticker research editor before saving.");
      let research;
      try { research = parseWatchlistResearch(String(form.get("tickerResearch") ?? "{}"), symbols); }
      catch (error) { throw new CommunityPublicationInputError(error instanceof SyntaxError ? "Check your ticker notes and research." : (error as Error).message); }
      const details = { communityId, actor, title, description, symbols, publishingMode: mode, atUtc };
      if (existingId) { repository.updateServerWatchlist({ ...details, watchlistId: existingId, status }); id = existingId; }
      else { id = repository.createServerWatchlist({ ...details, publish: status === "published" }); }
      db.prepare(`UPDATE traderlink_community_server_watchlists SET ticker_research_json=? WHERE watchlist_id=? AND community_id=?`).run(JSON.stringify(research), id, communityId);
      href = `/communities/${encodeURIComponent(input.communitySlug)}/server-watchlists/${id}`;
    }
    const name = kind === "alert" ? "Alert" : "Watchlist";
    const message = status === "draft" ? `${name} draft saved.` : status === "archived" ? `${name} archived.` : existingId ? `${name} saved.` : `${name} published.`;
    const result: CommunityPublicationFeedback = { status: "success", message, href };
    db.prepare(`INSERT INTO traderlink_community_publication_receipts VALUES(?,?,?,?,?,?)`).run(communityId, actor.userId, requestId, hash, JSON.stringify(result), atUtc);
    return result;
  }).immediate();
}
