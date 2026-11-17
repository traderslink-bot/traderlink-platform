# Coaching Discord refresh restriction

Exact parent fe5892683f3343ae1a8189d6ded6a64ade65ad5f. The refresh worker selects only canonical COMMUNITY_REVIEW_DISCORD_GUILD_ID and asserts each selected target immediately before the common verifier. Other guild historical participants cannot consume the refresh batch or call the provider. Uses Community's shared helper; common verifier remains Community-owned. No unrelated membership, policy, token or transport change.

Three synthetic tests passed: approved participants selected with historical denied targets present; wrong-guild-only queue produces no provider calls; changed selected target rejected at execution. No network calls or live Discord effects. Help unchanged: operational review boundary, no new user flow. Integration must retain common verifier execution-time re-resolution to protect a guild changed after query. Local dependencies are linked to the preserved Coaching donor; no install or build.
