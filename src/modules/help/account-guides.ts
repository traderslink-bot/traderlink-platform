import type { HelpGuide } from "./help-guide-types";

export const ACCOUNT_HELP_GUIDES: readonly HelpGuide[] = Object.freeze([
  Object.freeze({
    slug: "manage-sign-ins",
    title: "Manage your sign-ins",
    description: "Use the Account menu to sign out quickly, or end every active TraderLink sign-in when you need to.",
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
