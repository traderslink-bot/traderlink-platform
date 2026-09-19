# Mobile ticker chart layout

Owner-approved: screen-wide mobile TradingView chart; preserve upper content
widths; remove whitespace beneath the final chart. At 620px and below only,
the chart breaks out of gutters and its enclosing bottom paddings are removed.
Desktop, chart height, embed behavior and other pages are unchanged.

Help reviewed: no workflow changes, so no guide update needed.
Focused CSS parsing and selector checks; hosted visual acceptance pending.
No local server or full build. Coordinator owns release.

Live 390px verification found viewport units included the desktop browser's
scrollbar, clipping chart edges. Follow-up uses the existing dashboard/container
gutters instead: 32px per side below 600px, 40px at 600-620px. Bottom padding
was confirmed zero through all wrappers. Mobile recheck pending follow-up release.
