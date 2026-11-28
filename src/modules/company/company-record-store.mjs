import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";

const symbolFormat = /^[A-Z][A-Z0-9.-]{0,15}$/;
const cikFormat = /^\d{10}$/;
const sourceNames = new Set(["profile", "metrics", "sec"]);
const maxPayloadBytes = 16 * 1024 * 1024;

/**
 * A company store owns its database. A single transaction publishes each
 * source version and settles its job. Revisions pin a multi-request read.
 */
export function openCompanyRecordStore(path) {
  const db = new DatabaseSync(path);
  db.exec(`
    PRAGMA busy_timeout = 5000;
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS company_worker_state (key TEXT PRIMARY KEY, value TEXT NOT NULL) STRICT;
    CREATE TABLE IF NOT EXISTS company_rosters (
      source_revision INTEGER PRIMARY KEY, revision INTEGER NOT NULL, body TEXT NOT NULL
    ) STRICT;
    CREATE TABLE IF NOT EXISTS company_revisions (
      revision INTEGER PRIMARY KEY AUTOINCREMENT, visible_at INTEGER NOT NULL
    ) STRICT;
    CREATE INDEX IF NOT EXISTS company_revisions_visible_at ON company_revisions(visible_at, revision);
    CREATE TABLE IF NOT EXISTS company_listings (
      symbol TEXT NOT NULL, revision INTEGER NOT NULL, identity INTEGER NOT NULL, cik TEXT,
      active INTEGER NOT NULL, PRIMARY KEY(symbol, revision)
    ) STRICT;
    CREATE INDEX IF NOT EXISTS company_listings_issuer_active
      ON company_listings(cik, active, symbol, revision);
    CREATE TABLE IF NOT EXISTS company_jobs (
      subject TEXT NOT NULL, source TEXT NOT NULL, work_key TEXT NOT NULL,
      due_at INTEGER NOT NULL, priority INTEGER NOT NULL, attempts INTEGER NOT NULL DEFAULT 0,
      lease_token TEXT, lease_until INTEGER, completed_at INTEGER,
      PRIMARY KEY(subject, source, work_key)
    ) STRICT;
    CREATE INDEX IF NOT EXISTS company_jobs_due
      ON company_jobs(due_at, priority) WHERE completed_at IS NULL;
    CREATE INDEX IF NOT EXISTS company_jobs_lane_due
      ON company_jobs((priority >= 0), due_at, priority) WHERE completed_at IS NULL;
    CREATE TABLE IF NOT EXISTS company_source_versions (
      subject TEXT NOT NULL, source TEXT NOT NULL, revision INTEGER NOT NULL,
      checked_at INTEGER NOT NULL, value_revision INTEGER, state TEXT NOT NULL,
      retry_at INTEGER, payload TEXT, detail TEXT, health TEXT,
      PRIMARY KEY(subject, source, revision)
    ) STRICT;
  `);

  function transaction(operation) {
    db.exec("BEGIN IMMEDIATE");
    try {
      const result = operation();
      db.exec("COMMIT");
      return result;
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }

  const latestRevision = db.prepare("SELECT coalesce(max(revision), 0) AS revision FROM company_revisions");
  const visibleRevision = db.prepare("SELECT coalesce(max(revision), 0) AS revision FROM company_revisions WHERE visible_at <= ?");
  const addRevision = db.prepare(`
    INSERT INTO company_revisions (visible_at)
    VALUES (max(?, coalesce((SELECT max(visible_at) FROM company_revisions), 0)))
  `);
  const lastRoster = db.prepare("SELECT source_revision, body FROM company_rosters ORDER BY source_revision DESC LIMIT 1");
  const addRoster = db.prepare("INSERT INTO company_rosters VALUES (?, ?, ?)");
  const latestListing = db.prepare("SELECT * FROM company_listings WHERE symbol = ? AND revision <= ? ORDER BY revision DESC LIMIT 1");
  const addListing = db.prepare("INSERT INTO company_listings VALUES (?, ?, ?, ?, ?)");
  db.exec(`
    CREATE VIEW IF NOT EXISTS company_refresh_listings AS
      SELECT symbol, cik, identity, active FROM company_listings AS current
      WHERE active IN (1, 2) AND revision = (SELECT max(revision) FROM company_listings WHERE symbol = current.symbol);
  `);
  const allActive = db.prepare("SELECT symbol, cik, identity FROM company_refresh_listings WHERE active = 1 ORDER BY symbol");
  const allBackground = db.prepare("SELECT symbol, cik, identity FROM company_refresh_listings WHERE active = 2 ORDER BY symbol");
  const allRefreshing = db.prepare("SELECT * FROM company_refresh_listings ORDER BY symbol");
  const enqueueJob = db.prepare(`
    INSERT INTO company_jobs (subject, source, work_key, due_at, priority)
    VALUES (?, ?, ?, ?, ?) ON CONFLICT DO UPDATE SET priority = max(priority, excluded.priority)
    WHERE completed_at IS NULL AND priority < excluded.priority
  `);
  const promoteJobs = db.prepare("UPDATE company_jobs SET priority = 1 WHERE subject = ? AND completed_at IS NULL AND priority < 0");
  const demoteJobs = db.prepare("UPDATE company_jobs SET priority = -1 WHERE subject = ? AND completed_at IS NULL AND priority >= 0");
  const backgroundIssuer = db.prepare("SELECT 1 FROM company_refresh_listings WHERE active = 2 AND cik = ? LIMIT 1");
  const scannerIssuer = db.prepare("SELECT 1 FROM company_refresh_listings WHERE active = 1 AND cik = ? LIMIT 1");
  const nextJobQuery = `
    SELECT queued.subject, queued.source, queued.work_key FROM company_jobs AS queued
    WHERE queued.completed_at IS NULL AND queued.due_at <= $clock
      AND ($provider IS NULL OR (queued.source = 'sec') = ($provider = 'sec'))
      AND (queued.lease_until IS NULL OR queued.lease_until <= $clock)
      AND (queued.priority >= 0) = ($tier = 1)
      AND (
        (queued.source = 'sec' AND EXISTS (
          SELECT 1 FROM company_refresh_listings AS listing
          WHERE listing.active = $tier AND listing.cik = queued.subject
        )) OR (queued.source <> 'sec' AND EXISTS (
          SELECT 1 FROM company_refresh_listings AS listing
          WHERE listing.active = $tier AND listing.symbol = substr(queued.subject, 1, instr(queued.subject, '/') - 1)
            AND queued.subject = listing.symbol || '/' || listing.identity
        ))
      )
      AND NOT EXISTS (
        SELECT 1 FROM company_jobs AS running
        WHERE running.subject = queued.subject AND running.source = queued.source
          AND running.completed_at IS NULL AND running.lease_until > $clock
      )
    ORDER BY queued.priority DESC, queued.due_at, queued.subject, queued.work_key LIMIT 1
  `;
  const nextJob = db.prepare(nextJobQuery);
  const claimJob = db.prepare(`
    UPDATE company_jobs SET lease_token = $token, lease_until = $until, attempts = attempts + 1
    WHERE (subject, source, work_key) = (${nextJobQuery})
    RETURNING subject, source, work_key AS workKey, lease_token AS token, attempts
  `);
  const ownedJob = db.prepare(`
    SELECT 1 FROM company_jobs WHERE subject = ? AND source = ? AND work_key = ?
    AND lease_token = ? AND lease_until > ? AND completed_at IS NULL
  `);
  const finishJob = db.prepare(`
    UPDATE company_jobs SET completed_at = ?, lease_token = NULL, lease_until = NULL
    WHERE subject = ? AND source = ? AND work_key = ?
  `);
  const retryJob = db.prepare(`
    UPDATE company_jobs SET due_at = ?, lease_token = NULL, lease_until = NULL
    WHERE subject = ? AND source = ? AND work_key = ?
  `);
  const lastSource = db.prepare(`
    SELECT revision, checked_at, value_revision, state, retry_at, payload, health
    FROM company_source_versions WHERE subject = ? AND source = ? AND revision <= ?
    ORDER BY revision DESC LIMIT 1
  `);
  const priorValue = db.prepare(`
    SELECT checked_at, payload FROM company_source_versions WHERE subject = ? AND source = ? AND revision = ?
  `);
  const evidence = db.prepare("SELECT detail FROM company_source_versions WHERE subject = ? AND source = ? AND revision = ?");
  const addSource = db.prepare("INSERT INTO company_source_versions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
  const workerState = db.prepare("SELECT value FROM company_worker_state WHERE key = ?");
  const saveWorkerState = db.prepare("INSERT INTO company_worker_state VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value");

  function getSource(subject, source, revision, includeDetail = false) {
    const row = lastSource.get(subject, source, revision);
    if (!row) return { state: "pending" };
    const value = row.value_revision === row.revision ? row : row.value_revision === null ? undefined :
      priorValue.get(subject, source, row.value_revision);
    return {
      state: row.state,
      revision: row.revision,
      checkedAt: row.checked_at,
      lastSuccessAt: value?.checked_at ?? null,
      retryAt: row.retry_at,
      ...(row.health ? { health: JSON.parse(row.health) } : {}),
      value: value?.payload == null ? null : JSON.parse(value.payload),
      ...(includeDetail && row.value_revision !== null
        ? { detail: JSON.parse(evidence.get(subject, source, row.value_revision)?.detail ?? "null") } : {}),
    };
  }

  function sourceHealth(previous, pendingFiling, resolvedAccession) {
    const prior = previous?.health ? JSON.parse(previous.health) : {};
    const pending = prior.pendingFilings ?? (prior.pendingFiling ? [prior.pendingFiling] : []);
    const next = new Map(pending.map(filing => [filing.accession, filing]));
    if (pendingFiling) next.set(pendingFiling.accession, pendingFiling);
    if (resolvedAccession) next.delete(resolvedAccession);
    if (!next.size) return null;
    const pendingFilings = [...next.values()].sort((a, b) =>
      (b.reportDate ?? "").localeCompare(a.reportDate ?? "") ||
      b.date.localeCompare(a.date) || b.accession.localeCompare(a.accession));
    // Keep the existing Scanner wire field, prioritizing the newest annual filing.
    const annual = pendingFilings.filter(filing => /^(10-KT?|20-F|40-F)(\/A)?$/.test(filing.form));
    const pendingForScanner = annual.find(filing => !filing.reportDate) ?? annual[0] ?? pendingFilings[0];
    return JSON.stringify({ pendingFiling: pendingForScanner, pendingFilings });
  }

  function publish(job, now, state, retryAt, payload, detail = null, options = {}) {
    return transaction(() => {
      const keys = [job.subject, job.source, job.workKey];
      if (!ownedJob.get(...keys, job.token, now)) return false;
      const previous = lastSource.get(job.subject, job.source, Number.MAX_SAFE_INTEGER);
      const health = job.source === "sec" ? sourceHealth(previous, options.pendingFiling, options.resolvedAccession) : null;
      if (options.keepLease && previous?.health === health) return true;
      const revision = Number(addRevision.run(now).lastInsertRowid);
      const valueRevision = state === "retrying" ? previous?.value_revision ?? null : revision;
      addSource.run(job.subject, job.source, revision, now, valueRevision, state, retryAt, payload, detail, health);
      if (!options.keepLease) {
        if (retryAt === null) finishJob.run(now, ...keys);
        else retryJob.run(retryAt, ...keys);
      }
      return true;
    });
  }

  return {
    // Validate and accept one complete roster at a time. Same-issuer
    // re-admission can reuse retained facts. A resolved CIK change starts a new identity.
    reconcileRoster(sourceRevision, rows, now, publisherState = null) {
      if (!Number.isSafeInteger(sourceRevision) || sourceRevision < 1 || !Array.isArray(rows) || rows.length === 0 ||
          rows.some(row => typeof row?.symbol !== "string" || !symbolFormat.test(row.symbol) ||
            (row.cik != null && (typeof row.cik !== "string" || !cikFormat.test(row.cik))))) {
        throw new Error("Invalid company roster");
      }
      const sorted = rows.map(row => ({ symbol: row.symbol, cik: row.cik ?? null }))
        .sort((a, b) => a.symbol.localeCompare(b.symbol));
      const intended = new Map(sorted.map(row => [row.symbol, row.cik]));
      if (intended.size !== sorted.length) throw new Error("Duplicate company roster symbol");
      const body = JSON.stringify(sorted);
      return transaction(() => {
        const previousRoster = lastRoster.get();
        if (previousRoster && sourceRevision < previousRoster.source_revision) return false;
        if (previousRoster && sourceRevision === previousRoster.source_revision) {
          if (body !== previousRoster.body) throw new Error("Conflicting company roster revision");
          return false;
        }

        const revision = Number(addRevision.run(now).lastInsertRowid);
        const admissionPriority = previousRoster ? 3 : 2;
        for (const { symbol, cik } of allActive.all()) {
          if (!intended.has(symbol)) {
            const previous = latestListing.get(symbol, revision);
            addListing.run(symbol, revision, previous.identity, cik, 0);
            if (cik && backgroundIssuer.get(cik) && !scannerIssuer.get(cik)) demoteJobs.run(cik);
          }
        }
        for (const { symbol, cik } of sorted) {
          const previous = latestListing.get(symbol, revision);
          const issuer = cik ?? previous?.cik ?? null;
          if (previous?.active === 1 && previous.cik === issuer) continue;
          const identity = previous && (!previous.cik || previous.cik === issuer) ? previous.identity : revision;
          addListing.run(symbol, revision, identity, issuer, 1);
          promoteJobs.run(`${symbol}/${identity}`);
          if (issuer) promoteJobs.run(issuer);
          for (const source of ["profile", "metrics"]) {
            enqueueJob.run(`${symbol}/${identity}`, source, `admission/${revision}`, now, admissionPriority);
          }
          if (issuer) enqueueJob.run(issuer, "sec", `bootstrap/${issuer}`, now, admissionPriority);
        }
        addRoster.run(sourceRevision, revision, body);
        if (publisherState) saveWorkerState.run("publishedRoster", JSON.stringify(publisherState));
        return true;
      });
    },
    reconcileBackgroundRoster(rows, now) {
      if (!Array.isArray(rows) || rows.length === 0 || rows.some(row => typeof row?.symbol !== "string" ||
          !symbolFormat.test(row.symbol) || (row.cik != null && !cikFormat.test(row.cik)))) {
        throw new Error("Invalid background company roster");
      }
      const intended = new Map(rows.map(({ symbol, cik }) => [symbol, cik ?? null]));
      if (intended.size !== rows.length) throw new Error("Duplicate background company symbol");
      return transaction(() => {
        const updates = [];
        for (const { symbol, cik, identity } of allBackground.all()) {
          if (!intended.has(symbol)) updates.push({ symbol, cik, identity, active: 0 });
        }
        for (const [symbol, cik] of intended) {
          const previous = latestListing.get(symbol, Number.MAX_SAFE_INTEGER);
          if (previous?.active === 1) continue;
          const issuer = cik ?? previous?.cik ?? null;
          if (previous?.active === 2 && previous.cik === issuer) continue;
          const identity = previous && (!previous.cik || previous.cik === issuer) ? previous.identity : null;
          updates.push({ symbol, cik: issuer, identity, active: 2 });
        }
        if (!updates.length) return;
        const revision = Number(addRevision.run(now).lastInsertRowid);
        for (const { symbol, cik, identity, active } of updates) {
          addListing.run(symbol, revision, identity ?? revision, cik, active);
          if (active !== 2) continue;
          demoteJobs.run(`${symbol}/${identity ?? revision}`);
          if (cik && !scannerIssuer.get(cik)) {
            demoteJobs.run(cik);
            enqueueJob.run(cik, "sec", `bootstrap/${cik}`, now, -2);
          }
        }
      });
    },
    listBackground() {
      return allBackground.all();
    },
    listTracked() {
      return allActive.all();
    },
    reconcileIssuers(issuerBySymbol, now) {
      return transaction(() => {
        const changes = allRefreshing.all().flatMap(listing => {
          const cik = issuerBySymbol.get(listing.symbol);
          return cik && cikFormat.test(cik) && cik !== listing.cik ? [{ ...listing, nextCik: cik }] : [];
        });
        if (!changes.length) return false;
        const revision = Number(addRevision.run(now).lastInsertRowid);
        for (const { symbol, cik, nextCik, identity, active } of changes) {
          const nextIdentity = cik ? revision : identity;
          addListing.run(symbol, revision, nextIdentity, nextCik, active);
          if (cik && backgroundIssuer.get(cik) && !scannerIssuer.get(cik)) demoteJobs.run(cik);
          if (active === 1) promoteJobs.run(nextCik);
          enqueueJob.run(nextCik, "sec", `bootstrap/${nextCik}`, now, active === 1 ? 3 : -2);
          if (cik && active === 1) for (const source of ["profile", "metrics"]) {
            enqueueJob.run(`${symbol}/${nextIdentity}`, source, `admission/${revision}`, now, 3);
          }
        }
        return true;
      });
    },
    enqueue(subject, source, workKey, dueAt, priority = 0) {
      if (!sourceNames.has(source) || typeof subject !== "string" || typeof workKey !== "string" ||
          !Number.isSafeInteger(dueAt) || !Number.isSafeInteger(priority)) throw new Error("Invalid company job");
      return enqueueJob.run(subject, source, workKey, dueAt, priority).changes > 0;
    },
    claim(now, leaseMs, provider = null, background = false) {
      if (background && nextJob.get({ clock: now, provider, tier: 1 })) return;
      return claimJob.get({
        token: randomUUID(), until: now + leaseMs, clock: now, provider, tier: background ? 2 : 1,
      });
    },
    notePendingFiling(job, now, filing) {
      return publish(job, now, "retrying", null, null, null, { pendingFiling: filing, keepLease: true });
    },
    complete(job, now, value, state = "available", detail = null, resolvedAccession = undefined) {
      if (!["available", "unavailable"].includes(state)) throw new Error("Invalid company result");
      const payload = JSON.stringify(value ?? null);
      const evidenceBody = detail === null ? null : JSON.stringify(detail);
      if (Buffer.byteLength(payload) + (evidenceBody ? Buffer.byteLength(evidenceBody) : 0) > maxPayloadBytes) {
        throw new Error("Company publication too large");
      }
      return publish(job, now, state, null, payload, evidenceBody, { resolvedAccession });
    },
    defer(job, now, retryAt) {
      if (!Number.isSafeInteger(retryAt) || retryAt <= now) throw new Error("Invalid company retry");
      return publish(job, now, "retrying", retryAt, null);
    },
    settle(job, now) {
      const keys = [job.subject, job.source, job.workKey];
      return transaction(() => Boolean(ownedJob.get(...keys, job.token, now)) && finishJob.run(now, ...keys).changes > 0);
    },
    readWorkerState(key) {
      return JSON.parse(workerState.get(key)?.value ?? "null");
    },
    writeWorkerState(key, value) {
      saveWorkerState.run(key, JSON.stringify(value));
    },
    readSource(subject, source, includeDetail = false) {
      return getSource(subject, source, latestRevision.get().revision, includeDetail);
    },
    read(symbols, { asOf, revision, includeDetail = false } = {}) {
      const current = asOf === undefined ? latestRevision.get().revision : visibleRevision.get(asOf).revision;
      const pinned = revision === undefined ? current : Math.min(revision, current);
      return {
        revision: pinned,
        companies: symbols.map(symbol => {
          const listing = latestListing.get(symbol, pinned);
          if (!listing) return { symbol, state: "pending" };
          const subject = `${symbol}/${listing.identity}`;
          return {
            symbol, tracked: listing.active === 1, cik: listing.cik,
            ...(listing.active === 2 ? { background: true } : {}),
            profile: getSource(subject, "profile", pinned),
            metrics: getSource(subject, "metrics", pinned),
            sec: listing.cik ? getSource(listing.cik, "sec", pinned, includeDetail) : { state: "pending" },
          };
        }),
      };
    },
    close() {
      db.close();
    },
  };
}
