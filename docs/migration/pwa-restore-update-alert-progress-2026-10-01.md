# Restore the previous Update app alert

Status: owner-requested exact source restoration prepared locally. No push or deployment.

The owner explicitly rejected the automatic updater and instructed: put it back to how it was. This candidate reverses only the seven source paths introduced or changed by automatic-update release b3d18b0a222f65de1f11970c7cdd8d663e3fad8e, restoring their exact blobs from its immediate parent cbcca66fc166cee99d0e52eb675205d5a9f89591. It does not redesign automatic updating or preserve the rejected automatic guard.

Restored behavior: waiting updates show Update app; the user initiates activation. Existing fifteen-second recovery, current-worker lookup, explicit Reload app fallback, saved-offline-entry warning and protection from unsolicited late reload after timeout remain as they were before the rejected release. Existing Tracker/Admin unsaved-navigation handlers remain; only their new automatic-update-blocker hook is removed.

NetworkOnly thirty-second navigation/recovery, speed corrections, push handlers, offline storage and all unrelated features are preserved exactly from the immediate pre-release source. The new shared safety helper is removed. Prior automatic-update progress remains as historical evidence, superseded by this record. Help wording is restored to the same pre-release version.

Verification: six restored source blobs must exactly equal the immediate pre-release commit; removed helper must be absent; source syntax/targeted lint and parent-relative diff check. No build, server, browser/phone mutation, notification, database/config change, push or deployment. Production hold before 8 p.m. Eastern remains in force; coordinator controls later release authorization. Runtime/device verification is not claimed.

Allowlist:
- app/pwa/pwa-update-notice.tsx
- app/pwa/pwa-service-worker-bootstrap.tsx
- app/sw.ts
- app/(dashboard)/trade-tracker/trade-tracker-unsaved-changes.tsx
- app/(dashboard)/admin/watchlist/watchlist-analysis-editor.tsx
- src/modules/help/traderslink-app-guides.ts
- src/modules/platform/client/pwa/platform-pwa-update-safety.ts (delete)
- docs/migration/pwa-restore-update-alert-progress-2026-10-01.md
- docs/migration/traderlink-platform-pwa-plan.md (supersession link only)
