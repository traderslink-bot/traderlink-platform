import { createCipheriv, createDecipheriv, createHmac, randomBytes } from "node:crypto";
import { PartnerAlertValidationError, type PartnerAlertEnvironment } from "../contracts/partner-alert-contracts";
import { partnerAlertId, partnerAlertRecord, partnerAlertUtc } from "../contracts/partner-alert-validation";

export type PartnerAlertCredentialContext = Readonly<{
  communityId: string;
  environment: PartnerAlertEnvironment;
  accountId: string;
  purpose: "community_verification" | "publishing_verification";
}>;
export type PartnerAlertCredentialKeys = Readonly<{
  activeKeyVersion: string;
  keysBase64: Readonly<Record<string, string>>;
}>;
export type PartnerAlertWhopCredentials = Readonly<{
  accessToken: string;
  refreshToken: string | null;
  expiresAtUtc: string;
}>;
export type PartnerAlertEncryptedCredentials = Readonly<{
  version: 1;
  keyVersion: string;
  iv: string;
  ciphertext: string;
  tag: string;
}>;

const KEY_VERSION = /^[A-Za-z0-9_-]{1,64}$/u;
function failure(): never { throw new PartnerAlertValidationError("credentials", "The secure connection needs attention."); }
function decodeKey(value: unknown): Buffer {
  if (typeof value !== "string" || value.length !== 44) return failure();
  const key = Buffer.from(value, "base64");
  if (key.length !== 32 || key.toString("base64") !== value) return failure();
  return key;
}
function selectedKey(configuration: PartnerAlertCredentialKeys, version: string): Buffer {
  if (!KEY_VERSION.test(configuration.activeKeyVersion) || !KEY_VERSION.test(version)) return failure();
  const keys = partnerAlertRecord(configuration.keysBase64, "credentialKeys");
  if (!Object.prototype.hasOwnProperty.call(keys, version)) return failure();
  return decodeKey(keys[version]);
}
function aad(context: PartnerAlertCredentialContext): Buffer {
  partnerAlertId(context.communityId, "communityId");
  if (!["sandbox", "live"].includes(context.environment) || !/^biz_[A-Za-z0-9_]{1,124}$/u.test(context.accountId)
    || !["community_verification", "publishing_verification"].includes(context.purpose)) return failure();
  return Buffer.from(JSON.stringify(["partner-alert-whop-credentials-v1", context.communityId,
    context.environment, context.accountId, context.purpose]), "utf8");
}
function credentials(value: unknown): PartnerAlertWhopCredentials {
  const data = partnerAlertRecord(value, "credentials");
  const token = (value: unknown) => typeof value === "string" && value.length >= 1
    && value.length <= 8192 && !/[\u0000-\u0020\u007f]/u.test(value);
  if (!token(data.accessToken) || (data.refreshToken !== null && !token(data.refreshToken))) return failure();
  return Object.freeze({ accessToken: data.accessToken as string, refreshToken: data.refreshToken as string | null,
    expiresAtUtc: partnerAlertUtc(data.expiresAtUtc, "expiresAtUtc") });
}
function base64url(value: unknown, length?: number): Buffer {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]+$/u.test(value) || value.length > 32_000) return failure();
  const bytes = Buffer.from(value, "base64url");
  if ((length !== undefined && bytes.length !== length) || bytes.toString("base64url") !== value) return failure();
  return bytes;
}

/** No key/env/token reads on import. Explicit calls alone perform cryptography. */
export function encryptPartnerAlertCredentials(input: Readonly<{
  context: PartnerAlertCredentialContext;
  configuration: PartnerAlertCredentialKeys;
  credentials: PartnerAlertWhopCredentials;
}>): PartnerAlertEncryptedCredentials {
  const payload = credentials(input.credentials);
  const keyVersion = input.configuration.activeKeyVersion;
  const key = selectedKey(input.configuration, keyVersion);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv, { authTagLength: 16 });
  cipher.setAAD(aad(input.context));
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(payload), "utf8"), cipher.final()]);
  return Object.freeze({ version: 1, keyVersion, iv: iv.toString("base64url"),
    ciphertext: ciphertext.toString("base64url"), tag: cipher.getAuthTag().toString("base64url") });
}

export function decryptPartnerAlertCredentials(input: Readonly<{
  context: PartnerAlertCredentialContext;
  configuration: PartnerAlertCredentialKeys;
  encrypted: PartnerAlertEncryptedCredentials;
  nowUtc: string;
}>): PartnerAlertWhopCredentials {
  try {
    if (input.encrypted.version !== 1) return failure();
    const key = selectedKey(input.configuration, input.encrypted.keyVersion);
    const decipher = createDecipheriv("aes-256-gcm", key, base64url(input.encrypted.iv, 12), { authTagLength: 16 });
    decipher.setAAD(aad(input.context));
    decipher.setAuthTag(base64url(input.encrypted.tag, 16));
    const plaintext = Buffer.concat([decipher.update(base64url(input.encrypted.ciphertext)), decipher.final()]);
    const payload = credentials(JSON.parse(plaintext.toString("utf8")));
    if (payload.expiresAtUtc <= partnerAlertUtc(input.nowUtc, "nowUtc")) return failure();
    return payload;
  } catch { return failure(); }
}

/** Separate identity key, not the credential encryption key. Never hash an email. */
export function createPartnerAlertWhopUserReference(input: Readonly<{
  environment: PartnerAlertEnvironment;
  whopUserId: string;
  identityKeyBase64: string;
}>): string {
  if (!["sandbox", "live"].includes(input.environment) || !/^user_[A-Za-z0-9_]{1,123}$/u.test(input.whopUserId)) return failure();
  return createHmac("sha256", decodeKey(input.identityKeyBase64))
    .update(JSON.stringify(["partner-alert-whop-user-v1", input.environment, input.whopUserId]), "utf8").digest("hex");
}
