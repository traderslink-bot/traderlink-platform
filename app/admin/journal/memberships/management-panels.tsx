import type Database from "better-sqlite3";
import { FeatureLimitField } from "./feature-limit-field";
import { GenerationResetField } from "./generation-reset-field";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import { MembershipCheckbox } from "./membership-checkbox";
import Typography from "@mui/material/Typography";
import { JournalAdminPanel } from "../journal-admin-ui";
import { MembershipForm } from "./membership-form";
import { manageMembershipAction, manageStripeSubscriptionAction } from "./membership-actions";
import { readMembershipFeatures } from "@/src/modules/platform/server/membership/platform-membership-features";
import { membershipWhopConfiguration } from "@/src/modules/platform/server/membership/platform-membership-provider-readiness";
import { readMembershipWebhookFailures } from "@/src/modules/platform/server/membership/platform-membership-webhook-health";
import { membershipOwnerGrantRecurrence } from "@/src/modules/platform/contracts/platform-membership-owner-grant";
import { MembershipMemberPicker } from "./member-picker";
import { PrivateWatchlistAllowanceSettings } from "./private-watchlist-allowance-settings";
import { WatchlistPlanSettings } from "./watchlist-plan-settings";
import { readMembershipFeatureCopy, defaultMembershipFeatureCopy } from "@/src/modules/platform/server/membership/membership-feature-copy";

type Option = { id: string; label: string };
function Select({ name, label, options, defaultValue = "" }: { name: string; label: string; options: readonly (string | Option)[]; defaultValue?: string }) {
  return <TextField select required name={name} label={label} defaultValue={defaultValue}>
    {options.map((option) => typeof option === "string"
      ? <MenuItem key={option} value={option}>{option.replaceAll("_", " ")}</MenuItem>
      : <MenuItem key={option.id} value={option.id}>{option.label}</MenuItem>)}
  </TextField>;
}
function Field({ name, label, required = false, type = "text", hint }: {
  name: string; label: string; required?: boolean; type?: string; hint?: string;
}) { return <TextField name={name} label={label} required={required} type={type} helperText={hint} />; }
function Command({ operation }: { operation: string }) { return <input type="hidden" name="operation" value={operation} />; }
const dates = <><Field name="startsAtUtc" label="Starts at" hint="Optional UTC date and time, for example 2026-10-01T12:00:00.000Z" /><Field name="endsAtUtc" label="Ends at" hint="Leave empty for no end date." /></>;

export function MembershipManagementPanels({ database, section }: { database: Database.Database; section: string }) {
  const policies = new Map((database.prepare("SELECT feature_key,enforcement_mode FROM platform_membership_feature_policies").all() as { feature_key: string; enforcement_mode: string }[]).map((policy) => [policy.feature_key, policy.enforcement_mode]));
  const whopConfiguration = membershipWhopConfiguration();
  const versions = database.prepare(`SELECT v.plan_version_id id,p.name||' · version '||v.version_number||' · '||v.lifecycle_state label
    FROM platform_membership_plan_versions v JOIN platform_membership_plans p ON p.plan_id=v.plan_id ORDER BY p.name,v.version_number DESC`).all() as Option[];
  const offers = database.prepare(`SELECT o.offer_id id,p.name||' · '||o.name||' · '||o.status label FROM platform_membership_offers o
    JOIN platform_membership_plan_versions v ON v.plan_version_id=o.plan_version_id JOIN platform_membership_plans p ON p.plan_id=v.plan_id ORDER BY p.name,o.name`).all() as Option[];
  const providers = database.prepare("SELECT provider_key id,label FROM platform_membership_provider_definitions ORDER BY label").all() as Option[];
  const featureCopy = section === "Features" ? readMembershipFeatureCopy(database) : new Map();
  if (section === "Features") return <JournalAdminPanel title="Features">
    <PrivateWatchlistAllowanceSettings database={database} />
    <WatchlistPlanSettings database={database} />
    <Typography sx={{ mb: 2 }}>Descriptions appear on public and invitation plan cards. Editing text does not change access, prices or allowances.</Typography>
    <Stack spacing={2} sx={{ mb: 3 }}>{readMembershipFeatures(database).map(feature => {
      const copy = featureCopy.get(feature.key) ?? defaultMembershipFeatureCopy(feature.key, feature.label);
      return <details key={feature.key}>
        <summary>{feature.label} descriptions</summary>
        <MembershipForm key={`${feature.key}:${copy.brief}:${copy.details}`} action={manageMembershipAction} label="Save descriptions">
          <Command operation="feature_copy" /><input type="hidden" name="featureKey" value={feature.key} />
          <TextField name="brief" label="Brief description" multiline minRows={2} defaultValue={copy.brief} />
          <TextField name="details" label="Expandable details" multiline minRows={4} defaultValue={copy.details} />
        </MembershipForm>
      </details>;
    })}</Stack>
    <Stack spacing={1} sx={{ mb: 3 }}>{readMembershipFeatures(database).map((f) => <Typography key={f.key}>{f.label} · {f.key} · {policies.get(f.key) ?? "off"}</Typography>)}</Stack>
    <MembershipForm action={manageMembershipAction} label="Save feature"><Command operation="feature" />
      <Field name="featureKey" label="Feature key" required hint="Use the same key when connecting the feature in app code." />
      <Field name="label" label="Feature name" required /><Field name="moduleKey" label="Module key" required />
      <Select name="featureKind" label="Feature type" options={[{ id: "boolean", label: "Included access" }, { id: "limit", label: "Numeric limit" }]} />
    </MembershipForm>
    <Stack sx={{ mt: 3 }}><MembershipForm action={manageMembershipAction} label="Save access policy"><Command operation="feature_policy" />
      <Select name="featureKey" label="Feature" options={readMembershipFeatures(database).map((feature) => ({ id: feature.key, label: feature.label }))} />
      <Select name="enforcementMode" label="Membership enforcement" options={[{ id: "off", label: "Off — preserve ordinary access" }, { id: "shadow", label: "Shadow — evaluate without blocking" }, { id: "enforced", label: "Enforced — require plan access" }]} />
      <Typography>Applies where the feature is connected to membership checks in app code. Custom future features need that connection. This does not grant access to another member&apos;s private data.</Typography>
    </MembershipForm><Stack sx={{ mt: 3 }}><MembershipForm action={manageMembershipAction} label="Check member access"><Command operation="check_feature_access" />
      <MembershipMemberPicker />
      <Select name="featureKey" label="Feature" options={readMembershipFeatures(database).map((feature) => ({ id: feature.key, label: feature.label }))} />
      <Field name="requestedTotal" label="Total usage after the change" type="number" hint="For numeric limits. Leave blank when checking an included-access feature." />
    </MembershipForm></Stack></Stack>
  </JournalAdminPanel>;
  if (section === "Prices & checkout") return <Stack spacing={3}>
    <JournalAdminPanel title="Payment providers"><MembershipForm action={manageMembershipAction} label="Save provider"><Command operation="provider" />
      <Field name="providerKey" label="Provider key" required hint="For example stripe, whop, free, or your own provider." />
      <Field name="label" label="Provider name" required /><Select name="integrationMode" label="Integration" options={["native", "external_checkout", "manual", "free"]} />
      <Select name="configurationState" label="Connection status" options={["unconfigured", "test", "ready", "paused"]} />
    </MembershipForm></JournalAdminPanel>
    <JournalAdminPanel title="New price"><MembershipForm action={manageMembershipAction} label="Create offer"><Command operation="offer" />
      <Select name="planVersionId" label="Plan version" options={versions} /><Field name="name" label="Offer name" required />
      <Select name="provider" label="Payment provider" options={providers} /><Select name="channel" label="Availability" options={["website", "discord", "both", "private"]} />
      <Select name="billingKind" label="Payment type" options={["free", "one_time", "recurring", "lifetime"]} />
      <Field name="accessDurationDays" label="Access duration in days" type="number" hint="Optional for free or one-time offers. Blank means no expiry. Recurring access follows its paid period." />
      <Field name="currency" label="Currency" hint="Three-letter code, for example CAD. Leave blank for free offers." />
      <Field name="initialAmount" label="Initial price" hint="Major currency units, for example 10.00." />
      <Field name="renewalAmount" label="Renewal price" hint="Required for recurring offers." />
      <TextField select name="billingInterval" label="Billing interval" defaultValue="month">{["day", "week", "month", "year"].map((unit) => <MenuItem key={unit} value={unit}>{unit}</MenuItem>)}</TextField>
      <Field name="billingIntervalCount" label="Every" type="number" hint="For example 1 month, 2 weeks or 3 days." />
      <Field name="externalProductRef" label="Provider product ID" /><Field name="externalPriceRef" label="Provider price ID" />
      <Field name="externalCheckoutUrl" label="External checkout URL" type="url" />
    </MembershipForm></JournalAdminPanel>
    <JournalAdminPanel title="Offer availability"><MembershipForm action={manageMembershipAction} label="Update offer"><Command operation="offer_status" />
      <Select name="offerId" label="Offer" options={offers} /><Select name="status" label="Status" options={["active", "paused", "retired"]} />
    </MembershipForm></JournalAdminPanel>
  </Stack>;
  if (section === "Trials") {
    const trials = database.prepare(`SELECT t.trial_campaign_id id,t.name||' · '||t.status label,x.external_checkout_url checkout
      FROM platform_membership_trial_campaigns t LEFT JOIN platform_membership_trial_checkouts x ON x.trial_campaign_id=t.trial_campaign_id ORDER BY t.name`).all() as (Option & { checkout: string | null })[];
    return <Stack spacing={3}><JournalAdminPanel title="Whole-app trial plan"><MembershipForm action={manageMembershipAction} label="Create whole-app draft"><Command operation="whole_app_snapshot" />
      <Field name="planKey" label="Plan key" required hint="Start with a lowercase letter; use lowercase letters, numbers and hyphens. For example whole-app-trial." /><Field name="name" label="Plan name" required />
      <Field name="publicDescription" label="Plan description" />
      <Typography>Includes every currently selectable feature with unlimited numeric allowances. You can customize the draft before publishing. Future features are not silently added to existing published versions.</Typography>
    </MembershipForm></JournalAdminPanel><JournalAdminPanel title="New trial"><MembershipForm action={manageMembershipAction} label="Create trial"><Command operation="trial" />
      <Select name="offerId" label="Offer" options={offers} /><Field name="name" label="Trial name" required />
      <Field name="durationDays" label="Duration in days" type="number" required /><Field name="entryAmount" label="Trial price" hint="Leave blank or enter 0 for free." />
      <MembershipCheckbox name="paymentMethodRequired" label="Require a payment method" />
      <Field name="externalCheckoutUrl" label="External trial checkout URL" type="url" hint="For Whop/other external checkout, use a link configured with this trial's exact price, duration and renewal terms. Stripe creates its trial checkout automatically." />
      <Select name="eligibilityMode" label="Repeat eligibility" options={["once_per_campaign", "once_ever", "unlimited", "owner_only"]} />
      {dates}<Field name="capacity" label="Maximum enrollments" type="number" hint="Leave blank for unlimited." />
    </MembershipForm></JournalAdminPanel><JournalAdminPanel title="Trial availability"><MembershipForm action={manageMembershipAction} label="Update trial"><Command operation="trial_status" />
      <Select name="trialCampaignId" label="Trial" options={trials} /><Select name="status" label="Status" options={["active", "paused", "retired"]} />
    </MembershipForm></JournalAdminPanel><JournalAdminPanel title="External trial checkout">
      <Stack spacing={1} sx={{ mb: 3 }}>{trials.map((trial) => <Typography key={trial.id}>{trial.label} · {trial.checkout ?? "No external trial checkout"}</Typography>)}</Stack>
      <MembershipForm action={manageMembershipAction} label="Save trial checkout"><Command operation="trial_checkout" />
        <Select name="trialCampaignId" label="Trial" options={trials} />
        <Field name="externalCheckoutUrl" label="External trial checkout URL" type="url" hint="Match the offer's provider product/plan and the displayed trial terms. Leave blank to remove it. Paid/card-required external trials are not offered publicly until this is set; owner grants remain available." />
      </MembershipForm>
    </JournalAdminPanel></Stack>;
  }
  if (section === "Grant access") return <JournalAdminPanel title="Grant access"><MembershipForm action={manageMembershipAction} label="Grant access"><Command operation="grant" />
    <MembershipMemberPicker /><Select name="planVersionId" label="Plan version" options={versions.filter((v) => v.label.endsWith("published"))} />
    {dates}<Field name="reason" label="Reason" />
    <TextField select name="grantInterval" label="Owner grant renewal" defaultValue=""><MenuItem value="">No recurring schedule</MenuItem>{["day", "week", "month", "year"].map((unit) => <MenuItem key={unit} value={unit}>{unit}</MenuItem>)}</TextField>
    <Field name="grantIntervalCount" label="Renew every" type="number" hint="Recurring owner grants stay active until the chosen end date or revocation. This does not charge the member." />
  </MembershipForm></JournalAdminPanel>;
  if (section === "Discord access") {
    const rules = database.prepare("SELECT discord_offer_rule_id id,discord_guild_id||' · '||access_mode||' · '||status label FROM platform_membership_discord_offer_rules").all() as Option[];
    const editableRules = database.prepare("SELECT * FROM platform_membership_discord_offer_rules ORDER BY created_at_utc").all() as {
      discord_offer_rule_id: string; offer_id: string; discord_guild_id: string; discord_role_ids_json: string;
      access_mode: string; funding_mode: string; membership_max_age_seconds: number;
      starts_at_utc: string | null; ends_at_utc: string | null; updated_at_utc: string;
    }[];
    return <Stack spacing={3}><JournalAdminPanel title="Discord access"><MembershipForm action={manageMembershipAction} label="Save Discord rule"><Command operation="discord_rule" />
      <Select name="offerId" label="Offer" options={offers} /><Field name="guildId" label="Discord server ID" required />
      <Field name="roleIds" label="Discord role IDs" hint="Separate IDs with commas. Leave blank for all verified server members." />
      <Select name="accessMode" label="Access" options={[{ id: "automatic_grant", label: "Grant this plan" }, { id: "eligible_to_purchase", label: "Allow this offer's price" }]} />
      <Select name="fundingMode" label="Payment arrangement" options={["sponsored", "server_license", "member_paid"]} />
      <Field name="freshnessSeconds" label="Discord verification validity in seconds" required type="number" />{dates}
    </MembershipForm></JournalAdminPanel><JournalAdminPanel title="Existing Discord rules"><MembershipForm action={manageMembershipAction} label="Update Discord rule"><Command operation="discord_status" />
      <Select name="ruleId" label="Rule" options={rules} /><Select name="status" label="Status" options={["active", "paused", "retired"]} />
    </MembershipForm></JournalAdminPanel>{editableRules.map((rule) => <JournalAdminPanel key={`${rule.discord_offer_rule_id}:${rule.updated_at_utc}`} title={`Discord server ${rule.discord_guild_id}`}>
      <MembershipForm action={manageMembershipAction} label="Save Discord rule changes"><Command operation="edit_discord_rule" />
        <input type="hidden" name="ruleId" value={rule.discord_offer_rule_id} />
        <Select name="offerId" label="Offer" options={offers} defaultValue={rule.offer_id} />
        <TextField name="guildId" label="Discord server ID" defaultValue={rule.discord_guild_id} required />
        <TextField name="roleIds" label="Discord role IDs" defaultValue={(JSON.parse(rule.discord_role_ids_json) as string[]).join(", ")} helperText="Separate IDs with commas. Leave blank for all verified server members." />
        <Select name="accessMode" label="Access" options={[{ id: "automatic_grant", label: "Grant this plan" }, { id: "eligible_to_purchase", label: "Allow this offer's price" }]} defaultValue={rule.access_mode} />
        <Select name="fundingMode" label="Payment arrangement" options={["sponsored", "server_license", "member_paid"]} defaultValue={rule.funding_mode} />
        <TextField name="freshnessSeconds" label="Discord verification validity in seconds" type="number" required defaultValue={rule.membership_max_age_seconds} />
        <TextField name="startsAtUtc" label="Starts at" defaultValue={rule.starts_at_utc ?? ""} helperText="Optional UTC date and time." />
        <TextField name="endsAtUtc" label="Ends at" defaultValue={rule.ends_at_utc ?? ""} helperText="Leave blank for no end date." />
      </MembershipForm>
    </JournalAdminPanel>)}</Stack>;
  }
  if (section === "Subscriptions" || section === "Billing health") {
    const pending = database.prepare(`SELECT c.claim_id id,u.display_name||' · '||o.name||' · '||o.provider||' · '||c.state label FROM platform_membership_claims c
      JOIN platform_users u ON u.user_id=c.user_id JOIN platform_membership_offers o ON o.offer_id=c.offer_id
      WHERE c.state IN ('reserved','released') AND o.provider<>'stripe' ORDER BY c.created_at_utc DESC`).all() as Option[];
    const subscriptions = database.prepare(`SELECT s.provider_subscription_id id,u.display_name,s.provider,s.lifecycle_state,s.current_period_end_utc
      FROM platform_membership_provider_subscriptions s JOIN platform_users u ON u.user_id=s.user_id ORDER BY s.updated_at_utc DESC`).all() as { id: string; display_name: string; provider: string; lifecycle_state: string; current_period_end_utc: string | null }[];
    const stripeClaims = database.prepare(`SELECT c.claim_id id,u.display_name||' · '||o.name||' · '||c.state||' · '||
      CASE WHEN (SELECT a.action FROM platform_membership_audit_events a WHERE a.target_type='membership' AND a.target_id=c.claim_id
        AND a.action IN ('approve_stripe_claim_recovery','revoke_stripe_claim_recovery') ORDER BY a.rowid DESC LIMIT 1)='approve_stripe_claim_recovery'
        THEN 'recovery approved' ELSE 'recovery not approved' END label
      FROM platform_membership_claims c JOIN platform_users u ON u.user_id=c.user_id JOIN platform_membership_offers o ON o.offer_id=c.offer_id
      WHERE c.state IN ('reserved','released') AND o.provider='stripe' AND c.external_session_ref IS NOT NULL ORDER BY c.created_at_utc DESC`).all() as Option[];
    const failures = readMembershipWebhookFailures(database);
    return <JournalAdminPanel title={section}><Stack spacing={1}>
      {section === "Billing health" ? <><Typography>Stripe checkout: {process.env.STRIPE_SECRET_KEY ? "configured" : "not connected"}</Typography><Typography>Stripe webhook: {process.env.STRIPE_MEMBERSHIP_WEBHOOK_SECRET ? "configured" : "not connected"}</Typography></> : null}
      {section === "Billing health" ? <><Typography>Whop webhook: {whopConfiguration.webhook ? "configured" : "not configured"}</Typography><Typography>Whop renewal API: {whopConfiguration.renewalApi ? "configured" : "not configured"}</Typography><Typography>Whop identity mapping: {whopConfiguration.identity ? "configured" : "not configured"}</Typography><Typography>Configuration does not confirm a successful live payment.</Typography></> : null}
      {!subscriptions.length ? <Typography>No subscriptions recorded.</Typography> : subscriptions.map((s) => <Typography key={s.id}>{s.display_name} · {s.provider} · {s.lifecycle_state} · {s.current_period_end_utc ?? "No end date"}</Typography>)}
      {subscriptions.some((s) => s.provider === "stripe") ? <MembershipForm action={manageStripeSubscriptionAction} label="Update Stripe renewal">
        <Select name="subscriptionId" label="Subscription" options={subscriptions.filter((s) => s.provider === "stripe").map((s) => ({ id: s.id, label: `${s.display_name} · ${s.lifecycle_state}` }))} />
        <Select name="cancellation" label="Renewal" options={[{ id: "cancel", label: "Cancel at the end of the paid period" }, { id: "renew", label: "Continue renewing" }]} />
      </MembershipForm> : null}
      {failures.map((f, i) => <Typography key={i}>{f.provider} · {f.event_type} · {f.processed_at_utc} · {f.attempts} failed attempts awaiting confirmation</Typography>)}
      {stripeClaims.length ? <MembershipForm action={manageMembershipAction} label="Save Stripe checkout recovery">
        <Typography>Approve an invitation exception for this checkout after reviewing it in Stripe. Access still requires a verified Stripe payment event. This does not charge again, create a lifetime grant, reopen the invitation or consume another slot. Stripe must retry the failed event, or you can resend it from Stripe.</Typography>
        <Select name="claimId" label="Stripe checkout" options={stripeClaims} />
        <Select name="operation" label="Recovery" options={[{ id: "approve_stripe_claim_recovery", label: "Approve Stripe checkout recovery" }, { id: "revoke_stripe_claim_recovery", label: "Withdraw recovery approval" }]} />
        <Field name="reason" label="Recovery note" required />
      </MembershipForm> : null}
      <MembershipForm action={manageMembershipAction} label="Confirm payment and grant access"><Command operation="confirm_external_payment" />
        <Typography>Confirm only a payment you verified with the provider. This creates an owner grant even if the reservation or invitation expired, was revoked or reached capacity. It does not consume an invitation slot or change its limits.</Typography>
        <Select name="claimId" label="External checkout" options={pending} /><Field name="endsAtUtc" label="Access ends at" hint="Leave blank only when you intend lifetime access." />
        <Field name="reason" label="Payment confirmation note" required hint="Confirm payment in the provider before granting access." />
      </MembershipForm>
    </Stack></JournalAdminPanel>;
  }
  if (section === "Members") {
    const memberRows = database.prepare(`SELECT e.entitlement_id id,u.display_name||' · '||p.name||' · version '||v.version_number||' · '||e.status||' · '||COALESCE(e.ends_at_utc,'No end date') label,r.interval_unit,r.interval_count,
      target_plan.name pending_plan_name,target_version.version_number pending_version,c.renewal_after_utc
      FROM platform_membership_entitlements e JOIN platform_users u ON u.user_id=e.user_id
      JOIN platform_membership_plan_versions v ON v.plan_version_id=e.plan_version_id JOIN platform_membership_plans p ON p.plan_id=v.plan_id
      LEFT JOIN platform_membership_recurring_grants r ON r.entitlement_id=e.entitlement_id
      LEFT JOIN platform_membership_version_changes c ON c.entitlement_id=e.entitlement_id AND c.applied_at_utc IS NULL
      LEFT JOIN platform_membership_plan_versions target_version ON target_version.plan_version_id=c.target_plan_version_id
      LEFT JOIN platform_membership_plans target_plan ON target_plan.plan_id=target_version.plan_id
      ORDER BY u.display_name,e.created_at_utc,e.entitlement_id`).all() as (Option & {
        interval_unit: string | null; interval_count: number | null;
        pending_plan_name: string | null; pending_version: number | null; renewal_after_utc: string | null;
      })[];
    const members = memberRows.map((member) => {
      const recurrence = membershipOwnerGrantRecurrence(member.interval_unit, member.interval_count);
      const pending = member.pending_plan_name !== null
        ? ` · Pending: ${member.pending_plan_name} · version ${member.pending_version} on confirmed renewal after ${member.renewal_after_utc}` : "";
      return { id: member.id, label: `${member.label}${recurrence ? ` · ${recurrence}` : ""}${pending}` };
    });
    return <JournalAdminPanel title="Member access"><Stack spacing={1} sx={{ mb: 3 }}>{members.map((m) => <Typography key={m.id}>{m.label}</Typography>)}</Stack>
      <MembershipForm action={manageMembershipAction} label="Revoke selected access"><Command operation="revoke_grant" /><Select name="entitlementId" label="Access grant" options={members} /></MembershipForm>
      <Stack sx={{ mt: 3 }} spacing={3}><MembershipForm action={manageMembershipAction} label="Change member plan"><Command operation="migrate_member" />
        <Select name="entitlementId" label="Access grant" options={members} /><Select name="planVersionId" label="Target plan version" options={versions.filter((v) => v.label.endsWith("published"))} />
        <Select name="when" label="Apply change" options={[{ id: "now", label: "Immediately" }, { id: "renewal", label: "On the next confirmed subscription renewal" }]} />
        <Typography>Changes plan access only. It does not change the processor price or cancel any other access grant.</Typography>
      </MembershipForm><MembershipForm action={manageMembershipAction} label="Cancel pending plan change"><Command operation="cancel_member_migration" /><Select name="entitlementId" label="Access grant" options={members} /></MembershipForm></Stack>
    </JournalAdminPanel>;
  }
  if (section === "Private links") {
    const links = database.prepare("SELECT share_link_id id,name||' · '||status||' · claims: '||claim_count label FROM platform_membership_share_links ORDER BY created_at_utc DESC").all() as Option[];
    const pages = database.prepare("SELECT share_link_id id,name,expires_at_utc,maximum_claims FROM platform_membership_share_links WHERE status='active' ORDER BY created_at_utc DESC").all() as { id: string; name: string; expires_at_utc: string | null; maximum_claims: number | null }[];
    return <Stack spacing={3}>{pages.map((page) => {
      const selected = new Set((database.prepare("SELECT offer_id FROM platform_membership_share_link_offers WHERE share_link_id=?").all(page.id) as { offer_id: string }[]).map((row) => row.offer_id));
      return <JournalAdminPanel key={page.id} title={page.name}><MembershipForm action={manageMembershipAction} label="Save private page"><Command operation="edit_link" /><input type="hidden" name="shareLinkId" value={page.id} />
        <TextField name="name" label="Page title" defaultValue={page.name} required />
        <Typography>Select the offers for this page. Saving keeps its existing private URL. Plans marked private or unlisted do not appear on the main Plans page.</Typography>
        {offers.map((offer) => <MembershipCheckbox key={offer.id} name="offerIds" value={offer.id} defaultChecked={selected.has(offer.id)} label={offer.label} />)}
        <TextField name="expiresAtUtc" label="Expiry" defaultValue={page.expires_at_utc ?? ""} helperText="UTC date and time; blank means no expiry." />
        <TextField name="maximumClaims" label="Maximum claims" type="number" defaultValue={page.maximum_claims ?? ""} helperText="Blank means unlimited." />
      </MembershipForm></JournalAdminPanel>;
    })}<JournalAdminPanel title="Private link access"><MembershipForm action={manageMembershipAction} label="Revoke link"><Command operation="revoke_link" /><Select name="shareLinkId" label="Private link" options={links} /></MembershipForm></JournalAdminPanel></Stack>;
  }
  if (section === "Plans") {
    const plans = database.prepare("SELECT plan_id id,name,visibility,internal_note FROM platform_membership_plans ORDER BY name").all() as { id: string; name: string; visibility: string; internal_note: string }[];
    const drafts = database.prepare(`SELECT v.plan_version_id id,p.name,v.public_description FROM platform_membership_plan_versions v
      JOIN platform_membership_plans p ON p.plan_id=v.plan_id WHERE v.lifecycle_state='draft' ORDER BY p.name,v.version_number`).all() as { id: string; name: string; public_description: string }[];
    const features = readMembershipFeatures(database);
    return <Stack spacing={3}>
      {plans.map((plan) => <JournalAdminPanel key={plan.id} title={plan.name}><MembershipForm action={manageMembershipAction} label="Save plan details"><Command operation="plan_details" /><input type="hidden" name="planId" value={plan.id} />
        <TextField name="name" label="Plan name" defaultValue={plan.name} required />
        <TextField name="visibility" label="Visibility" select defaultValue={plan.visibility}>{["public", "private", "unlisted"].map((value) => <MenuItem key={value} value={value}>{value}</MenuItem>)}</TextField>
        <TextField name="internalNote" label="Internal note" defaultValue={plan.internal_note} multiline />
      </MembershipForm></JournalAdminPanel>)}
      <JournalAdminPanel title="Plan versions"><MembershipForm action={manageMembershipAction} label="Create new draft version"><Command operation="new_version" /><Select name="planVersionId" label="Copy version" options={versions} /></MembershipForm></JournalAdminPanel>
      {drafts.map((draft) => {
        const selected = new Map((database.prepare("SELECT feature_key,limit_value,reset_days FROM platform_membership_plan_features WHERE plan_version_id=?").all(draft.id) as { feature_key: string; limit_value: number | null; reset_days: number | null }[]).map((f) => [f.feature_key, f]));
        return <JournalAdminPanel key={draft.id} title={draft.name}><MembershipForm action={manageMembershipAction} label="Save draft"><Command operation="edit_draft" /><input type="hidden" name="planVersionId" value={draft.id} />
          <TextField name="publicDescription" label="Public description" multiline defaultValue={draft.public_description} />
          {features.map((feature) => <Stack key={feature.key} direction="row" spacing={2}>
            <MembershipCheckbox name="features" value={feature.key} defaultChecked={selected.has(feature.key)} label={feature.label} />
            {feature.kind === "limit" ? <FeatureLimitField featureKey={feature.key} value={selected.get(feature.key)?.limit_value} /> : null}
            <GenerationResetField featureKey={feature.key} value={selected.get(feature.key)?.reset_days} />
          </Stack>)}
        </MembershipForm><Stack sx={{ mt: 2 }}><MembershipForm action={manageMembershipAction} label="Publish version"><Command operation="publish" /><input type="hidden" name="planVersionId" value={draft.id} /></MembershipForm></Stack></JournalAdminPanel>;
      })}
    </Stack>;
  }
  if (section === "Audit history") {
    const events = database.prepare("SELECT audit_event_id id,action,occurred_at_utc FROM platform_membership_audit_events ORDER BY occurred_at_utc DESC LIMIT 100").all() as { id: string; action: string; occurred_at_utc: string }[];
    return <JournalAdminPanel title="Recent audit history"><Stack spacing={1}>{events.map((e) => <Typography key={e.id}>{e.occurred_at_utc} · {e.action}</Typography>)}</Stack></JournalAdminPanel>;
  }
  return null;
}
