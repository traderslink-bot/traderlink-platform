# Public Legal Pages and Regional Analytics Consent Progress

**Status:** Locally complete and owner accepted on 2026-08-12. Privacy-email
activation and trusted Railway geo headers remain publication gates.

## Approved boundary

- [x] Operator is TradersLink.
- [x] Ontario, Canada is the business and governing-law location.
- [x] Keep Google Analytics.
- [x] Use regional prior consent instead of worldwide opt-in.
- [x] Use Basic Consent behavior with no Analytics transmission before consent
  in required regions.
- [x] Keep the pages and prompt concise and standard.
- [x] Use `privacy@traderslink.pro` as the intended privacy contact.
- [x] Remove Vercel-specific geolocation headers from the Railway-targeted
  implementation.
- [ ] Activate mailbox or forwarding for `privacy@traderslink.pro` before
  publication; the domain currently has no configured MX service.
- [ ] Put a trusted geo-aware proxy in front of Railway and enable country and
  region origin headers before relying on regional prompting in production.

## Implementation

- [x] Add the Privacy Policy route.
- [x] Add the Terms and Conditions route.
- [x] Add reusable public legal layout and footer links.
- [x] Add the consent-region resolver and private no-store route.
- [x] Gate Google Analytics using Basic Consent behavior.
- [x] Add the regional consent prompt and persistent Cookie choices control.
- [x] Remove accessible Analytics cookies when optional Analytics is rejected.
- [x] Add the legal routes to the sitemap.
- [x] Align the controlling launch-readiness checklist.

## Verification

- [x] Targeted ESLint passes.
- [x] TypeScript passes without emitting files.
- [x] Privacy and Terms routes render correctly at desktop and narrow widths.
- [x] Landing and shared public footers expose Privacy, Terms and Cookie choices.
- [x] Required/unknown-region visits send no Analytics traffic before consent.
- [x] Rejected visits remain untracked by Google Analytics.
- [x] Trusted non-consent-region headers keep Analytics enabled without a prompt.
- [x] Owner approved the Privacy Policy UI; separate Terms UI approval was
  explicitly waived.

## Release boundary

No push, deployment, DNS change, mailbox provisioning or production Analytics
change is authorized by this local implementation record.
