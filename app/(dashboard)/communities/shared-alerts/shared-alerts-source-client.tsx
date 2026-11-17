"use client";

import { useRouter } from "next/navigation";
import { PLATFORM_MUTATION_REQUEST_HEADER } from "@/src/modules/platform/contracts/platform-request-security";
import type { SharedSourceAlert } from "@/src/modules/communities/server/shared-alerts-source-publication";
import type { SharedSourceActionResult } from "./shared-alerts-source-actions";
import { SharedAlertsSourceForm } from "./shared-alerts-source-form";
import { SharedAlertsSourceDestinations } from "./shared-alerts-source-destinations";

type Choice = Readonly<{ id: string; name: string }>;
type PublisherView = Readonly<{
  view: "publisher"; communitySlug: string; audiences: readonly Choice[]; destinations: readonly Choice[];
  initialAlert?: SharedSourceAlert; initialDestinationIds?: readonly string[]; initialDistribution?: "website" | "discord";
}>;
type OwnerView = Readonly<{
  view: "owner"; communitySlug: string; channels: readonly Choice[]; publishers: readonly Choice[];
  destinations: readonly Readonly<{ id: string; name: string; channelId: string; active: boolean; publisherIds: readonly string[] }>[];
}>;

/** Real same-origin transport. Parent must mount with authenticated, scoped data; server repeats every check. */
export function SharedAlertsSourceClient(props: PublisherView | OwnerView) {
  const router = useRouter();
  async function submit(form: FormData): Promise<SharedSourceActionResult> {
    const scopes = form.getAll("communitySlug");
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(props.communitySlug) || props.communitySlug.length > 100 || scopes.length !== 1 || scopes[0] !== props.communitySlug) throw new Error("Community scope changed");
    const response = await fetch(`/api/communities/${encodeURIComponent(props.communitySlug)}/shared-alerts/source`, {
      method: "POST", credentials: "same-origin", mode: "same-origin", redirect: "error", cache: "no-store",
      headers: { [PLATFORM_MUTATION_REQUEST_HEADER]: "1" }, body: form,
    });
    if (!response.headers.get("content-type")?.includes("application/json")) throw new Error("Publication result unavailable");
    const result = await response.json() as SharedSourceActionResult;
    if (!result || !["success", "error"].includes(result.status) || typeof result.message !== "string" || result.message.length > 2000 || (!response.ok && result.status !== "error")) throw new Error("Publication result unavailable");
    if (result.status === "success") {
      if (form.get("command") === "save_alert" && (!result.alert || typeof result.alert.alertId !== "string" || typeof result.alert.updatedAtUtc !== "string")) throw new Error("Publication result unavailable");
      if (props.view === "publisher") router.refresh();
    }
    return result;
  }
  if (props.view === "owner") return <SharedAlertsSourceDestinations communitySlug={props.communitySlug} channels={props.channels} destinations={props.destinations} publishers={props.publishers} submit={submit} />;
  return <SharedAlertsSourceForm key={`${props.communitySlug}:${props.initialAlert?.alertId ?? "new"}`} communitySlug={props.communitySlug} audiences={props.audiences} destinations={props.destinations}
    initialAlert={props.initialAlert} initialDestinationIds={props.initialDestinationIds} initialDistribution={props.initialDistribution} submit={submit} />;
}
