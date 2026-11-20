"use client";

import { useRouter } from "next/navigation";
import { PLATFORM_MUTATION_REQUEST_HEADER } from "@/src/modules/platform/contracts/platform-request-security";
import type { SharedSourceAlert } from "@/src/modules/communities/server/shared-alerts-source-publication";
import type { SharedSourceActionResult } from "./shared-alerts-source-actions";
import { SharedAlertsSourceForm } from "./shared-alerts-source-form";
import { SharedAlertsSourceDestinations } from "./shared-alerts-source-destinations";
import { SharedAlertsSourceAssignments, isSharedSourceAssignmentState } from "./shared-alerts-source-assignments";
import type { SharedSourceAssignmentDestination, SharedSourceAssignmentPublisher } from "@/src/modules/communities/contracts/shared-alerts-contracts";

type Choice = Readonly<{ id: string; name: string }>;
type PublisherView = Readonly<{
  view: "publisher"; communitySlug: string; audiences: readonly Choice[]; destinations: readonly Choice[];
  isOwner?: boolean;
  initialAlert?: SharedSourceAlert; initialDestinationIds?: readonly string[]; initialDistribution?: "website" | "discord";
}>;
type OwnerView = Readonly<{
  view: "owner"; communitySlug: string; channels: readonly Choice[]; publishers: readonly Choice[];
  destinations: readonly SharedSourceAssignmentDestination[];
}>;
type AssignmentView = Readonly<{ view: "owner_assignments"; communitySlug: string; publishers: readonly SharedSourceAssignmentPublisher[]; destinations: readonly SharedSourceAssignmentDestination[] }>;

/** Real same-origin transport. Parent must mount with authenticated, scoped data; server repeats every check. */
export function SharedAlertsSourceClient(props: PublisherView | OwnerView | AssignmentView) {
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
      if (form.get("command") === "assign_publishers" && (!isSharedSourceAssignmentState(result.assignment) || result.assignment.destinationId !== form.get("destinationId"))) throw new Error("Assignment result unavailable");
      if (props.view === "publisher") router.refresh();
    }
    return result;
  }
  async function reloadAssignments() {
    const response = await fetch(`/api/communities/${encodeURIComponent(props.communitySlug)}/shared-alerts/source?communitySlug=${encodeURIComponent(props.communitySlug)}&view=owner_assignments`, { credentials: "same-origin", mode: "same-origin", redirect: "error", cache: "no-store" });
    if (!response.ok || !response.headers.get("content-type")?.includes("application/json")) throw new Error("Assignments unavailable");
    const body = await response.json();
    if (body?.community?.slug !== props.communitySlug || !Array.isArray(body.destinations) || body.destinations.length > 200 || !Array.isArray(body.publishers) || body.publishers.length > 200
      || body.destinations.some((row: SharedSourceAssignmentDestination) => !isSharedSourceAssignmentState(row) || row.id !== row.destinationId || typeof row.name !== "string" || row.name.length > 80 || typeof row.active !== "boolean" || !/^\d{1,32}$/u.test(row.channelId))
      || body.publishers.some((row: SharedSourceAssignmentPublisher) => !row || typeof row.id !== "string" || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/u.test(row.id) || typeof row.name !== "string" || row.name.length > 300 || typeof row.available !== "boolean")
      || new Set(body.destinations.map((row: SharedSourceAssignmentDestination) => row.id)).size !== body.destinations.length
      || new Set(body.publishers.map((row: SharedSourceAssignmentPublisher) => row.id)).size !== body.publishers.length) throw new Error("Assignments unavailable");
    return body as Readonly<{ destinations: readonly SharedSourceAssignmentDestination[]; publishers: readonly SharedSourceAssignmentPublisher[] }>;
  }
  if (props.view === "owner_assignments") return <SharedAlertsSourceAssignments communitySlug={props.communitySlug} destinations={props.destinations} publishers={props.publishers} submit={submit} reload={reloadAssignments} />;
  if (props.view === "owner") return <SharedAlertsSourceDestinations communitySlug={props.communitySlug} channels={props.channels} destinations={props.destinations} publishers={props.publishers} submit={submit} reloadAssignments={reloadAssignments} />;
  return <SharedAlertsSourceForm key={`${props.communitySlug}:${props.initialAlert?.alertId ?? "new"}`} communitySlug={props.communitySlug} audiences={props.audiences} destinations={props.destinations} isOwner={props.isOwner}
    initialAlert={props.initialAlert} initialDestinationIds={props.initialDestinationIds} initialDistribution={props.initialDistribution} submit={submit} />;
}
