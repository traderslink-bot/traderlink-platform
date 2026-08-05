import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { Metadata } from "next";
import Link from "next/link";

import { JournalAdminOverviewService } from "@/src/modules/journal/server/administration/journal-admin-overview-service";
import { withJournalAdminPageDatabase } from "@/src/modules/platform/server/administration/require-journal-admin-page";
import {
  JournalAdminEmpty,
  JournalAdminMetricCard,
  JournalAdminMetricGrid,
  JournalAdminPage,
  JournalAdminPageHeader,
  JournalAdminPanel,
  JournalAdminStatus,
  formatAdminInteger,
  formatAdminPercentage,
  formatAdminUtc,
} from "./journal-admin-ui";

export const metadata: Metadata = { title: "Overview | Journal Administration" };
export const dynamic = "force-dynamic";

export default async function JournalAdminOverviewPage() {
  const overview = await withJournalAdminPageDatabase((database, scope) =>
    new JournalAdminOverviewService({ database, scope }).read());
  return (
    <JournalAdminPage>
      <JournalAdminPageHeader
        description="A privacy-safe view of account growth, statement imports, format-learning work, Data Decisions and operational health across the Journal."
        eyebrow="Private owner access"
        title="Journal Administration"
      />

      {overview.imports.systemFailed > 0 || overview.formats.privacyReviewRequired > 0 ? (
        <Alert severity="warning">
          {formatAdminInteger(overview.imports.systemFailed)} system-failed imports and {formatAdminInteger(overview.formats.privacyReviewRequired)} statement observations need attention.
        </Alert>
      ) : (
        <Alert severity="success">No critical import or statement-format alerts are waiting.</Alert>
      )}

      <JournalAdminMetricGrid>
        <JournalAdminMetricCard
          caption={`${formatAdminInteger(overview.users.new30Days)} joined in 30 days`}
          label="Registered users"
          value={formatAdminInteger(overview.users.registeredProduction)}
        />
        <JournalAdminMetricCard
          caption={`${formatAdminInteger(overview.users.signedIn7Days)} signed in during 7 days`}
          label="Journal-activated users"
          value={formatAdminInteger(overview.users.journalActivated)}
        />
        <JournalAdminMetricCard
          caption={`${formatAdminInteger(overview.users.multipleAccountUsers)} users have multiple accounts`}
          label="Active Journal accounts"
          value={formatAdminInteger(overview.users.activeJournalAccounts)}
        />
        <JournalAdminMetricCard
          caption={`${formatAdminInteger(overview.imports.committedWithDecisions)} include Data Decisions`}
          label="Committed imports"
          value={formatAdminInteger(overview.imports.committed)}
        />
        <JournalAdminMetricCard
          caption="Waiting for a trader-confirmed column map"
          label="Mapping required"
          value={formatAdminInteger(overview.imports.mappingRequired)}
        />
        <JournalAdminMetricCard
          caption="Private format evidence waiting for review"
          label="New format candidates"
          value={formatAdminInteger(overview.formats.newCandidates)}
        />
        <JournalAdminMetricCard
          caption="The trader remains the only factual decision-maker"
          label="Unresolved Data Decisions"
          value={formatAdminInteger(overview.dataDecisions.unresolved)}
        />
        <JournalAdminMetricCard
          caption="Fully observed attempts only"
          label="Import commit rate"
          value={formatAdminPercentage(overview.imports.commitRate.percentage)}
        />
      </JournalAdminMetricGrid>

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" } }}>
        <JournalAdminPanel title="Import health">
          <Stack spacing={1.5} sx={{
            "& > :not(:last-child)": { borderBottom: 1, borderColor: "divider", pb: 1.5 },
          }}>
            <Stack direction="row" sx={{ justifyContent: "space-between" }}>
              <Typography color="text.secondary" variant="body2">Format recognition</Typography>
              <Typography sx={{ fontWeight: 800 }}>{formatAdminPercentage(overview.imports.formatRecognitionRate.percentage)}</Typography>
            </Stack>
            <Stack direction="row" sx={{ justifyContent: "space-between" }}>
              <Typography color="text.secondary" variant="body2">System failure rate</Typography>
              <Typography sx={{ fontWeight: 800 }}>{formatAdminPercentage(overview.imports.systemFailureRate.percentage)}</Typography>
            </Stack>
            <Stack direction="row" sx={{ justifyContent: "space-between" }}>
              <Typography color="text.secondary" variant="body2">Attempt tracking began</Typography>
              <Typography sx={{ fontWeight: 700 }}>{formatAdminUtc(overview.coverage.attemptInstrumentationStartedAtUtc)}</Typography>
            </Stack>
          </Stack>
        </JournalAdminPanel>

        <JournalAdminPanel title="Latest operational receipts">
          {overview.latestOperations.length === 0 ? (
            <JournalAdminEmpty>No backup, restore or runtime receipts have been recorded yet.</JournalAdminEmpty>
          ) : (
            <Stack spacing={1.25}>
              {overview.latestOperations.map((operation) => (
                <Stack direction="row" key={operation.operationRef} spacing={1.5} sx={{ alignItems: "center", justifyContent: "space-between" }}>
                  <Box>
                    <Typography sx={{ fontWeight: 750, textTransform: "capitalize" }}>{operation.kind.replaceAll("_", " ")}</Typography>
                    <Typography color="text.secondary" variant="caption">{formatAdminUtc(operation.completedAtUtc ?? operation.startedAtUtc)}</Typography>
                  </Box>
                  <JournalAdminStatus state={operation.state} />
                </Stack>
              ))}
            </Stack>
          )}
        </JournalAdminPanel>
      </Box>

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", lg: "repeat(3, minmax(0, 1fr))" } }}>
        <JournalAdminPanel
          action={<Link href="/admin/journal/imports" style={{ color: "#011E56", fontWeight: 750, textDecoration: "none" }}>View imports</Link>}
          title="Oldest mapping requests"
        >
          {overview.queues.mappingRequired.length === 0 ? (
            <JournalAdminEmpty>No statement mappings are waiting.</JournalAdminEmpty>
          ) : (
            <Stack spacing={1.25}>
              {overview.queues.mappingRequired.slice(0, 5).map((item) => (
                <Box key={item.importRef}>
                  <Typography sx={{ fontWeight: 750 }}>{item.safeBrokerLabel ?? "Broker not supplied"}</Typography>
                  <Typography color="text.secondary" variant="caption">{item.userDisplayName} · {formatAdminUtc(item.submittedAtUtc)}</Typography>
                </Box>
              ))}
            </Stack>
          )}
        </JournalAdminPanel>

        <JournalAdminPanel
          action={<Link href="/admin/journal/statement-formats" style={{ color: "#011E56", fontWeight: 750, textDecoration: "none" }}>View formats</Link>}
          title="Ready for importer work"
        >
          {overview.queues.formatsReadyForDevelopment.length === 0 ? (
            <JournalAdminEmpty>No format candidates are ready for development.</JournalAdminEmpty>
          ) : (
            <Stack spacing={1.25}>
              {overview.queues.formatsReadyForDevelopment.slice(0, 5).map((item) => (
                <Box key={item.formatRef}>
                  <Typography sx={{ fontWeight: 750 }}>{item.canonicalBrokerLabel ?? "Unlabeled broker"}</Typography>
                  <Typography color="text.secondary" variant="caption">{formatAdminInteger(item.observationCount)} observations · {formatAdminInteger(item.distinctUserCount)} users</Typography>
                </Box>
              ))}
            </Stack>
          )}
        </JournalAdminPanel>

        <JournalAdminPanel
          action={<Link href="/admin/journal/data-decisions" style={{ color: "#011E56", fontWeight: 750, textDecoration: "none" }}>View decisions</Link>}
          title="Recurring Data Decisions"
        >
          {overview.queues.recurringDecisionIssues.length === 0 ? (
            <JournalAdminEmpty>No recurring unresolved issue pattern is present.</JournalAdminEmpty>
          ) : (
            <Stack spacing={1.25}>
              {overview.queues.recurringDecisionIssues.slice(0, 5).map((item) => (
                <Stack direction="row" key={`${item.issueCode}-${item.targetKind}`} sx={{ justifyContent: "space-between" }}>
                  <Box>
                    <Typography sx={{ fontWeight: 750 }}>{item.issueCode.replaceAll("_", " ")}</Typography>
                    <Typography color="text.secondary" variant="caption">{item.targetKind.replaceAll("_", " ")}</Typography>
                  </Box>
                  <Chip label={formatAdminInteger(item.unresolvedCount)} size="small" />
                </Stack>
              ))}
            </Stack>
          )}
        </JournalAdminPanel>
      </Box>
    </JournalAdminPage>
  );
}
