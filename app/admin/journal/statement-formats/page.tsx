import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import type { Metadata } from "next";
import Link from "next/link";

import { JournalStatementFormatService } from "@/src/modules/journal/server/administration/journal-statement-format-service";
import { withJournalAdminPageDatabase } from "@/src/modules/platform/server/administration/require-journal-admin-page";
import {
  JournalAdminEmpty,
  JournalAdminPage,
  JournalAdminPageHeader,
  JournalAdminPanel,
  JournalAdminStatus,
  JournalAdminTable,
  formatAdminInteger,
  formatAdminUtc,
} from "../journal-admin-ui";

export const metadata: Metadata = { title: "Statement Formats | Journal Administration" };
export const dynamic = "force-dynamic";

export default async function JournalAdminStatementFormatsPage() {
  const data = await withJournalAdminPageDatabase((database, scope) =>
    new JournalStatementFormatService({ database, scope }).list({ pageSize: 50 }));
  return (
    <JournalAdminPage>
      <JournalAdminPageHeader
        description="Turn successful user mappings into exact, reusable broker-statement support while keeping statement values and account identifiers private."
        eyebrow="Importer learning"
        title="Statement Formats"
      />
      {data.formats.items.length === 0 ? (
        <JournalAdminEmpty>No privacy-safe format candidates have been observed yet.</JournalAdminEmpty>
      ) : (
        <JournalAdminTable>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Format</TableCell>
                <TableCell>Broker labels</TableCell>
                <TableCell>Structure</TableCell>
                <TableCell>Evidence</TableCell>
                <TableCell>Support state</TableCell>
                <TableCell>Next action</TableCell>
                <TableCell align="right">Review</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.formats.items.map((item) => (
                <TableRow hover key={item.formatRef}>
                  <TableCell><strong>{item.layoutLabel}</strong><br />{formatAdminUtc(item.lastObservedAtUtc)}</TableCell>
                  <TableCell>
                    {item.canonicalBrokerLabel ??
                      (item.observedBrokerLabels.join(", ") || "Not supplied")}
                  </TableCell>
                  <TableCell>{item.fileKind} · {item.normalizedEncoding}<br />{item.delimiterLabel ?? "Delimiter unavailable"}</TableCell>
                  <TableCell>{formatAdminInteger(item.observationCount)} observations<br />{formatAdminInteger(item.distinctUserCount)} users</TableCell>
                  <TableCell><JournalAdminStatus state={item.effectiveState} /></TableCell>
                  <TableCell sx={{ textTransform: "capitalize" }}>{item.recommendedNextAction.replaceAll("_", " ")}</TableCell>
                  <TableCell align="right">
                    <Link
                      href={`/admin/journal/statement-formats/${encodeURIComponent(item.formatRef)}`}
                      style={{ color: "#011E56", fontWeight: 750, textDecoration: "none" }}
                    >
                      Review format
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </JournalAdminTable>
      )}

      <JournalAdminPanel title="Privacy review required">
        {data.privacyReviewRequired.length === 0 ? (
          <JournalAdminEmpty>No statement layouts are waiting for privacy review.</JournalAdminEmpty>
        ) : (
          <Table size="small">
            <TableHead><TableRow><TableCell>Observed</TableCell><TableCell>Broker label</TableCell><TableCell>File type</TableCell><TableCell>Outcome</TableCell></TableRow></TableHead>
            <TableBody>
              {data.privacyReviewRequired.map((item) => (
                <TableRow key={item.observationRef}>
                  <TableCell>{formatAdminUtc(item.observedAtUtc)}</TableCell>
                  <TableCell>{item.safeBrokerLabel ?? "Not supplied"}</TableCell>
                  <TableCell>{item.fileKind}</TableCell>
                  <TableCell><JournalAdminStatus state={item.outcome} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </JournalAdminPanel>
    </JournalAdminPage>
  );
}
