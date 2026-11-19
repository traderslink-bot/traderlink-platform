// @vitest-environment node
import Database from "better-sqlite3";
import { afterEach,beforeEach,expect,it,vi } from "vitest";
const native=vi.hoisted(()=>({identity:vi.fn(),configuration:vi.fn()}));
vi.mock("./whop-ai-review-staging-identity",()=>({requireWhopOAuthRequestIdentity:native.identity,loadWhopOAuthRequestConfiguration:native.configuration}));
import { canConnectWhopAccount,readWhopAccountConnectionNotice,readWhopAccountIdentity } from "./whop-account-connection";

const user="11111111-1111-4111-8111-111111111111",other="22222222-2222-4222-8222-222222222222";
let db:Database.Database;
beforeEach(()=>{
  vi.resetAllMocks();vi.stubEnv("TRADERLINK_PLATFORM_PUBLIC_ORIGIN","https://stage.example.test");
  db=new Database(":memory:");
  // Identity reader contract fixture only; no entitlement/policy qualification.
  db.exec("CREATE TABLE platform_whop_user_links(user_id TEXT,link_state TEXT); CREATE TABLE platform_whop_membership_projections(user_id TEXT,membership_state TEXT)");
  native.identity.mockReturnValue({mode:"platform_session",sessionId:"original_session",scope:{userId:user}});
  native.configuration.mockReturnValue({realm:"sandbox"});
});
afterEach(()=>{db.close();vi.unstubAllEnvs();});
function read(){db.pragma("query_only=ON");return readWhopAccountIdentity(db,user);}
it("does not infer a connection or paid access from an AI projection",()=>{
  db.prepare("INSERT INTO platform_whop_membership_projections VALUES(?,'active')").run(user);
  expect(read()).toBe("not_linked");expect(native.configuration).not.toHaveBeenCalled();
});
it("reads only this user's canonical identity and ignores payment status",()=>{
  db.prepare("INSERT INTO platform_whop_user_links VALUES(?,'active'),(?,'conflict')").run(user,other);
  db.prepare("INSERT INTO platform_whop_membership_projections VALUES(?,'deactivated')").run(user);
  expect(read()).toBe("linked");
});
it.each([["conflict","conflict"],["revoked","not_linked"],["invalid","unavailable"]] as const)("maps %s canonical identity safely",(stored,expected)=>{
  db.prepare("INSERT INTO platform_whop_user_links VALUES(?,?)").run(user,stored);expect(read()).toBe(expected);
});
it("holds ambiguous active identity rows",()=>{
  db.prepare("INSERT INTO platform_whop_user_links VALUES(?,'active'),(?,'active')").run(user,user);expect(read()).toBe("conflict");
});
it("requires a read-only context and returns unavailable for missing schema",()=>{
  expect(readWhopAccountIdentity(db,user)).toBe("unavailable");
  db.exec("DROP TABLE platform_whop_user_links");expect(read()).toBe("unavailable");
});
it("uses the actual native loader and trusted public origin before offering sandbox connect",()=>{
  expect(canConnectWhopAccount(new Headers({host:"attacker.example"}),user)).toBe(true);
  const request=native.configuration.mock.calls[0]![0];expect(new URL(request.url).origin).toBe("https://stage.example.test");
});
it("does not offer a connection for a different or unsupported original identity",()=>{
  native.identity.mockReturnValue({mode:"platform_session",sessionId:"other",scope:{userId:other}});
  expect(canConnectWhopAccount(new Headers(),user)).toBe(false);expect(native.configuration).not.toHaveBeenCalled();
});
it("does not turn production or failed native qualification into a sandbox action",()=>{
  native.configuration.mockReturnValue({realm:"live"});expect(canConnectWhopAccount(new Headers(),user)).toBe(false);
  native.configuration.mockImplementation(()=>{throw Error("native denied");});expect(canConnectWhopAccount(new Headers(),user)).toBe(false);
});
it("accepts only fixed display outcomes and never arbitrary callback text",()=>{
  expect(readWhopAccountConnectionNotice("connected")).toBe("connected");
  expect(readWhopAccountConnectionNotice(["connected"])).toBeNull();
  expect(readWhopAccountConnectionNotice("https://attacker.example")).toBeNull();
});
