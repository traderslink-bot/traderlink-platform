import type Database from "better-sqlite3";

export type PlatformProfileInstallInput=Readonly<{profileRef:string;expectedGeneration:number|null;
  retentionPolicyRef:string;backupPolicyRef:string;validUntilUtc:string}>;
export type PlatformReviewedProfile=Readonly<{profileRef:string;retentionPolicyRef:string;
  backupPolicyRef:string;validUntilUtc:string}>;

/** Shared synchronous mutation primitive. The caller owns the existing Auth
 * frame/transaction and supplies the exact admission validators and clock. */
export function installPlatformProfile(input:Readonly<{database:Database.Database;schemaSha256:string;
  profiles:readonly PlatformReviewedProfile[];command:PlatformProfileInstallInput;
  authorizeOwner:()=>void;reference:(value:string)=>string;canonicalUtc:(value:string)=>string;
  nowUtc:()=>string;reject:()=>never}>):number{
  input.authorizeOwner();
  input.reference(input.command.profileRef);input.reference(input.command.retentionPolicyRef);
  input.reference(input.command.backupPolicyRef);
  const reviewed=input.profiles.find(profile=>profile.profileRef===input.command.profileRef);
  if(!reviewed||input.command.retentionPolicyRef!==reviewed.retentionPolicyRef
    ||input.command.backupPolicyRef!==reviewed.backupPolicyRef
    ||input.canonicalUtc(input.command.validUntilUtc)<=input.nowUtc()
    ||input.command.validUntilUtc>reviewed.validUntilUtc)return input.reject();
  const old=input.database.prepare("SELECT generation FROM platform_erasure_profiles WHERE profile_ref=?")
    .get(input.command.profileRef) as {generation:number}|undefined;
  if((old?.generation??null)!==input.command.expectedGeneration)return input.reject();
  const generation=(old?.generation??0)+1;
  input.database.prepare(`INSERT INTO platform_erasure_profiles VALUES(?,?,?,?,?,'hold_signer_and_shared_owner',?)
    ON CONFLICT(profile_ref) DO UPDATE SET generation=excluded.generation,schema_sha256=excluded.schema_sha256,
    retention_policy_ref=excluded.retention_policy_ref,backup_policy_ref=excluded.backup_policy_ref,
    valid_until_utc=excluded.valid_until_utc`).run(input.command.profileRef,generation,input.schemaSha256,
      input.command.retentionPolicyRef,input.command.backupPolicyRef,input.command.validUntilUtc);
  return generation;
}
