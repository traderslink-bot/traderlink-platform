import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import {
  DashboardDataScopeChip,
  DashboardPage,
  DashboardPanel,
  DashboardUnavailableState,
} from "./dashboard-template";

export function ImportTradesFoundation() {
  return (
    <DashboardPage>
      <Alert severity="info">
        Trade imports continue to use the governed CSV validation and repair
        flow while its screens are migrated into this Material dashboard.
      </Alert>
      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: {
            xs: "minmax(0, 1fr)",
            md: "repeat(2, minmax(0, 1fr))",
          },
        }}
      >
        <DashboardPanel title="Import a broker statement">
          <Stack spacing={1.5} sx={{ alignItems: "flex-start" }}>
            <Typography color="text.secondary" variant="body2">
              Upload execution history, validate the broker columns, and save
              accepted trades. Rows needing repair stay inside the import flow.
            </Typography>
            <Button
              href="/intelligence/upload-csv"
              startIcon={<CloudUploadRoundedIcon />}
              variant="contained"
            >
              Choose a CSV
            </Button>
          </Stack>
        </DashboardPanel>
        <DashboardPanel title="Import activity">
          <Stack spacing={1.5} sx={{ alignItems: "flex-start" }}>
            <Typography color="text.secondary" variant="body2">
              Open saved imports, unfinished repairs, duplicate checks, and
              the audit history for prior files.
            </Typography>
            <Button
              href="/intelligence/imports"
              startIcon={<HistoryRoundedIcon />}
              variant="outlined"
            >
              View import history
            </Button>
          </Stack>
        </DashboardPanel>
      </Box>
    </DashboardPage>
  );
}

export function ManualEntryFoundation() {
  return (
    <DashboardPage>
      <Alert severity="info">
        The complete execution form is laid out below. Saving remains disabled
        until the v3 manual-entry mutation contract is accepted.
      </Alert>
      <DashboardPanel title="Execution details">
        <Box
          component="form"
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: {
              xs: "minmax(0, 1fr)",
              sm: "repeat(2, minmax(0, 1fr))",
              lg: "repeat(4, minmax(0, 1fr))",
            },
          }}
        >
          <TextField
            helperText="NYSE or Nasdaq stock"
            label="Symbol"
            name="symbol"
            placeholder="AAPL"
            required
          />
          <TextField
            defaultValue="buy"
            label="Side"
            name="side"
            required
            select
          >
            <MenuItem value="buy">Buy</MenuItem>
            <MenuItem value="sell">Sell</MenuItem>
            <MenuItem value="sell-short">Sell short</MenuItem>
            <MenuItem value="buy-to-cover">Buy to cover</MenuItem>
          </TextField>
          <TextField
            label="Execution date"
            name="executionDate"
            required
            slotProps={{ inputLabel: { shrink: true } }}
            type="date"
          />
          <TextField
            helperText="Exchange-local time"
            label="Execution time"
            name="executionTime"
            required
            slotProps={{ inputLabel: { shrink: true } }}
            type="time"
          />
          <TextField
            label="Quantity"
            name="quantity"
            required
            slotProps={{ htmlInput: { min: 0, step: "any" } }}
            type="number"
          />
          <TextField
            label="Execution price"
            name="price"
            required
            slotProps={{ htmlInput: { min: 0, step: "any" } }}
            type="number"
          />
          <TextField
            defaultValue="0"
            label="Commission and fees"
            name="fees"
            required
            slotProps={{ htmlInput: { min: 0, step: "any" } }}
            type="number"
          />
          <TextField
            label="Account"
            name="account"
            value="Assigned securely by the server"
            disabled
          />
          <TextField
            label="Execution note"
            multiline
            name="note"
            minRows={3}
            placeholder="Optional context for this execution"
            sx={{ gridColumn: { sm: "1 / -1" } }}
          />
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            sx={{
              alignItems: { xs: "stretch", sm: "center" },
              gridColumn: { sm: "1 / -1" },
              justifyContent: "flex-end",
            }}
          >
            <Typography color="text.secondary" variant="caption">
              Required: symbol, side, exact date and time, quantity, price, and
              trading costs.
            </Typography>
            <Button disabled startIcon={<SaveRoundedIcon />} variant="contained">
              Save execution
            </Button>
          </Stack>
        </Box>
      </DashboardPanel>
    </DashboardPage>
  );
}

export function ReflectionLoopFoundation() {
  return (
    <DashboardPage>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        sx={{
          alignItems: { xs: "stretch", sm: "center" },
          justifyContent: "space-between",
        }}
      >
        <DashboardDataScopeChip />
        <ButtonGroup aria-label="Reflection period" size="small">
          <Button variant="contained">Daily</Button>
          <Button variant="outlined">Weekly</Button>
          <Button variant="outlined">Monthly</Button>
        </ButtonGroup>
      </Stack>
      <DashboardPanel title="Reflection history">
        <DashboardUnavailableState
          description="Reflection Loop is preserved as a separate feature for product review. Coach and Progress are not included in the v3 dashboard foundation."
          title="Reflection Loop is ready for redesign"
        />
      </DashboardPanel>
    </DashboardPage>
  );
}
