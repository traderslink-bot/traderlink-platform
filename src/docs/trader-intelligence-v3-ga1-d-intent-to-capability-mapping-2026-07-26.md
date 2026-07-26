# GA1-D Intent-to-Capability Mapping

| Structured question intent | Deterministic capabilities |
| --- | --- |
| What is hurting me most? | time, price, ticker, sequence, position size |
| When do I trade worst? | time window |
| Do I trade worse after losses? | prior outcome |
| Am I overtrading? | overtrading and sequence |
| Do I give back profits? | profit giveback |
| Which price range is weakest? | price range |
| Which tickers hurt me? | ticker and repeat attempts |
| Are my later trades worse? | sequence |
| Are my larger trades worse? | position size |
| Which habits are improving? | unsupported until governed period comparison |
| Which rules should I test next? | rule candidates, prior outcome, giveback, repeat attempts |

Static synonym fixtures map the matching canonical identifiers. Unsupported
intent, metric, dimension, comparison, missing fee/net authority, mixed
currency, missing tags, candle/market context, risk plan, or insufficient
sample returns a structured limitation rather than prose or a guess.
