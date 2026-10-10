import styles from "./plan-catalog.module.css";
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
import { selectMembershipAction } from "./checkout-actions";

export function PlanCatalog({
  plans,
  privateOffer = false,
  secret,
  title = "Plans",
}: {
  plans: readonly PlatformMembershipCatalogPlan[];
  privateOffer?: boolean;
  secret?: string;
  title?: string;
}) {
  return (
    <Box component="main" className={styles.page}>
      <Container maxWidth="lg">
        <Stack spacing={4}>
          <Stack spacing={1} className={styles.heading} sx={{ maxWidth: 760 }}>
            {privateOffer ? <Chip color="primary" label="Private offer" sx={{ alignSelf: "flex-start" }} /> : null}
            <Typography component="h1" variant="h1">{title}</Typography>
            <Stack direction="row" spacing={2} sx={{ pt: 1 }}>
              <Button href={`/api/auth/discord/login?returnTo=${encodeURIComponent(secret ? `/plans/invite/${secret}` : "/plans")}`} variant="outlined">Sign in</Button>
              <Button href="/account/membership" variant="text">Plan &amp; billing</Button>
            </Stack>
          </Stack>
          {plans.length === 0 ? (
            <Paper variant="outlined" sx={{ borderRadius: 3, p: { xs: 3, md: 5 } }}>
              <Typography component="h2" variant="h2">No plans are available</Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                There are no active offers on this page right now.
              </Typography>
            </Paper>
          ) : (
            <Box className={styles.grid}>
              {plans.map((plan) => (
                <article key={plan.planVersionId} className={styles.frame}>
                  <div className={styles.card}>
                  <h2 className={styles.name}>{plan.name}</h2>
                  {plan.offers.map(offer => <div key={offer.offerId}>
                    <div className={styles.price}>{membershipOfferPrice(offer)}</div>
                    {plan.offers.length > 1 ? <div>{offer.name}</div> : null}
                  </div>)}
                  {plan.description ? <p className={styles.description}>{plan.description}</p> : null}
                  <ul className={styles.features}>
                    {plan.features.map((feature) => {
                      const fallback = defaultMembershipFeatureCopy(feature.featureKey, feature.label);
                      const brief = feature.brief ?? fallback.brief;
                      const details = feature.details ?? fallback.details;
                      return <li key={feature.featureKey} className={styles.feature}>
                        <strong>{feature.label}</strong>
                        {feature.kind === "limit" ? <span className={styles.allowance}>
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
                        </span> : null}
                        {brief ? <p>{brief}</p> : null}
                        {details ? <details><summary aria-label={`More details about ${feature.label}`}>More details</summary><p>{details}</p></details> : null}
                      </li>;
                    })}
                  </ul>
                  <Stack spacing={1.5} className={styles.footer}>
                    {plan.offers.map((offer) => (
                      <Box key={offer.offerId} className={styles.offer}>
                        <Typography sx={{ fontSize: "1.15rem", fontWeight: 850 }}>{membershipOfferPrice(offer)}</Typography>
                        <Typography variant="caption">{offer.name}</Typography>
                        {offer.accessDurationDays ? <Typography variant="body2">Includes {offer.accessDurationDays} days of access.</Typography> : null}
                        {!offer.automaticConfirmation && offer.billingKind !== "free" ? <Typography variant="body2">Payment uses {offer.providerLabel}. The owner confirms access after payment.</Typography> : null}
                        <MembershipForm action={selectMembershipAction} label={offer.billingKind === "free" ? "Get access" : "Choose this plan"}>
                          <input type="hidden" name="offerId" value={offer.offerId} />
                          {secret ? <input type="hidden" name="secret" value={secret} /> : null}
                        </MembershipForm>
                        {offer.trials.map((trial) => <Box key={trial.id} sx={{ mt: 2 }}>
                          <Typography>{trial.name} · {trial.durationDays} days · {trial.amount === 0 ? "Free" : formatMembershipMoney(trial.amount, offer.currency)}</Typography>
                          <Typography variant="body2">{offer.billingKind === "recurring" && (trial.amount > 0 || trial.paymentMethodRequired)
                            ? `Renews after the trial: ${membershipOfferPrice({ ...offer, initialAmountMinor: offer.renewalAmountMinor })}`
                            : "Access ends when the trial ends."}</Typography>
                          <MembershipForm action={selectMembershipAction} label="Start trial">
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
        </Stack>
      </Container>
    </Box>
  );
}
