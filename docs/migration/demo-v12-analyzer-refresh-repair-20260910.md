# Demo Analyzer count repair

Owner reported aggregate Analyzer94 versus Your analyzed trades89 after version11. Source cause: rebuildAffectedExecutionChains versions every trade in the affected instrument chain; version11 regenerated only the two edited trades. Your analyzed trades requires analysis.round_trip_version_id to equal the active trade current_version_id. The other three YXT and two WETO analyses can therefore be stale. Production read-only confirmation requested from Coordinator.

Implementation complete: version12 regenerates all seven Analyzer-backed YXT/WETO trades from saved candles. Version11 executions already matching the approved correction skip appendVersion and rebuild; matching notes also skip new revision. Existingversion11account keeps817executions/170trades/1632executionversions and records oneversion12application with zero mappings. Earlier packs still receive approvedversion11corrections and refresh the entire affected chains. No new provider request, fee or P/L change, migration, schema, browser action, or local tests/build/server.

Exact integration allowlist, relative to productiondc3cf0099bf952b130947cee26a94007ef452f4a (Coordinator must refresh parent):

- src/modules/journal/server/demo/journal-demo-red-revision.ts: already-corrected facts skip execution writes/rebuild; unchanged notes skip revision.
- src/modules/journal/server/demo/journal-demo-august-pack.ts: version12identity/hash; Analyzer population includes all affected symbols, not just edited trades.
- src/modules/journal/server/demo/journal-demo-current-version.ts: UUID ed7d910d-6e50-4af8-9e4a-745e9a782dc1.
- src/modules/journal/server/demo/journal-demo-canonical-fact-materializer.ts: ONLY pin11UUID a2703b8c-41a7-48ac-8a1c-62f7695ed6f1 and add12CURRENT. Preserve production Session Tracker wording.
- src/modules/journal/server/demo/journal-demo-materializer.ts: ONLY preserve exact11empty-application exception and add exact12/currentUUID exception. Initial seed still requires nonempty mappings.
- This record and relevant new plan/progress status paragraphs only.

All version10/11JSON, financial data, historical application manifests, provider plumbing, owner opt-outs and real accounts preserved. No global query filter removal: repair current Demo saved-analysis references. Source graph compiler check covers these five files. Production acceptance requires94current analyzed trades with matching filters,zero stale ready references forYXT/WETO,unchanged817/170/1632andP/L,andrepeatpassivecounts stable. Owner controls Chrome; do not force browser use. Coordinator owns Git/push/deploy/health. Source implementation is not live acceptance.
