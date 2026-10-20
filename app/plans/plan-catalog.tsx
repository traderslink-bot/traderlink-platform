import styles from "./plan-catalog.module.css";
import { Fragment } from "react";
import { defaultMembershipFeatureCopy } from "@/src/modules/platform/contracts/membership-feature-copy";
import { formatMembershipNewsDelay, isMembershipNewsDelay } from "@/src/modules/platform/contracts/membership-news-delays";
import { formatWatchlistBudget } from "@/src/modules/platform/contracts/membership-watchlist-budget";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";

import type { PlatformMembershipCatalogPlan } from
  "@/src/modules/platform/server/membership/platform-membership-catalog-repository";
import { membershipOfferPrice, formatMembershipMoney } from "@/src/modules/platform/contracts/platform-membership-pricing";
import { MembershipForm } from "../admin/journal/memberships/membership-form";
import { selectEmbeddedMembershipAction, selectMembershipAction } from "./checkout-actions";
import { PlanAddonSelection, type PlanAddonChoice } from "./plan-addon-selection";
import { PlanAddonCard } from "./plan-addon-card";
import { PlanPrice } from "./plan-price";
import { membershipAllowanceInBrief } from "@/src/modules/platform/contracts/membership-product-features";
import { PricingSiteChrome } from "./pricing-site-chrome";

export function PlanCatalog({
  plans,
  privateOffer = false,
  secret,
  title = "Your Trading. Your Goals. Your Plan.",
  upgradeFeature,
  embedded = false,
}: {
  plans: readonly PlatformMembershipCatalogPlan[];
  privateOffer?: boolean;
  secret?: string;
  title?: string;
  upgradeFeature?: string;
  embedded?: boolean;
}) {
  const basePlans = plans.filter(plan => plan.packageType !== "addon");
  const addonPlans = plans.filter(plan => plan.packageType === "addon");
  if (embedded && basePlans.length === 0) return null;
  const Chrome = embedded ? Fragment : PricingSiteChrome;
  const PlanHeading = embedded ? "h3" : "h2";
  const addons: PlanAddonChoice[] = addonPlans.flatMap<PlanAddonChoice>(plan => plan.displayOnly
    ? (plan.displayPrices ?? []).filter(price => price.terms).slice(0, 1).map(price => ({ id: plan.planId, name: plan.name, requiresDiscord: plan.requiresDiscord, brief: plan.description, features: plan.features, price: price.terms!, displayOnly: true }))
    : plan.offers.filter(offer => offer.billingKind === "free" || (offer.provider === "stripe" && offer.billingInterval === "month" && offer.billingIntervalCount === 1)).slice(0, 1).map(offer => ({ id: offer.offerId, name: plan.name, requiresDiscord: plan.requiresDiscord, brief: plan.description, features: plan.features, price: offer, displayOnly: false })));
  return (
    <Chrome>
    <Box component={embedded ? "section" : "main"} aria-label={embedded ? "Plans" : undefined} className={styles.page}>
      <Container maxWidth="lg">
        <Stack spacing={0}>
          <Stack spacing={1} className={styles.heading} sx={{ alignItems: "center", textAlign: "center" }}>
            {privateOffer ? <Chip color="primary" label="Private offer" sx={{ alignSelf: "flex-start" }} /> : null}
            <Typography component={embedded ? "h2" : "h1"} variant="h1" sx={{ fontSize: "3.9375rem", lineHeight: 1.15 }}>{title}</Typography>
            {!privateOffer ? <Typography component="p" sx={{ color: "#fff", maxWidth: 760, fontSize: "1.125rem", lineHeight: 1.6 }}>Take control of your trading with powerful journaling, performance analytics, and insights. Choose the plan that fits your trading goals and start improving with every trade.</Typography> : null}
            {privateOffer ? <Stack direction="row" spacing={2} sx={{ pt: 1 }}>
              <Button href={`/login?returnTo=${encodeURIComponent(secret ? `/plans/invite/${secret}` : "/plans")}`} variant="outlined">Sign in</Button>
              <Button href="/account/membership" variant="text">Plan &amp; billing</Button>
            </Stack> : null}
          </Stack>
          {upgradeFeature && addonPlans.length ? (
            <Typography component="p" sx={{ color: "#fff", mb: 3, maxWidth: 760 }}>
              This feature is available in an add-on. Select it under a compatible monthly or free plan below.
            </Typography>
          ) : null}
          {basePlans.length === 0 ? (
            <Paper variant="outlined" sx={{ borderRadius: 3, p: { xs: 3, md: 5 } }}>
              <Typography component="h2" variant="h2">{addonPlans.length ? "No compatible base plans are available" : "No plans are available"}</Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                {addonPlans.length ? "Add-ons need a compatible monthly or free plan. Contact TradersLink for available options." : "There are no active offers on this page right now."}
              </Typography>
            </Paper>
          ) : (
            <Box className={styles.grid}>
              {basePlans.map((plan) => (
                <article key={plan.planVersionId} className={styles.frame}>
                  <div className={styles.card}>
                  <div className={styles.cardHeader}>
                  <PlanHeading className={styles.name}>{plan.name}</PlanHeading>
                  <div className={styles.headerPrices}>
                  {plan.displayPrices?.map((price, index) => <div key={index}>
                    {price.terms ? <PlanPrice price={price.terms} /> : <p className={styles.priceUnavailable}>{price.price}</p>}
                    {(plan.displayPrices?.length ?? 0) > 1 ? <div className={styles.priceNote}>{price.name}</div> : null}
                  </div>)}
                  {plan.offers.map(offer => <div key={offer.offerId}>
                    <PlanPrice price={offer} />
                    {plan.offers.length > 1 ? <div>{offer.name}</div> : null}
                  </div>)}
                  </div>
                  </div>
                  {plan.description ? <p className={styles.description}>{plan.description}</p> : null}
                  {plan.requiresDiscord ? <p className={styles.discordRequirement}>This plan requires a connected Discord account for its Discord benefits. Connect now in <a href="/account/login">Login methods</a>, or sign up and connect later. You can still use the app.</p> : null}
                  <ul className={styles.features}>
                    {plan.features.map((feature) => {
                      const fallback = defaultMembershipFeatureCopy(feature.featureKey, feature.label);
                      const brief = feature.brief ?? fallback.brief;
                      const details = feature.details ?? fallback.details;
                      const content = <>
                        <span className={styles.featureTitle}><strong>{feature.label}</strong>
                        {feature.kind === "limit" && !membershipAllowanceInBrief(feature.featureKey) ? <span className={styles.allowance}>
                          {isMembershipNewsDelay(feature.featureKey) ? formatMembershipNewsDelay(feature.limitValue)
                            : feature.featureKey === "private_watchlist.cost_microusd" ? formatWatchlistBudget(feature.limitValue)
                              : feature.limitValue === null ? "Unlimited" : feature.limitValue}
                          {feature.metered && feature.limitValue !== null
                            ? feature.privatePeriod ? feature.privatePeriod.kind === "calendar_month" ? " per calendar month (UTC)"
                              : feature.privatePeriod.kind === "lifetime" ? " · no reset"
                                : ` every ${feature.privatePeriod.days} ${feature.privatePeriod.days === 1 ? "day" : "days"}`
                              : feature.resetDays === undefined ? " · reset period unavailable"
                              : feature.resetDays === null ? " · no reset"
                                : ` every ${feature.resetDays} ${feature.resetDays === 1 ? "day" : "days"}`
                            : null}
                        </span> : null}</span>
                        {brief ? <span className={styles.brief}>{brief}</span> : null}
                      </>;
                      return <li key={feature.featureKey} className={styles.feature}>
                        {details ? <details><summary aria-label={`More details about ${feature.label}`}>{content}</summary><p>{details}</p></details>
                          : <div className={styles.featureContent}>{content}</div>}
                      </li>;
                    })}
                  </ul>
                  <Stack spacing={1.5} className={styles.footer}>
                    {plan.displayOnly ? <>
                      {plan.displayPrices?.[0]?.terms && !privateOffer ? <PlanAddonSelection basePrice={plan.displayPrices[0].terms} addons={addons} preview /> : null}
                      <div className={styles.purchaseNotice}><span>Purchases are not available for this display-only plan.</span></div>
                      <button type="button" className={styles.previewAction} disabled>
                        {plan.displayPrices?.length && plan.displayPrices.every(price => price.terms?.billingKind === "free") ? "Get access" : "Buy now"}
                      </button>
                    </> : null}
                    {plan.offers.map((offer) => (
                      <Box key={offer.offerId} className={styles.offer}>
                        <Typography sx={{ fontSize: "1.15rem", fontWeight: 850 }}>{membershipOfferPrice(offer)}</Typography>
                        <Typography variant="caption">{offer.name}</Typography>
                        {offer.accessDurationDays ? <Typography variant="body2">Includes {offer.accessDurationDays} days of access.</Typography> : null}
                        {!offer.automaticConfirmation && offer.billingKind !== "free" ? <Typography variant="body2">Payment uses {offer.providerLabel}. The owner confirms access after payment.</Typography> : null}
                        <MembershipForm action={embedded ? selectEmbeddedMembershipAction : selectMembershipAction} navigateTop={embedded} label={offer.billingKind === "free" ? "Get access" : "Choose this plan"}>
                          <input type="hidden" name="offerId" value={offer.offerId} />
                          {!privateOffer ? <PlanAddonSelection basePrice={offer} addons={addons} /> : null}
                          {secret ? <input type="hidden" name="secret" value={secret} /> : null}
                        </MembershipForm>
                        {offer.trials.map((trial) => <Box key={trial.id} sx={{ mt: 2 }}>
                          <Typography>{trial.name} · {trial.durationDays} days · {trial.amount === 0 ? "Free" : formatMembershipMoney(trial.amount, offer.currency)}</Typography>
                          <Typography variant="body2">{(trial.endBehavior ?? (offer.billingKind === "recurring" && (trial.amount > 0 || trial.paymentMethodRequired) ? "renew" : "end_access")) === "renew"
                            ? `Renews after the trial: ${membershipOfferPrice({ ...offer, initialAmountMinor: offer.renewalAmountMinor })}`
                            : "Access ends when the trial ends."}</Typography>
                          <MembershipForm action={embedded ? selectEmbeddedMembershipAction : selectMembershipAction} navigateTop={embedded} label="Start trial">
                            <input type="hidden" name="offerId" value={offer.offerId} /><input type="hidden" name="trialCampaignId" value={trial.id} />
                            {secret ? <input type="hidden" name="secret" value={secret} /> : null}
                          </MembershipForm>
                        </Box>)}
                      </Box>
                    ))}
                  </Stack>
                  </div>
                </article>
              ))}
            </Box>
          )}
          {addonPlans.length ? <section className={styles.addonSection} aria-labelledby="plan-addons-title">
            <h2 id="plan-addons-title" className={styles.addonSectionTitle}>Add-ons</h2>
            <p className={styles.addonSectionDescription}>Add one or more packages to your monthly or free plan.</p>
            <div className={styles.addonGrid}>{addonPlans.map(plan => <PlanAddonCard key={plan.planId} plan={plan} secret={secret} />)}</div>
          </section> : null}
        </Stack>
      </Container>
    </Box>
    </Chrome>
  );
}
