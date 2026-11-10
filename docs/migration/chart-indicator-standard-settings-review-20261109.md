# Chart indicator correction — research and layout review

Owner direction November 9, 2026: implement familiar TradingView/Moomoo indicator behavior, research each indicator before completion, remove invented VWAP terminology, and provide complete configurable EMA/SMA choices. This supersedes the limited six-indicator prototype's acceptance assumptions. No production update is authorized by this research checkpoint.

## Actual current gaps

- Six indicator types exist, but each instance has only id/type/period/color/width. This is not a complete indicator-specific settings contract.
- EMA/SMA accept repeated instances and editable periods, but the add/edit interaction makes these options poorly discoverable. They lack source, offset, visibility and smoothing controls.
- VWAP legend says `VWAP · Eastern day`; the settings explanation repeats that wording. The implementation groups by an Eastern calendar date. This does not implement the documented configurable Session anchor and must not be described as standard session VWAP merely by relabeling it.
- RSI is one fixed-source length with no editable reference levels, smoothing or per-line visibility.
- MACD hardcodes 12/26/9 EMA calculations and gives no independent oscillator/signal settings or plot styles.
- Bollinger hardcodes a two-standard-deviation multiplier, close source and SMA basis; upper/lower colors are not independently configurable.
- The renderer hardcodes a second plot's color. A period/color/width-only generic editor cannot correctly configure a multi-plot indicator.
- Calculation history and display history must be separated: panning to load older bars must not repeatedly re-seed already mature studies or produce unexplained jumps. Existing saved preferences must survive an expanded contract.

## Primary references checked

1. EMA: https://www.tradingview.com/support/solutions/43000592270-exponential-moving-average/
2. SMA: https://www.tradingview.com/support/solutions/43000696841-simple-moving-average/
3. VWAP: https://www.tradingview.com/support/solutions/43000502018-volume-weighted-average-price-vwap/
4. RSI: https://www.tradingview.com/support/solutions/43000502338-relative-strength-index-rsi/
5. MACD: https://www.tradingview.com/support/solutions/43000502344-moving-average-convergence-divergence-macd-indicator/
6. Bollinger: https://www.tradingview.com/support/solutions/43000501840-bollinger-bands-bb/
7. Smoothing: https://www.tradingview.com/support/solutions/43000742042-i-see-a-smoothing-section-in-an-indicator-s-settings-what-does-it-do/
8. Moomoo indicator controls: https://www.moomoo.com/us/learn/how-to-customize-technical-indicators-in-moomoo
9. Moomoo adding/removing MA lines: https://www.moomoo.com/us/learn/how-to-custom-technical-indicators
10. Moomoo RSI 6/12/24: https://www.moomoo.com/mm/support/topic3_239?from_platform=4&lang=en-us&platform_langArea=mm
11. Moomoo VWAP: https://www.moomoo.com/my/learn/what-is-the-volume-weighted-average-price
12. Moomoo chart manual: https://www.moomoo.com/ca/manual/topic-14-220

TradingView and Moomoo are different implementations; do not claim their defaults/options are identical. TradingView's documented input definitions provide the calculation/settings reference; Moomoo supplies the multiple-line workflow reference. Broker screener API defaults are not evidence of chart UI defaults.

## Required indicator-specific inventory

| Indicator | Inputs/calculation | Plot controls |
| --- | --- | --- |
| EMA / SMA | Editable positive length per line; source; positive/negative offset; optional smoothing type/length and smoothing Bollinger deviation; multiple independently configured lines | Each line visible/color/width/style; values/axis labels; remove line; reset defaults |
| VWAP | Session anchor plus documented Week/Month/Quarter/Year/Decade/Century and event anchors; source default HLC3; offset; hide on daily or above; standard-deviation/percentage band mode; three independently enabled multipliers | VWAP and each upper/lower band visibility/color/width/style; band fills; precision |
| RSI | Length and source; Wilder RMA calculation; optional smoothing type/length/deviation; independently selectable lines to support multiple periods | RSI and smoothing styles; upper/middle/lower levels, visibility and fills; ordinary 0–100 scale |
| MACD | Source; fast/slow/signal lengths; oscillator MA type EMA/SMA; signal MA type EMA/SMA; defaults 12/26/9 | Independent MACD/signal line styles, histogram visibility and rising/falling positive/negative colors; zero level |
| Bollinger Bands | Length; basis MA type; source; standard-deviation multiplier; offset; default 20/2 | Independent basis/upper/lower styles and visibility; background fill |

Shared source choices: Open, High, Low, Close, HL2, HLC3, OHLC4; verify additional source options from the reference UI rather than assuming a complete list from prose. Sources that depend on other indicators require explicit dependency handling and cannot be fabricated from OHLC.

TradingView smoothing choices documented: None, SMA, SMA + Bollinger Bands, EMA, SMMA/RMA, WMA, VWMA. Smoothing is an additional plot, not replacement of the original EMA/SMA/RSI calculation.

Calculation timeframe and wait-for-timeframe-close, plus visibility by chart timeframe, belong in the complete reference inventory. Higher timeframe studies must be computed from correct higher timeframe candles and mapped without lookahead; styling a lower timeframe study does not implement this option.

Event-anchored VWAP requires actual earnings/dividend/split events. The current OHLCV-only indicator path does not prove those facts are available. Do not silently reset on calendar dates or offer an inert event option. Verify the underlying event/data path before claiming those anchor choices complete.

## Concrete proposed editor composition

Use the existing chart's Indicators entry, with a searchable library and an added-indicators list. Select an added indicator to edit it. Standard tabs: Inputs / Style / Visibility. Keep chart preferences in the gear menu. On desktop the indicator editor is a right drawer; on mobile it is a bottom panel. No new preferences page.

EMA Inputs example (periods below illustrate configuration, not forced additions):

    EMA                              eye   settings   remove
    Inputs | Style | Visibility
    Length     Source     Offset
    9          Close      0                 remove line
    20         Close      0                 remove line
    50         Close      0                 remove line
    200        Close      0                 remove line
    + Add line
    Smoothing [None] ... dependent controls when selected
    Reset defaults

Each line is independently editable; common lengths are conveniences, not a fixed allowed list. Adding EMA must not force four lines on a user's chart. Existing single-line saved setups remain unchanged. SMA uses the same line editor with its own calculations/settings. The chart legend identifies each enabled line's type, length and value; controls hide, edit or remove it without reopening the library.

VWAP Inputs example:

    VWAP
    Inputs | Style | Visibility
    Anchor Period [Session]
    Source [HLC3]       Offset [0]
    Hide on 1D or above [checkbox]
    Bands Calculation Mode [Standard deviation]
    Band 1 [checkbox] [1.0]
    Band 2 [checkbox] [2.0]
    Band 3 [checkbox] [3.0]

No `Eastern day` indicator title or invented alternate VWAP name. Exchange/session rules are implementation facts; chart display timezone must not redefine the trading session. Overnight sessions must use genuine provider/session data.

## Completion evidence, not prototype claims

- Source-backed input/style/visibility matrix for every implemented type, distinguishing TradingView and Moomoo differences and any unresolved options.
- Independent numerical reference fixtures for source selection, seed/warm-up, MA variants, RSI, MACD, Bollinger deviations and VWAP anchors/bands. Verify zero-volume/missing bars, splits, session transitions and DST. Do not silently choose flat RSI behavior or differing MACD histogram scaling without verifying the selected reference.
- A saved v1 preference migration retaining each existing indicator id/length/style and no forced default studies. Round-trip save, reopen, symbol changes, logout/login and simultaneous-chart behavior must retain the setup.
- Actual main/compact shared-chart browser checks: multiple EMA/SMA lines, independent plots, edit/hide/remove, style and visibility, chart scale/panes, mobile scroll/focus and cleanup.
- Measure realtime recalculation and historical loading with the chosen settings; loaded-history boundaries must not create unexplained indicator jumps.
- Settings layout needs owner review before the redesigned UI is implemented, per shared project UI-design rule. No implementation, tests, preview changes or production deployment claimed by this document.

Status: research and concrete layout proposal prepared; implementation not complete. Help guide updates must accompany the eventual accepted editor, not describe this proposal as already live.

### Event-anchor implementation evidence

Alpaca documents split/dividend event types and process-date query ordering at https://docs.alpaca.markets/us/reference/corporateactions-1 . Its official SDK models identify ex_date separately from process_date: https://github.com/alpacahq/alpaca-py/blob/master/alpaca/data/models/corporate_actions.py . Implemented calendar-date event resets from ex_date for forward/reverse stock splits and cash/stock dividends, with complete pagination, normalized symbol identity and no processing-date substitution. The Earnings anchor still needs a verified earnings source; no inert Earnings option was added. Owner asked whether existing Finnhub metadata should supply those dates; prices/candles remain Alpaca.

### Public native source reference recovered — 2026-11-10 UTC

TradingView's anonymous chart UI asked for an account, but the native script itself is explicitly published with scriptAccess=open_no_auth. Its pinned VWAP48.0 source is available at https://pine-facade.tradingview.com/pine-facade/get/STD%3BVWAP/48.0 . Public source SHA256176f7d7ab679f72bfe98e7ac6cb7c10279a91cd15aa50a982107f58bc3ac83a8. No authenticated account, bypass or source redistribution was used. The [native reference manifest](chart-indicator-native-reference-manifest-20261110.json) records provenance for all six native scripts; onlyVWAP was inspected/implemented at this checkpoint.

NativeVWAP source confirms Session/Week/Month/Quarter/Year/Decade/Century and earnings/dividend/split event resets; HLC3; hide1D=false; Chart timeframe with gaps; offset0; standard-deviation/percentage band units; multipliers1/2/3 with only firstenabled;0.5inputstep/nonnegative/no explicit multiplier maximum; green/olive/teal band pairs and95transparency fills. Native inputs leave offset bounds unspecified; the application still documents its supported±500offset range rather than claiming that cap is a native input rule. Native earnings reacts to actual or standardized earnings facts, including reportedzero; dividends use gross, splits use denominator.

Palette hexes verified against https://www.tradingview.com/pine-script-docs/visuals/colors/ : green#4CAF50,olive#808000,teal#089981. Native plot-order reference is https://www.tradingview.com/pine-script-docs/visuals/overview/#z-index : fills precede plots unless explicit_plot_zorder is enabled; nativeVWAP does not enable it. Some older examples on the Colors page contradict that dedicated group ordering. Use the explicit visual-order specification for this native script: fills above background/grid and below plots, with native crosshair on top.

This resolves the earlier native-source/defaults access gap. It does not claim an authenticated native numerical-runtime comparison or completed earnings/external-source support.


### External-source lifecycle reference — 2026-11-10

Rechecked the English official Overview, External uses section: https://www.tradingview.com/pine-script-docs/visuals/overview/#external-uses-exports-alerts-and-more . Calculated plots remain eligible as another indicator's Source even when their plot or entire indicator is hidden. Editing the upstream plot changes downstream calculations; removing the upstream indicator removes its dependent script. Consequently the future dependency implementation must separate calculation availability from visual visibility and remove dependents transitively. It must not silently replace a removed input with Close or disable upstream deletion. Horizontal reference levels are not automatically eligible merely because our renderer represents them as line series.

The same official page describes offsets as visual displacement of per-bar calculations. That establishes presentation semantics, but does not by itself prove how an external Source is sampled across different calculation timeframes or whether an exported external plot incorporates its visual offset. Those combinations remain unverified; no guessed sampling rule has been implemented.

Owner requested explanations of earnings dates and indicator linking. Earnings dates are for the optional Earnings VWAP anchor, not ordinary Session VWAP. Linking can, for example, smooth RSI with an SMA; multiple independent EMA periods do not require linking. A recommendation to schedule these additions after standalone studies is not an approved scope change. Existing full goal and strict indicator order remain in force, pending the owner's decision. No source or hosted change in this research checkpoint.
