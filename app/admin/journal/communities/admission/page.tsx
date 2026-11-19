import Alert from '@mui/material/Alert';
import { withJournalAdminPageDatabase } from '@/src/modules/platform/server/administration/require-journal-admin-page';
import { CommunityAdmissionError, CommunityAdmissionService } from '@/src/modules/communities/server/community-admission-service';
import { JournalAdminAccessDenied } from '../../journal-admin-access-denied';
import { JournalAdminPage, JournalAdminPageHeader } from '../../journal-admin-ui';
import { CommunityAdmissionEditor } from './admission-editor';
export const dynamic = 'force-dynamic';
export default async function CommunityAdmissionPage() {
    let snapshot: ReturnType<CommunityAdmissionService['read']>;
    try {
        snapshot = await withJournalAdminPageDatabase((db, scope) => new CommunityAdmissionService(db, scope, new Date().toISOString()).read());
    } catch (error) {
        if (error instanceof CommunityAdmissionError && error.status === 403) return <JournalAdminAccessDenied/>;
        throw error;
    }
    return <JournalAdminPage><JournalAdminPageHeader title="Community admission"/>
    {snapshot.available ? <CommunityAdmissionEditor initial={snapshot}/> : <Alert severity="info">Community admission is not activated in this environment. Existing community connections and coaching history are unchanged.</Alert>}
  </JournalAdminPage>;
}
