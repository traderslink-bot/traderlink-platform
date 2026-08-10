# Notifications And Imports Help Center Progress

**Status:** Complete and owner-authorized for local commit

## Scope

Add a small, plain-language Help Center collection for the approved
Notifications and statement-import experience. The collection reuses the
existing Help Center article, overview, search, navigation and responsive
layout templates.

## Completed content

- [x] **Notifications** explains the bell, unread updates, full Notifications
      page, and the kinds of updates a trader may see.
- [x] **Discord notifications** explains optional category choices and the
      optional one-time completion message for a statement import.
- [x] **When a statement will not import** explains why an import can stop,
      the private review choice, manual column mapping, and the follow-up
      review path.
- [x] The collection is available from the Help Center, Help navigation,
      search, and Popular help.
- [x] Copy uses everyday product language and avoids internal implementation
      terms. It does not claim Discord, AI processing, a bot, provider or
      hosted scheduling is active.

## Verification

- [x] Focused ESLint passed for the six Help source files.
- [x] A low-resource registry check confirmed three guides, four collection
      navigation entries, twelve searchable records, and the Popular help
      entry for the statement-import guide.
- [x] No database, provider, Discord, server, browser, deployment or external
      service was started or changed.

## Boundary

This is Help content only. The related Notifications and AI import-repair
implementation, hosted activation, Discord delivery and provider configuration
remain separately documented and unchanged by this commit.
