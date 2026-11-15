import Alert from '@mui/material/Alert';
import { withJournalAdminPageDatabase } from '@/src/modules/platform/server/administration/require-journal-admin-page';
import { CommunityAdmissionService } from '@/src/modules/communities/server/community-admission-service';
import { JournalAdminPage, JournalAdminPageHeader } from '../../journal-admin-ui';
import { CommunityAdmissionEditor } from './admission-editor';
export const dynamic = 'force-dynamic';
export default async function CommunityAdmissionPage() {
    const snapshot = await withJournalAdminPageDatabase((db, scope) => new CommunityAdmissionService(db, scope, new Date().toISOString()).read());
    return <JournalAdminPage><JournalAdminPageHeader title="Community admission"/>
    {snapshot.available ? <CommunityAdmissionEditor initial={snapshot}/> : <Alert severity="info">Community admission is not activated in this environment. Existing community connections and coaching history are unchanged.</Alert>}
  </JournalAdminPage>;
}
