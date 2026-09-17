"use client";

/* eslint-disable @next/next/no-html-link-for-pages -- Public navigation crosses the static landing service and Next.js; full requests preserve that routing boundary. */

import { createContext, type ReactNode, useContext, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import styles from "./public-website-chrome.module.css";
import { OPEN_COOKIE_CHOICES_EVENT } from "@/src/lib/privacy/analytics-consent-events";

const PublicWebsiteContext = createContext(false);
export function usePublicWebsiteChrome() { return useContext(PublicWebsiteContext); }

export function LegacyWebsiteChrome({ children }: { children: ReactNode }) {
  return usePublicWebsiteChrome() ? null : children;
}

const featureLinks = [
  ["/trading-journal", "Trading Journal"],
  ["/trading-journal#daily-trade-tracker", "Daily Trade Tracker"],
  ["/trade-analyzer", "Trade Analyzer"],
  ["/trade-analytics", "Trade Analytics"],
] as const;
const footerLinks = [featureLinks[0], featureLinks[2], featureLinks[3], ["/academy", "Academy"], ["/help", "Help"]] as const;

export function PublicWebsiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return <PublicWebsiteContext.Provider value={true}>
    <HomepageNavigation key={pathname} />
    {children}
    <div className={styles.privacyControl}><button type="button" onClick={() => window.dispatchEvent(new Event(OPEN_COOKIE_CHOICES_EVENT))}>Cookie choices</button></div>
    <footer className={styles.footer} aria-label="TradersLink links">
      <p>TradersLink, living the small cap trading life!</p>
      <nav aria-label="Explore TradersLink" className={styles.footerProducts}>{footerLinks.map(([href,label])=><a key={href} href={href}>{label}</a>)}</nav>
      <div className={styles.legal}><a href="/privacy">Privacy Policy</a><a href="/terms">Terms &amp; Conditions</a></div>
      <p className={styles.disclaimer}>TradersLink helps active traders track their trades, review performance, and analyze trading activity. Our tools and educational content are for informational purposes only and do not constitute financial or investment advice. Trading involves risk, including loss of capital.</p>
    </footer>
  </PublicWebsiteContext.Provider>;
}

function HomepageNavigation() {
  const [menuOpen,setMenuOpen]=useState(false);
  const [featuresOpen,setFeaturesOpen]=useState(false);
  const header=useRef<HTMLElement>(null);
  const menuButton=useRef<HTMLButtonElement>(null);
  const featureButton=useRef<HTMLButtonElement>(null);
  useEffect(()=>{
    function closeOutside(event: PointerEvent) { if(!header.current?.contains(event.target as Node)){setMenuOpen(false);setFeaturesOpen(false);} }
    function closeEscape(event: KeyboardEvent) { if(event.key!=="Escape")return; if(featuresOpen){setFeaturesOpen(false);featureButton.current?.focus();}else if(menuOpen){setMenuOpen(false);menuButton.current?.focus();} }
    document.addEventListener("pointerdown",closeOutside);document.addEventListener("keydown",closeEscape);
    return ()=>{document.removeEventListener("pointerdown",closeOutside);document.removeEventListener("keydown",closeEscape);};
  },[featuresOpen,menuOpen]);
  return <header className={styles.header} ref={header}>
    <a href="/" className={styles.logo} aria-label="TradersLink home">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="https://traderslink.pro/landing-assets/logo-horizontal-light.png" alt="TradersLink" width={1760} height={361} decoding="async" />
    </a>
    <button ref={menuButton} type="button" className={styles.menuToggle} aria-controls="public-primary-navigation" aria-expanded={menuOpen} aria-label={menuOpen?"Close navigation menu":"Open navigation menu"} onClick={()=>{setMenuOpen(!menuOpen);setFeaturesOpen(false);}}><span className={styles.menuLines} data-open={menuOpen} aria-hidden="true"><span/><span/><span/></span></button>
    <nav id="public-primary-navigation" aria-label="Primary" className={styles.navigation} data-open={menuOpen}>
      <div className={styles.features}>
        <button ref={featureButton} type="button" className={styles.featuresToggle} aria-controls="public-feature-links" aria-expanded={featuresOpen} onClick={()=>setFeaturesOpen(!featuresOpen)}>Features <span className={styles.chevron} aria-hidden="true" /></button>
        <div id="public-feature-links" className={styles.featureLinks} hidden={!featuresOpen}>{featureLinks.map(([href,label])=><a key={href} href={href}>{label}</a>)}</div>
      </div>
      <a href="/academy">Academy</a><a href="/help">Help</a>
      <a href="https://app.traderslink.pro/api/auth/discord/login?returnTo=%2Fworkspace">Log in</a>
      <a className={styles.signup} href="https://traderslink.pro/beta">Sign up free</a>
    </nav>
  </header>;
}
