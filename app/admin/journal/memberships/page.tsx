import Alert from "@mui/material/Alert";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import type { Metadata } from "next";
import { withJournalAdminPageDatabase } from "@/src/modules/platform/server/administration/require-journal-admin-page";
import { PlatformMembershipAdminService } from "@/src/modules/platform/server/membership/platform-membership-admin-service";
import { readMembershipEditorChoices, readMembershipPlanList } from "@/src/modules/platform/server/membership/membership-plan-editor-read";
import { isTraderLinkPlatformError } from "@/src/modules/platform/server/database/platform-migration-contract";
import { JournalAdminMetricCard, JournalAdminMetricGrid, JournalAdminPage, JournalAdminPageHeader, JournalAdminPanel } from "../journal-admin-ui";
import { PrivatePlanLinkForm } from "./private-link-form";
import { MembershipManagementPanels } from "./management-panels";
import { UnifiedPlanWorkspace } from "./unified-plan-workspace";

export const metadata: Metadata = { title: "Memberships | Journal Administration" };
export const dynamic = "force-dynamic";
const sections = ["Overview", "Plans", "Features", "Payment providers", "Members", "Grant access", "Subscriptions", "Billing health", "Audit history", "Private links"] as const;

export default async function MembershipsAdminPage({ searchParams }: { searchParams: Promise<{ section?: string; new?: string }> }) {
  const query = await searchParams;
  const requested = ["Prices & checkout", "Trials", "Discord access"].includes(query.section ?? "") ? "Plans" : query.section;
  const section = sections.find(item => item === requested) ?? "Overview";
  const result = await withJournalAdminPageDatabase(database => {
    const snapshot = new PlatformMembershipAdminService(database).read();
    const ready = snapshot.available && Boolean(database.prepare("SELECT 1 FROM sqlite_schema WHERE name='platform_membership_editor_drafts' AND type='table'").get());
    return {
      snapshot,
      panel: snapshot.available && section !== "Plans" ? MembershipManagementPanels({ database, section }) : null,
      editor: ready && section === "Plans" ? { ...readMembershipEditorChoices(database), items: readMembershipPlanList(database) } : null,
    };
  }).catch(error => {
    // The parent admin layout owns login redirects and the locked-access screen.
    // Parallel page rendering must not turn that expected denial into a 500.
    if (process.env.NODE_ENV === "production" && isTraderLinkPlatformError(error) &&
      ["TRADERLINK_WORKSPACE_ACCESS_DENIED", "TRADERLINK_JOURNAL_ADMIN_ACCESS_DENIED"].includes(error.code)) return null;
    throw error;
  });
  if (!result) return null;
  const { snapshot, panel, editor } = result;
  return <JournalAdminPage>
    <JournalAdminPageHeader description="" eyebrow="Private owner access" title="Memberships" />
    {!snapshot.available ? <Alert severity="info">The membership foundation is awaiting its controlled database migration.</Alert> : null}
    <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
      {sections.map(item => <Chip component="a" clickable href={`/admin/journal/memberships?section=${encodeURIComponent(item)}`}
        color={item === section ? "primary" : "default"} key={item} label={item} variant={item === section ? "filled" : "outlined"} />)}
    </Stack>
    {section === "Overview" ? <JournalAdminMetricGrid>
      <JournalAdminMetricCard caption="All plan states" label="Plans" value={snapshot.counts.plans.toString()} />
      <JournalAdminMetricCard caption="Available to new members" label="Active prices" value={snapshot.counts.activeOffers.toString()} />
      <JournalAdminMetricCard caption="All access sources" label="Active memberships" value={snapshot.counts.activeEntitlements.toString()} />
      <JournalAdminMetricCard caption="Currently available" label="Active trials" value={snapshot.counts.activeTrials.toString()} />
      <JournalAdminMetricCard caption="Unlisted and revocable" label="Private links" value={snapshot.counts.activeShareLinks.toString()} />
    </JournalAdminMetricGrid> : null}
    {section === "Plans" ? editor ? <UnifiedPlanWorkspace {...editor} createNew={query.new === "1"} />
      : <Alert severity="info">The plan editor is awaiting its controlled database migration.</Alert> : panel}
    {section === "Private links" && snapshot.available ? <JournalAdminPanel title="New private plans page">
      <PrivatePlanLinkForm offers={snapshot.offers} />
    </JournalAdminPanel> : null}
  </JournalAdminPage>;
}
