import type { ReactNode } from "react";
import Link from "next/link";
import { TraderLinkPlatformDashboardFrame } from "@/app/dashboard-layout-frame";
import styles from "./swing-idea.module.css";

export function SwingFrame({ signedIn, returnTo, children }: { signedIn: boolean; returnTo: string; children: ReactNode }) {
  return signedIn ? <TraderLinkPlatformDashboardFrame loginReturnTo={returnTo} watchlistMemberAccess>{children}</TraderLinkPlatformDashboardFrame> :
    <div className={styles.guest}><header className={styles.guestHeader}><Link href="/swings">TRADERSLINK</Link></header>{children}</div>;
}
