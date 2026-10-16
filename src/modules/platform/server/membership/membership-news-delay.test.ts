// @vitest-environment node
import Database from "better-sqlite3";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
const fixture = vi.hoisted(() => ({ sources: [{ planVersionId: "base" }] }));
vi.mock("./platform-membership-repository", () => ({ PlatformMembershipRepository: class { readEffectiveAccess() { return { sources: fixture.sources, limits: {}, booleanFeatures: [] }; } } }));
import { delayedNewsAvailableAt, readMembershipNewsDelaySeconds } from "./membership-news-delay";
let db: Database.Database;
beforeEach(() => { fixture.sources = [{ planVersionId: "base" }]; db = new Database(":memory:"); db.exec(`CREATE TABLE platform_membership_feature_policies(feature_key,enforcement_mode); CREATE TABLE platform_operator_grants(user_id,authority_key,grant_state); CREATE TABLE platform_membership_plan_features(plan_version_id,feature_key,limit_value);`); });
afterEach(() => db.close());
it("enforces independent configured visibility and notification delays by default", () => {
  db.prepare("INSERT INTO platform_membership_plan_features VALUES ('base',?,?)").run("news.visibility_delay_seconds",180);
  db.prepare("INSERT INTO platform_membership_plan_features VALUES ('base',?,?)").run("news.notification_delay_seconds",300);
  expect(readMembershipNewsDelaySeconds(db,"member","news.visibility_delay_seconds")).toBe(180);
  expect(readMembershipNewsDelaySeconds(db,"member","news.notification_delay_seconds")).toBe(300);
});
it("uses the shortest explicitly granted delay and preserves an immediate grant", () => {
  fixture.sources.push({ planVersionId: "addon" });
  db.exec("INSERT INTO platform_membership_plan_features VALUES ('base','news.visibility_delay_seconds',180),('addon','news.visibility_delay_seconds',0)");
  expect(readMembershipNewsDelaySeconds(db,"member","news.visibility_delay_seconds")).toBe(0);
});
it.each(["off","shadow"])("respects explicit %s delay rollout", mode => {
  db.prepare("INSERT INTO platform_membership_feature_policies VALUES ('news.visibility_delay_seconds',?)").run(mode);
  db.exec("INSERT INTO platform_membership_plan_features VALUES ('base','news.visibility_delay_seconds',180)");
  expect(readMembershipNewsDelaySeconds(db,"member","news.visibility_delay_seconds")).toBe(0);
});
it("anchors delayed availability to the later of publication and local availability", () => {
  expect(delayedNewsAvailableAt("2026-10-16T12:00:00.000Z","2026-10-16T11:00:00.000Z",180)).toBe("2026-10-16T12:03:00.000Z");
  expect(delayedNewsAvailableAt("2026-10-16T11:00:00.000Z","2026-10-16T12:00:00.000Z",180)).toBe("2026-10-16T12:03:00.000Z");
});
