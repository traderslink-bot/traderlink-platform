# Partner Channels — current screen specification

Updated November 17, 2026, America/Toronto. Implements the
[current working plan](partner-alert-channels-plan.md), requirements R1–R10.
This supersedes the November 1 neutral-name and mandatory publishing-fee design.
The earlier approval remains historical evidence in the progress record; it does
not approve the revised screens before the owner's next visual review.

## Shared presentation

Use existing dashboard/admin frames and shared Light/Navy tokens. Support mobile,
keyboard navigation, clear focus and readable loading/error/success/disabled states.
Keep internal IDs, authority codes and provider implementation details out of forms.
Use actual Discord server/channel names refreshed by stable ID. Do not offer
neutral display names or automatically suppress legitimate source branding.
Retain the no-links/invites/media/promotion content baseline, distinct from branding.

## Publishing server owner

Route: `/communities/[communitySlug]/partner-channels`. Current verified owner only.
Entry action: **Publish channels**. Invitees and later applicants use the same flow.
If no community is connected, link to existing connection/bot installation and
return to the draft afterward. Neither an invitation nor an existing connection
means the publisher is approved.

| Step | What the owner sees and does |
| --- | --- |
| Connected server | Actual server name, connection/bot status and current ownership verification; reconnect instructions when needed. No manually entered server name. |
| Source channels | Select readable supported channels retrieved from Discord; actual names, author permissions and clear unreadable/unsupported states. |
| Review access | Explain free personal access for the TradersLink owner to every channel in the applicant server, including paid/private channels, not just selected channels; show access pending or admin-confirmed inspection. Bot access is shown separately. Exact access-arrangement UI requires a concrete design. |
| Channel access and pricing | Connect the publisher's Stripe account or set up a new one, then set prices and billing periods for individual channels and/or same-server packages. Show existing Whop offers for previous buyers. Show price/currency/cadence and every included channel. Avoid the vague label “Trader offers.” |
| Publishing rules | Review redistribution consent, text/author rules, held posts and destination behavior. No publishing fee, billing agreement or publishing-payment requirement. |
| Review and submit | Summary of source server/channels, access-for-review status, offers, consent and verification problems; submit or save draft. Review access may remain pending on submission, but must be confirmed before approval. Nothing goes live on submission. |

Preserve inputs across steps and unrelated refreshes. Show unsaved changes and
confirmed persistence. Bound loading and offer retry/recovery; uncertain saves
must not claim failure or success. Distinguish editable drafts from under-review
or changed versions. After activation show mappings, publishing health, held posts,
last deliveries, requested changes and pause/end actions with their consequences.
Keep a live approved version distinct from an amendment draft. Saving or submitting
an amendment never silently stops or changes the currently approved publishing.

## TradersLink owner/admin

Routes: `/admin/journal/partner-channels` and its `[communityId]` detail route.
Use the existing real owner-admin authorization boundary.

Queue: actual source server, application status, selected channel/offer counts,
submission time, review-access status and action needed. No publishing-fee column.

Detail:

1. Server connection/ownership and the admin's personal inspection confirmation.
2. Actual source channels and proposed TradersLink destinations.
3. Each individual/package offer, publisher Stripe account, exact price/cadence and channel coverage, including retained Whop offers for previous buyers.
4. Redistribution consent and content/author rules.
5. Bot permissions, private/read-only destination roles and outstanding failures.
6. Request changes, decline and explicit publisher/mapping/offer approval.
7. Separate setup/activation checks and an explicit admin activation action after
   publisher consent. Approval alone is not Publishing. Zero subscribers is not
   an activation failure.

Do not mark review access confirmed based solely on an applicant's assertion.
Destination creation/selection/naming must be concretely designed before related
writes; admin must see exactly what will be created or connected.

## Trader/subscriber

Route: `/partner-channels`. Any paid Premium member can buy any available offer;
there is no publisher-controlled individual subscriber selection.

- Browse actual publisher server names, actual channel names and packages.
- Show included channels, price, currency and exact recurring cadence on cards
  and detail views, with paid Premium and publisher subscription states separately.
- Non-Premium: explain both requirements and direct to Premium before offering
  channel checkout. Premium alone does not unlock a publisher's paid channels.
- Confirm the linked Discord account belongs to the TradersLink destination
  server; otherwise offer join-and-recheck before attempting channel access.
- Only active approved offers expose new checkout. Paused or ended offers show
  existing-purchase/access information without a new purchase action.
- Premium: verified publisher Stripe checkout or **Check existing purchase** for
  a retained Whop subscription. Show overlapping
  purchases so the trader can avoid paying twice for the same coverage.
- Billing statement: “Payment, refunds, and billing are handled by the community.”
  Show Stripe for new purchases and Whop for retained Whop subscriptions.
  TradersLink verifies access and manages its destination roles.
- After checkout: **Checking access**, then confirmed access or the precise missing
  requirement. No access claim from a redirect or unverified provider response.
- Confirmed access includes **Open channel in Discord** for the authorized
  TradersLink destination; never reveal a private source-channel link.
- Direct/external Whop purchase or renewal without Premium does not grant access.
  Explain the missing Premium requirement and verify the existing purchase after
  Premium is restored, without prompting a duplicate purchase.
- Show manage-billing guidance, period-end cancellation and remaining paid access.
  Local alert-text cleanup after seven days does not delete published Discord
  alerts or remove the subscriber's otherwise valid channel access.

Mobile uses readable single-column cards and clear actions without horizontal
scroll. Details retain price and coverage near the purchase action.

## Local text expiry

Owner/admin delivery and moderation views show stored text only within its seven-day
window. After cleanup, retain useful message IDs/status and show **Alert text
expired**. Do not offer replay/release for an expired held body, claim a pending
send succeeded, or send Discord deletion merely because the local body expired.
A current source edit/delete still follows its own verified synchronization flow.

## State and acceptance checklist

Signed out; wrong owner; no applicants/offers; no readable channels; missing personal
review access; missing bot; unavailable provider; stale application; pending/unknown
save; rejected/changed offers; checking/failed role assignment; Premium missing;
subscription missing/expired; normal publishing pause; security suspension; ended
mapping; revised offer with existing purchases; nonmember join-and-recheck; disconnect and erasure. See the plan's complete acceptance inventory.

Help guides must be updated alongside actual changed behavior, not merely because
this specification was rewritten. Current code is not assumed to implement this
specification; evidence belongs in the progress record.
