// @vitest-environment node
import {describe,expect,it} from "vitest";
import {PartnerAlertRestoreReapplication} from "./partner-alert-restore-reapplication";

const held=(operation:()=>unknown)=>expect(operation).toThrowError(expect.objectContaining({code:"held",message:"Platform operation requires current admission."}));
describe("Partner Channel restore reapplication remains unbound",()=>{
 it("rejects construction without a bounded historical key set",()=>{held(()=>new PartnerAlertRestoreReapplication(null as never,{read:()=>{throw new Error("ledger must not be read");}},{keys:[],bindingKeyringSha256:"b".repeat(64),nowUtc:()=>"2026-11-03T12:00:00.000Z"}));});
 it("rejects construction without an exact keyring digest",()=>{held(()=>new PartnerAlertRestoreReapplication(null as never,{read:()=>{throw new Error("ledger must not be read");}},{keys:[{keyRef:"binding-v1",key:new Uint8Array(32).fill(3)}],bindingKeyringSha256:"wrong",nowUtc:()=>"2026-11-03T12:00:00.000Z"}));});
});
