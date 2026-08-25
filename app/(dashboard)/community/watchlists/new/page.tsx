import type { Metadata } from "next";

import { CommunityWatchlistCreateForm } from "../community-watchlist-create-form";

export const metadata: Metadata = {
  title: "Create watchlist | TradersLink Platform",
};

export default function CreateCommunityWatchlistPage() {
  return <CommunityWatchlistCreateForm />;
}
