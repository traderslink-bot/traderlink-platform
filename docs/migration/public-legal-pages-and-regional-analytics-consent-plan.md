# Public Legal Pages and Regional Analytics Consent Plan

**Status:** Locally complete and owner accepted on 2026-08-12. Privacy-email
activation, publication and deployment remain separate owner-controlled actions.

## Purpose

Add standard public legal documents for TradersLink and apply only the regional
Google Analytics consent controls required for the current site. The legal
pages must support the landing page, Academy, News and future public pages; the
dashboard remains one part of the same site.

This is a practical product implementation, not a substitute for legal advice.
The documents must describe the product that exists and avoid invented company,
provider, retention or commercial claims.

## Owner decisions

- Business/operator name: `TradersLink`.
- Business location and governing law: Ontario, Canada.
- Intended privacy contact: `privacy@traderslink.pro`.
- The privacy address must receive mail before publication. DNS currently has
  no configured MX service, so mailbox or forwarding activation is an open
  publication gate.
- Keep Google Analytics.
- Do not impose a worldwide opt-in requirement.
- Require prior Analytics consent only where the current Analytics use requires
  it, with a safe prompt when location cannot be determined.
- Keep the legal documents and consent interface standard and concise.

## Complete target inventory

### Public documents

1. `/privacy` provides the public Privacy Policy.
2. `/terms` provides the public Terms and Conditions.
3. The Privacy Policy includes the cookie and local-storage explanation; no
   separate Cookie Policy page is created.
4. Both routes include page metadata, canonical URLs, clear headings, an
   effective date and the shared public footer.
5. Both routes are included in the public sitemap.

### Privacy Policy subjects

- operator and scope;
- information visitors and account holders provide;
- Discord identity, membership and session information;
- Academy progress, Watchlist and referral information;
- Journal, broker, execution, note, review and analytics information;
- optional AI feature data handling;
- payment/access status received from Whop without claiming TradersLink stores
  full card details;
- automatic website, security and consent-choice information;
- Google Analytics and regional consent behavior;
- purposes, service providers, international processing, retention and
  safeguards;
- access, correction, deletion, consent withdrawal and complaint rights;
- children, policy updates and Privacy Officer contact.

### Terms and Conditions subjects

- acceptance and eligibility;
- accounts and Discord-based access;
- free and paid services, with transaction-specific terms left to the purchase
  surface and payment provider;
- educational-only information, no investment advice and trading risk;
- AI, market-data and service limitations;
- user content and the limited service licence needed to process it;
- acceptable use and intellectual property;
- third-party services and links;
- availability, changes, suspension, termination and account deletion;
- disclaimers, liability limits subject to applicable law, indemnity,
  severability and Ontario governing law;
- contact information.

### Regional Analytics behavior

1. Railway does not supply country or province headers. The live domain must
   therefore use a trusted geo-aware proxy in front of Railway. The current
   implementation reads Cloudflare's `CF-IPCountry` and `CF-Region-Code`
   origin headers and does not use any Vercel header or add a per-request
   third-party geolocation lookup.
2. Prior consent is required for the EEA, the United Kingdom and Quebec under
   the current Google Analytics configuration. The region list is isolated in
   one maintainable module.
3. When prior consent is required, or location is unavailable, the Google tag
   is not loaded until the visitor accepts.
4. Basic consent behavior is required: rejection sends no Analytics request,
   cookie, event, consent ping or cookieless measurement ping to Google.
5. Outside those regions, Google Analytics loads normally. Visitors can still
   disable optional Analytics through `Cookie choices`.
6. Necessary authentication, security, account-selection and user-requested
   preference storage remain available regardless of Analytics choice.
7. Withdrawing consent disables future collection and removes accessible
   `_ga` cookies. It cannot retroactively remove data already collected before
   withdrawal.
8. The consent endpoint returns only whether prior consent is required. It does
   not return or store the visitor country or region in application data.

### Shared public access

- The landing-page footer links to Privacy, Terms and Cookie choices.
- The shared public-site shell provides the same footer for Academy, News,
  Watchlist information pages and other public surfaces that use it.
- The legal pages use the landing page's dark TradersLink visual language.
- The existing authenticated `/account/privacy` deletion page remains unchanged
  and is not represented as the public Privacy Policy.

## Verification boundary

Follow the repository's low-resource cadence. Do not run Vitest. After the
complete slice is assembled:

1. run targeted ESLint on the changed source files;
2. run TypeScript without emitting files;
3. inspect `/privacy`, `/terms`, the landing footer and the regional consent
   prompt in the canonical repository on its identified review port;
4. verify a consent-required/unknown visit makes no Google Analytics network
   request and creates no `_ga` cookie before acceptance;
5. verify mocked non-consent-region resolution enables the existing Analytics
   component without showing the prompt;
6. verify rejection and later preference changes;
7. do not run a production build, broad regression, deployment or external
   publication without a later acceptance boundary requiring it.

## Publication gates

- `privacy@traderslink.pro` can receive and answer messages.
- The production host supplies trustworthy country and Quebec region headers,
  or unknown requests receive the consent prompt.
- The final visible pages and consent prompt receive owner approval.
- Deployment is separately authorized from a clean accepted release.

## Progress record

Implementation is tracked in
[Public Legal Pages and Regional Analytics Consent Progress](public-legal-pages-and-regional-analytics-consent-progress.md).
