import { LoginScreen } from "./login-screen";
import type { Metadata } from "next";
import { loginReturnTo } from "@/src/modules/platform/server/authentication/platform-login-http";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Sign in | TradersLink",
  referrer: "no-referrer",
  robots: { index: false, follow: false },
};
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const errors: Record<string, string> = {
    "google-unavailable": "Google sign-in is currently unavailable.",
    "google-failed": "Google sign-in did not complete. Please try again.",
    "account-conflict":
      "Use your existing sign-in method, then connect the other method in Account.",
    "discord-account-conflict":
      "This Discord account is already connected to another TradersLink account.",
  };
  return (
    <LoginScreen
      mode={query.mode === "signup" ? "signup" : "login"}
      returnTo={loginReturnTo(query.returnTo)}
      reauthenticate={query.reauth === "1"}
      error={typeof query.error === "string" ? errors[query.error] : undefined}
      message={
        query.verified
          ? "Email verified. Sign in below."
          : query.reset
            ? "Password changed. Sign in below."
            : undefined
      }
    />
  );
}
