import "server-only";

import { requireCommunityOwnerReviewRequestIdentity } from "@/src/modules/communities/server/community-owner-review-request-identity";

/** Outer human-review boundary. Feature ownership, admin and purchase checks
 * still run in the existing handlers after this gate. Provider webhooks use
 * their signature checks and never call this helper. */
export function partnerAlertOwnerReviewRequestDenied(request: Request): Response | null {
  try {
    requireCommunityOwnerReviewRequestIdentity(request.headers);
    return null;
  } catch {
    return Response.json({ ok: false, code: "forbidden",
      message: "Partner channels are unavailable for this account." }, {
      status: 403,
      headers: { "cache-control": "private, no-store, max-age=0", pragma: "no-cache",
        "x-content-type-options": "nosniff", vary: "Cookie" },
    });
  }
}
