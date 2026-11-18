// @vitest-environment node
// These are composition/denial port fixtures, never actual Core admission or
// sandbox entitlement proof. Native image/issuer acceptance remains separate.
import { beforeEach,expect,it,vi } from "vitest";
const mocks = vi.hoisted(() => ({ identity: vi.fn(),target: vi.fn(),provider: vi.fn(),refresh: vi.fn(),native: vi.fn(),
  admitted: vi.fn(),writer: vi.fn(),classify: vi.fn(),session: vi.fn(),scope: vi.fn() }));
vi.mock("../../communities/server/community-staging-qa-target",() => ({ assertCommunityStagingQaTarget: mocks.target }));
vi.mock("../../communities/server/community-owner-review-request-identity",() => ({ requireCommunityOwnerReviewIdentity: (value: unknown) => value }));
vi.mock("../../platform/server/authentication/require-platform-request-scope",() => ({ requireTraderLinkPlatformAuthenticatedRequestIdentity: mocks.identity }));
vi.mock("../../platform/server/privacy/platform-erasure-admission",() => ({ requirePlatformErasureWriter: mocks.writer }));
vi.mock("../../platform/server/authentication/platform-session-repository",() => ({ PlatformSessionRepository: class { findActiveByTokenDigest(...args: unknown[]) { return mocks.session(...args); } } }));
vi.mock("../../platform/server/authentication/authenticated-user-journal-scope",() => ({ deriveAuthenticatedUserJournalScope: mocks.scope }));
vi.mock("./partner-alert-admission",() => ({ requirePartnerAlertAdmission: mocks.admitted }));
vi.mock("./partner-alert-isolated-staging",() => ({ readPartnerAlertIsolatedStaging: mocks.classify }));
vi.mock("./partner-alert-native-runtime",() => ({ bindPartnerAlertNativeSubscriber: mocks.native }));
vi.mock("./partner-alert-premium-whop-access-provider",() => ({ createPartnerAlertPremiumWhopAccessProvider: mocks.provider }));
vi.mock("./partner-alert-premium-whop-refresh",() => ({ createPartnerAlertPremiumWhopRequestSubscriberBinding: mocks.refresh }));
import { createPartnerAlertRequestPremiumBinder } from "./partner-alert-request-premium-binding";

beforeEach(() => { vi.resetAllMocks(); });
function fixture() {
  const userId = "22222222-2222-4222-8222-222222222222",guildId = "1559172784813514803";
  const offer = { scopeRef: "native_premium",environment: "sandbox" as const,accountId: "biz_canonical",productId: "prod_canonical",planId: "plan_canonical" };
  const ticket = { scope: { userId,guildId,authorityKey: "authority",discordUserId: "1001" } };
  const read = { kind: "snapshot",ticket,payer: { kind: "bound" },policy: { state: "active",offerScopes: [offer],
    nativeQualification: { reviewRef: "review",schemaSha256: "c".repeat(64),apiVersion: "2026-10-27-2" } },coverage: [] as unknown[] };
  const db = { name: "/unit/platform.sqlite",inTransaction: false,
    prepare: () => ({ all: () => [{auth_subject:"1001"}] }) };
  const producer = { resolveUserAuthority: vi.fn(() => { expect(db.inTransaction).toBe(true);return { kind: "linked",authorityKey: "authority" }; }),
    captureV2: vi.fn(() => { expect(db.inTransaction).toBe(true);return read; }),
    nativePurchaseV2: vi.fn(() => { expect(db.inTransaction).toBe(true);return { kind: "purchase" }; }),
    isCurrentV2: vi.fn(() => true) };
  const core = { now: () => "2026-11-18T00:00:00.000Z",assertCurrent: vi.fn(() => { expect(db.inTransaction).toBe(true); }),assertLivePrincipal: vi.fn(() => { expect(db.inTransaction).toBe(true); }),memberRepository: vi.fn(() => producer) };
  const provider = { qualification: {},assertCurrent: vi.fn(),prepare: vi.fn() };
  const binding = { refreshPremium: vi.fn(),runtimeAuthority: { database: db,current: () => null },clear: vi.fn() };
  const authority = { refresh: vi.fn() };
  const environment: NodeJS.ProcessEnv = { NODE_ENV: "test",PARTNER_ALERT_PREMIUM_WHOP_SANDBOX_READ_TOKEN: "unit_sandbox_read_key",
    TRADERLINK_PLATFORM_ISOLATED_STAGING_SOURCE_COMMIT: "a".repeat(40),TRADERLINK_PLATFORM_ISOLATED_STAGING_SOURCE_VECTOR_SHA256: "b".repeat(64),
    TRADERLINK_PLATFORM_ISOLATED_STAGING_SCHEMA_SHA256: "c".repeat(64),TRADERLINK_PLATFORM_ISOLATED_STAGING_BUILD_ID: "unit",
    TRADERLINK_PLATFORM_ISOLATED_STAGING_ARTIFACT_SHA256: "d".repeat(64),TRADERLINK_WATCHLIST_DASHBOARD_NAV_DISCORD_SUBJECT:"1001,1003" };
  mocks.identity.mockReturnValue({ mode: "platform_session",sessionId: "session",scope: { userId,workspaceId: "workspace",workspaceRole:"owner",allowedAccountIds:[],activeAccountId:null } });
  mocks.session.mockReturnValue({sessionId:"session",userId});
  mocks.scope.mockReturnValue(mocks.identity().scope);
  mocks.classify.mockReturnValue({ origin: "https://stage.example.test",fingerprint: "unit_stage" });
  mocks.provider.mockReturnValue(provider);mocks.refresh.mockReturnValue(binding);mocks.native.mockReturnValue(authority);
  mocks.admitted.mockReturnValue({ runCommunity: (_community: string,_users: string[],operation: () => unknown) => {
    expect(db.inTransaction).toBe(false);db.inTransaction = true;
    try { return operation(); } finally { db.inTransaction = false; }
  } });
  mocks.writer.mockReturnValue(core);
  const target = { communityId: "community",userId,offerId: "offer",offerVersion: 1,mappingIds: ["mapping"] };
  const request = new Request("https://stage.example.test/partner-channels",{headers:{cookie:"tl_platform_session="+"U".repeat(43)}});
  const input = { database: db,admission: core,request,environment,guildId,paidRoleId: "1002" };
  const create = () => createPartnerAlertRequestPremiumBinder(input as never);
  return { create,input,target,producer,read,offer,provider,binding,authority };
}
it("authenticates the actual buyer before reading a secret or source",() => {
  const f = fixture(),secret = vi.fn(() => "unit_secret");
  Object.defineProperty(f.input.environment,"PARTNER_ALERT_PREMIUM_WHOP_SANDBOX_READ_TOKEN",{ get: secret });
  mocks.identity.mockImplementation(() => { throw new Error("session denied"); });
  expect(f.create().bind(f.target)).toBeNull();expect(secret).not.toHaveBeenCalled();
  expect(mocks.target).not.toHaveBeenCalled();expect(mocks.provider).not.toHaveBeenCalled();
});
it("rejects a foreign target without provider preparation",() => {
  const f = fixture();expect(f.create().bind({ ...f.target,userId: "foreign" })).toBeNull();
  expect(mocks.provider).not.toHaveBeenCalled();expect(mocks.admitted).not.toHaveBeenCalled();
});
it("never substitutes a generic read key when the dedicated sandbox key is absent",() => {
  const f = fixture();delete f.input.environment.PARTNER_ALERT_PREMIUM_WHOP_SANDBOX_READ_TOKEN;f.input.environment.WHOP_API_KEY = "unit_other";
  expect(f.create().bind(f.target)).toBeNull();expect(mocks.provider).not.toHaveBeenCalled();
});
it("checks the actual native target before obtaining a producer",() => {
  const f = fixture();mocks.target.mockImplementation(() => { throw new Error("wrong actual image"); });
  expect(f.create().bind(f.target)).toBeNull();expect(f.input.admission.memberRepository).not.toHaveBeenCalled();
});
it.each(["unbound payer","extra scope","wrong realm","wrong user","wrong API"])("refuses %s instead of a first-link shortcut",kind => {
  const f = fixture();
  if (kind === "unbound payer") f.read.payer.kind = "unbound";
  if (kind === "extra scope") f.read.policy.offerScopes.push({ ...f.offer,scopeRef: "extra" });
  if (kind === "wrong realm") f.read.policy.offerScopes[0]!.environment = "live" as never;
  if (kind === "wrong user") f.read.ticket.scope.userId = "foreign";
  if (kind === "wrong API") f.read.policy.nativeQualification.apiVersion = "unreviewed";
  expect(f.create().bind(f.target)).toBeNull();expect(mocks.provider).not.toHaveBeenCalled();expect(mocks.refresh).not.toHaveBeenCalled();
});
it("wires canonical policy, real request and private hooks without a raw subject or paid flag",() => {
  const f = fixture(),scope = f.create();expect(scope.bind(f.target)).toBe(f.authority);
  expect(mocks.provider.mock.calls[0]![0]).toMatchObject({ offer: f.offer,client: { environment: "sandbox",accountId: f.offer.accountId,
    apiVersionDate: "2026-10-27-2",bearerToken: "unit_sandbox_read_key" } });
  const refresh = mocks.refresh.mock.calls[0]![0];
  expect(refresh.request).toBe(f.input.request);expect(refresh.producer).toBe(f.producer);
  expect(refresh).not.toHaveProperty("ownerRequest");expect(refresh).not.toHaveProperty("readVerifiedNativeSubject");
  expect(f.producer.nativePurchaseV2).toHaveBeenCalledWith(f.read.ticket,f.offer.scopeRef);
  expect(mocks.native.mock.calls[0]![6]).toMatchObject({ refreshPremium: f.binding.refreshPremium,runtimeAuthority: f.binding.runtimeAuthority });
  expect(() => refresh.writer.run(() => refresh.provider.assertCurrent())).not.toThrow();
  scope.clear();expect(f.binding.clear).toHaveBeenCalledOnce();expect(scope.bind(f.target)).toBeNull();
});
it.each(["secret rotation","session change","request headers changed","abort"])("revalidates %s before further provider work",kind => {
  const f = fixture(),controller = new AbortController();f.input.request = new Request(f.input.request.url,{ signal: controller.signal,headers:f.input.request.headers });
  const scope = f.create();expect(scope.bind(f.target)).toBe(f.authority);
  const refresh = mocks.refresh.mock.calls[0]![0];
  if (kind === "secret rotation") f.input.environment.PARTNER_ALERT_PREMIUM_WHOP_SANDBOX_READ_TOKEN = "unit_rotated";
  if (kind === "session change") mocks.identity.mockReturnValue({ mode: "platform_session",sessionId: "other",scope: { userId: f.target.userId,workspaceId: "workspace" } });
  if (kind === "request headers changed") f.input.request.headers.set("x-unit-change","changed");
  if (kind === "abort") controller.abort();
  expect(() => refresh.provider.assertCurrent()).toThrow();scope.clear();
});
it("returns a fresh known-membership list only from current canonical coverage",() => {
  const f = fixture();f.read.coverage = [{ kind: "native_coverage",offer: f.offer,collection: { members: [{ membershipRef: "mem_known" },{ membershipRef: "mem_known" }] } }];
  f.create().bind(f.target);const refresh = mocks.refresh.mock.calls[0]![0];
  expect(refresh.writer.run(() => refresh.readKnownMembershipIds(f.read.ticket))).toEqual(["mem_known"]);
  f.producer.isCurrentV2.mockReturnValue(false);
  expect(() => refresh.writer.run(() => refresh.readKnownMembershipIds(f.read.ticket))).toThrow();
});

it("never invokes the complete Auth resolver inside the owned writer",() => {
  const f=fixture(),scope=f.create();
  const original=mocks.identity();mocks.identity.mockImplementation(()=>{expect(f.input.database.inTransaction).toBe(false);return original;});
  expect(scope.bind(f.target)).toBe(f.authority);
  const refresh=mocks.refresh.mock.calls[0]![0];
  expect(()=>refresh.writer.run(()=>refresh.provider.assertCurrent())).not.toThrow();
  scope.clear();
});
it("rechecks the original native session inside the writer without opening Auth",()=>{
  const f=fixture(),scope=f.create();expect(scope.bind(f.target)).toBe(f.authority);
  const refresh=mocks.refresh.mock.calls[0]![0],calls=mocks.identity.mock.calls.length;
  mocks.session.mockReturnValue(null);
  expect(()=>refresh.writer.run(()=>refresh.provider.assertCurrent())).toThrow();
  expect(mocks.identity.mock.calls.length).toBe(calls);scope.clear();
});
