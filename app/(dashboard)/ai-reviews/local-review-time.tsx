"use client";

export function LocalReviewTime({ value }: Readonly<{ value: string }>) {
  return (
    <time dateTime={value} suppressHydrationWarning>
      {new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))}
    </time>
  );
}
