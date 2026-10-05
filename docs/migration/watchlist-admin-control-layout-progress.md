# Watchlist admin control layout progress

Plan: [approved layout](watchlist-admin-control-layout-plan.md).

- Inspected live owner console in Chrome. Premium switches were appended into the general publishing-options row; move controls were long and technical metadata crowded the row header. Access/review loading errors observed separately, not diagnosed or changed by this layout slice.
- Implemented exact-parent overlays on Platform 2aa651ec / Runtime 6a552ca8, preserving dirty checkout work.
- Added labelled More actions groups, moved Premium controls into Access, kept main review actions visible, and relocated technical metadata into Diagnostics. Existing event handlers and request payloads remain unchanged.
- Help updated. No migration or notification behavior change.
- Focused checkpoint PASS: candidate TypeScript syntax, embedded page/review/Premium JavaScript parsing, actual DOM group order, Premium switches in Access, technical details in Diagnostics, visible errors and operation status, main actions outside the disclosure, and expanded-state preservation. Used isolated DOM with stubbed access responses; no live requests or writes.
- Implementation complete for owner-approved layout. Narrow checkpoint prepared; rendered desktop/mobile owner acceptance and deployment remain pending. No production visual acceptance claimed.
