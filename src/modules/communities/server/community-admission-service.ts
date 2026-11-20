import type { CommunityAdmissionEvidence, CommunityAdmissionEvaluation, CommunityAdmissionPolicy, } from '../contracts/community-admission';
import { isFreshCommunityEvidence } from './community-launch-policy';
import { createHash, randomUUID } from 'node:crypto';
import type Database from 'better-sqlite3';
import { z } from 'zod';
import type { JournalAdminScope } from '../../platform/contracts/journal-admin-scope';
import type { CommunityAdmissionAdminSnapshot, CommunityAdmissionCommand, CommunityAdmissionEntry, CommunityOwnerDecision, } from '../contracts/community-admission';
import { DEFAULT_COMMUNITY_ADMISSION_POLICY } from '../contracts/community-admission';
import { CommunityBrandedContentRepository, CommunityPageAllowanceConflictError } from './community-branded-content-repository';
import { TraderLinkPlatformError } from '../../platform/server/database/platform-migration-contract';
import { hasCommunityAllowanceOperatorAuthority } from './community-allowance-operator-authority';
/** Only server-owned count receipts may satisfy the configured total minimum. */
export function evaluateCommunityAdmission(policy: CommunityAdmissionPolicy, evidence: CommunityAdmissionEvidence, atUtc: string): CommunityAdmissionEvaluation {
    if (!Number.isSafeInteger(policy.revision) || policy.revision < 0
        || !Number.isSafeInteger(evidence.revision) || evidence.revision < 0
        || !/^\d{1,32}$/u.test(evidence.guildId)
        || !['manual', 'automatic'].includes(policy.mode)
        || !Array.isArray(policy.requirements))
        throw new Error('Invalid community admission input.');
    const result = (reason: CommunityAdmissionEvaluation['reason']): CommunityAdmissionEvaluation => ({
        status: 'pending', reason, policyRevision: policy.revision, evidenceRevision: evidence.revision,
    });
    if (evidence.serverOwnerVerified !== true || !isFreshCommunityEvidence(evidence.connectionVerifiedAtUtc, atUtc)) {
        return result('connection_unverified');
    }
    if (policy.mode === 'manual')
        return result('manual_review');
    if (policy.requirements.length === 0)
        return result('requirements_not_configured');
    if (!evidence.memberCount || evidence.memberCount.guildId !== evidence.guildId)
        return result('unsupported_evidence');
    const assessed = assessApproximateMemberMinimum(policy, evidence.memberCount, atUtc);
    if (assessed.approved)
        return { status: 'approved', reason: 'requirements_met', policyRevision: policy.revision, evidenceRevision: evidence.revision };
    return result(assessed.reason === 'stale_evidence' ? 'stale_evidence' : assessed.reason === 'below_minimum' ? 'below_minimum' : 'unsupported_evidence');
}
/** Automatic mode requires an explicit supported approximate-total minimum. */
export function assertCommunityAdmissionPolicyCanActivate(policy: CommunityAdmissionPolicy): void {
    if (!Number.isSafeInteger(policy.revision) || policy.revision < 0
        || !['manual', 'automatic'].includes(policy.mode)
        || !Array.isArray(policy.requirements))
        throw new Error('Invalid community admission policy.');
    const seen = new Set<string>();
    for (const rule of policy.requirements) {
        if (!['server_member_count'].includes(rule.signal)
            || !Number.isSafeInteger(rule.minimum) || rule.minimum <= 0 || seen.has(rule.signal)) {
            throw new Error('Invalid community minimum requirement.');
        }
        seen.add(rule.signal);
    }
    if (policy.mode === 'automatic' && policy.requirements.length !== 1) {
        throw new Error('Choose an approximate total member minimum before enabling automatic approval.');
    }
}
export class CommunityAdmissionError extends Error {
    constructor(message: string, public readonly status: 400 | 403 | 409 | 503) { super(message); }
}
const guild = z.string().regex(/^\d{1,32}$/u);
const reason = z.string().trim().min(1).max(2000).refine(value => !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(value));
const revision = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
export const communityAdmissionCommandSchema = z.discriminatedUnion('action', [
    z.object({ action: z.literal('invite'), guildId: guild, displayName: z.string().trim().min(1).max(120).refine(value => !/[\u0000-\u001f\u007f]/u.test(value)), reason }).strict(),
    z.object({ action: z.literal('decide'), guildId: guild, kind: z.enum(['admission', 'coaching_exemption']), status: z.enum(['pending', 'approved', 'declined']), expectedRevision: revision, expectedAdmissionRevision: revision.nullable().optional(), reason }).strict(),
    z.object({ action: z.literal('policy'), expectedRevision: revision, mode: z.enum(['manual', 'automatic']), minimumMembers: z.number().int().positive().max(Number.MAX_SAFE_INTEGER).nullable(), reason }).strict(),
    z.object({ action: z.literal('destination_allowance'), guildId: guild, pageLimit: z.number().int().min(0).max(1000), expectedMutationToken: z.string().datetime({ offset: false }).nullable(), reason }).strict(),
]);
type DecisionRow = {
    revision: number;
    kind: CommunityOwnerDecision['kind'];
    status: CommunityOwnerDecision['status'];
    reason: string;
    actor_user_id: string;
    created_at_utc: string;
    admission_revision: number | null;
    source: 'owner' | 'automatic';
};
function decision(row: DecisionRow | undefined): CommunityOwnerDecision | null {
    return row ? { revision: row.revision, kind: row.kind, status: row.status, reason: row.reason, actorUserId: row.actor_user_id, decidedAtUtc: row.created_at_utc, admissionRevision: row.admission_revision, source: row.source } : null;
}
export function isCommunityAdmissionStorageAvailable(db: Database.Database): boolean {
    return (db.prepare("SELECT count(*) count FROM sqlite_master WHERE type='table' AND name IN ('traderlink_community_admission_invitations','traderlink_community_admission_policy_versions','traderlink_community_admission_decisions','traderlink_community_admission_commands','traderlink_community_admission_member_counts')").get() as {
        count: number;
    }).count === 5;
}
/** Scope must come from existing Platform owner authorization, never from a request body. */
export class CommunityAdmissionService {
    constructor(private readonly db: Database.Database, private readonly scope: JournalAdminScope, private readonly atUtc: string) {
        const age = Date.parse(atUtc) - Date.parse(scope.authorizedAtUtc);
        const production = scope.role === 'journal_owner_admin' && scope.mode === 'production_discord_owner';
        const development = scope.role === 'development_journal_owner_admin' && scope.mode === 'local_development_owner';
        const evidenceAge = Date.parse(atUtc) - Date.parse(scope.discordOwnerVerifiedAtUtc ?? '');
        if ((!production && !development) || !scope.permissions.includes('manage_users') || !Number.isFinite(age) || age < 0 || age > 300000
            || (production && (!Number.isFinite(evidenceAge) || evidenceAge < 0 || evidenceAge > 300000)))
            throw new CommunityAdmissionError('Owner authorization required.', 403);
    }
    private requireStorage() {
        if (!isCommunityAdmissionStorageAvailable(this.db))
            throw new CommunityAdmissionError('Community admission is not activated.', 503);
    }
    private latest(guildId: string, kind: CommunityOwnerDecision['kind']) {
        return decision(this.db.prepare('SELECT revision,kind,status,reason,actor_user_id,created_at_utc,admission_revision,source FROM traderlink_community_admission_decisions WHERE discord_guild_id=? AND kind=? ORDER BY revision DESC LIMIT 1').get(guildId, kind) as DecisionRow | undefined);
    }
    private destinationAllowance(guildId:string):CommunityAdmissionEntry['destinationAllowance']{
        const canManage=hasCommunityAllowanceOperatorAuthority(this.db,this.scope.userId);
        const community=this.db.prepare('SELECT community_id FROM traderlink_communities WHERE discord_guild_id=?').get(guildId) as {community_id:string}|undefined;
        if(!community)return {connectionState:'not_connected',state:'unconfigured',pageLimit:null,pagesUsed:0,mutationToken:null,updatedByUserId:null,canManage};
        const allowance=this.db.prepare('SELECT page_limit,updated_by_user_id,updated_at_utc FROM traderlink_community_page_allowances WHERE community_id=?').get(community.community_id) as {page_limit:number;updated_by_user_id:string|null;updated_at_utc:string}|undefined;
        const pagesUsed=(this.db.prepare("SELECT count(*) count FROM traderlink_community_content_pages WHERE community_id=? AND status<>'archived'").get(community.community_id) as {count:number}).count;
        return {connectionState:'connected',state:allowance?'configured':'unconfigured',pageLimit:allowance?.page_limit??null,pagesUsed,mutationToken:allowance?.updated_at_utc??null,updatedByUserId:allowance?.updated_by_user_id??null,canManage};
    }
    private allowanceTarget(guildId:string):string{
        if(!hasCommunityAllowanceOperatorAuthority(this.db,this.scope.userId))throw new CommunityAdmissionError('Platform operator authorization required.',403);
        if(this.latest(guildId,'admission')?.status!=='approved')throw new CommunityAdmissionError('Approve community admission before configuring publishing destinations.',400);
        const community=this.db.prepare('SELECT community_id FROM traderlink_communities WHERE discord_guild_id=?').get(guildId) as {community_id:string}|undefined;
        if(!community)throw new CommunityAdmissionError('Connect and verify the community before configuring publishing destinations.',400);
        return community.community_id;
    }
    policy(): CommunityAdmissionPolicy {
        this.requireStorage();
        const row = this.db.prepare('SELECT revision,mode,requirements_json FROM traderlink_community_admission_policy_versions ORDER BY revision DESC LIMIT 1').get() as {
            revision: number;
            mode: 'manual' | 'automatic';
            requirements_json: string;
        } | undefined;
        return row ? { revision: row.revision, mode: row.mode, requirements: JSON.parse(row.requirements_json) } : DEFAULT_COMMUNITY_ADMISSION_POLICY;
    }
    read(afterGuildId?: string): CommunityAdmissionAdminSnapshot {
        if (afterGuildId && !guild.safeParse(afterGuildId).success)
            throw new CommunityAdmissionError('Invalid page cursor.', 400);
        if (!isCommunityAdmissionStorageAvailable(this.db))
            return { available: false, entries: [], hasMore: false, policy: DEFAULT_COMMUNITY_ADMISSION_POLICY };
        const rows = this.db.prepare('SELECT discord_guild_id,display_name,created_at_utc,reason,actor_user_id FROM traderlink_community_admission_invitations WHERE discord_guild_id>? ORDER BY discord_guild_id LIMIT 51').all(afterGuildId ?? '') as {
            discord_guild_id: string;
            display_name: string;
            created_at_utc: string;
            reason: string;
            actor_user_id: string;
        }[];
        const entries: CommunityAdmissionEntry[] = rows.slice(0, 50).map(row => ({ guildId: row.discord_guild_id, displayName: row.display_name, invitedAtUtc: row.created_at_utc, invitationReason: row.reason, invitedByUserId: row.actor_user_id, admission: this.latest(row.discord_guild_id, 'admission'), exemption: this.latest(row.discord_guild_id, 'coaching_exemption'), memberCount: this.memberCount(row.discord_guild_id), newConnectionAllowed: canAdmitNewCommunity(this.db, row.discord_guild_id, false, this.atUtc),destinationAllowance:this.destinationAllowance(row.discord_guild_id) }));
        return { available: true, entries, hasMore: rows.length > 50, policy: this.policy() };
    }
    history(guildId: string, beforeRevision?: number, kind: CommunityOwnerDecision['kind'] = 'admission') {
        this.requireStorage();
        if (!guild.safeParse(guildId).success || !['admission', 'coaching_exemption'].includes(kind) || (beforeRevision !== undefined && (!Number.isSafeInteger(beforeRevision) || beforeRevision < 1)))
            throw new CommunityAdmissionError('Invalid history request.', 400);
        return (this.db.prepare('SELECT revision,kind,status,reason,actor_user_id,created_at_utc,admission_revision,source FROM traderlink_community_admission_decisions WHERE discord_guild_id=? AND kind=? AND revision<? ORDER BY revision DESC LIMIT 51').all(guildId, kind, beforeRevision ?? Number.MAX_SAFE_INTEGER) as DecisionRow[]).map(row => decision(row)!);
    }
    execute(raw: unknown, requestKey: string): {
        revision?: number;
        mutationToken?: string;
        guildId: string | null;
        action: string;
    } {
        this.requireStorage();
        const parsed = communityAdmissionCommandSchema.safeParse(raw);
        if (!parsed.success || !z.string().uuid().safeParse(requestKey).success)
            throw new CommunityAdmissionError('Check the community form and provide a request key.', 400);
        const command: CommunityAdmissionCommand = parsed.data;
        const hash = createHash('sha256').update(JSON.stringify(command)).digest('hex');
        try{return this.db.transaction(() => {
            const allowanceCommunityId=command.action==='destination_allowance'?this.allowanceTarget(command.guildId):null;
            const previous = this.db.prepare('SELECT command_sha256,receipt_json FROM traderlink_community_admission_commands WHERE actor_user_id=? AND request_key=?').get(this.scope.userId, requestKey) as {
                command_sha256: string;
                receipt_json: string;
            } | undefined;
            if (previous) {
                if (previous.command_sha256 !== hash)
                    throw new CommunityAdmissionError('This request key was already used for a different change.', 409);
                return JSON.parse(previous.receipt_json);
            }
            let nextRevision = 1;
            let mutationToken:string|undefined;
            if (command.action === 'invite') {
                if (this.db.prepare('SELECT 1 FROM traderlink_community_admission_invitations WHERE discord_guild_id=?').get(command.guildId))
                    throw new CommunityAdmissionError('This server is already in the invitation register.', 409);
                this.db.prepare('INSERT INTO traderlink_community_admission_invitations VALUES (?,?,?,?,?)').run(command.guildId, command.displayName, this.scope.userId, command.reason, this.atUtc);
            }
            else if (command.action === 'policy') {
                const current = this.policy();
                if (current.revision !== command.expectedRevision)
                    throw new CommunityAdmissionError('Policy changed. Reload before saving.', 409);
                nextRevision = current.revision + 1;
                const requirements = command.minimumMembers === null ? [] : [{ signal: 'server_member_count' as const, minimum: command.minimumMembers }];
                try {
                    assertCommunityAdmissionPolicyCanActivate({ revision: nextRevision, mode: command.mode, requirements });
                }
                catch (error) {
                    throw new CommunityAdmissionError(error instanceof Error ? error.message : 'Invalid policy.', 400);
                }
                this.db.prepare('INSERT INTO traderlink_community_admission_policy_versions VALUES (?,?,?,?,?,?)').run(nextRevision, command.mode, JSON.stringify(requirements), this.scope.userId, command.reason, this.atUtc);
            }
            else if(command.action==='destination_allowance'){
                mutationToken=new CommunityBrandedContentRepository(this.db).setPageAllowance({communityId:allowanceCommunityId!,pageLimit:command.pageLimit,platformActorUserId:this.scope.userId,expectedMutationToken:command.expectedMutationToken,reason:command.reason,atUtc:this.atUtc});
            }
            else {
                if (!this.db.prepare('SELECT 1 FROM traderlink_community_admission_invitations WHERE discord_guild_id=?').get(command.guildId))
                    throw new CommunityAdmissionError('Record the invited community first.', 400);
                const current = this.latest(command.guildId, command.kind);
                if ((current?.revision ?? 0) !== command.expectedRevision)
                    throw new CommunityAdmissionError('Decision changed. Reload before deciding.', 409);
                if (command.kind === 'coaching_exemption' && command.expectedAdmissionRevision !== (this.latest(command.guildId, 'admission')?.revision ?? null))
                    throw new CommunityAdmissionError('Admission changed. Reload before reviewing the exemption.', 409);
                if (command.kind === 'coaching_exemption' && command.status === 'approved' && this.latest(command.guildId, 'admission')?.status !== 'approved')
                    throw new CommunityAdmissionError('Approve community admission before granting a coaching exemption.', 400);
                nextRevision = (current?.revision ?? 0) + 1;
                this.db.prepare('INSERT INTO traderlink_community_admission_decisions VALUES (?,?,?,?,?,?,?,?,?,?,?,?)').run(randomUUID(), command.guildId, nextRevision, command.kind, command.status, this.scope.userId, command.reason, this.atUtc, command.kind === 'coaching_exemption' ? this.latest(command.guildId, 'admission')?.revision ?? null : null, 'owner', null, null);
            }
            const receipt = { ...(command.action==='destination_allowance'?{mutationToken}:{revision:nextRevision}), guildId: command.action === 'policy' ? null : command.guildId, action: command.action };
            this.db.prepare('INSERT INTO traderlink_community_admission_commands VALUES (?,?,?,?,?)').run(this.scope.userId, requestKey, hash, JSON.stringify(receipt), this.atUtc);
            return receipt;
        }).immediate();}catch(error){if(error instanceof CommunityAdmissionError)throw error;if(error instanceof CommunityPageAllowanceConflictError)throw new CommunityAdmissionError('Destination allowance changed. Reload before saving.',409);if(error instanceof TraderLinkPlatformError){if(error.code==='TRADERLINK_WORKSPACE_ACCESS_DENIED')throw new CommunityAdmissionError('Platform operator authorization required.',403);if(error.code==='TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED')throw new CommunityAdmissionError('Check the destination allowance form.',400);}throw error;}
    }
    memberCount(guildId: string): import('../contracts/community-admission').CommunityMemberCountReceipt | null {
        const row = this.db.prepare('SELECT receipt_id,source,approximate_total_members,observed_at_utc FROM traderlink_community_admission_member_counts WHERE discord_guild_id=? ORDER BY revision DESC LIMIT 1').get(guildId) as {
            receipt_id: string;
            source: 'discord_bot_guild_with_counts';
            approximate_total_members: number;
            observed_at_utc: string;
        } | undefined;
        return row ? { receiptId: row.receipt_id, guildId, source: row.source, approximateTotalMembers: row.approximate_total_members, observedAtUtc: row.observed_at_utc } : null;
    }
    private collectionCommand(raw: unknown, requestKey: string) {
        this.requireStorage();
        const parsed = communityCountCollectionSchema.safeParse(raw);
        if (!parsed.success || !z.string().uuid().safeParse(requestKey).success)
            throw new CommunityAdmissionError('Invalid count collection request.', 400);
        return parsed.data;
    }
    prepareCountCollection(raw: unknown, requestKey: string): {
        completed: Record<string, unknown> | null;
    } {
        const command = this.collectionCommand(raw, requestKey);
        const hash = createHash('sha256').update(JSON.stringify(command)).digest('hex');
        const previous = this.db.prepare('SELECT command_sha256,receipt_json FROM traderlink_community_admission_commands WHERE actor_user_id=? AND request_key=?').get(this.scope.userId, requestKey) as {
            command_sha256: string;
            receipt_json: string;
        } | undefined;
        if (previous) {
            if (previous.command_sha256 !== hash)
                throw new CommunityAdmissionError('Request key was already used for another change.', 409);
            return { completed: JSON.parse(previous.receipt_json) };
        }
        if (!this.db.prepare('SELECT 1 FROM traderlink_community_admission_invitations WHERE discord_guild_id=?').get(command.guildId))
            throw new CommunityAdmissionError('Record the invited community before collecting evidence.', 400);
        if (this.policy().revision !== command.expectedPolicyRevision || (this.latest(command.guildId, 'admission')?.revision ?? 0) !== command.expectedAdmissionRevision)
            throw new CommunityAdmissionError('Policy or admission changed. Reload before collecting evidence.', 409);
        return { completed: null };
    }
    recordCountCollection(raw: unknown, requestKey: string, rawReceipt: unknown): Record<string, unknown> {
        const command = this.collectionCommand(raw, requestKey);
        const parsed = countReceiptSchema.safeParse(rawReceipt);
        if (!parsed.success || parsed.data.guildId !== command.guildId || !isFreshCommunityEvidence(parsed.data.observedAtUtc, this.atUtc))
            throw new CommunityAdmissionError('Count evidence is missing, mismatched or stale.', 400);
        const receipt = parsed.data;
        return this.db.transaction(() => {
            const prepared = this.prepareCountCollection(command, requestKey);
            if (prepared.completed)
                return prepared.completed;
            const evidenceRevision = (this.db.prepare('SELECT coalesce(max(revision),0)+1 next FROM traderlink_community_admission_member_counts WHERE discord_guild_id=?').get(command.guildId) as {
                next: number;
            }).next;
            this.db.prepare('INSERT INTO traderlink_community_admission_member_counts VALUES (?,?,?,?,?,?)').run(receipt.receiptId, command.guildId, evidenceRevision, receipt.source, receipt.approximateTotalMembers, receipt.observedAtUtc);
            const policy = this.policy(), current = this.latest(command.guildId, 'admission');
            const assessment = assessApproximateMemberMinimum(policy, receipt, this.atUtc);
            // Any explicit owner decision wins, including a decision returned to manual review.
            const canApprove = assessment.approved && current?.source !== 'owner';
            let decisionRevision = current?.revision ?? 0;
            if (canApprove) {
                decisionRevision++;
                this.db.prepare('INSERT INTO traderlink_community_admission_decisions VALUES (?,?,?,?,?,?,?,?,?,?,?,?)').run(randomUUID(), command.guildId, decisionRevision, 'admission', 'approved', this.scope.userId, 'Configured Discord approximate total member minimum met.', this.atUtc, null, 'automatic', policy.revision, receipt.receiptId);
            }
            const result = { action: 'collect_count', guildId: command.guildId, revision: decisionRevision, evidenceReceiptId: receipt.receiptId, automaticApproved: canApprove, reason: current?.source === 'owner' ? 'owner_decision_preserved' : assessment.reason };
            const hash = createHash('sha256').update(JSON.stringify(command)).digest('hex');
            this.db.prepare('INSERT INTO traderlink_community_admission_commands VALUES (?,?,?,?,?)').run(this.scope.userId, requestKey, hash, JSON.stringify(result), this.atUtc);
            return result;
        }).immediate();
    }
    /** New-business eligibility only; never blocks accepted work or edits an entitlement. */
    exemptionFact(guildId: string) {
        this.requireStorage();
        return readCommunityCoachingExemptionFact(this.db, guildId);
    }
}
/** Server-only caller supplies a scoped guild; this returns no owner-private reasons. */
export function readCommunityCoachingExemptionFact(db: Database.Database, guildId: string): import('../contracts/community-admission').CommunityCoachingExemptionFact {
    if (!guild.safeParse(guildId).success)
        throw new CommunityAdmissionError('Invalid server.', 400);
    if (!isCommunityAdmissionStorageAvailable(db))
        return { version: 1, available: false, state: 'unassessed', admissionRevision: null, exemptionRevision: null };
    const read = (kind: string) => db.prepare('SELECT status,revision,admission_revision FROM traderlink_community_admission_decisions WHERE discord_guild_id=? AND kind=? ORDER BY revision DESC LIMIT 1').get(guildId, kind) as {
        status: string;
        revision: number;
        admission_revision: number | null;
    } | undefined;
    const admission = read('admission'), exemption = read('coaching_exemption');
    return { version: 1, available: true, state: !exemption || exemption.status === 'pending' ? 'unassessed' : admission?.status === 'approved' && exemption.status === 'approved' && exemption.admission_revision === admission.revision ? 'eligible' : 'ineligible', admissionRevision: admission?.revision ?? null, exemptionRevision: exemption?.revision ?? null };
}
/** Once storage is activated, every NEW connection requires an invited, approved record. */
export function canAdmitNewCommunity(db: Database.Database, guildId: string, legacyOwnerApproved: boolean, atUtc: string = new Date().toISOString()): boolean {
    if (!guild.safeParse(guildId).success)
        return false;
    if (!isCommunityAdmissionStorageAvailable(db))
        return legacyOwnerApproved === true;
    const invited = Boolean(db.prepare('SELECT 1 FROM traderlink_community_admission_invitations WHERE discord_guild_id=?').get(guildId));
    if (!invited)
        return false;
    const latest = db.prepare("SELECT status,source,policy_revision,evidence_receipt_id FROM traderlink_community_admission_decisions WHERE discord_guild_id=? AND kind='admission' ORDER BY revision DESC LIMIT 1").get(guildId) as {
        status: string;
        source: string;
        policy_revision: number | null;
        evidence_receipt_id: string | null;
    } | undefined;
    if (latest?.status !== 'approved')
        return false;
    if (latest.source === 'owner')
        return true;
    const newest = db.prepare('SELECT receipt_id FROM traderlink_community_admission_member_counts WHERE discord_guild_id=? ORDER BY revision DESC LIMIT 1').get(guildId) as {
        receipt_id: string;
    } | undefined;
    if (newest?.receipt_id !== latest.evidence_receipt_id)
        return false;
    const policy = db.prepare('SELECT revision,mode,requirements_json FROM traderlink_community_admission_policy_versions ORDER BY revision DESC LIMIT 1').get() as {
        revision: number;
        mode: 'manual' | 'automatic';
        requirements_json: string;
    } | undefined;
    const row = db.prepare('SELECT receipt_id,source,approximate_total_members,observed_at_utc FROM traderlink_community_admission_member_counts WHERE receipt_id=? AND discord_guild_id=?').get(latest.evidence_receipt_id, guildId) as {
        receipt_id: string;
        source: 'discord_bot_guild_with_counts';
        approximate_total_members: number;
        observed_at_utc: string;
    } | undefined;
    return Boolean(policy && policy.revision === latest.policy_revision && row && assessApproximateMemberMinimum({ revision: policy.revision, mode: policy.mode, requirements: JSON.parse(policy.requirements_json) }, { receiptId: row.receipt_id, guildId, source: row.source, approximateTotalMembers: row.approximate_total_members, observedAtUtc: row.observed_at_utc }, atUtc).approved);
}
/** Discovery/preflight only. Current bot/owner verification still happens before linking. */
export function canConnectCommunity(db: Database.Database, guildId: string, userId: string, legacyOwnerApproved: boolean): boolean {
    if (!guild.safeParse(guildId).success)
        return false;
    const existing = db.prepare('SELECT owner_user_id FROM traderlink_communities WHERE discord_guild_id=?').get(guildId) as {
        owner_user_id: string;
    } | undefined;
    if (existing)
        return existing.owner_user_id === userId;
    return canAdmitNewCommunity(db, guildId, legacyOwnerApproved);
}
export const communityCountCollectionSchema = z.object({
    action: z.literal('collect_count'), guildId: guild, expectedPolicyRevision: revision, expectedAdmissionRevision: revision,
}).strict();
const countReceiptSchema = z.object({
    receiptId: z.string().uuid(), guildId: guild, source: z.literal('discord_bot_guild_with_counts'),
    approximateTotalMembers: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER), observedAtUtc: z.string().datetime(),
}).strict();
/** Normalizes ONLY official approximate total; never accepts a human/activity claim. */
export function normalizeDiscordApproximateMemberCount(raw: unknown, guildId: string, observedAtUtc: string): import('../contracts/community-admission').CommunityMemberCountReceipt {
    const parsed = z.object({ id: guild, approximate_member_count: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER) }).safeParse(raw);
    if (!parsed.success || parsed.data.id !== guildId || !z.string().datetime().safeParse(observedAtUtc).success)
        throw new CommunityAdmissionError('Discord approximate total member count is unavailable.', 503);
    return { receiptId: randomUUID(), guildId, source: 'discord_bot_guild_with_counts', approximateTotalMembers: parsed.data.approximate_member_count, observedAtUtc };
}
/** Source-only adapter. Callers provide server credentials; no env read or call at import. */
export async function collectDiscordApproximateMemberCount(guildId: string, botToken: string, request: typeof fetch = fetch, now: () => Date = () => new Date()) {
    if (!guild.safeParse(guildId).success || !botToken.trim())
        throw new CommunityAdmissionError('Discord count collection is unavailable.', 503);
    try {
        const response = await request(`https://discord.com/api/v10/guilds/${guildId}?with_counts=true`, { headers: { Authorization: `Bot ${botToken}` }, cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(8000) });
        if (!response.ok)
            throw new Error('Unavailable');
        const reader = response.body?.getReader();
        if (!reader)
            throw new Error('Unavailable');
        let size = 0;
        const chunks: Uint8Array[] = [];
        try {
            for (;;) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                size += value.byteLength;
                if (size > 524288) {
                    await reader.cancel();
                    throw new Error('Unavailable');
                }
                chunks.push(value);
            }
        }
        finally {
            reader.releaseLock();
        }
        const bytes = new Uint8Array(size);
        let offset = 0;
        for (const chunk of chunks) {
            bytes.set(chunk, offset);
            offset += chunk.byteLength;
        }
        return normalizeDiscordApproximateMemberCount(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)), guildId, now().toISOString());
    }
    catch {
        throw new CommunityAdmissionError('Discord approximate total member count is unavailable. No automatic approval was made.', 503);
    }
}
export function assessApproximateMemberMinimum(policy: CommunityAdmissionPolicy, receipt: import('../contracts/community-admission').CommunityMemberCountReceipt | null, atUtc: string): {
    approved: boolean;
    reason: 'manual_review' | 'requirements_not_configured' | 'unknown_evidence' | 'stale_evidence' | 'below_minimum' | 'minimum_met';
} {
    if (policy.mode !== 'automatic')
        return { approved: false, reason: 'manual_review' };
    if (policy.requirements.length !== 1 || policy.requirements[0].signal !== 'server_member_count' || !Number.isSafeInteger(policy.requirements[0].minimum) || policy.requirements[0].minimum <= 0)
        return { approved: false, reason: 'requirements_not_configured' };
    if (!receipt || !countReceiptSchema.safeParse(receipt).success)
        return { approved: false, reason: 'unknown_evidence' };
    if (!isFreshCommunityEvidence(receipt.observedAtUtc, atUtc))
        return { approved: false, reason: 'stale_evidence' };
    return receipt.approximateTotalMembers >= policy.requirements[0].minimum ? { approved: true, reason: 'minimum_met' } : { approved: false, reason: 'below_minimum' };
}
/** An invited candidate may prepare installation without admission or coaching access. */
export function canPrepareCommunityInstallation(db: Database.Database, guildId: string, userId: string, legacyOwnerApproved: boolean): boolean {
    if (canConnectCommunity(db, guildId, userId, legacyOwnerApproved))
        return true;
    if (!guild.safeParse(guildId).success || !isCommunityAdmissionStorageAvailable(db))
        return false;
    if (!db.prepare('SELECT 1 FROM traderlink_community_admission_invitations WHERE discord_guild_id=?').get(guildId))
        return false;
    const latest = db.prepare("SELECT status FROM traderlink_community_admission_decisions WHERE discord_guild_id=? AND kind='admission' ORDER BY revision DESC LIMIT 1").get(guildId) as {
        status: string;
    } | undefined;
    if (latest?.status === 'declined')
        return false;
    // Discovery isn't ownership proof. Existing installation verification still checks the live owner.
    return Boolean(db.prepare('SELECT 1 FROM traderlink_community_discord_guild_candidates WHERE user_id=? AND discord_guild_id=? AND guild_owner=1').get(userId, guildId));
}
