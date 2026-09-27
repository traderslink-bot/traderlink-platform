import type { Metadata } from "next";

import { LegalPageLayout } from "../legal-page-layout";

export const metadata: Metadata = {
  title: "Terms and Conditions | TradersLink",
  description:
    "The terms that apply when accessing or using TradersLink websites and services.",
  alternates: { canonical: "/terms" },
};

export default function TermsAndConditionsPage() {
  return (
    <LegalPageLayout
      description="These terms govern access to traderslink.pro and the related TradersLink websites, community features, tools and services."
      title="Terms and Conditions"
    >
      <section>
        <h2>1. Acceptance of these terms</h2>
        <p>
          By accessing or using TradersLink, you agree to these Terms and
          Conditions and our Privacy Policy. If you do not agree, do not use the
          service. Additional terms shown when you purchase or activate a
          specific feature also apply to that feature.
        </p>
      </section>

      <section>
        <h2>2. Eligibility and accounts</h2>
        <p>
          You must have reached the age of majority where you live to create a
          TradersLink account or purchase a paid service. You must provide
          accurate information, protect your login credentials and promptly tell
          us about suspected unauthorized account use.
        </p>
        <p>
          Some features use Discord for authentication, membership verification
          or community access. You are responsible for maintaining the external
          account needed to use those features and for following the applicable
          provider’s terms.
        </p>
      </section>

      <section>
        <h2>3. TradersLink services</h2>
        <p>
          TradersLink may provide free and paid trading education, market and
          news information, alerts, scanners, generated chart levels, Academy
          content, Watchlist features, trade-journal tools, analytics and
          AI-assisted review features. Available features may change as the
          service develops.
        </p>
        <p>
          Paid access, billing periods, prices, renewals, cancellations and any
          applicable refund terms are disclosed at the time of purchase and may
          be administered by a payment or membership provider such as Whop. The
          purchase terms shown there control that transaction. Nothing in these
          terms limits a non-waivable consumer right under applicable law.
        </p>
      </section>

      <section>
        <h2>4. Educational information only</h2>
        <p>
          TradersLink provides information and tools for education, research and
          personal trade review. It does not provide investment, financial,
          legal, accounting or tax advice and does not act as a broker, dealer,
          investment adviser or fiduciary.
        </p>
        <p>
          Market information, alerts, analysis, generated levels and AI output
          may be delayed, incomplete, inaccurate or unavailable. They are not a
          recommendation to buy, sell or hold a security. You are solely
          responsible for evaluating information and making your own trading and
          financial decisions.
        </p>
      </section>

      <section>
        <h2>5. Trading risk</h2>
        <p>
          Trading involves substantial risk, including the possible loss of all
          capital committed to a trade. Small-cap and volatile securities can
          involve rapid price changes, limited liquidity, trading halts and
          execution risk. Past performance, simulated results and historical
          analysis do not guarantee future results. Only trade with risk you
          understand and can afford to bear.
        </p>
      </section>

      <section>
        <h2>6. Your information and content</h2>
        <p>
          You retain ownership of trading records, notes and other content you
          submit. You grant TradersLink a limited licence to host, process,
          reproduce and display that content only as reasonably necessary to
          provide, secure and improve the services you request. Our handling of
          personal information is described in the Privacy Policy.
        </p>
        <p>
          You are responsible for ensuring that you have the right to submit
          information and that it does not violate law or another person’s
          rights. Do not submit another person’s confidential or personal
          information unless you are authorized to do so.
        </p>
      </section>

      <section>
        <h2>7. Acceptable use</h2>
        <p>You must not:</p>
        <ul>
          <li>use TradersLink for unlawful, fraudulent or abusive activity;</li>
          <li>
            attempt to access another user’s account, data or restricted service;
          </li>
          <li>
            interfere with security, availability, rate limits or technical
            protections;
          </li>
          <li>
            upload malware or content that infringes another person’s rights;
          </li>
          <li>
            scrape, copy, resell or commercially redistribute the service or its
            content except with written permission; or
          </li>
          <li>
            use market information, provider data or third-party content in a
            manner prohibited by its licence or source terms.
          </li>
        </ul>
      </section>

      <section>
        <h2>8. TradersLink content and intellectual property</h2>
        <p>
          TradersLink and its original software, branding, designs, educational
          materials, compilations and content are owned by TradersLink or its
          licensors and are protected by applicable intellectual-property laws.
          Subject to these terms, we give you a limited, personal, revocable,
          non-exclusive and non-transferable right to use the service for its
          intended purpose.
        </p>
        <p>
          If you voluntarily provide feedback, you permit us to use it to improve
          TradersLink without restriction or compensation, provided we do not
          publicly identify you without permission.
        </p>
      </section>

      <section>
        <h2>9. Third-party services and links</h2>
        <p>
          TradersLink may connect to or link to services operated by others,
          including Discord, Whop, Google, brokers, market-data sources and AI
          providers. Their services are governed by their own terms and privacy
          practices. We do not control and are not responsible for third-party
          services, content, security or availability.
        </p>
      </section>

      <section>
        <h2>10. Service changes and availability</h2>
        <p>
          We may add, change, suspend or discontinue features. We do not promise
          uninterrupted, error-free or permanent availability. Beta, preview and
          experimental features may change or be withdrawn and should not be
          relied upon as the sole record of important information.
        </p>
        <p>
          You are responsible for keeping appropriate copies of information you
          need outside TradersLink and for verifying important records against
          your broker or another authoritative source.
        </p>
      </section>

      <section>
        <h2>11. Suspension, termination and deletion</h2>
        <p>
          You may stop using TradersLink at any time and may use available
          account controls to request deletion. We may restrict or terminate
          access when reasonably necessary to address unlawful activity,
          security risk, non-payment, material violation of these terms or harm
          to TradersLink or others. Provisions that by their nature should
          survive termination remain in effect.
        </p>
      </section>

      <section>
        <h2>12. Disclaimers</h2>
        <p>
          To the maximum extent permitted by law, TradersLink is provided “as
          is” and “as available,” without warranties or conditions of any kind,
          whether express, implied or statutory, including merchantability,
          fitness for a particular purpose, title and non-infringement. We do not
          warrant the accuracy, completeness, timeliness or results of any
          information, tool, alert, analysis or AI output.
        </p>
      </section>

      <section>
        <h2>13. Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, TradersLink and its operators,
          suppliers and service providers will not be liable for indirect,
          incidental, special, consequential, exemplary or punitive damages, or
          for lost profits, trading losses, lost data, lost opportunities or
          business interruption arising from or related to TradersLink.
        </p>
        <p>
          Where liability cannot be excluded, our total liability for claims
          relating to the service will not exceed the amount you paid directly
          for the affected TradersLink service during the twelve months before
          the event giving rise to the claim. These limits do not apply where
          prohibited by law.
        </p>
      </section>

      <section>
        <h2>14. Indemnity</h2>
        <p>
          To the extent permitted by law, you agree to indemnify TradersLink from
          third-party claims, damages and reasonable costs arising from your
          unlawful use of the service, content you submit, or material violation
          of these terms. This does not require you to indemnify TradersLink for
          its own unlawful conduct.
        </p>
      </section>

      <section>
        <h2>15. Governing law</h2>
        <p>
          These terms are governed by the laws of Ontario and the federal laws of
          Canada applicable there, without regard to conflict-of-law rules. The
          courts located in Ontario will have jurisdiction over disputes, except
          where applicable consumer law gives you the right to bring a claim in
          another forum.
        </p>
      </section>

      <section>
        <h2>16. General terms</h2>
        <p>
          If a provision is unenforceable, it will be limited or removed only to
          the extent necessary and the remaining provisions will continue. Our
          failure to enforce a provision is not a waiver. You may not transfer
          these terms without our consent; we may transfer them as part of a
          reorganization, financing or sale of the service. These terms and any
          applicable purchase-specific terms form the agreement concerning your
          use of TradersLink.
        </p>
      </section>

      <section>
        <h2>17. Changes to these terms</h2>
        <p>
          We may update these terms as TradersLink changes. We will post the
          updated terms with a new effective date and provide additional notice
          when required. Continuing to use the service after updated terms take
          effect means you accept them, to the extent permitted by law.
        </p>
      </section>

      <section>
        <h2>18. Contact</h2>
        <p>
          TradersLink
          <br />
          Ontario, Canada
          <br />
          <a href="mailto:privacy@traderslink.pro">privacy@traderslink.pro</a>
        </p>
      </section>
    </LegalPageLayout>
  );
}
