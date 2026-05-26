"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";

type LessonCompletionLinkProps = {
  children: ReactNode;
  className?: string;
  href: string;
  lessonSlug: string;
  shouldTrack: boolean;
};

export function LessonCompletionLink({
  children,
  className,
  href,
  lessonSlug,
  shouldTrack,
}: LessonCompletionLinkProps) {
  const router = useRouter();

  async function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (
      !shouldTrack ||
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.altKey ||
      event.ctrlKey ||
      event.shiftKey
    ) {
      return;
    }

    event.preventDefault();

    try {
      await fetch("/api/academy/lessons/complete", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ lessonSlug }),
      });
    } catch {
      // Navigation should not get stuck if progress storage is temporarily unavailable.
    }

    router.push(href);
  }

  return (
    <Link
      className={className}
      href={href}
      onClick={handleClick}
      prefetch={false}
    >
      {children}
    </Link>
  );
}
