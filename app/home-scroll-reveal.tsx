"use client";

import { useEffect } from "react";

const visibleClass = "tl-scroll-visible";

export function HomeScrollReveal() {
  useEffect(() => {
    const revealItems = Array.from(
      document.querySelectorAll<HTMLElement>("[data-scroll-reveal]"),
    );

    if (revealItems.length === 0) {
      return;
    }

    if (!("IntersectionObserver" in window)) {
      revealItems.forEach((item) => item.classList.add(visibleClass));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          entry.target.classList.add(visibleClass);
          observer.unobserve(entry.target);
        });
      },
      {
        rootMargin: "0px 0px -12% 0px",
        threshold: 0.12,
      },
    );

    revealItems.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, []);

  return null;
}
