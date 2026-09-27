# Notes with approved analysis

Owner-approved September 27 correction: saved notes must accompany an initially approved analysis. Mobile: directly below analysis. Desktop: column 1 of following row. Empty notes still omit the card. Preserve exact notes text, analysis and unrelated cards. No AI or notification changes.

Root cause verified live: GYGY had an 825-character saved draft. Approval revision 12's website payload omitted traderNotes; website delivery revision 14 was acknowledged. Notes-only publication includes this card, but analysis publication omitted it. Notes were not lost.

Implementation: include saved notes in the initial analysis publication preview and freeze the same payload on approval. For already-listed tickers omit the notes field from subsequent analysis patches, retaining public notes without exposing private edits. Existing frozen approvals remain immutable. Existing save-notes publish:true action is the bounded website-only correction for GYGY once authorized release is healthy.

Placement patch changes only the Trader notes article gridColumn from 1 / -1 to 1 on current Platform parent e650ca660876f8b917ec1742367a89d8e3cb2f36. It already follows the full-width analysis in DOM order; mobile grid has one column. Rendering remains conditional on nonempty trimmed text. No new UI control or altered font.

Coordinator confirmed existing source lanes and owns release. Deployment and GYGY publication are complete. Help now clarifies initial-approval notes publication; later draft privacy remains unchanged.

Source complete: runtime d3249edc143a8ec0e5dac909e45a28ce040b7aa0 on4336910; allowlist manager plus scripts/verify-notes-analysis-publication.cjs. Actual-method offline checks pass for initial notes/analysis/levels, empty notes, immutable retries without rebuild, both already-listed indicators, private save and website-only publish. Whitespace check passes. Platform patch SHA256 DDB8AD0FFF7BA6E799E350B790837F0A046EEF0BA7B8E7FFB1740B7F0BFD4033. Handoff includes exact Help clarification and authenticated existing save-notes operation, with note-content hash and analysis-identity verification required after GYGY repair. No worker hosted mutation, AI calls, notifications or new local server.

## Completed hosted verification — September 27

- Coordinator deployed Platform cac37b94413228b6913eac55f9863a2df590f000 (Railway deployment prefix 1d177516), SUCCESS, schema 127 and health ready. Placement and Help only.
- Runtime d3249edc143a8ec0e5dac909e45a28ce040b7aa0 deployed as e00ec01c-f9e1-472c-8870-569f158ebf80, SUCCESS and ready, with original volume and 36 actual-file hashes verified by Coordinator.
- After healthy-release authorization, used authenticated owner My notes > Publish notes once for GYGY, unchanged text. UI confirmed Notes published. This later bounded operation supersedes the source-checkpoint no-mutation statement above.
- Public ticker page visibly shows TRADER NOTES immediately beneath the full-width analysis, in desktop column 1. Mobile placement follows the same DOM order and single-column grid; a separate mobile screenshot was not taken.
- Coordinator independent postprobe at 16:43:42 UTC confirmed 825 characters, SHA256 a48c06df2b1be5e34055f4c14288453007f87b50a7e43fb0bcf279c6bffce6aa, identical to saved draft.
- Analysis hash 0c65396e671c4286710ccca2737e9afc6bc1395475b60a467152e9c8ab027463 and updatedAt 1790477750809 unchanged. No analysis regeneration/reapproval or notification action performed.
- Scope complete. No new migration, paid AI call, local server or broad test run.
