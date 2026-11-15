import { withJournalAdminRequest, journalAdminJson, journalAdminUnavailable } from '../admin-route-runtime';
import { JOURNAL_ADMIN_IDEMPOTENCY_HEADER, requireJournalAdminMutationRequest } from '@/src/modules/platform/server/administration/platform-admin-request-security';
import { CommunityAdmissionError, CommunityAdmissionService, communityCountCollectionSchema, collectDiscordApproximateMemberCount } from '@/src/modules/communities/server/community-admission-service';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
function unavailable(error: unknown) {
    return error instanceof CommunityAdmissionError
        ? journalAdminJson({ error: error.message }, error.status)
        : journalAdminUnavailable(error);
}
export async function GET(request: Request) {
    try {
        return withJournalAdminRequest(request, (db, scope) => {
            const service = new CommunityAdmissionService(db, scope, new Date().toISOString());
            const query = new URL(request.url).searchParams;
            const guildId = query.get('guildId');
            if (!guildId)
                return journalAdminJson(service.read(query.get('after') ?? undefined));
            const kind = query.get('kind') ?? 'admission';
            if (kind !== 'admission' && kind !== 'coaching_exemption')
                throw new CommunityAdmissionError('Invalid decision history.', 400);
            const before = query.get('before');
            return journalAdminJson({ history: service.history(guildId, before === null ? undefined : Number(before), kind), exemption: service.exemptionFact(guildId) });
        });
    }
    catch (error) {
        return unavailable(error);
    }
}
export async function POST(request: Request) {
    try {
        requireJournalAdminMutationRequest(request);
        // Authorize before body work, then reauthorize after the asynchronous read.
        withJournalAdminRequest(request, () => true);
        if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))
            throw new CommunityAdmissionError('Use a JSON community form.', 400);
        const reader = request.body?.getReader();
        if (!reader)
            throw new CommunityAdmissionError('Community form is missing.', 400);
        const chunks: Uint8Array[] = [];
        let size = 0;
        try {
            for (;;) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                size += value.byteLength;
                if (size > 8192) {
                    await reader.cancel();
                    return journalAdminJson({ error: 'Community form is too large.' }, 413);
                }
                chunks.push(value);
            }
        }
        finally {
            reader.releaseLock();
        }
        const joined = new Uint8Array(size);
        let offset = 0;
        for (const chunk of chunks) {
            joined.set(chunk, offset);
            offset += chunk.byteLength;
        }
        let body: unknown;
        try {
            body = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(joined));
        }
        catch {
            throw new CommunityAdmissionError('Check the community form.', 400);
        }
        const key = request.headers.get(JOURNAL_ADMIN_IDEMPOTENCY_HEADER) ?? '';
        const collection = communityCountCollectionSchema.safeParse(body);
        if (collection.success) {
            const prepared = withJournalAdminRequest(request, (db, scope) => new CommunityAdmissionService(db, scope, new Date().toISOString()).prepareCountCollection(collection.data, key));
            if (prepared.completed)
                return journalAdminJson(prepared.completed);
            // No DB transaction or database handle is retained across the provider request.
            const receipt = await collectDiscordApproximateMemberCount(collection.data.guildId, process.env.TRADERLINK_DISCORD_BOT_TOKEN ?? '');
            return withJournalAdminRequest(request, (db, scope) => journalAdminJson(new CommunityAdmissionService(db, scope, new Date().toISOString()).recordCountCollection(collection.data, key, receipt)));
        }
        return withJournalAdminRequest(request, (db, scope) => journalAdminJson(new CommunityAdmissionService(db, scope, new Date().toISOString()).execute(body, key)));
    }
    catch (error) {
        return unavailable(error);
    }
}
