import "server-only";

import type Database from "better-sqlite3";

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { JournalAccountRepository } from "../accounts/journal-account-repository";
import {
  JournalAccountService,
  loadAccountIdentityConfiguration,
} from "../accounts/journal-account-service";
import {
  MOOMOO_SOURCE_ACCOUNT_CANONICALIZERS,
  MOOMOO_SOURCE_ACCOUNT_CANONICALIZATION_VERSION,
} from "../accounts/moomoo-source-account-canonicalizer";
import {
  decryptMoomooPrivateData,
  encryptMoomooPrivateData,
  type EncryptedMoomooPrivateData,
} from "@/src/modules/platform/server/broker-connections/moomoo-private-data-crypto";
import {
  loadMoomooCredentialKeyConfiguration,
} from "@/src/modules/platform/server/broker-connections/moomoo-connection-credentials";
import { MoomooConnectionAccessService } from "@/src/modules/platform/server/broker-connections/moomoo-connection-access-service";
import { MoomooConnectionRepository } from "@/src/modules/platform/server/broker-connections/moomoo-connection-repository";
import {
  type MoomooAuthorizedTradingAccount,
  MoomooTradingReadClient,
} from "@/src/modules/platform/server/broker-connections/moomoo-trading-read-client";
import {
  createCanonicalUtcTimestamp,
  createCanonicalUuidV4,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";
import {
  MoomooExecutionImportRepository,
  type MoomooBrokerAccountLink,
} from "./moomoo-execution-import-repository";

export type MoomooAuthorizedAccountOption = Readonly<{
  selectionRef: string;
  label: string;
  accountType: "cash" | "margin" | "unknown";
  authorizedMarketCount: number;
}>;

export type MoomooLinkedAccountOption = Readonly<{
  linkRef: string;
  label: string;
  accountType: "cash" | "margin" | "unknown";
  authorizedMarketCount: number;
}>;

function encodePrivateRef(
  kind: "moomoo_account_selection_v1" | "moomoo_account_link_v1",
  encrypted: EncryptedMoomooPrivateData,
): string {
  return Buffer.from(JSON.stringify([
    kind,
    encrypted.keyVersion,
    encrypted.initializationVector,
    encrypted.ciphertext,
    encrypted.authenticationTag,
  ]), "utf8").toString("base64url");
}

function decodePrivateRef(
  value: string,
  expectedKind: "moomoo_account_selection_v1" | "moomoo_account_link_v1",
): EncryptedMoomooPrivateData {
  if (value.length < 1 || value.length > 8192 || !/^[A-Za-z0-9_-]+$/u.test(value)) {
    platformFailure("TRADERLINK_BROKER_CONNECTION_ACCESS_DENIED", {
      stage: "account_selection_ref",
    });
  }
  try {
    const parsed: unknown = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    if (
      !Array.isArray(parsed) || parsed.length !== 5 ||
      parsed[0] !== expectedKind ||
      parsed.slice(1).some((part) => typeof part !== "string")
    ) throw new Error();
    return Object.freeze({
      keyVersion: parsed[1] as string,
      initializationVector: parsed[2] as string,
      ciphertext: parsed[3] as string,
      authenticationTag: parsed[4] as string,
    });
  } catch {
    platformFailure("TRADERLINK_BROKER_CONNECTION_ACCESS_DENIED", {
      stage: "account_selection_ref",
    });
  }
}

function encodeSelectionRef(encrypted: EncryptedMoomooPrivateData): string {
  return encodePrivateRef("moomoo_account_selection_v1", encrypted);
}

function decodeSelectionRef(value: string): EncryptedMoomooPrivateData {
  return decodePrivateRef(value, "moomoo_account_selection_v1");
}

function sortedAccounts(
  accounts: readonly MoomooAuthorizedTradingAccount[],
): readonly MoomooAuthorizedTradingAccount[] {
  return Object.freeze([...accounts].sort((left, right) =>
    left.accountType.localeCompare(right.accountType) ||
    left.accountId.localeCompare(right.accountId)));
}

function accountLabel(
  account: MoomooAuthorizedTradingAccount,
  index: number,
): string {
  const kind = account.accountType === "unknown" ? "trading" : account.accountType;
  return `Moomoo ${kind} account ${index + 1}`;
}

export class MoomooExecutionImportAccountService {
  private readonly connectionRepository: MoomooConnectionRepository;
  private readonly accessService: MoomooConnectionAccessService;
  private readonly importRepository: MoomooExecutionImportRepository;

  constructor(
    private readonly database: Database.Database,
    private readonly client: MoomooTradingReadClient = new MoomooTradingReadClient(),
    private readonly now: () => Date = () => new Date(),
  ) {
    this.connectionRepository = new MoomooConnectionRepository(database);
    this.accessService = new MoomooConnectionAccessService(
      this.connectionRepository,
      now,
    );
    this.importRepository = new MoomooExecutionImportRepository(database);
  }

  async discoverAuthorizedAccounts(
    scope: WorkspaceAccessScope,
  ): Promise<readonly MoomooAuthorizedAccountOption[]> {
    const token = await this.accessService.executionAccessToken(scope);
    const accounts = sortedAccounts(await this.client.authorizedAccounts(token));
    const configuration = loadMoomooCredentialKeyConfiguration();
    return Object.freeze(accounts.map((account, index) => Object.freeze({
      selectionRef: encodeSelectionRef(encryptMoomooPrivateData({
        configuration,
        purpose: "broker_account_id",
        plaintext: account.accountId,
      })),
      label: accountLabel(account, index),
      accountType: account.accountType,
      authorizedMarketCount: account.enabledMarketCodes.length,
    })));
  }

  listLinkedAccounts(
    scope: WorkspaceAccessScope,
    journalAccountId: string,
  ): readonly MoomooLinkedAccountOption[] {
    if (!scope.allowedAccountIds.includes(journalAccountId)) {
      platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    }
    const configuration = loadMoomooCredentialKeyConfiguration();
    return Object.freeze(this.importRepository
      .listLinks(scope.workspaceId, journalAccountId)
      .filter((link) => link.state === "active")
      .map((link) => Object.freeze({
        linkRef: encodePrivateRef(
          "moomoo_account_link_v1",
          encryptMoomooPrivateData({
            configuration,
            purpose: "broker_account_link_ref",
            plaintext: link.brokerAccountLinkId,
          }),
        ),
        label: link.privacySafeLabel,
        accountType: link.accountType,
        authorizedMarketCount: link.enabledMarketCodes.length,
      })));
  }

  resolveLinkedAccount(input: Readonly<{
    scope: WorkspaceAccessScope;
    journalAccountId: string;
    linkRef: string;
  }>): MoomooBrokerAccountLink {
    if (!input.scope.allowedAccountIds.includes(input.journalAccountId)) {
      platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    }
    const configuration = loadMoomooCredentialKeyConfiguration();
    const brokerAccountLinkId = decryptMoomooPrivateData({
      configuration,
      purpose: "broker_account_link_ref",
      encrypted: decodePrivateRef(input.linkRef, "moomoo_account_link_v1"),
    });
    const link = this.importRepository.findLinkById(
      input.scope.workspaceId,
      input.journalAccountId,
      brokerAccountLinkId,
    );
    if (!link || link.state !== "active") {
      platformFailure("TRADERLINK_BROKER_CONNECTION_ACCESS_DENIED", {
        stage: "linked_account_unavailable",
      });
    }
    return link;
  }

  async linkAuthorizedAccount(input: Readonly<{
    scope: WorkspaceAccessScope;
    journalAccountId: string;
    selectionRef: string;
  }>): Promise<MoomooBrokerAccountLink> {
    const configuration = loadMoomooCredentialKeyConfiguration();
    const rawAccountId = decryptMoomooPrivateData({
      configuration,
      purpose: "broker_account_id",
      encrypted: decodeSelectionRef(input.selectionRef),
    });
    const token = await this.accessService.executionAccessToken(input.scope);
    const accounts = sortedAccounts(await this.client.authorizedAccounts(token));
    const selectedIndex = accounts.findIndex((account) => account.accountId === rawAccountId);
    const selected = accounts[selectedIndex];
    if (!selected) {
      platformFailure("TRADERLINK_BROKER_CONNECTION_ACCESS_DENIED", {
        stage: "authorized_account_changed",
      });
    }
    const connection = this.connectionRepository.find(input.scope);
    if (!connection || connection.state !== "active") {
      platformFailure("TRADERLINK_BROKER_CONNECTION_ACCESS_DENIED");
    }
    const privacySafeLabel = accountLabel(selected, selectedIndex);
    const accountService = new JournalAccountService(
      new JournalAccountRepository(this.database),
      loadAccountIdentityConfiguration(
        process.env,
        MOOMOO_SOURCE_ACCOUNT_CANONICALIZERS,
        MOOMOO_SOURCE_ACCOUNT_CANONICALIZATION_VERSION,
      ),
    );
    const sourceIdentity = accountService.confirmSourceIdentityLink(input.scope, {
      accountId: input.journalAccountId,
      sourceSystem: "moomoo",
      rawSourceAccountId: rawAccountId,
      privacySafeDisplay: privacySafeLabel,
      sourceAccountCanonicalizationVersion:
        MOOMOO_SOURCE_ACCOUNT_CANONICALIZATION_VERSION,
      now: this.now(),
    });
    const timestamp = createCanonicalUtcTimestamp(this.now());
    return this.importRepository.upsertLink({
      brokerAccountLinkId:
        this.importRepository.findLinkBySourceIdentity(
          input.scope.workspaceId,
          input.journalAccountId,
          sourceIdentity.sourceIdentityId,
        )?.brokerAccountLinkId ?? createCanonicalUuidV4(),
      workspaceId: input.scope.workspaceId,
      accountId: input.journalAccountId,
      sourceIdentityId: sourceIdentity.sourceIdentityId,
      connectionId: connection.connectionId,
      privacySafeLabel,
      accountType: selected.accountType,
      enabledMarketCodes: selected.enabledMarketCodes,
      encryptedAccountId: encryptMoomooPrivateData({
        configuration,
        purpose: "broker_account_id",
        plaintext: rawAccountId,
      }),
      timestamp,
    });
  }
}
