import { DashboardPage, DashboardUnavailableState } from "../dashboard-template";

export default function DashboardNotFound() {
  return <DashboardPage>
    <DashboardUnavailableState
      title="Page not found"
      description="This page could not be found."
      actionHref="/workspace"
      actionLabel="Back to workspace"
    />
  </DashboardPage>;
}
