import { TraderLinkPlatformDashboardFrame } from "../dashboard-layout-frame";
import { MembershipFeatureAccessNotice } from "../(dashboard)/membership-feature-access-notice";

/** A signed-in member may discover Watchlist without loading its protected data. */
export function WatchlistMembershipNotice() {
  return (
    <TraderLinkPlatformDashboardFrame billingMemberAccess loginReturnTo="/watchlist">
      <MembershipFeatureAccessNotice
        feature="watchlist.access"
        title="Watchlist"
        message="Follow the stocks that matter. Unlock Watchlist to explore published tickers and the insights included in your plan."
      />
    </TraderLinkPlatformDashboardFrame>
  );
}
