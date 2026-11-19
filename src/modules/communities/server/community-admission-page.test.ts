// @vitest-environment node
import type Database from "better-sqlite3";
import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import type {JournalAdminScope} from "../../platform/contracts/journal-admin-scope";
import {DEFAULT_COMMUNITY_ADMISSION_POLICY} from "../contracts/community-admission";

const fixture=vi.hoisted(()=>({pageDatabase:vi.fn()}));
vi.mock("@/src/modules/platform/server/administration/require-journal-admin-page",()=>({
  withJournalAdminPageDatabase:fixture.pageDatabase,
}));
vi.mock("@/app/admin/journal/journal-admin-ui",()=>({
  JournalAdminPage:()=>null,JournalAdminPageHeader:()=>null,
}));
vi.mock("@/app/admin/journal/communities/admission/admission-editor",()=>({
  CommunityAdmissionEditor:()=>null,
}));
vi.mock("@/app/admin/journal/journal-admin-access-denied",()=>({
  JournalAdminAccessDenied:()=>null,
}));
vi.mock("@mui/material/Alert",()=>({default:()=>null}));

import CommunityAdmissionPage from "@/app/admin/journal/communities/admission/page";
import {JournalAdminPage} from "@/app/admin/journal/journal-admin-ui";
import {JournalAdminAccessDenied} from "@/app/admin/journal/journal-admin-access-denied";
import {CommunityAdmissionError,CommunityAdmissionService} from "./community-admission-service";

const at="2026-11-19T10:00:00.000Z";
function scope(ownerProofAgeMs:number):JournalAdminScope{
  return {userId:"10000000-0000-4000-8000-000000000001",role:"journal_owner_admin",mode:"production_discord_owner",
    authorizedAtUtc:at,discordOwnerVerifiedAtUtc:new Date(Date.parse(at)-ownerProofAgeMs).toISOString(),permissions:["manage_users"]};
}
beforeEach(()=>{
  vi.useFakeTimers();vi.setSystemTime(new Date(at));
  fixture.pageDatabase.mockReset();
});
afterEach(()=>{vi.restoreAllMocks();vi.useRealTimers();});

describe("Community admission page authorization result",()=>{
  it("keeps the fresh owner page at the existing five-minute boundary",async()=>{
    const read=vi.spyOn(CommunityAdmissionService.prototype,"read").mockReturnValue({
      available:true,entries:[],hasMore:false,policy:DEFAULT_COMMUNITY_ADMISSION_POLICY,
    });
    fixture.pageDatabase.mockImplementation(operation=>operation({} as Database.Database,scope(300_000)));
    expect((await CommunityAdmissionPage()).type).toBe(JournalAdminPage);
    expect(read).toHaveBeenCalledOnce();
  });
  it("shows the existing access-denied component when the real service rejects stale owner proof",async()=>{
    const read=vi.spyOn(CommunityAdmissionService.prototype,"read");
    fixture.pageDatabase.mockImplementation(operation=>operation({} as Database.Database,scope(300_001)));
    expect((await CommunityAdmissionPage()).type).toBe(JournalAdminAccessDenied);
    expect(read).not.toHaveBeenCalled();
  });
  it.each([
    new CommunityAdmissionError("Storage unavailable",503),
    new Error("Unexpected database failure"),
    {status:403,message:"Not a CommunityAdmissionError"},
  ])("rethrows other errors without disguising them as an authorization denial",async error=>{
    fixture.pageDatabase.mockRejectedValue(error);
    await expect(CommunityAdmissionPage()).rejects.toBe(error);
  });
});
