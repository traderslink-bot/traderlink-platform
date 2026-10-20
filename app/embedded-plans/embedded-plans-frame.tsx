"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function EmbeddedPlansFrame({ children }: { children: ReactNode }) {
  const content = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = content.current;
    if (!root || window.parent === window) return;
    let active = true;
    function report() {
      if (!active || !root) return;
      const available = root.querySelector('section[aria-label="Plans"]') !== null;
      window.parent.postMessage({
        type: "traderslink:plans-section",
        available,
        height: available ? Math.ceil(root.getBoundingClientRect().height) : 0,
      }, window.location.origin);
    }
    // Keep normal navigation and login links out of the pricing frame.
    function targetParent(event: MouseEvent) {
      const target = event.target;
      const link = target instanceof Element ? target.closest("a") : null;
      if (link && (!link.target || link.target === "_self")) link.target = "_top";
    }
    const observer = new ResizeObserver(report);
    observer.observe(root);
    root.addEventListener("click", targetParent, true);
    void document.fonts.ready.then(report);
    report();
    return () => {
      active = false;
      observer.disconnect();
      root.removeEventListener("click", targetParent, true);
    };
  }, []);
  return <div ref={content}>{children}</div>;
}
