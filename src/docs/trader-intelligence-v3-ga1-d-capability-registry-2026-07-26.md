# GA1-D Capability Registry

All Coach capability calls are structured. `Coach` later may recognize a
question, but the backend accepts only known intent/capability keys.

| Capability | Executor | Dimensions | Finding / rule to test |
| --- | --- | --- | --- |
| core, daily, weekly, monthly performance | GA1-A query | date/week/month | summary or ranked condition |
| session performance | GA1-A query | session | worst time window |
| time, price, hold, direction, sequence, repeat, size | GA1-B governed preset | respective declared dimension | weak condition / linked GA1-C candidate where applicable |
| ticker performance, giveback, overtrading, rule candidates | GA1-A query | ticker/date/sequence/prior outcome | weak ticker, giveback, overtrading, rule to test |
| setup/mistake tags, habit trend | unsupported response | none | requires tags or governed period comparison |

The metric registry remains GA1-A's content-addressed registry. GA1-D exposes
its approved metrics rather than creating another metric calculator. The
dimension, filter, comparison, and finding registries are the versioned Coach
types and static maps in `analytics/coach`.
