import Alert from "@mui/material/Alert";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";

function savedViewTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function OfflineSavedViewStatus({
  savedAtUtc,
  message = "This saved view is available offline. Reconnect to change saved information or request updated results.",
}: {
  message?: string;
  savedAtUtc: string;
}) {
  return (
    <Stack spacing={1} sx={{ alignItems: "flex-start" }}>
      <Chip
        color="primary"
        label={`Offline · Last updated ${savedViewTime(savedAtUtc)}`}
        size="small"
        variant="outlined"
      />
      <Alert severity="info">{message}</Alert>
    </Stack>
  );
}
