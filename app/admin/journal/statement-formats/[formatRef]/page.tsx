import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JournalStatementFormatService } from "@/src/modules/journal/server/administration/journal-statement-format-service";
import { withJournalAdminPageDatabase } from "@/src/modules/platform/server/administration/require-journal-admin-page";
import {
  JournalAdminPage,
  JournalAdminPageHeader,
  JournalAdminPanel,
  JournalAdminStatus,
  formatAdminInteger,
  formatAdminUtc,
} from "../../journal-admin-ui";
import { StatementFormatActions } from "./statement-format-actions";

export const metadata: Metadata = { title: "Format Detail | Journal Administration" };
export const dynamic = "force-dynamic";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function layoutTables(value: unknown): readonly Readonly<{
  label: string;
  kind: string;
  headers: readonly string[];
}>[] {
  if (!isRecord(value) || !Array.isArray(value.tables)) return [];
  return value.tables.flatMap((candidate) => {
    if (!isRecord(candidate) || typeof candidate.tableLabel !== "string" ||
      typeof candidate.tableKind !== "string" || !Array.isArray(candidate.headerLabels) ||
      candidate.headerLabels.some((label) => typeof label !== "string")) return [];
    return [Object.freeze({
      label: candidate.tableLabel,
      kind: candidate.tableKind,
      headers: Object.freeze(candidate.headerLabels as string[]),
    })];
  });
}

export default async function JournalAdminStatementFormatDetailPage({
  params,
}: {
  params: Promise<{ formatRef: string }>;
}) {
  const { formatRef } = await params;
  const result = await withJournalAdminPageDatabase((database, scope) => {
    const service = new JournalStatementFormatService({ database, scope });
    return Object.freeze({
      detail: service.detail(formatRef),
      formats: service.list({ pageSize: 100 }).formats.items,
    });
  });
  const detail = result.detail;
  if (!detail) notFound();
  const structures = detail.sanitizedStructures.flatMap(layoutTables);
  return (
    <JournalAdminPage>
      <Link
        href="/admin/journal/statement-formats"
        style={{ color: "#011E56", fontWeight: 750, textDecoration: "none" }}
      >
        ← Statement Formats
      </Link>
      <JournalAdminPageHeader
        description="Review the privacy-safe structure and mapping evidence collected from this exact statement layout."
        eyebrow="Importer learning"
        title={detail.summary.layoutLabel}
      />
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { sm: "center" } }}>
        <JournalAdminStatus state={detail.summary.effectiveState} />
        <Chip label={`${formatAdminInteger(detail.summary.observationCount)} observations`} size="small" variant="outlined" />
        <Chip label={`${formatAdminInteger(detail.summary.distinctUserCount)} users`} size="small" variant="outlined" />
        <Chip label={detail.summary.canonicalBrokerLabel ?? "Broker not supplied"} size="small" variant="outlined" />
      </Stack>

      {detail.summary.effectiveState === "support_drift" ? (
        <Alert severity="error">The deployed importer no longer matches the reviewed format evidence. Automatic matching remains off until the exact registry and fixture match is restored.</Alert>
      ) : null}

      <JournalAdminPanel title="Format actions">
        <StatementFormatActions
          developerPackageAvailable={detail.developerPackageAvailable}
          formatRef={detail.summary.formatRef}
          lifecycleState={detail.summary.lifecycleState}
          mergeOptions={result.formats
            .filter((item) => item.formatRef !== detail.summary.formatRef &&
              !["duplicate", "rejected"].includes(item.lifecycleState))
            .map((item) => ({
              formatRef: item.formatRef,
              label: item.layoutLabel,
              revision: item.revision,
              state: item.effectiveState,
            }))}
          revision={detail.summary.revision}
        />
      </JournalAdminPanel>

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" } }}>
        <JournalAdminPanel title="Captured statement layout">
          {structures.length === 0 ? (
            <Typography color="text.secondary" variant="body2">No displayable table structure is available.</Typography>
          ) : (
            <Stack spacing={2} sx={{
              "& > :not(:last-child)": { borderBottom: 1, borderColor: "divider", pb: 2 },
            }}>
              {structures.map((table, index) => (
                <Box key={`${table.label}-${index}`}>
                  <Typography sx={{ fontWeight: 800 }}>{table.label}</Typography>
                  <Typography color="text.secondary" variant="caption">{table.kind.replaceAll("_", " ")}</Typography>
                  <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap", gap: 0.75, mt: 1 }}>
                    {table.headers.map((header) => <Chip key={header} label={header} size="small" />)}
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}
        </JournalAdminPanel>

        <JournalAdminPanel title="Mapping evidence">
          <Stack spacing={1.5} sx={{
            "& > :not(:last-child)": { borderBottom: 1, borderColor: "divider", pb: 1.5 },
          }}>
            <Box><Typography color="text.secondary" variant="caption">Successful manual mappings</Typography><Typography sx={{ fontWeight: 800 }}>{formatAdminInteger(detail.summary.successfulManualMappingCount)}</Typography></Box>
            <Box><Typography color="text.secondary" variant="caption">Conflicting mapping variants</Typography><Typography sx={{ fontWeight: 800 }}>{formatAdminInteger(detail.summary.conflictingMappingCount)}</Typography></Box>
            <Box><Typography color="text.secondary" variant="caption">Affected upload attempts</Typography><Typography sx={{ fontWeight: 800 }}>{formatAdminInteger(detail.affectedAttemptCount)}</Typography></Box>
            <Box><Typography color="text.secondary" variant="caption">Private sources currently shared</Typography><Typography sx={{ fontWeight: 800 }}>{formatAdminInteger(detail.consentedSourceCount)}</Typography></Box>
          </Stack>
        </JournalAdminPanel>
      </Box>

      <JournalAdminPanel title="Lifecycle history">
        <Stack spacing={1.25} sx={{
          "& > :not(:last-child)": { borderBottom: 1, borderColor: "divider", pb: 1.25 },
        }}>
          {detail.timeline.map((event) => (
            <Stack direction={{ xs: "column", sm: "row" }} key={event.sequence} sx={{ justifyContent: "space-between" }}>
              <Box>
                <Typography sx={{ fontWeight: 750, textTransform: "capitalize" }}>{event.reasonCode.replaceAll("_", " ")}</Typography>
                <Typography color="text.secondary" variant="caption">{formatAdminUtc(event.occurredAtUtc)}</Typography>
              </Box>
              <JournalAdminStatus state={event.newState} />
            </Stack>
          ))}
        </Stack>
      </JournalAdminPanel>
    </JournalAdminPage>
  );
}
