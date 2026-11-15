'use client';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import type { CommunityAdmissionAdminSnapshot, CommunityAdmissionCommand, CommunityCountCollectionCommand, CommunityAdmissionEntry, CommunityOwnerDecision } from '@/src/modules/communities/contracts/community-admission';
import { JOURNAL_ADMIN_REQUEST_HEADER, JOURNAL_ADMIN_IDEMPOTENCY_HEADER } from '@/src/modules/platform/contracts/journal-admin-request';
import { JournalAdminPanel } from '../../journal-admin-ui';
const subscribeHydration = () => () => {};
const clientHydrated = () => true;
const serverHydrated = () => false;
const labels = { pending: 'Pending review', approved: 'Approved', declined: 'Declined' };
const exemptionLabels = { pending: 'Not assessed', approved: 'Eligible', declined: 'Not eligible' };
function DecisionForm({ entry, kind, busy, onSave }: {
    entry: CommunityAdmissionEntry;
    kind: CommunityOwnerDecision['kind'];
    busy: boolean;
    onSave: (command: CommunityAdmissionCommand, form: HTMLFormElement) => Promise<boolean>;
}) {
    const current = kind === 'admission' ? entry.admission : entry.exemption;
    return <Box component="form" method="post" onSubmit={async (event) => {
            event.preventDefault();
            const form = event.currentTarget, data = new FormData(form);
            const saved = await onSave({ action: 'decide', guildId: entry.guildId, kind, status: data.get('status') as 'approved' | 'declined' | 'pending', expectedRevision: current?.revision ?? 0, expectedAdmissionRevision: entry.admission?.revision ?? null, reason: String(data.get('reason') ?? '') }, form);
            if (saved)
                form.reset();
        }}><Box component="fieldset" disabled={busy} sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}><Stack spacing={2}>
    <Typography component="h3" variant="subtitle1">{kind === 'admission' ? 'Admission decision' : 'Separate coaching exemption'}</Typography>
    <TextField select name="status" label={kind === 'admission' ? 'Community admission' : 'Coaching exemption'} defaultValue="" required>
      <MenuItem value="" disabled>Choose a decision</MenuItem>
      <MenuItem value="approved" disabled={kind === 'coaching_exemption' && entry.admission?.status !== 'approved'}>{kind === 'admission' ? 'Approve admission' : 'Grant coaching exemption'}</MenuItem>
      <MenuItem value="declined">{kind === 'admission' ? 'Decline admission' : 'Decline or revoke exemption'}</MenuItem>
      <MenuItem value="pending">{kind === 'admission' ? 'Return to review' : 'Return to not assessed'}</MenuItem>
    </TextField>
    <TextField name="reason" label="Owner reason" required multiline minRows={2} slotProps={{ htmlInput: { maxLength: 2000 } }} helperText="Private owner record. A new decision keeps the earlier history."/>
    <Box><Button type="submit" variant="outlined">{kind === 'admission' ? 'Save admission decision' : 'Save exemption decision'}</Button></Box>
  </Stack></Box></Box>;
}
export function CommunityAdmissionEditor({ initial }: {
    initial: CommunityAdmissionAdminSnapshot;
}) {
    const hydrated = useSyncExternalStore(subscribeHydration, clientHydrated, serverHydrated);
    const [snapshot, setSnapshot] = useState(initial), [busy, setBusy] = useState(false), [message, setMessage] = useState(''), [failed, setFailed] = useState(false), [dirty, setDirty] = useState(false), [mode, setMode] = useState<'manual' | 'automatic'>(initial.policy.mode);
    const [history, setHistory] = useState<{
        guildId: string;
        kind: CommunityOwnerDecision['kind'];
        items: CommunityOwnerDecision[];
        more: boolean;
    } | null>(null);
    const rootRef = useRef<HTMLDivElement>(null), requestRef = useRef<{
        serialized: string;
        key: string;
    } | null>(null), lock = useRef(false);
    useEffect(() => {
        if (!dirty)
            return;
        const warn = (event: BeforeUnloadEvent) => event.preventDefault();
        window.addEventListener('beforeunload', warn);
        return () => window.removeEventListener('beforeunload', warn);
    }, [dirty]);
    async function refresh(after?: string) {
        const response = await fetch(`/api/admin/journal/community-admission${after ? `?after=${encodeURIComponent(after)}` : ''}`, { cache: 'no-store' });
        const result = await response.json();
        if (!response.ok)
            throw new Error(result.error ?? 'Community register could not be loaded.');
        setSnapshot(result as CommunityAdmissionAdminSnapshot);
        setHistory(null);
    }
    async function save(command: CommunityAdmissionCommand | CommunityCountCollectionCommand, form: HTMLFormElement) {
        if (!hydrated || lock.current)
            return false;
        lock.current = true;
        setBusy(true);
        setMessage('');
        try {
            const serialized = JSON.stringify(command);
            if (requestRef.current?.serialized !== serialized)
                requestRef.current = { serialized, key: crypto.randomUUID() };
            const response = await fetch('/api/admin/journal/community-admission', { method: 'POST', headers: { 'content-type': 'application/json', [JOURNAL_ADMIN_REQUEST_HEADER]: '1', [JOURNAL_ADMIN_IDEMPOTENCY_HEADER]: requestRef.current.key }, body: serialized });
            const result = await response.json();
            if (!response.ok)
                throw new Error(result.error ?? 'Community change could not be saved.');
            // Retain the request key through refresh failure so retries cannot duplicate decisions.
            await refresh();
            delete form.dataset.admissionDirty;
            setDirty(Boolean(rootRef.current?.querySelector('form[data-admission-dirty="true"]')));
            requestRef.current = null;
            setFailed(false);
            setMessage('Saved. Existing connections and accepted coaching work are unchanged.');
            return true;
        }
        catch (error) {
            setFailed(true);
            setMessage(error instanceof Error ? error.message : 'Community change could not be saved.');
            return false;
        }
        finally {
            lock.current = false;
            setBusy(false);
        }
    }
    async function showHistory(entry: CommunityAdmissionEntry, kind: CommunityOwnerDecision['kind'], before?: number) {
        if (!hydrated || lock.current)
            return;
        lock.current = true;
        setBusy(true);
        try {
            const query = new URLSearchParams({ guildId: entry.guildId, kind });
            if (before)
                query.set('before', String(before));
            const response = await fetch(`/api/admin/journal/community-admission?${query}`, { cache: 'no-store' });
            const result = await response.json();
            if (!response.ok)
                throw new Error(result.error ?? 'History could not be loaded.');
            const items = result.history as CommunityOwnerDecision[];
            setHistory({ guildId: entry.guildId, kind, items: items.slice(0, 50), more: items.length > 50 });
        }
        catch (error) {
            setFailed(true);
            setMessage(error instanceof Error ? error.message : 'History could not be loaded.');
        }
        finally {
            lock.current = false;
            setBusy(false);
        }
    }
    return <Stack ref={rootRef} spacing={3} onChange={event => {
            const form = (event.target as HTMLElement).closest('form');
            if (form)
                form.dataset.admissionDirty = 'true';
            setDirty(true);
        }} onReset={event => {
            delete (event.target as HTMLFormElement).dataset.admissionDirty;
            setDirty(Boolean(rootRef.current?.querySelector('form[data-admission-dirty="true"]')));
        }} aria-busy={busy || !hydrated}>
    {message ? <Alert severity={failed ? 'error' : 'success'}>{message}</Alert> : null}
    {dirty ? <Typography role="status" color="text.secondary" variant="body2">You have unsaved form changes. Save each form before leaving or refreshing.</Typography> : null}
    <JournalAdminPanel title="Admission policy"><Box component="form" method="post" onSubmit={async (event) => {
            event.preventDefault();
            const form = event.currentTarget, data = new FormData(form), raw = String(data.get('minimum') ?? '').trim();
            if (await save({ action: 'policy', expectedRevision: snapshot.policy.revision, mode, minimumMembers: raw === '' ? null : Number(raw), reason: String(data.get('reason') ?? '') }, form))
                form.reset();
        }}><Box component="fieldset" disabled={busy || !hydrated} sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}><Stack spacing={2}>
      <Typography>During beta, record communities you invite and decide who may join. An invitation does not approve admission or connect a server.</Typography>
      <TextField select label="Approval mode" value={mode} onChange={event => setMode(event.target.value as 'manual' | 'automatic')}><MenuItem value="manual">Manual owner approval</MenuItem><MenuItem value="automatic">Automatic approval</MenuItem></TextField>
      <Alert severity="info">Automatic approval uses only a fresh Discord approximate TOTAL member count for an invited server and your configured minimum. Totals include bots and do not establish human participation, activity or moderation quality. An empty minimum never approves anyone. For a new automatic connection, refresh evidence within five minutes. Owner decisions always take precedence.</Alert>
      <TextField key={snapshot.policy.revision} name="minimum" label="Minimum total members" required={mode === 'automatic'} type="number" defaultValue={snapshot.policy.requirements[0]?.minimum ?? ''} slotProps={{ htmlInput: { min: 1, step: 1 } }} helperText="Approximate Discord total, including bots. Required for automatic approval; no preset minimum."/>
      <TextField name="reason" label="Policy change reason" required multiline minRows={2} slotProps={{ htmlInput: { maxLength: 2000 } }}/>
      <Box><Button type="submit" variant="outlined">Save admission policy</Button></Box>
    </Stack></Box></Box></JournalAdminPanel>
    <JournalAdminPanel title="Record an invited community"><Box component="form" method="post" onSubmit={async (event) => {
            event.preventDefault();
            const form = event.currentTarget, data = new FormData(form);
            if (await save({ action: 'invite', guildId: String(data.get('guildId') ?? ''), displayName: String(data.get('displayName') ?? ''), reason: String(data.get('reason') ?? '') }, form))
                form.reset();
        }}><Box component="fieldset" disabled={busy || !hydrated} sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}><Stack spacing={2}>
      <TextField name="displayName" label="Community name" required slotProps={{ htmlInput: { maxLength: 120 } }}/>
      <TextField name="guildId" label="Discord server ID" required slotProps={{ htmlInput: { inputMode: 'numeric', pattern: '[0-9]{1,32}', maxLength: 32 } }} helperText="Identifies the exact invited server. This owner-entered record does not verify ownership or install an app."/>
      <TextField name="reason" label="Invitation reason" required multiline minRows={2} slotProps={{ htmlInput: { maxLength: 2000 } }}/>
      <Box><Button type="submit" variant="contained">Record invited community</Button></Box>
    </Stack></Box></Box></JournalAdminPanel>
    <JournalAdminPanel title="Invited communities">
      <Stack spacing={3}>
        {snapshot.entries.length === 0 ? <Typography>No invited communities on this page.</Typography> : null}
        {snapshot.entries.map(entry => {
            const exemptionCurrent = entry.exemption?.admissionRevision === entry.admission?.revision;
            const eligible = entry.admission?.status === 'approved' && entry.exemption?.status === 'approved' && exemptionCurrent;
            return <Box key={entry.guildId} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: { xs: 2, sm: 3 } }}><Stack spacing={2}>
            <Typography component="h2" variant="h3">{entry.displayName}</Typography>
            <Typography variant="body2" color="text.secondary">Server {entry.guildId} · Invited {entry.invitedAtUtc}</Typography>
            <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>Invitation reason: {entry.invitationReason}</Typography>
            <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}><Chip label={entry.admission ? labels[entry.admission.status] : 'Pending review'} color={entry.admission?.status === 'approved' ? 'success' : entry.admission?.status === 'declined' ? 'error' : 'default'}/><Chip label={`Coaching exemption: ${eligible ? 'Eligible' : entry.exemption?.status === 'declined' ? 'Not eligible' : entry.exemption?.status === 'approved' ? 'Review required' : 'Not assessed'}`} color={eligible ? 'success' : 'default'}/></Stack>
            <Typography variant="body2">Connection and community quality are not established by a member count. Linking still requires the existing server-owner checks. Coaching exemptions require your separate decision for the current admission approval.</Typography>
            {entry.admission?.source === 'automatic' && !entry.newConnectionAllowed ? <Alert severity="warning">Current evidence or policy does not allow a new connection. Refresh the count and review your configured minimum.</Alert> : null}
                            {entry.memberCount ? <Typography variant="body2">Discord approximate total members: {entry.memberCount.approximateTotalMembers} · Observed {entry.memberCount.observedAtUtc}. Includes bots; not an activity or quality score.</Typography> : <Typography variant="body2" color="text.secondary">No Discord member-count evidence collected.</Typography>}
                            <Box component="form" method="post" onSubmit={async (event) => { event.preventDefault(); await save({ action: 'collect_count', guildId: entry.guildId, expectedPolicyRevision: snapshot.policy.revision, expectedAdmissionRevision: entry.admission?.revision ?? 0 }, event.currentTarget); }}><Button type="submit" variant="outlined" disabled={busy || !hydrated}>Refresh Discord count and evaluate</Button></Box>
                            <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}><DecisionForm key={`admission-${entry.admission?.revision ?? 0}`} entry={entry} kind="admission" busy={busy || !hydrated} onSave={save}/><DecisionForm key={`exemption-${entry.exemption?.revision ?? 0}`} entry={entry} kind="coaching_exemption" busy={busy || !hydrated} onSave={save}/></Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}><Button disabled={busy || !hydrated} onClick={() => void showHistory(entry, 'admission')}>Admission history</Button><Button disabled={busy || !hydrated} onClick={() => void showHistory(entry, 'coaching_exemption')}>Exemption history</Button></Stack>
            {history?.guildId === entry.guildId ? <Box aria-live="polite"><Typography component="h3" variant="subtitle1">{history.kind === 'admission' ? 'Admission' : 'Exemption'} history</Typography>{history.items.length === 0 ? <Typography>No decisions yet.</Typography> : null}{history.items.map(item => <Box key={item.revision} sx={{ borderTop: 1, borderColor: 'divider', py: 1 }}><Typography variant="body2">{history.kind === 'admission' ? labels[item.status] : exemptionLabels[item.status]} · {item.decidedAtUtc} · Decision {item.revision}</Typography><Typography sx={{ overflowWrap: 'anywhere' }}>{item.reason}</Typography></Box>)}{history.more ? <Button disabled={busy || !hydrated} onClick={() => void showHistory(entry, history.kind, history.items.at(-1)?.revision)}>Older decisions</Button> : null}</Box> : null}
          </Stack></Box>;
        })}
        <Stack direction="row" spacing={2}><Button disabled={busy || dirty || !hydrated} onClick={() => void refresh().catch(() => { setFailed(true); setMessage('Register could not be refreshed.'); })}>First page / refresh</Button>{snapshot.hasMore ? <Button disabled={busy || dirty || !hydrated} onClick={() => void refresh(snapshot.entries.at(-1)?.guildId).catch(() => { setFailed(true); setMessage('Next page could not be loaded.'); })}>Next page</Button> : null}</Stack>
      </Stack>
    </JournalAdminPanel>
  </Stack>;
}
