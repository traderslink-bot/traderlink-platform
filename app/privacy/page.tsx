import type { Metadata } from "next";

import { LegalPageLayout } from "../legal-page-layout";

export const metadata: Metadata = {
  title: "Privacy Policy | TradersLink",
  description:
    "How TradersLink collects, uses, shares and protects personal information.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout
      description="This policy explains what personal information TradersLink handles, why we use it, and the choices available to you."
      title="Privacy Policy"
    >
      <section>
        <h2>1. Who we are</h2>
        <p>
          TradersLink is an Ontario, Canada business providing trading education,
          market-information tools, community access and trade-journal features.
          In this policy, “TradersLink,” “we,” “us” and “our” refer to the
          operator of traderslink.pro and the related TradersLink services.
        </p>
        <p>
          TradersLink is responsible for the personal information under its
          control. The Privacy Officer is responsible for questions, complaints
          and requests concerning this policy.
        </p>
      </section>

      <section>
        <h2>2. Information we collect</h2>
        <h3 className="mt-5">Information you provide</h3>
        <ul>
          <li>
            Account and identity information, including information received
            when you sign in with Discord, such as your Discord identifier,
            display name and relevant TradersLink server membership or role.
          </li>
          <li>
            Trading-journal information you enter or import, such as broker and
            account references, executions, positions, statements, symbols,
            prices, quantities, fees, notes, tags, rules, reviews and related
            analytics.
          </li>
          <li>
            Academy progress, Watchlist activity, feature preferences,
            notification choices and referral information connected to your
            account.
          </li>
          <li>
            Questions, support messages, feedback and information you choose to
            submit through optional AI-assisted features.
          </li>
        </ul>

        <h3 className="mt-5">Information collected automatically</h3>
        <ul>
          <li>
            Basic request and security information, such as IP address, browser
            and device details, requested pages, timestamps and server logs.
          </li>
          <li>
            Necessary session, authentication, account-selection and preference
            information stored in cookies or local browser storage.
          </li>
          <li>
            With consent where required, Google Analytics information such as
            pages viewed, approximate location, device and browser information,
            referral source and a browser identifier used to distinguish visits.
          </li>
        </ul>

        <h3 className="mt-5">Information from other services</h3>
        <p>
          We may receive account, membership, entitlement or transaction-status
          information from services you use with TradersLink, including Discord,
          Whop and a broker connection you choose to enable. Payment providers
          process payment-card details under their own terms; TradersLink does
          not need your full card number to confirm access.
        </p>
      </section>

      <section>
        <h2>3. How we use information</h2>
        <p>We use personal information to:</p>
        <ul>
          <li>provide, secure and maintain TradersLink;</li>
          <li>authenticate accounts and confirm feature access;</li>
          <li>
            import, organize and analyze the trading information you choose to
            save;
          </li>
          <li>save Academy progress, preferences and account settings;</li>
          <li>provide support and respond to privacy requests;</li>
          <li>
            understand website use and improve the service through optional
            Analytics;
          </li>
          <li>detect misuse, investigate problems and protect our users; and</li>
          <li>comply with legal obligations and enforce our agreements.</li>
        </ul>
        <p>
          When an AI-assisted feature is used, we process only the information
          needed to respond to that request. AI output can be incomplete or
          incorrect and does not replace your own review or professional advice.
        </p>
      </section>

      <section>
        <h2>4. Cookies, local storage and Analytics</h2>
        <p>
          TradersLink uses necessary cookies and similar storage for login,
          security, account selection, saved preferences and remembering your
          Analytics choice. Blocking necessary storage may prevent requested
          features from working.
        </p>
        <p>
          We also use Google Analytics to understand visits and improve the
          website. Google Analytics may use first-party cookies named
          <code className="mx-1 rounded bg-slate-900 px-1.5 py-0.5 text-slate-200">
            _ga
          </code>
          and
          <code className="mx-1 rounded bg-slate-900 px-1.5 py-0.5 text-slate-200">
            _ga_&lt;id&gt;
          </code>
          for up to two years. Where prior consent is required, the Google tag
          remains completely blocked until you accept Analytics. Rejecting it
          sends no Analytics events or cookieless measurement pings to Google.
        </p>
        <p>
          Elsewhere, Analytics may operate when you visit, subject to applicable
          law. You can turn optional Analytics on or off at any time using
          <strong className="font-semibold text-slate-100"> Cookie choices</strong>
          in the public footer. Your choice is stored in your browser for up to
          six months. Turning Analytics off stops future collection from that
          browser and removes accessible Google Analytics cookies, but it does
          not retroactively delete information collected before your choice.
        </p>
      </section>

      <section>
        <h2>5. When we share information</h2>
        <p>We may share information with:</p>
        <ul>
          <li>
            service providers that host, secure, maintain, analyze or support
            TradersLink;
          </li>
          <li>
            Discord for sign-in and community access, Whop for paid-access
            status, Google for optional Analytics, and an AI or broker provider
            when you choose a feature that requires that provider;
          </li>
          <li>
            professional advisers, regulators, courts or law enforcement where
            disclosure is reasonably necessary or legally required; and
          </li>
          <li>
            a successor in a business transaction, subject to appropriate
            confidentiality and legal protections.
          </li>
        </ul>
        <p>
          We do not sell personal information. We require service providers to
          handle information for the services they provide and subject to their
          applicable contractual and legal obligations.
        </p>
      </section>

      <section>
        <h2>6. Processing outside Canada</h2>
        <p>
          Some providers may process information outside Ontario or Canada,
          including in the United States. Information processed in another
          jurisdiction may be subject to that jurisdiction’s laws and lawful
          access requests. We use reasonable contractual, technical and
          organizational safeguards appropriate to the service and information.
        </p>
      </section>

      <section>
        <h2>7. Retention and deletion</h2>
        <p>
          We retain personal information only for as long as reasonably needed
          to provide the service, maintain security and records, resolve disputes
          and meet legal obligations. Retention varies according to the type of
          information and why it was collected.
        </p>
        <p>
          Account holders can use the Delete Account section of Account Settings to
          request deletion of a selected Trade Tracker account or, where
          available, their complete TradersLink account. Information may remain
          for a limited period in protected backups, security records or records
          we must retain by law. Failed or unfinished statement imports are not
          retained by default unless you deliberately authorize a support or
          recovery workflow that says otherwise.
        </p>
      </section>

      <section>
        <h2>8. Security</h2>
        <p>
          We use reasonable administrative, technical and physical safeguards
          designed to protect personal information. These include access
          controls, account separation, protected credentials and limited data
          access. No internet or storage system is completely secure, so we
          cannot guarantee absolute security.
        </p>
      </section>

      <section>
        <h2>9. Your privacy choices and rights</h2>
        <p>
          Depending on where you live, you may have rights to request access to,
          correction of or deletion of personal information; withdraw consent;
          object to or restrict certain processing; or receive a portable copy
          of certain information. Some rights are subject to legal exceptions.
        </p>
        <p>
          You may change Analytics through Cookie choices and update available
          account preferences within TradersLink. To make another privacy
          request or complaint, contact the Privacy Officer. We may need to
          verify your identity before fulfilling a request. Canadian residents
          may also contact the Office of the Privacy Commissioner of Canada if
          a concern is not resolved.
        </p>
      </section>

      <section>
        <h2>10. Children</h2>
        <p>
          TradersLink account and paid services are intended for people who have
          reached the age of majority where they live. The service is not
          directed to children under 13, and we do not knowingly collect their
          personal information. Contact us if you believe a child has provided
          personal information without appropriate authorization.
        </p>
      </section>

      <section>
        <h2>11. Changes to this policy</h2>
        <p>
          We may update this policy as TradersLink changes. We will post the
          updated version with a new effective date and provide additional
          notice or obtain consent when required by law.
        </p>
      </section>

      <section>
        <h2>12. Contact the Privacy Officer</h2>
        <p>
          Privacy Officer
          <br />
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
