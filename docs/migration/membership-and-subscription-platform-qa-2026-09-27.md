# Membership and subscription QA - 2026-09-27

Status: QA review complete for the current partial implementation; not ready for release.

Follow-up: the owner requested corrections after this review. See the
[QA correction record](membership-and-subscription-qa-fixes-progress.md) for implemented fixes,
new verification and remaining acceptance gaps. The findings below preserve the
original pre-correction snapshot, not the current implementation status.

Controlling [plan](membership-and-subscription-platform-plan.md) and
[progress](membership-and-subscription-platform-progress.md).

## Verified scope

Canonical repository on `main`, shared dirty working tree. Reviewed the current
membership source without changing unrelated work. Corrected one QA-script
assertion and extended its boundary coverage; no product fixes in this pass.

`npx.cmd tsx src/scripts/verify-platform-membership-foundation.ts` passed using
the existing local Node user-info fallback. It creates a disposable database,
applies only the membership migration with minimal user fixtures, and removes
the database in `finally`. It is not a full migration-chain rehearsal.

Confirmed 14 tables, custom feature registration, two additive grants, highest
account limit 9, cross-user isolation, future-start exclusion, exact expiry,
retained lifetime grant, revoked grant exclusion, immutable published feature
replacement guard, public website offer filtering, hashed private secrets,
wrong-secret rejection, expired/revoked/exhausted-link filtering and zero
foreign-key violations. Link claim counts and revocation were set directly in
the fixture; this does not prove a working claim or revoke application command.

Focused ESLint passed for the verifier, membership contracts, migration,
repositories, admin routes/actions and plans routes. Source review confirms the
Memberships navigation item in the existing Journal Administration shell and
server authorization wrappers on both mutation actions.

No browser QA, full typecheck, build, full migration chain, processor calls or
real database mutations were performed. No local listener was found on ports
3000-3020. Browser/HTTP behavior, responsive rendering and runtime authorization
remain unverified. No commit, push or deployment occurred.

## Findings

1. **High - Owner customization is blocked in the plan builder.**
   `app/admin/journal/memberships/plans/new/page.tsx:45` renders only
   `PLATFORM_MEMBERSHIP_FEATURES`; `membership-actions.ts:34` filters submitted
   features through the same constant. Registered custom features cannot be
   selected and manually submitted custom keys are silently omitted. The builder
   also claims features can be registered in Memberships, but no such UI exists.

2. **High - Most owner controls are unfinished.**
   `app/admin/journal/memberships/page.tsx:48` renders section labels as Chips
   without navigation or actions. Only draft creation and private-link creation
   are connected. Editing/versioning/publishing, offers/prices/providers, trials,
   Discord programs, per-member grants and subscription management cannot yet
   be completed from the owner's dashboard.

3. **High - No membership payment-to-access integration.**
   The new effective-access resolver has no app enforcement callers; its only
   external caller is the verifier. The new subscription, Discord-rule and
   provider-event tables have no runtime processing commands. External checkout
   links alone do not connect a payment to a stable user or grant app access.
   Existing Whop code is not evidence that the new membership engine is wired.

4. **High - Extra payment providers are restricted by storage.**
   `0132_platform_membership_foundation.ts:157` restricts event receipt providers
   to `stripe` and `whop`, although provider definitions and offers accept custom
   provider keys. This contradicts the owner-controlled provider requirement.

5. **High - Price and period presentation can be incorrect.**
   `platform-membership-repository.ts:145` permits paid offers with null currency,
   amount or recurring period. `app/plans/plan-catalog.tsx:13` labels missing
   amounts/currency Free, divides all currency amounts by 100 and labels a
   30-day period a month. Calendar monthly recurrence cannot be represented
   faithfully by the present days-only field. Different initial and renewal
   charges are accepted but only the renewal amount is displayed. Correct these
   contracts before real checkout is exposed.

6. **Medium - Private link claim limits are not enforced through checkout.**
   The catalog checks `claim_count`, but no runtime path increments it or binds
   a purchase to a claim. Revocation filtering exists but there is no owner
   revoke action. The current UI exposes Maximum claims ahead of its working
   redemption flow. A valid link displaying offers does not verify purchasing.

7. **Medium - Active dashboard counts ignore time/capacity.**
   `platform-membership-admin-service.ts:60` counts only `status='active'`.
   Ended or future grants can count as active; expired/exhausted links and
   closed trial enrollment windows can appear available.

8. **Medium - Draft form errors have no usable recovery state.**
   `createMembershipPlanAction` throws validation/duplicate errors without
   returning field feedback. Publication and plan editing paths do not yet exist
   for the resulting drafts.

## Complete requirement inventory

| Owner requirement | Current evidence and remaining work |
| --- | --- |
| Any number of plans, free or paid | No numerical plan cap found; backend draft/publish exists, UI only creates drafts; free enrollment missing |
| Custom features and future features | Backend registry supports arbitrary keys; UI fixed to built-ins; app enforcement missing |
| Owner-selected prices and processors | Draft offer/provider repository exists; owner controls and lifecycle handling missing; event-provider restriction above |
| Stripe website/app checkout | Not implemented in the membership engine |
| Whop for Discord, optionally shown on plans | External offer rendering exists; new entitlement integration missing |
| Coaching in any chosen plan | Feature composition foundation only; runtime coaching integration missing |
| Multiple Discord servers, any selected roles | Rule storage exists; configuration, verification and grant synchronization missing |
| Free/discounted server-specific access | Offer/rule foundation only; eligibility and purchase/grant workflows missing |
| Free or paid trials with custom durations | Backend draft campaigns accept positive integer days and entry amount; enrollment, charging, expiry lifecycle and admin controls missing |
| Whole-app trial | Snapshot creation and enrollment workflow missing |
| Individual timed/lifetime/recurring access | Fixed start/end and lifetime backend grants work; admin commands, renewal scheduling and recurring billing missing |
| Plan changes and existing-member control | Published feature edit guard exists; next-version creation and owner-selected member migration missing |
| User Plans page | `/plans` source exists and catalog filtering passes; no integrated browser verification |
| Unlisted non-indexable page | `/plans/invite/[secret]` source has noindex/nofollow and no-referrer; omitted from public nav/sitemap; HTTP output unverified |
| Existing admin dashboard | Memberships link, route and existing authorization wrappers confirmed in source; most management controls unfinished |
| Member Plan & billing | New membership workflow missing |
| Full owner control | Not satisfied until the findings and workflow gaps are resolved |

## Help alignment

Reviewed `src/modules/help/paid-plan-guides.ts`, `public-help-content.ts` and
relevant app-guide references. Existing help describes Whop checkout and Whop
billing management. Update those guides alongside working Stripe/multi-plan,
trials, grants and Discord flows before activation. Do not advertise unfinished
controls in Help. No Help content changed during this QA-only pass.

## Resume boundary

Fix the customization and provider restrictions, then complete the approved
owner workflows and payment/access integration. Recheck the exact corrected
behaviors, rehearse the complete migration chain in disposable storage, and
perform browser QA against a correctly migrated local QA runtime. Preserve the
unrelated shared work and the existing real database. Do not call this product
complete based on the foundation verifier alone.
