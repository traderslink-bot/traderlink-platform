import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import type { Metadata } from "next";

import { StockLevelsAdminActivityService } from "@/src/modules/stock-levels/server/stock-levels-admin-activity-service";
import { withJournalAdminPageDatabase } from "@/src/modules/platform/server/administration/require-journal-admin-page";
import {
  JournalAdminEmpty,
  JournalAdminMetricCard,
  JournalAdminMetricGrid,
  JournalAdminPage,
  JournalAdminPanel,
  JournalAdminTable,
  formatAdminInteger,
} from "../journal-admin-ui";

export const metadata: Metadata = { title: "Levels | Journal Administration" };
export const dynamic = "force-dynamic";

export default async function JournalAdminLevelsPage() {
  const activity = await withJournalAdminPageDatabase((database) =>
    new StockLevelsAdminActivityService(database).read());
  return (
    <JournalAdminPage>
      <Typography component="h1" variant="h1">Levels</Typography>

      <JournalAdminMetricGrid>
        <JournalAdminMetricCard
          caption="Successful requests today"
          label="Today's generations"
          value={formatAdminInteger(activity.todayTotal)}
        />
      </JournalAdminMetricGrid>

      <JournalAdminPanel title="Users">
        {activity.users.length === 0 ? (
          <JournalAdminEmpty>No successful Levels requests have been recorded today.</JournalAdminEmpty>
        ) : (
          <JournalAdminTable>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell align="right">Generations</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {activity.users.map((user, index) => (
                  <TableRow key={index}>
                    <TableCell>{user.displayName}</TableCell>
                    <TableCell align="right">{formatAdminInteger(user.generationCount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </JournalAdminTable>
        )}
      </JournalAdminPanel>
    </JournalAdminPage>
  );
}
