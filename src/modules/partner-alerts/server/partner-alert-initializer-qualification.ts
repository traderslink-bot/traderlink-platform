import type Database from "better-sqlite3";
import type { PlatformErasureAdmission, PlatformErasureQualificationReceipt } from
  "../../platform/server/privacy/platform-erasure-admission";

export function assertPaidPartnerQualificationValues(receipt: PlatformErasureQualificationReceipt,
  expected: Readonly<{ schemaSha256: string; profileCatalogSha256: string }>): void {
  if (receipt.schemaSha256 !== expected.schemaSha256 || receipt.profileCatalogSha256 !== expected.profileCatalogSha256) {
    throw new Error("partner_initializer_qualification_mismatch");
  }
}
export function requirePaidPartnerInitializerQualification(input: Readonly<{ database: Database.Database;
  core: PlatformErasureAdmission; expectedSchemaSha256: string; expectedProfileCatalogSha256: string }> ):
  PlatformErasureQualificationReceipt {
  const receipt = input.core.qualificationReceipt();
  input.core.assertQualificationReceipt(input.database, receipt);
  assertPaidPartnerQualificationValues(receipt, { schemaSha256: input.expectedSchemaSha256,
    profileCatalogSha256: input.expectedProfileCatalogSha256 });
  return receipt;
}
