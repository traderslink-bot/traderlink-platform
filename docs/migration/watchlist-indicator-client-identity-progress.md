# Indicator card identity correction — October 9, 2026

Owner approved fix and deployment. Production server uses persisted publication UUID, but browser card still compared responses against symbol plus posted time and discarded them. OLB blank state reproduced after reload; active VEEA, OLB, QNME and SAIQ have persisted identities and refresh audits.

Correction: pass the existing publication identity to the card, key its lifecycle by that identity, and retain exact symbol/identity response checks. Missing identities do not fetch; old activation responses remain rejected. Displayed publication dates/prices, provider requests, calculations, access controls and analysis remain unchanged. Existing legacy CJMB/SKYQ missing identities remain a separate guarded reconciliation; never synthesize identities from timestamps.

Help review: no visible behavior or control changes intended; existing indicator guidance remains accurate. No Help text change needed.

Local implementation complete. Focused candidate verification and coordinator deployment acceptance recorded in handoff; live acceptance pending deployment. No data mutation, provider request or notification from this correction.
