// @vitest-environment node
import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MoomooConnectionAccessService } from "./moomoo-connection-access-service";
import { MoomooConnectionRepository } from "./moomoo-connection-repository";
import { runMoomooConnectionMonitor } from "./moomoo-connection-monitor";
import type Database from "better-sqlite3";
import { refreshMoomooAccessToken } from "./moomoo-oauth";
vi.mock("./moomoo-oauth",()=>({getMoomooOAuthConfig:()=>({clientId:"qa"}),refreshMoomooAccessToken:vi.fn()}));
vi.mock("./moomoo-connection-credentials",()=>({loadMoomooCredentialKeyConfiguration:()=>({}),decryptMoomooCredentials:()=>({accessToken:"old",refreshToken:"original"}),encryptMoomooCredentials:vi.fn(({credentials})=>credentials)}));
afterEach(()=>{vi.clearAllMocks();vi.restoreAllMocks();vi.useRealTimers();});
const now = new Date("2026-10-26T00:00:00.000Z");
function fixture(expiry=now.toISOString(), clock:()=>Date=()=>now) {
 const scope={userId:randomUUID(),workspaceId:randomUUID(),workspaceRole:"owner" as const,allowedAccountIds:[],activeAccountId:null};
 const record={connectionId:randomUUID(),state:"active",encrypted:{ciphertext:"revision"},accessTokenExpiresAtUtc:expiry};
 const repo={assertAccessAllowed:vi.fn(),find:vi.fn(()=>record),markReauthorizationRequired:vi.fn(),saveAuthorized:vi.fn()};
 const service=()=>new MoomooConnectionAccessService(repo as unknown as MoomooConnectionRepository,clock);
 return {scope,repo,record,service};
}
describe("refresh requests preserve consent and coalesce",()=>{
 it("does not change state or credentials for a transient outage",async()=>{
  const f=fixture();vi.mocked(refreshMoomooAccessToken).mockResolvedValue({status:"unavailable"});
  await expect(f.service().accessToken(f.scope)).rejects.toThrow();
  await expect(f.service().accessToken(f.scope)).rejects.toThrow();expect(refreshMoomooAccessToken).toHaveBeenCalledTimes(1);expect(f.repo.markReauthorizationRequired).not.toHaveBeenCalled();expect(f.repo.saveAuthorized).not.toHaveBeenCalled();
 });
 it("uses a still-valid token during an early refresh outage",async()=>{
  const f=fixture(new Date(now.getTime()+30000).toISOString());vi.mocked(refreshMoomooAccessToken).mockResolvedValue({status:"unavailable"});
  expect(await f.service().accessToken(f.scope)).toBe("old");expect(f.repo.markReauthorizationRequired).not.toHaveBeenCalled();
 });
 it("coalesces concurrent monitor and request refreshes and only transitions once",async()=>{
  const f=fixture();let finish!:(value:{status:"reauthorization_required"})=>void;
  vi.mocked(refreshMoomooAccessToken).mockImplementation(()=>new Promise(resolve=>{finish=resolve;}));
  const first=f.service().accessToken(f.scope),second=f.service().accessToken(f.scope);
  const results=Promise.allSettled([first,second]);finish({status:"reauthorization_required"});
  expect((await results).every(result=>result.status==="rejected")).toBe(true);
  expect(refreshMoomooAccessToken).toHaveBeenCalledTimes(1);expect(f.repo.markReauthorizationRequired).toHaveBeenCalledTimes(1);
 });
 it("persists successful refresh against its expected credential revision and keeps original refresh token",async()=>{
  const f=fixture();vi.mocked(refreshMoomooAccessToken).mockResolvedValue({status:"refreshed",accessToken:"new",expiresInSeconds:7200,scopes:["quote:read"]});
  expect(await f.service().accessToken(f.scope)).toBe("new");
  expect(f.repo.saveAuthorized).toHaveBeenCalledWith(f.scope,expect.objectContaining({expectedCredentialCiphertext:"revision",encrypted:{accessToken:"new",refreshToken:"original"}}));
 });
 it("never returns an old token that expires while an early refresh is awaiting the provider",async()=>{
  vi.useFakeTimers();vi.setSystemTime(now);
  const f=fixture(new Date(now.getTime()+10000).toISOString(),()=>new Date());
  vi.mocked(refreshMoomooAccessToken).mockImplementation(async()=>{
    await new Promise(resolve=>setTimeout(resolve,15000));return {status:"unavailable"};
  });
  const result=f.service().accessToken(f.scope).then(value=>({value}),error=>({error}));
  await vi.advanceTimersByTimeAsync(15000);
  expect(await result).toMatchObject({error:expect.objectContaining({message:expect.stringContaining("temporarily unavailable")})});
  expect(f.repo.markReauthorizationRequired).not.toHaveBeenCalled();expect(f.repo.saveAuthorized).not.toHaveBeenCalled();
  // Cooldown begins after the failure, not before the 15-second request.
  vi.setSystemTime(new Date(now.getTime()+61000));
  await expect(f.service().accessToken(f.scope)).rejects.toThrow("temporarily unavailable");
  expect(refreshMoomooAccessToken).toHaveBeenCalledTimes(1);
  vi.setSystemTime(new Date(now.getTime()+76000));
  vi.mocked(refreshMoomooAccessToken).mockResolvedValue({status:"unavailable"});
  await expect(f.service().accessToken(f.scope)).rejects.toThrow("temporarily unavailable");
  expect(refreshMoomooAccessToken).toHaveBeenCalledTimes(2);
 });
 it("the real monitor uses a live service clock rather than freezing its selection timestamp",async()=>{
  vi.useFakeTimers();vi.setSystemTime(now);
  const f=fixture(new Date(now.getTime()+10000).toISOString());
  vi.spyOn(MoomooConnectionRepository.prototype,"assertAccessAllowed").mockImplementation(()=>{});
  vi.spyOn(MoomooConnectionRepository.prototype,"find").mockReturnValue(f.record as NonNullable<ReturnType<MoomooConnectionRepository["find"]>>);
  const reconcile=vi.spyOn(MoomooConnectionRepository.prototype,"reconcileAttentionAlert").mockImplementation(()=>{});
  const db={prepare:()=>({all:()=>[{connection_id:f.record.connectionId,user_id:f.scope.userId,workspace_id:f.scope.workspaceId,role:"owner",connection_state:"active"}]})};
  vi.mocked(refreshMoomooAccessToken).mockImplementation(async()=>{
    await new Promise(resolve=>setTimeout(resolve,15000));return {status:"unavailable"};
  });
  const pending=runMoomooConnectionMonitor(db as unknown as Database.Database,{after:"",now:new Date(now)});
  await vi.advanceTimersByTimeAsync(15000);
  expect(await pending).toMatchObject({checked:1,unavailable:1});
  expect(reconcile).not.toHaveBeenCalled();
 });

});
