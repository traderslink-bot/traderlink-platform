# Account Session Management Progress

**Status:** Individual session sign-out is released. The duplicate older
current-browser sign-out card and privacy-safe labels for future sign-ins are
ready locally and await their narrow release.

**Controlling plan:** [Account Settings And Erasure Plan](account-settings-and-erasure-plan.md)

## Owner-requested outcome

- [x] List each active TraderLink browser or device sign-in in Account Security.
- [x] Identify the current browser and show the real created and last-active
  times for every sign-in.
- [x] Let the owner end one selected sign-in without ending the others.
- [x] Keep one current-browser sign-out control in the session list and the
  separate confirmed sign-out-everywhere path.
- [x] Keep device naming honest: existing sessions have no stored device name,
  so the page does not invent one.
- [x] Save a coarse browser/device label only for future Discord sign-ins;
  never retain raw user agents, browser versions, IP addresses or location.
- [x] Update the Account Help guide with individual sign-out steps.

## Verification boundary

- Focused ESLint and whitespace checks pass for the changed account, session,
  route and display files.
- No migration, test suite, server process or deployment ran for this slice.
