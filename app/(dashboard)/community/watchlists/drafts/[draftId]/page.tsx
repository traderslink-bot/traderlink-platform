import { notFound } from "next/navigation";
import { CommunityWatchlistRepository } from "@/src/modules/community/server/community-watchlist-repository";
import { requireMembershipPageScope } from "@/src/modules/platform/server/membership/platform-membership-page-access";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { CommunityWatchlistCreateForm } from "../../community-watchlist-create-form";

export const metadata = { title: "Edit draft | TraderLink Platform" };
export const dynamic = "force-dynamic";

export default async function EditCommunityWatchlistDraft({ params }: { params: Promise<{ draftId: string }> }) {
  const scope = await requireMembershipPageScope("community.access");
  const { draftId } = await params;
  const draft = withReadonlyPlatformDatabase({}, (database) => new CommunityWatchlistRepository(database).findOwnedDraft(scope.userId, draftId));
  if (!draft) notFound();
  return <CommunityWatchlistCreateForm draft={draft} key={`${draft.id}:${draft.updatedAtUtc}`} />;
}
