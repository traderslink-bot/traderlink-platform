import { requirePlatformMutationRequest } from "../../platform/server/authentication/platform-mutation-request-security";
import { evaluatePartnerAlertChannelAccess, type PartnerAlertAccessInput } from "../contracts/partner-alert-access-policy";
import type { PartnerAlertContextTicket } from "../contracts/partner-alert-contracts";
import type { PartnerAlertRoleAuthority, PartnerAlertRoleSnapshot } from "./partner-alert-role-worker";

export type PartnerAlertSubscriberOffer = Readonly<{
  userId: string;
  communityId: string;
  offerId: string;
  offerVersion: number;
  mappingIds: readonly string[];
}>;

export type PartnerAlertDiscordDestination = Readonly<{ name: string; guildId: string; channelId: string }>;
export type PartnerAlertSubscriberConfirmation = (contexts: readonly PartnerAlertContextTicket[]) => void;

export function restrictPartnerAlertAccessToOffer(input: PartnerAlertAccessInput,
  target: PartnerAlertSubscriberOffer) {
  const matches = (offer: { offerId: string; offerVersion: number }) =>
    offer.offerId === target.offerId && offer.offerVersion === target.offerVersion;
  const offers = input.offers.filter(({ offer }) => matches({ offerId: offer.offerId, offerVersion: offer.version }));
  const stripe = input.stripeFunding;
  const stripeOnly = stripe?.stripeOnlyOffers?.filter(matches) ?? [];
  const mappingIds = offers[0]?.offer.mappingIds ?? stripeOnly[0]?.mappingIds;
  if (offers.length + stripeOnly.length !== 1 || !mappingIds || mappingIds.length !== target.mappingIds.length
    || target.mappingIds.some(mappingId => !mappingIds.includes(mappingId))) return null;
  return { ...input, offers, memberships: input.memberships.filter(matches), previousCommunityPaidThroughUtc: null,
    stripeFunding: stripe && { ...stripe,
      paidOffers: stripe.paidOffers.filter(matches),
      noLegacyWhopOffers: stripeOnly.length === 1,
    },
  };
}

/** Current, provider-verified membership for the exact linked subject. */
export type PartnerAlertSubscriberRoleObserver = (
  target: Readonly<{ guildId: string; discordUserId: string }>,
  signal?: AbortSignal,
) => Promise<Readonly<{
  guildId: string;
  discordUserId: string;
  roleIds: readonly string[];
  observedAtUtc: string;
  validUntilUtc: string;
}> | null>;

export async function verifyPartnerAlertSubscriberOffer(
  target: PartnerAlertSubscriberOffer,
  authority: PartnerAlertRoleAuthority,
  nowUtc: () => string,
  observeRoles?: PartnerAlertSubscriberRoleObserver,
  signal?: AbortSignal,
  confirm?: PartnerAlertSubscriberConfirmation,
): Promise<"subscribed" | "eligible" | "ineligible" | "unavailable"> {
  if (!authority.inCurrentWriter || !target.mappingIds.length) return "unavailable";
  try {
    const snapshots: PartnerAlertRoleSnapshot[] = [];
    for (const mappingId of target.mappingIds) {
      snapshots.push(await authority.refresh({ communityId: target.communityId, userId: target.userId, mappingId }));
    }
    const assess = (): "eligible" | "existing" | "ineligible" | "unavailable" => {
      const at = nowUtc();
      let hasExistingWhop = false;
      for (const [index, snapshot] of snapshots.entries()) {
        const { input, ticket } = snapshot;
        const mappingId = target.mappingIds[index];
        if (!authority.isCurrent(ticket) || input.userId !== target.userId
          || input.communityId !== target.communityId || input.mappingId !== mappingId) return "unavailable";
        const selected = restrictPartnerAlertAccessToOffer(input, target);
        if (!selected) return "unavailable";
        const decision = evaluatePartnerAlertChannelAccess({ ...selected, nowUtc: at });
        if (decision.allowed) continue;
        const whop = selected.existingWhopAccess;
        if (decision.reason === "subscription_unverified" && whop?.kind === "retained"
          && whop.observedAtUtc <= at && whop.validUntilUtc > at
          && whop.retainedOffers.some(offer => offer.offerId === target.offerId && offer.offerVersion === target.offerVersion)) {
          hasExistingWhop = true;
          continue;
        }
        return decision.desiredRole === "hold" ? "unavailable" : "ineligible";
      }
      return hasExistingWhop ? "existing" : "eligible";
    };
    const eligibility = authority.inCurrentWriter(assess);
    if (eligibility !== "eligible" && eligibility !== "existing") return eligibility;
    if (!observeRoles) return eligibility === "existing" ? "unavailable" : eligibility;
    const first = snapshots[0]!.ticket.context;
    if (!first.linkedDiscordUserId || signal?.aborted || snapshots.some(({ ticket }) =>
      ticket.context.guildId !== first.guildId || ticket.context.linkedDiscordUserId !== first.linkedDiscordUserId)) return "unavailable";
    const observation = await observeRoles({ guildId: first.guildId, discordUserId: first.linkedDiscordUserId }, signal);
    return authority.inCurrentWriter(() => {
      const current = assess();
      if (current !== "eligible" && current !== "existing") return current;
      if (signal?.aborted || !observation || observation.guildId !== first.guildId
        || observation.discordUserId !== first.linkedDiscordUserId) return "unavailable";
      const at = Date.parse(nowUtc());
      const observed = Date.parse(observation.observedAtUtc);
      const until = Date.parse(observation.validUntilUtc);
      if (!(observed <= at && at < until && until <= observed + 30_000)) return "unavailable";
      if (!snapshots.every(({ ticket }) => observation.roleIds.includes(ticket.context.roleId))) {
        return current === "existing" ? "unavailable" : "eligible";
      }
      confirm?.(snapshots.map(({ ticket }) => ticket.context));
      return "subscribed";
    });
  } catch {
    return "unavailable";
  }
}

export async function checkPartnerAlertSubscriberAccess(
  request: Request,
  authorize: () => PartnerAlertSubscriberOffer,
  authority: PartnerAlertRoleAuthority | ((target: PartnerAlertSubscriberOffer) => PartnerAlertRoleAuthority | null) | null,
  nowUtc: () => string,
  observeRoles?: PartnerAlertSubscriberRoleObserver,
  readDestinations?: (contexts: readonly PartnerAlertContextTicket[]) => readonly PartnerAlertDiscordDestination[],
): Promise<Response> {
  let destinations: readonly PartnerAlertDiscordDestination[] = [];
  const respond = (status: number, code: string) => Response.json({ ok: status === 200, code,
    ...(code === "subscribed" ? { result: { access: "subscribed",
      ...(destinations.length ? { destinations } : {}) } } : {}) }, {
    status, headers: { "cache-control": "private, no-store", vary: "Cookie" },
  });
  if (request.method !== "POST") return respond(405, "method_not_allowed");
  try {
    requirePlatformMutationRequest(request);
    const target = authorize();
    const bound = typeof authority === "function" ? authority(target) : authority;
    if (bound) {
      const result = await verifyPartnerAlertSubscriberOffer(target, bound, nowUtc, observeRoles, request.signal,
        contexts => { destinations = readDestinations?.(contexts) ?? []; });
      if (request.signal.aborted || JSON.stringify(authorize()) !== JSON.stringify(target)) {
        return respond(503, "verification_unavailable");
      }
      if (result === "subscribed") return respond(200, "subscribed");
      if (result === "eligible") return respond(200, "eligible");
      if (result === "ineligible") return respond(403, "subscription_required");
    }
  } catch { /* Authorization or evidence could not be established. */ }
  return respond(503, "verification_unavailable");
}
