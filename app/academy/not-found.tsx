import Link from "next/link";

import { AcademyShell } from "./academy-shell";

export default function AcademyNotFound() {
  return (
    <AcademyShell>
      <div className="academy-container-narrow">
        <div className="academy-not-found-card">
          <p className="academy-eyebrow">TradersLink Academy</p>
          <h1 className="academy-title-sm">Lesson not found</h1>
          <p className="academy-lede">
            This Academy route is not in the current content registry.
          </p>
          <Link href="/academy/" className="academy-button">
            Return to Academy
          </Link>
        </div>
      </div>
    </AcademyShell>
  );
}
