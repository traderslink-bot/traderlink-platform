# Hide internal candle IDs in analysis

Owner requested removing leaked references such as 5m:1790637300000 from SLXN/YMT analysis. Scope: prices, levels, approval and stored raw evidence unchanged. Display parser cleans exact timeframe plus13-digit candle identifiers in existing and future full/simple reads. Source/evidence fields remain untouched. This is not a reason to reject an otherwise usable read or regenerate it.

Runtime prompt correction must cover owner-review, ordinary and simple formats: candle IDs and timestamps are internal evidence only; prose describes the structure without quoting them. Continue exact IDs in dedicated evidence fields when schema requires them.

No production mutation or new paid request. Source correction implemented; focused examples pass for incomplete parenthesis, complete parenthesis, inline including-reference, unchanged prices and ordinary time text. Runtime prompt patch prepared as watchlist-candle-id-prompt.patch (zero-context: apply with --unidiff-zero against exact runtime parent, reconciling timeout patch independently). Runtime deployment/build and hosted visual check remain pending. Coordinator owns deployment; owner approval required before deploy. Help review: existing Help describes analysis prose/levels; no new control or workflow, so no guide change required.
