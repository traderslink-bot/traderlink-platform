import "server-only";

import { createPublicKey, type KeyObject } from "node:crypto";
import type Database from "better-sqlite3";
import { requirePlatformErasureWriter } from "../../platform/server/privacy/platform-erasure-admission";
import { createPartnerAlertDiscordRoleRest } from "./partner-alert-discord-role-rest";
import { createPartnerAlertManagedRoleTransport } from "./partner-alert-managed-role-transport";
import { partnerAlertOutputBindingMatches, type PartnerAlertDiscordOutputConfiguration } from "./partner-alert-provider-runtime-configuration";
import { createPartnerAlertStripeErasureDiscordObserver, issuePartnerAlertStripeErasureRoleProof, readPartnerAlertStripeErasureRoleFacts,
  type StripeErasureRoleFacts, type StripeErasureRoleProofScope } from "./partner-alert-stripe-erasure-role-proof";
import { createPartnerAlertStripeErasureAuthorityReader, createPartnerAlertStripeErasureIntentReader,
  type StripeErasureAuthorityQuery, type StripeErasureAuthoritySources } from "./partner-alert-stripe-erasure-authority";
import { openPartnerAlertStripeErasureTransportArchive, readPartnerAlertStripeErasureTransport,
  settlePartnerAlertStripeErasureTransport } from "./partner-alert-stripe-erasure-transport";
import { openPartnerAlertStripeErasureSettlementArchive, readSettledPartnerAlertStripeErasureRoleCoverage,
  recordPartnerAlertStripeErasureSettlements } from "./partner-alert-stripe-erasure-settlement";

type RootScope = Extract<StripeErasureRoleProofScope,{mode:"root"}>;
type RestoreScope = Extract<StripeErasureRoleProofScope,{mode:"restore"}>;
type RoleProofKeys = Readonly<{keyId:string;privateKey:KeyObject;publicKey:KeyObject;maximumLifetimeMs:number}>;

/** An erased buyer can no longer hold either provider's member access. The
 * seller-erasure case still needs a separately qualified survivor decision. */
export function createPartnerAlertErasedBuyerCoverage(db: Database.Database) {
  const identity = db.prepare(`SELECT user_id FROM platform_auth_identities
    WHERE auth_provider='discord' AND auth_subject=? AND status='active' LIMIT 2`).pluck();
  const lifecycle = db.prepare(`SELECT valid_until_utc FROM platform_erasure_lifecycles
    WHERE user_id=? AND lifecycle_ref=? AND operation_ref=? AND erasure_generation=? AND phase='settling'`).pluck();
  const read = (connection: Database.Database, query: StripeErasureAuthorityQuery, provider: "stripe" | "whop") => {
    const { scope,facts,discordUserId,atUtc } = query;
    if (connection !== db || !db.inTransaction || scope.userId !== facts.scope.buyer_user_id) return null;
    const linked = identity.all(discordUserId);
    const validUntilUtc = lifecycle.get(scope.userId,scope.lifecycleRef,scope.operationRef,scope.erasureGeneration);
    if (linked.length !== 1 || linked[0] !== scope.userId || typeof validUntilUtc !== "string" || validUntilUtc <= atUtc) return null;
    const current = readPartnerAlertStripeErasureRoleFacts(db,scope.userId).entries.find(entry =>
      entry.scope.buyer_user_id === scope.userId && entry.scope.community_id === facts.scope.community_id
      && entry.scope.mapping_id === facts.scope.mapping_id && entry.guildId === facts.guildId && entry.roleId === facts.roleId);
    return current ? { kind:"absent" as const,
      authoritySha256:provider === "stripe" ? current.stripeAuthoritySha256 : current.whopAuthoritySha256,validUntilUtc } : null;
  };
  return Object.freeze({
    readStripeSurvivor: (connection: Database.Database, query: StripeErasureAuthorityQuery) => read(connection,query,"stripe"),
    readWhopSurvivor: (connection: Database.Database, query: StripeErasureAuthorityQuery) => read(connection,query,"whop"),
  });
}

/** Composes the real app output registry and bot with Core's admitted root.
 * The worker and its configuration are supplied by that runtime, never an HTTP payload. */
export function createPartnerAlertStripeErasureRuntime(db: Database.Database, input: Readonly<{
  nowUtc: () => string;
  inRootWriter: <T>(operation: () => T) => T;
  readCurrentConfiguration: () => PartnerAlertDiscordOutputConfiguration | null;
  forbiddenRoleIds: readonly string[];
  sources: Omit<StripeErasureAuthoritySources,"readSettledTransport">;
  discordFetch?: typeof fetch;
  readAuthenticatedRestoreTransport?: StripeErasureAuthoritySources["readSettledTransport"];
}>) {
  const readIntent = createPartnerAlertStripeErasureIntentReader(db,input.sources);
  const readAuthority = createPartnerAlertStripeErasureAuthorityReader(db,{
    ...input.sources,
    readSettledTransport: (connection,query,desiredPresent) => query.scope.mode === "root"
      ? readPartnerAlertStripeErasureTransport(connection,query,desiredPresent)
      : input.readAuthenticatedRestoreTransport?.(connection,query,desiredPresent) ?? null,
  });
  const readMapping = db.prepare(`SELECT community_id,source_guild_id,source_channel_id,destination_guild_id,
    destination_channel_id,destination_role_id FROM partner_alert_mappings WHERE mapping_id=? AND ever_approved=1`);
  type RegisteredMapping = { community_id:string; source_guild_id:string; source_channel_id:string;
    destination_guild_id:string; destination_channel_id:string; destination_role_id:string };
  const registeredRole = (configuration: PartnerAlertDiscordOutputConfiguration, facts: StripeErasureRoleFacts) => {
    const mappingId = facts.scope.mapping_id;
    const row = readMapping.get(mappingId) as RegisteredMapping | undefined;
    if (!row || row.community_id !== facts.scope.community_id || row.destination_guild_id !== facts.guildId
      || row.destination_role_id !== facts.roleId || row.destination_role_id === row.destination_guild_id
      || input.forbiddenRoleIds.includes(row.destination_role_id) || !partnerAlertOutputBindingMatches(configuration.outputBindings,{
        communityId:row.community_id,sourceGuildId:row.source_guild_id,sourceChannelId:row.source_channel_id,
        destinationGuildId:row.destination_guild_id,destinationChannelId:row.destination_channel_id,destinationRoleId:row.destination_role_id,
      })) return null;
    return { mappingId,guildId:row.destination_guild_id,channelId:row.destination_channel_id,
      roleId:row.destination_role_id,guildPermissions:"0",allowGrant:false };
  };
  const provider = (configuration: PartnerAlertDiscordOutputConfiguration) => ({
    botUserId:configuration.discordBotUserId,botToken:configuration.discordBotToken,
    maximumDurationMs:5000,transport:input.discordFetch ?? fetch,
  });
  const configurationIsCurrent = (configuration: PartnerAlertDiscordOutputConfiguration) => {
    // Equality also covers the credential. It stays in memory.
    const fingerprint = JSON.stringify(configuration);
    return () => JSON.stringify(input.readCurrentConfiguration()) === fingerprint;
  };
  const settle = async (scope: RootScope, facts: StripeErasureRoleFacts) => {
    const configuration = input.readCurrentConfiguration();
    if (!configuration || db.inTransaction) return false;
    const isCurrent = configurationIsCurrent(configuration);
    const discord = provider(configuration);
    const transport = createPartnerAlertManagedRoleTransport({ botUserId:discord.botUserId,
      createRest: target => createPartnerAlertDiscordRoleRest(discord,target),
      forbiddenRoleIds: input.forbiddenRoleIds,
      readBinding: mappingId => mappingId === facts.scope.mapping_id && isCurrent() ? registeredRole(configuration,facts) : null,
    });
    return settlePartnerAlertStripeErasureTransport(db,{
      ...input,scope,facts,transport,readIntent:(...args) => isCurrent() ? readIntent(...args) : null,
      observeDiscord:createPartnerAlertStripeErasureDiscordObserver(discord,input.nowUtc),
    });
  };
  const coreFence = (scope: RootScope) => {
    const core = requirePlatformErasureWriter(db);
    if (core.rootCommand(scope.userId) !== scope.operationRef) return null;
    const operation = core.operation(scope.operationRef), lifecycle = core.lifecycle(scope.userId);
    return operation.phase === "ready" && lifecycle.phase === "settling" && operation.quiescence_ref
      ? {ref:operation.quiescence_ref,generation:lifecycle.generation} : null;
  };
  const readRootEvidence = (scope: RootScope, facts: StripeErasureRoleFacts, nowUtc: string) => {
    const intent = readIntent(scope,facts,nowUtc);
    if (!intent) return null;
    const transport = readPartnerAlertStripeErasureTransport(db,intent.query,intent.desiredPresent);
    const settlement = readSettledPartnerAlertStripeErasureRoleCoverage(db,{
      scope,facts,nowUtc,readIndependentAuthority:(entry,at) => readAuthority(scope,entry,at),
    });
    return transport && settlement ? Object.freeze({ settlement:settlement.settlement, claims:{
      settlement:{claimRef:settlement.claimRef,originalSha256:settlement.originalSha256},
      transport:{claimRef:transport.claimRef,originalSha256:transport.originalSha256},
    } }) : null;
  };
  const prepareRoot = async (scope: RootScope, keys: RoleProofKeys) => {
    if (db.inTransaction || keys.privateKey.type !== "private" || keys.privateKey.asymmetricKeyType !== "ed25519"
      || keys.publicKey.type !== "public" || keys.publicKey.asymmetricKeyType !== "ed25519"
      || !createPublicKey(keys.privateKey).export({format:"der",type:"spki"}).equals(keys.publicKey.export({format:"der",type:"spki"}))
      || !/^[A-Za-z0-9_-]{1,128}$/u.test(keys.keyId) || !Number.isSafeInteger(keys.maximumLifetimeMs)
      || keys.maximumLifetimeMs < 1 || keys.maximumLifetimeMs > 300_000) return null;
    const configuration = input.readCurrentConfiguration();
    const isCurrent = configuration ? configurationIsCurrent(configuration) : () => input.readCurrentConfiguration() === null;
    const entries = input.inRootWriter(() => {
      const fence = coreFence(scope);
      if (fence?.ref !== scope.writerFenceRef || fence.generation !== scope.writerFenceGeneration) return null;
      const facts = readPartnerAlertStripeErasureRoleFacts(db,scope.userId).entries;
      if (facts.length > 10000 || facts.some(entry => !configuration || !registeredRole(configuration,entry)
        || !readIntent(scope,entry,input.nowUtc()))) return null;
      return facts;
    });
    if (!entries) return null;
    for (const facts of entries) {
      if (!isCurrent() || !await settle(scope,facts)) return null;
    }
    const observer = configuration && createPartnerAlertStripeErasureDiscordObserver(provider(configuration),input.nowUtc);
    const attested = await issuePartnerAlertStripeErasureRoleProof({
      database:db,scope,...keys,nowUtc:input.nowUtc,inRootWriter:input.inRootWriter,
      readFence:() => isCurrent() ? coreFence(scope) : null,
      readSettledTransport:(facts,discordUserId) => {
        const intent = readIntent(scope,facts,input.nowUtc());
        return intent?.query.discordUserId === discordUserId ? readPartnerAlertStripeErasureTransport(db,intent.query,intent.desiredPresent) : null;
      },
      resolveAuthority:async facts => input.inRootWriter(() => {
        const intent = readIntent(scope,facts,input.nowUtc());
        return intent ? {...facts,discordUserId:intent.query.discordUserId,stripe:intent.stripe,whop:intent.whop,validUntilUtc:intent.validUntilUtc} : null;
      }),
      observeDiscord:async target => observer ? observer(target) : null,
    });
    return input.inRootWriter(() => {
      const nowUtc = input.nowUtc();
      const assertCurrentWriter = () => {
        const fence = coreFence(scope);
        if (!isCurrent() || fence?.ref !== scope.writerFenceRef || fence.generation !== scope.writerFenceGeneration) {
          throw new Error("Stripe erasure root writer changed.");
        }
      };
      assertCurrentWriter();
      // The command can be retried with a fresh signature while the already
      // verified durable receipts are still current. Keep their original bytes.
      if (attested.proof.entries.every(entry => readRootEvidence(scope,entry,nowUtc) !== null)) return attested;
      const rows = attested.proof.entries.map(entry => {
        const authority = readAuthority(scope,entry,nowUtc);
        if (!authority) throw new Error("Stripe erasure role authority changed.");
        return {...entry,facts:entry,settledAtUtc:authority.settledAtUtc,validUntilUtc:attested.proof.expiresAtUtc};
      });
      recordPartnerAlertStripeErasureSettlements(db,{...attested,scope,nowUtc,rows,keyId:keys.keyId,proofPublicKey:keys.publicKey,
        assertCurrentWriter,readIndependentAuthority:(facts,atUtc) => readAuthority(scope,facts,atUtc),
      });
      return attested;
    });
  };
  return Object.freeze({readAuthority,readRootEvidence,settle,prepareRoot});
}

/** Composes separately authenticated archives under the inspected, admitted
 * restore operation. There is no Discord client or private signing key here. */
export function openPartnerAlertStripeRestoreEvidence(db: Database.Database, input: Readonly<{
  scope: RestoreScope;
  nowUtc: string;
  sources: Omit<StripeErasureAuthoritySources,"readSettledTransport">;
  transport: Omit<Parameters<typeof openPartnerAlertStripeErasureTransportArchive>[1],"scope">;
  settlement: Omit<Parameters<typeof openPartnerAlertStripeErasureSettlementArchive>[1],
    "expectedScope"|"originalRootFence"|"nowUtc"|"verifyArchivedAuthority">;
}>) {
  if (!db.inTransaction || input.sources.verifyRestoreAuthority?.(db,input.scope) !== true
    || input.transport.publicKey.type !== "public" || input.settlement.archivePublicKey.type !== "public"
    || input.transport.publicKey.export({format:"der",type:"spki"})
      .equals(input.settlement.archivePublicKey.export({format:"der",type:"spki"}))) return null;
  const transport = openPartnerAlertStripeErasureTransportArchive(db,{...input.transport,scope:input.scope});
  if (!transport) return null;
  const readAuthority = createPartnerAlertStripeErasureAuthorityReader(db,{...input.sources,readSettledTransport:transport});
  const settlement = openPartnerAlertStripeErasureSettlementArchive(db,{
    ...input.settlement,expectedScope:input.scope,nowUtc:input.nowUtc,originalRootFence:input.transport.originalFence,
    verifyArchivedAuthority:(facts,atUtc) => readAuthority(input.scope,facts,atUtc),
  });
  if (!settlement) return null;
  return (facts: StripeErasureRoleFacts, nowUtc: string) => {
    const current = settlement(facts,nowUtc);
    if (!current) return null;
    const observed = transport(db,{scope:input.scope,facts,discordUserId:current.discordUserId,atUtc:nowUtc},current.desiredPresent);
    return observed ? Object.freeze({settlement:current,claims:{settlement:current.rawClaim,transport:observed.rawClaim}}) : null;
  };
}
