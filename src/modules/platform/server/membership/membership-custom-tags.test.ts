import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { assertMembershipCustomTagCreation, assertMembershipRuleCreation, assertMembershipJournalAccountCreation, membershipFeatureDeniedResponse } from "./platform-membership-access";
import { PlatformMembershipRepository } from "./platform-membership-repository";
import { JOURNAL_TAG_PRESET_CATALOG } from "@/src/modules/journal/contracts/journal-tag-preset-catalog";

describe("Custom-tag plan allowance", () => {
  let db: Database.Database;
  let limit: number | null | undefined;
  let ruleLimit: number | null | undefined;
  let accountLimit: number | null | undefined;
  let allowedFeatures: string[];
  beforeEach(() => {
    db = new Database(":memory:");
    db.exec(`CREATE TABLE journal_accounts (account_id TEXT, workspace_id TEXT, created_by_user_id TEXT, status TEXT);
      CREATE TABLE journal_demo_accounts (account_id TEXT, workspace_id TEXT);
      CREATE TABLE journal_tags (created_by_user_id TEXT, account_id TEXT, current_name TEXT, lifecycle_state TEXT);
      CREATE TABLE journal_rules (created_by_user_id TEXT, account_id TEXT, source_kind TEXT, lifecycle_state TEXT);
      CREATE TABLE platform_membership_feature_policies (feature_key TEXT, enforcement_mode TEXT);`);
    limit = 2;
    ruleLimit = 2;
    accountLimit = 2;
    allowedFeatures = [];
    vi.spyOn(PlatformMembershipRepository.prototype, "readEffectiveAccess").mockImplementation(userId => ({
      userId, evaluatedAtUtc: new Date().toISOString(), booleanFeatures: allowedFeatures, sources: [],
      limits: { ...(accountLimit === undefined ? {} : { "journal.accounts": accountLimit }), ...(limit === undefined ? {} : { "journal.custom_tags": limit }), ...(ruleLimit === undefined ? {} : { "journal.custom_rules": ruleLimit }) },
    }));
  });
  afterEach(() => { db.close(); vi.restoreAllMocks(); });
  const tag = (name: string, account = "a", user = "member", state = "active") =>
    db.prepare("INSERT INTO journal_tags VALUES (?,?,?,?)").run(user, account, name, state);

  it("enforces account capacity by default across workspaces and preserves existing rows", () => {
    db.exec("INSERT INTO journal_accounts VALUES ('a','w1','member','active'),('b','w2','member','active');");
    expect(() => assertMembershipJournalAccountCreation(db, "member")).toThrow();
    expect(db.prepare("SELECT COUNT(*) count FROM journal_accounts").get()).toEqual({ count: 2 });
    accountLimit = 3;
    expect(() => assertMembershipJournalAccountCreation(db, "member")).not.toThrow();
  });
  it("excludes Demo, inactive accounts and another member from account capacity", () => {
    db.exec("INSERT INTO journal_accounts VALUES ('demo','w','member','active'),('old','w','member','closed'),('other','w','other','active'); INSERT INTO journal_demo_accounts VALUES ('demo','w');");
    accountLimit = 1;
    expect(() => assertMembershipJournalAccountCreation(db, "member")).not.toThrow();
    accountLimit = 0;
    expect(() => assertMembershipJournalAccountCreation(db, "member")).toThrow();
    accountLimit = null;
    expect(() => assertMembershipJournalAccountCreation(db, "member")).not.toThrow();
    accountLimit = undefined;
    expect(() => assertMembershipJournalAccountCreation(db, "member")).toThrow();
  });
  it("preserves account policy overrides and returns structured upgrade guidance", async () => {
    accountLimit = 0;
    try { assertMembershipJournalAccountCreation(db, "member"); }
    catch (error) {
      const response = membershipFeatureDeniedResponse(error)!;
      expect(response.status).toBe(403);
      expect(await response.json()).toMatchObject({ code: "membership_required", error: { message: expect.stringContaining("Journal account allowance") } });
    }
    for (const mode of ["off", "shadow"]) {
      db.prepare("DELETE FROM platform_membership_feature_policies").run();
      db.prepare("INSERT INTO platform_membership_feature_policies VALUES ('journal.accounts',?)").run(mode);
      expect(() => assertMembershipJournalAccountCreation(db, "member")).not.toThrow();
    }
  });
  it("shares the limit across accounts and rejects the next tag at capacity", () => {
    tag("My first tag", "a");
    expect(() => assertMembershipCustomTagCreation(db, "member", "My second tag")).not.toThrow();
    tag("My second tag", "b");
    expect(() => assertMembershipCustomTagCreation(db, "member", "My third tag")).toThrow();
    expect(db.prepare("SELECT COUNT(*) count FROM journal_tags").get()).toEqual({ count: 2 });
  });
  it("excludes preset tags, other members and retired custom tags", () => {
    tag(JOURNAL_TAG_PRESET_CATALOG[0].name);
    tag("Retired tag", "a", "member", "retired");
    tag("Another member's tag", "a", "other");
    limit = 1;
    expect(() => assertMembershipCustomTagCreation(db, "member", "New custom tag")).not.toThrow();
  });
  it("allows presets even when the custom allowance is zero", () => {
    limit = 0;
    expect(() => assertMembershipCustomTagCreation(db, "member", JOURNAL_TAG_PRESET_CATALOG[0].name)).not.toThrow();
    expect(() => assertMembershipCustomTagCreation(db, "member", "Custom tag")).toThrow();
  });
  it("allows an explicitly unlimited plan beyond the old 200-tag ceiling", () => {
    limit = null;
    for (let n = 0; n < 201; n++) tag(`Custom ${n}`);
    expect(() => assertMembershipCustomTagCreation(db, "member", "Next custom tag")).not.toThrow();
  });
  it("requires the feature to be included in the member's plan", () => {
    limit = undefined;
    expect(() => assertMembershipCustomTagCreation(db, "member", "Custom tag")).toThrow();
  });
  it("preserves owner and explicit global-policy overrides", () => {
    limit = 0;
    db.exec("CREATE TABLE platform_operator_grants (user_id TEXT, authority_key TEXT, grant_state TEXT);");
    db.prepare("INSERT INTO platform_operator_grants VALUES ('member','journal_administration','active')").run();
    expect(() => assertMembershipCustomTagCreation(db, "member", "Custom tag")).not.toThrow();
    db.exec("DELETE FROM platform_operator_grants; INSERT INTO platform_membership_feature_policies VALUES ('journal.custom_tags','off');");
    expect(() => assertMembershipCustomTagCreation(db, "member", "Custom tag")).not.toThrow();
  });
  it("returns plain guidance when the allowance is exhausted", async () => {
    limit = 0;
    try { assertMembershipCustomTagCreation(db, "member", "Custom tag"); }
    catch (error) {
      const response = membershipFeatureDeniedResponse(error);
      expect(response?.status).toBe(403);
      expect((await response!.json()).error.message).toContain("custom tag");
      return;
    }
    throw new Error("Expected a denied custom-tag request");
  });
  it("shares custom-rule capacity across accounts and excludes other members and presets", () => {
    allowedFeatures = ["journal.rules"];
    db.exec(`INSERT INTO journal_rules VALUES ('member','a','custom','active'),('member','b','custom','active'),
      ('member','b','template','active'),('other','a','custom','active');`);
    expect(() => assertMembershipRuleCreation(db, "member", "custom")).toThrow();
    db.exec("UPDATE journal_rules SET lifecycle_state='paused' WHERE account_id='b' AND source_kind='custom';");
    expect(() => assertMembershipRuleCreation(db, "member", "custom")).not.toThrow();
  });
  it("requires preset access separately from custom rules", () => {
    allowedFeatures = ["journal.rules"];
    expect(() => assertMembershipRuleCreation(db, "member", "template")).toThrow();
    allowedFeatures.push("journal.preset_rules");
    expect(() => assertMembershipRuleCreation(db, "member", "template")).not.toThrow();
    ruleLimit = 0;
    expect(() => assertMembershipRuleCreation(db, "member", "custom")).toThrow();
  });
  it("allows Unlimited custom rules and requires the Trading Rules feature", () => {
    ruleLimit = null;
    expect(() => assertMembershipRuleCreation(db, "member", "custom")).toThrow();
    allowedFeatures = ["journal.rules"];
    expect(() => assertMembershipRuleCreation(db, "member", "custom")).not.toThrow();
  });
});
