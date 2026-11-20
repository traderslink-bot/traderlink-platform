# Screeners consumer compatibility — held source follow-up

Screeners owner supplied the authoritative read-only consumer handoff. HEADc234 reader, installed861 source and own8d99 preimages are byte-identical. Independently checked all four supplied hashes in ownHEAD: candle-cache-reader dcf010804095e358a747395009819096d6183c53e60b2ba488657942cb501c40; live-vwap-worker41b8f25297af27b90a4623d0ee006a607bf6c75c9b98c0929a16cf5fc5d25972; live-market-worker22972a4be1fbb317ca96bdcc64253ea17909a42458814cab6d65147a37038794; entry314e003e14650cbc92341f6383c031773fdb075f93d9534dd8611744a09c0026.

Owner confirms no overlapping Screeners edit. This is source compatibility, not live acceptance. Root retains future gateway-first rollout/configuration authority. The explicit worker environment still omits the new flag; it intentionally stays legacy. No entry, live-worker, installed3067 producer or runtime/config/credentials were edited.

## One new edge-case correction

The neutral numeric-row codec originally rejected a malformed optional weighted-price value for the entire batch. Legacy consumer behavior marks only that symbol partial. Treat unusable optional weighted values as absent at the neutral boundary, never as zero or OHLC-derived prices. Preserve finite numbers and explicit null exactly. The existing consumer then makes positive-volume/missing-VWAP seeds partial while preserving peers; zero-volume/empty complete histories remain valid. Required candle fields, schema, columns, row width and source boundary validation remain unchanged.

The original Company/cache13 packet41550bfca6e0d74956f974af2bef28cac6ae2ee147b39bc44ca5fd7efe5fe420 is immutable. This follow-up is an additive three-file overlay against its exact portable-codec postimage, plus a new dedicated test and this record. Do not replace or regenerate the frozen packet.

## Qualification

26 focused checks across four files pass: new authoritative consumer scenarios, existing wire codec, original seed reader and original live VWAP worker. Targeted TypeScript7 paths and lint0errors/0warnings pass. Cases cover exact seconds/millisecond boundaries, missing/invalid VWAP peer isolation, quiet histories, missing/partial coverage, strict timestamps, source basis/interval/date/end rejection, sequential50-symbol requests, prior yielded batches surviving later busy status,401/429/502/503 classification, original retry behavior and fresh reconnect boundaries.

All fetches are mocked, no provider requests or external writes. One guarded finite source batch used available host capacity and released its own guards normally. No new browser, preview, service restart, configuration change, migration, provider switch, Git index/ref change or deployment. Actual live-worker acceptance remains a future separately authorized release checkpoint.

External receipt directory: /tmp/traderlink-provider-screener-compat-20261119. Root owns source preservation/integration. DO NOT DEPLOY remains in force.
