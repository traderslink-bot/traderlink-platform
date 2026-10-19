import { Alert, Button, Stack, Typography } from "@mui/material";
import { DashboardPage } from "../dashboard-template";

export function MembershipFeatureAccessNotice({ feature, title, message }: Readonly<{ feature: string; title: string; message: string }>) {
  return <DashboardPage>
    <Typography component="h1" variant="h1">{title}</Typography>
    <Alert severity="info" sx={{ mt: 2, maxWidth: 560 }}>
      {message}
      <Stack sx={{ mt: 1, alignItems: "flex-start" }}><Button href={`/plans?feature=${encodeURIComponent(feature)}`} variant="contained">Unlock {title}</Button></Stack>
    </Alert>
  </DashboardPage>;
}
