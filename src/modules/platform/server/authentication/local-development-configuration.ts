import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  realpathSync,
} from "node:fs";
import { dirname, isAbsolute, relative, resolve } from "node:path";

type AuthoritySection = Readonly<{
  activeKeyVersion: string;
  keysBase64: Readonly<Record<string, string>>;
}>;

type MoomooConnectionSection = Readonly<{
  oauthClientId: string;
  credentialActiveKeyVersion: string;
  credentialKeysBase64: Readonly<Record<string, string>>;
}>;

export type LocalDevelopmentConfiguration = Readonly<{
  databasePath: string;
  evidenceVaultRoot: string;
  uploadStagingRoot: string;
  authorityPath: string;
  protectedStorageRoots: readonly string[];
}>;

function fail(): never {
  throw new Error("platform_local_configuration_invalid");
}

function outsideRepository(repositoryRoot: string, candidate: string): boolean {
  const path = relative(repositoryRoot, candidate);
  return path === ".." || path.startsWith(`..\\`) || isAbsolute(path);
}

function requireDirectory(path: string): string {
  const resolved = resolve(path);
  if (
    !existsSync(resolved) ||
    lstatSync(resolved).isSymbolicLink() ||
    !lstatSync(resolved).isDirectory() ||
    realpathSync(resolved) !== resolved
  ) fail();
  return resolved;
}

function requireFile(path: string): string {
  const resolved = resolve(path);
  if (
    !existsSync(resolved) ||
    lstatSync(resolved).isSymbolicLink() ||
    !lstatSync(resolved).isFile() ||
    realpathSync(resolved) !== resolved
  ) fail();
  return resolved;
}

function authoritySection(value: unknown): AuthoritySection {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail();
  const record = value as Record<string, unknown>;
  if (
    typeof record.activeKeyVersion !== "string" ||
    !record.keysBase64 ||
    typeof record.keysBase64 !== "object" ||
    Array.isArray(record.keysBase64)
  ) fail();
  const keysBase64 = Object.fromEntries(
    Object.entries(record.keysBase64).map(([version, value]) => {
      if (typeof value !== "string") fail();
      const decoded = Buffer.from(value, "base64");
      if (decoded.length < 32 || decoded.toString("base64") !== value) fail();
      return [version, value];
    }),
  );
  if (!(record.activeKeyVersion in keysBase64)) fail();
  return Object.freeze({
    activeKeyVersion: record.activeKeyVersion,
    keysBase64: Object.freeze(keysBase64),
  });
}

function moomooConnectionSection(value: unknown): MoomooConnectionSection {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail();
  const record = value as Record<string, unknown>;
  if (
    typeof record.oauthClientId !== "string" || record.oauthClientId.length < 1 ||
    typeof record.credentialActiveKeyVersion !== "string" ||
    !record.credentialKeysBase64 || typeof record.credentialKeysBase64 !== "object" ||
    Array.isArray(record.credentialKeysBase64)
  ) fail();
  const credentialKeysBase64 = Object.fromEntries(
    Object.entries(record.credentialKeysBase64).map(([version, value]) => {
      if (typeof value !== "string" || !/^[A-Za-z0-9_-]{1,64}$/u.test(version)) fail();
      const decoded = Buffer.from(value, "base64");
      if (decoded.length !== 32 || decoded.toString("base64") !== value) fail();
      return [version, value];
    }),
  );
  if (!(record.credentialActiveKeyVersion in credentialKeysBase64)) fail();
  return Object.freeze({
    oauthClientId: record.oauthClientId,
    credentialActiveKeyVersion: record.credentialActiveKeyVersion,
    credentialKeysBase64: Object.freeze(credentialKeysBase64),
  });
}

export function loadTraderLinkPlatformLocalDevelopmentConfiguration(
  options: Readonly<{
    repositoryRoot: string;
    environment?: NodeJS.ProcessEnv;
  }>,
): LocalDevelopmentConfiguration {
  const environment = options.environment ?? process.env;
  const repositoryRoot = requireDirectory(options.repositoryRoot);
  const privateDataRoot = requireDirectory(
    environment.TRADERLINK_PLATFORM_LOCAL_PRIVATE_DATA_ROOT ??
      resolve(repositoryRoot, "..", "private-data"),
  );
  if (!outsideRepository(repositoryRoot, privateDataRoot)) fail();
  const databasePath = requireFile(
    environment.TRADERLINK_PLATFORM_DB_PATH ??
      resolve(privateDataRoot, "traderlink-platform", "development.sqlite"),
  );
  const evidenceVaultRoot = requireDirectory(
    environment.TRADERLINK_PLATFORM_JOURNAL_EVIDENCE_VAULT_ROOT ??
      resolve(privateDataRoot, "traderlink-platform-import-artifacts"),
  );
  const uploadStagingRoot = resolve(
    environment.TRADERLINK_PLATFORM_JOURNAL_UPLOAD_STAGING_ROOT ??
      resolve(privateDataRoot, "traderlink-platform-upload-staging"),
  );
  if (!existsSync(uploadStagingRoot)) {
    mkdirSync(uploadStagingRoot, { recursive: true, mode: 0o700 });
  }
  requireDirectory(uploadStagingRoot);
  const authorityPath = requireFile(
    environment.TRADERLINK_PLATFORM_JOURNAL_AUTHORITY_PATH ??
      resolve(
        privateDataRoot,
        "traderlink-platform-config",
        "journal-authority-v1.json",
      ),
  );
  for (const candidate of [databasePath, evidenceVaultRoot, uploadStagingRoot, authorityPath]) {
    if (!outsideRepository(repositoryRoot, candidate)) fail();
  }

  const authorityDocument: unknown = JSON.parse(readFileSync(authorityPath, "utf8"));
  if (!authorityDocument || typeof authorityDocument !== "object" || Array.isArray(authorityDocument)) {
    fail();
  }
  const authority = authorityDocument as Record<string, unknown>;
  const accountIdentity = authoritySection(authority.accountIdentity);
  const journalPrivacy = authoritySection(authority.journalPrivacy);
  const moomooPath = resolve(dirname(authorityPath), "moomoo-connection-v1.json");
  const moomoo = existsSync(moomooPath)
    ? moomooConnectionSection(JSON.parse(readFileSync(requireFile(moomooPath), "utf8")))
    : null;
  const defaultProtectedRoots = [
    resolve(privateDataRoot, "v3-dashboard"),
    resolve(privateDataRoot, "legacy-app"),
    resolve(dirname(privateDataRoot), "..", "traderslink.pro back up july 29"),
  ].filter((candidate) => existsSync(candidate)).map(requireDirectory);
  const protectedStorageRoots = environment
    .TRADERLINK_PLATFORM_JOURNAL_PROTECTED_STORAGE_ROOTS_JSON
    ? JSON.parse(environment.TRADERLINK_PLATFORM_JOURNAL_PROTECTED_STORAGE_ROOTS_JSON) as unknown
    : defaultProtectedRoots;
  if (
    !Array.isArray(protectedStorageRoots) ||
    protectedStorageRoots.length === 0 ||
    protectedStorageRoots.some((root) => typeof root !== "string")
  ) fail();
  const checkedProtectedRoots = Object.freeze(
    protectedStorageRoots.map((root) => requireDirectory(String(root))),
  );

  Object.assign(environment, {
    TRADERLINK_PLATFORM_DB_PATH: databasePath,
    TRADERLINK_PLATFORM_JOURNAL_AUTHORITY_PATH: authorityPath,
    TRADERLINK_PLATFORM_JOURNAL_EVIDENCE_VAULT_ROOT: evidenceVaultRoot,
    TRADERLINK_PLATFORM_JOURNAL_UPLOAD_STAGING_ROOT: uploadStagingRoot,
    TRADERLINK_PLATFORM_JOURNAL_PROTECTED_STORAGE_ROOTS_JSON:
      JSON.stringify(checkedProtectedRoots),
    TRADERLINK_PLATFORM_ACCOUNT_IDENTITY_ACTIVE_KEY_VERSION:
      accountIdentity.activeKeyVersion,
    TRADERLINK_PLATFORM_ACCOUNT_IDENTITY_HMAC_KEYS_JSON:
      JSON.stringify(accountIdentity.keysBase64),
    TRADERLINK_PLATFORM_JOURNAL_HMAC_ACTIVE_KEY_VERSION:
      journalPrivacy.activeKeyVersion,
    TRADERLINK_PLATFORM_JOURNAL_HMAC_KEYS_JSON:
      JSON.stringify(journalPrivacy.keysBase64),
    ...(moomoo ? {
      TRADERLINK_MOOMOO_OAUTH_CLIENT_ID: moomoo.oauthClientId,
      TRADERLINK_MOOMOO_CREDENTIAL_ACTIVE_KEY_VERSION:
        moomoo.credentialActiveKeyVersion,
      TRADERLINK_MOOMOO_CREDENTIAL_KEYS_BASE64:
        JSON.stringify(moomoo.credentialKeysBase64),
    } : {}),
  });
  return Object.freeze({
    databasePath,
    evidenceVaultRoot,
    uploadStagingRoot,
    authorityPath,
    protectedStorageRoots: checkedProtectedRoots,
  });
}
