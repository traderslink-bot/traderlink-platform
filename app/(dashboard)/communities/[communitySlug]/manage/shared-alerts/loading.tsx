import LinearProgress from "@mui/material/LinearProgress";
import { DashboardPage, DashboardPanel } from "@/app/dashboard-ui";

export default function SharedAlertsLoading() {
  return <DashboardPage><DashboardPanel title="Shared alerts"><LinearProgress aria-label="Loading Shared alerts" /></DashboardPanel></DashboardPage>;
}
