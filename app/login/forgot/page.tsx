import { LoginScreen } from "../login-screen";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Account recovery | TradersLink",
  robots: { index: false, follow: false },
};
export default function Page() {
  return <LoginScreen mode="forgot" returnTo="/plans" />;
}
