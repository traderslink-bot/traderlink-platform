import { LoginScreen } from "../login-screen";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Confirm email | TradersLink",
  referrer: "no-referrer",
  robots: { index: false, follow: false },
};
export default function Page() {
  return <LoginScreen mode="confirm-email-change" returnTo="/account/login" />;
}
