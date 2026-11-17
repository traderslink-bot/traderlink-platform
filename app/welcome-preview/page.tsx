import { notFound } from "next/navigation";

import { NewsletterOptInOffer } from "../(dashboard)/welcome/newsletter-opt-in-offer";

export const dynamic = "force-dynamic";

/** Staging-only newsletter review. The signed-in Home page is at /home. */
export default function WelcomePreviewPage() {
  if (process.env.RAILWAY_ENVIRONMENT_NAME !== "staging") notFound();

  return <NewsletterOptInOffer canSubscribe preview />;
}
