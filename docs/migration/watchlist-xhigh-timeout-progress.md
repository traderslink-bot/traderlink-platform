# Extra High request timeout correction

Owner requested fixing repeated SOAR/LABT generation failures. Saved hosted audits confirm Luna xhigh timed out at180002ms for SOAR and twice for LABT; another SOAR xhigh completed in163 seconds. These were transport deadlines, not content rejections.

Correction: default xhigh deadline600 seconds; all other efforts retain180 seconds. Explicit configured timeout remains authoritative. Resolve effort per request, snapshot timer/audit deadline so settings changes during a request cannot falsify timing. No prompt, model, output-token, approval, publication, notification or retry changes. No new paid requests. Longer wait alone does not raise token caps or create another request.

Release artifact: watchlist-xhigh-timeout.patch, one runtime source file src/lib/ai/traderslink-ai-read-service.ts. Generator reads the existing runtime lane and leaves it unchanged. Narrow focused getter/deadline/syntax verification in src/scripts/package-watchlist-xhigh-timeout.cjs. Coordinator owns integration/build/release; no deployment performed. Runtime environment override must be checked before release because an explicit180000 will still take precedence.

Live acceptance pending: one owner-initiated Extra High analysis completing under the new deadline. Do not claim every request will finish within600 seconds or that provider latency is repaired.
