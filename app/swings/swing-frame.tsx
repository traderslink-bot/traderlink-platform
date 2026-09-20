import type { ReactNode } from "react";
import Link from "next/link";
import { TraderLinkPlatformDashboardFrame } from "@/app/dashboard-layout-frame";
import styles from "./swing-idea.module.css";
import { SwingThemeSurface } from "./swing-theme-surface";

export function SwingFrame({ signedIn, returnTo, children }: { signedIn: boolean; returnTo: string; children: ReactNode }) {
  return signedIn ? <TraderLinkPlatformDashboardFrame loginReturnTo={returnTo} watchlistMemberAccess><SwingThemeSurface>{children}</SwingThemeSurface></TraderLinkPlatformDashboardFrame> :
    <SwingThemeSurface><div className={styles.guest}><header className={styles.guestHeader}><Link href="/swings">TRADERSLINK</Link></header>{children}</div></SwingThemeSurface>;
}
