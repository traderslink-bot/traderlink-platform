# General and Swings tooltips

Owner-approved display-only slice, following queued legacy-retirement Platform `13211b4094da196abc934920fe416eb043cc6610`. Preserve all earlier queued changes and unrelated dirty checkout files.

- Replace General's information glyph with the same styled question-mark circle used by Potential Path.
- Add the same control below Swings, using the owner's exact approved text: "This list focuses on stocks with a recent, active catalyst and floats above 50 million shares—ideally above 100 million. Stocks with an upcoming catalyst may also be included, regardless of float size."
- Keep General wording unchanged. Use native details/summary so touch and keyboard activation work without a hover dependency. Theme-aware popup styling stays separate from shared global CSS.
- No new Next-Day Watchlist type; that is a naming suggestion awaiting the owner's choice.

Local implementation and focused syntax/markup checks complete. No browser preview, production build, push or deployment. Owner visual acceptance remains pending.

## Separate price-time diagnosis

`watchlistPriceNote` only accepts ticker quote provenance. Card-derived prices intentionally do not reuse card publication/update time. `applyPatch` preserves ticker provenance but otherwise derives price from cards. The one-time Moomoo overnight reference currently records `checkedAt`, not an overnight trade timestamp; its ordinary `data_time` is explicitly not used as an overnight timestamp. These source facts explain how a price can display without an actual observation time. No timestamp behavior is changed by this slice.

Read-only production check confirmed FFAI (1.70), SLXN (0.404), YMT (2.07) and SMMT (18.23) stored as card-derived prices. SMMT separately held an overnight reference of 18.59 with check time only. The stored card observation fields cannot establish the last trade time. The corrective follow-up must carry matched provider price/time through closed-session activation; do not replace it with deployment, card update, request time, or an assumed 8 PM close. This was diagnosis only: no database writes or provider calls.
