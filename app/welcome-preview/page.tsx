import { notFound } from "next/navigation";

import { NewsletterOptInOffer } from "../(dashboard)/welcome/newsletter-opt-in-offer";

export const dynamic = "force-dynamic";

/** Staging-only visual review surface; the real route remains the signed-in /welcome flow. */
export default function WelcomePreviewPage() {
  if (process.env.RAILWAY_ENVIRONMENT_NAME !== "staging") notFound();

  return <NewsletterOptInOffer canSubscribe preview />;
}
