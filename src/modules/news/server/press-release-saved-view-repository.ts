import "server-only";
import type Database from "better-sqlite3";
import { DEFAULT_NEWS_FILTERS, NEWS_FILTERS_FEATURE, parseNewsFilters } from "../contracts/press-release-filters";
import { decodeNewsFilters, encodeNewsFilters, MAX_SAVED_NEWS_VIEWS, newsAlertFilters, newsViewName, type NewsViewPreference, type SavedNewsView, type SaveNewsViewInput } from "../contracts/press-release-saved-views";
import { assertCanonicalUtcTimestamp, assertCanonicalUuidV4, createCanonicalUuidV4 } from "../../platform/server/database/platform-migration-contract";
import { assertMembershipFeature, evaluateMembershipFeature } from "../../platform/server/membership/platform-membership-access";
import { pressReleaseFilterQuery } from "./press-release-filter-query";
import { registerPressReleaseFilterFunctions } from "./press-release-filter-functions";

type ViewRow = { view_id: string; name: string; filters_json: string; revision: number; alerts_enabled: number; alerts_started_at_utc: string | null };
export class PressReleaseSavedViewRepository {
  constructor(private readonly database: Database.Database) {}
  isInstalled(): boolean { return !!this.database.prepare("SELECT 1 FROM sqlite_schema WHERE type='table' AND name='news_press_release_saved_views'").get(); }
  private active(userId: string): void {
    assertCanonicalUuidV4(userId, "userId");
    if (!this.database.prepare("SELECT 1 FROM platform_users WHERE user_id=? AND status='active'").get(userId)) throw new Error("Sign in to use your saved views.");
  }
  private writable(userId: string): void { this.active(userId); assertMembershipFeature(this.database, userId, "news.access"); assertMembershipFeature(this.database, userId, NEWS_FILTERS_FEATURE); }
  readPreference(userId: string): NewsViewPreference | null {
    this.active(userId);
    const row = this.database.prepare("SELECT filters_json,revision FROM news_press_release_view_preferences WHERE user_id=?").get(userId) as { filters_json: string; revision: number } | undefined;
    return row ? { filters: decodeNewsFilters(row.filters_json), revision: row.revision } : null;
  }
  savePreference(userId: string, filters: unknown, atUtc: string): NewsViewPreference {
    this.writable(userId); assertCanonicalUtcTimestamp(atUtc, "updatedAtUtc");
    const json = encodeNewsFilters(filters);
    this.database.prepare(`INSERT INTO news_press_release_view_preferences VALUES(?,?,1,?)
      ON CONFLICT(user_id) DO UPDATE SET filters_json=excluded.filters_json,revision=revision+1,updated_at_utc=excluded.updated_at_utc WHERE excluded.updated_at_utc>=news_press_release_view_preferences.updated_at_utc`).run(userId,json,atUtc);
    return this.readPreference(userId)!;
  }
  list(userId: string): readonly SavedNewsView[] {
    this.active(userId);
    const rows = this.database.prepare("SELECT view_id,name,filters_json,revision,alerts_enabled,alerts_started_at_utc FROM news_press_release_saved_views WHERE user_id=? ORDER BY name COLLATE NOCASE,view_id").all(userId) as ViewRow[];
    return rows.map(row => ({ id: row.view_id, name: row.name, filters: decodeNewsFilters(row.filters_json), revision: row.revision, alertsEnabled: row.alerts_enabled === 1, alertsStartedAt: row.alerts_started_at_utc }));
  }
  save(userId: string, input: SaveNewsViewInput, atUtc: string): readonly SavedNewsView[] {
    this.writable(userId); assertCanonicalUtcTimestamp(atUtc,"updatedAtUtc");
    const name = newsViewName(input.name), filters = parseNewsFilters(input.filters), json = encodeNewsFilters(filters);
    if (typeof input.alertsEnabled !== "boolean") throw new Error("Choose whether this view sends alerts.");
    this.database.transaction(() => {
      if (this.database.prepare("SELECT 1 FROM news_press_release_saved_views WHERE user_id=? AND name=? COLLATE NOCASE AND view_id<>?").get(userId,name,input.id ?? "")) throw new Error("You already have a saved view with this name.");
      if (input.id === null) {
        const count = (this.database.prepare("SELECT count(*) n FROM news_press_release_saved_views WHERE user_id=?").get(userId) as { n: number }).n;
        if (count >= MAX_SAVED_NEWS_VIEWS) throw new Error(`You can save up to ${MAX_SAVED_NEWS_VIEWS} views. Remove one to add another.`);
        this.database.prepare("INSERT INTO news_press_release_saved_views VALUES(?,?,?,?,?,?,1,?,?)").run(createCanonicalUuidV4(),userId,name,json,Number(input.alertsEnabled),input.alertsEnabled ? atUtc : null,atUtc,atUtc);
      } else {
        assertCanonicalUuidV4(input.id,"viewId");
        if (!Number.isSafeInteger(input.revision) || Number(input.revision)<1) throw new Error("Refresh this saved view before changing it.");
        const old = this.database.prepare("SELECT filters_json,alerts_enabled,alerts_started_at_utc FROM news_press_release_saved_views WHERE user_id=? AND view_id=? AND revision=?").get(userId,input.id,input.revision) as Pick<ViewRow,"filters_json"|"alerts_enabled"|"alerts_started_at_utc"> | undefined;
        if (!old) throw new Error("This saved view changed elsewhere. Refresh before saving.");
        const changed = JSON.stringify(newsAlertFilters(decodeNewsFilters(old.filters_json))) !== JSON.stringify(newsAlertFilters(filters));
        const startsAt = input.alertsEnabled ? (!old.alerts_enabled || changed ? atUtc : old.alerts_started_at_utc) : old.alerts_started_at_utc;
        this.database.prepare("UPDATE news_press_release_saved_views SET name=?,filters_json=?,alerts_enabled=?,alerts_started_at_utc=?,revision=revision+1,updated_at_utc=? WHERE user_id=? AND view_id=? AND revision=?").run(name,json,Number(input.alertsEnabled),startsAt,atUtc,userId,input.id,input.revision);
      }
    }).immediate();
    return this.list(userId);
  }
  remove(userId: string, id: string, revision: number): readonly SavedNewsView[] {
    this.active(userId); assertCanonicalUuidV4(id,"viewId");
    if (!Number.isSafeInteger(revision) || revision < 1) throw new Error("Refresh this saved view before deleting it.");
    const result = this.database.prepare("DELETE FROM news_press_release_saved_views WHERE user_id=? AND view_id=? AND revision=?").run(userId,id,revision);
    if (result.changes !== 1) throw new Error("This saved view changed elsewhere. Refresh before deleting.");
    return this.list(userId);
  }
  setAlerts(userId: string, id: string, revision: number, enabled: boolean, atUtc: string): readonly SavedNewsView[] {
    this.active(userId); assertCanonicalUuidV4(id,"viewId"); assertCanonicalUtcTimestamp(atUtc,"updatedAtUtc");
    if (enabled) assertMembershipFeature(this.database,userId,NEWS_FILTERS_FEATURE);
    if (typeof enabled !== "boolean" || !Number.isSafeInteger(revision) || revision < 1) throw new Error("Refresh this view before changing alerts.");
    const result=this.database.prepare("UPDATE news_press_release_saved_views SET alerts_enabled=?, alerts_started_at_utc=CASE WHEN ?=1 AND alerts_enabled=0 THEN ? ELSE alerts_started_at_utc END,revision=revision+1,updated_at_utc=? WHERE user_id=? AND view_id=? AND revision=?").run(Number(enabled),Number(enabled),atUtc,atUtc,userId,id,revision);
    if(result.changes!==1)throw new Error("This saved view changed elsewhere. Refresh before changing alerts.");
    return this.list(userId);
  }
  /** Alert criteria are evaluated at the new article's arrival, so delivery
   * delays and midnight rollover do not change an already-matching event. */
  hasMatchingAlert(userId: string, articleId: string): boolean {
    if (!this.isInstalled() || (!evaluateMembershipFeature(this.database,userId,NEWS_FILTERS_FEATURE).allowed || !evaluateMembershipFeature(this.database,userId,"news.access").allowed)) return false;
    if (!this.database.prepare("SELECT 1 FROM platform_users WHERE user_id=? AND status='active'").get(userId)) return false;
    const article = this.database.prepare("SELECT created_at FROM news_articles WHERE id=?").get(articleId) as { created_at: string } | undefined;
    if (!article || !Number.isFinite(Date.parse(article.created_at))) return false;
    registerPressReleaseFilterFunctions(this.database);
    const rows = this.database.prepare("SELECT filters_json,alerts_started_at_utc FROM news_press_release_saved_views WHERE user_id=? AND alerts_enabled=1").all(userId) as Pick<ViewRow,"filters_json"|"alerts_started_at_utc">[];
    for (const row of rows) {
      if (!row.alerts_started_at_utc || Date.parse(article.created_at)<Date.parse(row.alerts_started_at_utc)) continue;
      const filters = { ...decodeNewsFilters(row.filters_json,new Date(article.created_at)), read: DEFAULT_NEWS_FILTERS.read, sort: DEFAULT_NEWS_FILTERS.sort };
      const query = pressReleaseFilterQuery(filters);
      if (this.database.prepare(`SELECT 1 FROM news_articles article WHERE article.id=? ${query.where}`).get(articleId,...query.parameters)) return true;
    }
    return false;
  }
}
