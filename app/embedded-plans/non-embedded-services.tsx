"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** The enclosing feature page owns consent UI; the plans frame adds no app chrome. */
export function NonEmbeddedServices({ children }: { children: ReactNode }) {
  return usePathname() === "/embedded-plans" ? null : children;
}
