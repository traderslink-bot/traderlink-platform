import type { HelpGuide } from "./help-guide-types";

export const ACCOUNT_HELP_GUIDES: readonly HelpGuide[] = Object.freeze([
  Object.freeze({
    slug: "set-pnl-preference",
    title: "Set your P/L preference",
    description: "Choose whether summary P/L defaults to Net or Gross without changing any recorded trade facts.",
    sections: Object.freeze([
      Object.freeze({
        id: "choose-pnl-basis",
        title: "Choose your default P/L basis",
        summary: "Use I enter fees for Net P/L or I don’t enter fees for Gross P/L.",
        keywords: Object.freeze(["p/l", "profit and loss", "gross", "net", "fees", "preference"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "Open Account settings, select General, then use P/L preference. I enter fees selects Net P/L. I don’t enter fees selects Gross P/L. Save the choice to set the default across Workspace, Analytics Overview, Results, Timing, Trade Breakdown, Trade Analyzer, Trade Explorer and Compare. A page's own Gross or Net choice still overrides the saved default for that view." }),
          Object.freeze({ kind: "callout", title: "Leave Fees blank when there was no fee", text: "For a manual trade, a blank Fee is recorded as $0 and included in both Gross and Net P/L. Enter a fee only when your broker charged one. This setting changes the default summary basis only; it never relabels or rewrites recorded Gross, Net, price, quantity or fee facts." }),
        ]),
      }),
    ]),
  }),
  Object.freeze({
    slug: "manage-sign-ins",
    title: "Manage your sign-ins",
    description: "Review each active TraderLink sign-in, end one you do not recognize, or sign out everywhere when you need to.",
    sections: Object.freeze([
      Object.freeze({
        id: "quick-account-menu",
        title: "Use the Account menu",
        summary: "Open Account settings or sign out from the person icon at the top right of TraderLink.",
        keywords: Object.freeze(["log out", "logout", "account menu", "sign out", "top right", "person icon"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "Select the person icon at the top right of TraderLink to open the Account menu. Choose Account settings to manage your account, Security to review sign-ins, or Log out to end TraderLink on the browser you are using." }),
          Object.freeze({ kind: "callout", title: "Logging out is safe", text: "Logging out ends your TraderLink session on that browser. It does not delete your Trade Tracker data or remove your Discord account." }),
        ]),
      }),
      Object.freeze({
        id: "end-one-sign-in",
        title: "End one sign-in",
        summary: "Review each active browser or device sign-in and end only the one you no longer want to use.",
        keywords: Object.freeze(["one device", "one browser", "sign out one", "active sign-ins", "security"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "steps", items: Object.freeze([
            Object.freeze({ title: "1. Open Security", text: "Select the person icon at the top right, then choose Security." }),
            Object.freeze({ title: "2. Review active sign-ins", text: "Each entry shows when that TraderLink browser or device sign-in was last active and when it was created. This browser is identified separately." }),
            Object.freeze({ title: "3. End the one you no longer want", text: "Choose Sign out beside that entry. Your other TraderLink sign-ins stay active." }),
          ]) }),
          Object.freeze({ kind: "callout", title: "Use the dates to identify an older sign-in", text: "TraderLink did not retain device names for existing sign-ins, so Security shows the real sign-in and last-active dates instead of guessing a device name." }),
        ]),
      }),
      Object.freeze({
        id: "sign-out-everywhere",
        title: "Sign out everywhere",
        summary: "End all of your active TraderLink sign-ins after a shared-device or security concern.",
        keywords: Object.freeze(["sign out everywhere", "all devices", "security", "lost device", "shared computer"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "steps", items: Object.freeze([
            Object.freeze({ title: "1. Open Security", text: "Select the person icon at the top right, then choose Security." }),
            Object.freeze({ title: "2. Choose Sign out everywhere", text: "Read the confirmation. This ends the current sign-in and every other active TraderLink sign-in for your account." }),
            Object.freeze({ title: "3. Sign in again when ready", text: "Use Discord to sign in again on each browser or device where you want to use TraderLink." }),
          ]) }),
          Object.freeze({ kind: "callout", title: "Use this if a device is no longer private", text: "Signing out everywhere is useful after using a shared computer, losing a device or seeing a sign-in you do not recognize." }),
        ]),
      }),
    ]),
  }),
]);

export function accountGuideBySlug(slug: string): HelpGuide | undefined {
  return ACCOUNT_HELP_GUIDES.find((guide) => guide.slug === slug);
}
