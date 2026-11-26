# Desktop Scanner layouts

Edit layout lets users move and resize cards on a four-column grid. Dragging
updates an outline and commits placement on release. Keyboard arrows on a
handle perform the same adjustments. Moves can swap compatible cards.
Resizing can relocate adjacent cards into available cells. Cancel restores the
active layout. Reset loads the default into the draft. Named layouts persist
in this browser and can be selected again after reload.

Isolated Chromium QA covered outline-only dragging, pointer and keyboard
resize, named layouts, reset and cancel, and chart canvas and feed continuity.
Median first-row time was 561 ms before and 596 ms after across three runs
per version with fixture data. Focused TypeScript and lint passed.

The desktop Edit layout entry uses the Dashboard Customize icon in the
Scanner top navigation. Editing controls stay above the grid.

## Trading Workspace top navigation actions

Cancel has an outlined button and Save has a filled button with a contrasting border. Save remains visible while disabled and enables when the layout name is entered. Isolated Chromium checks with the production theme verified the labels, borders, disabled and enabled Save, and both actions in light and dark mode.

## Resized scanner content — November 17, 2026

The owner reported blank space below scanner results after making cards taller.
The production-source browser reproduction confirmed that a card grew from
408px to 608px while its stock-card list stopped at 420px. Momentum also kept
its 420px limit. Top Losers and HOD Drops have an additional results Stack
that needs to share the card height with its scrolling list.

The fix makes these results fill the remaining desktop card space. The rapid
section keeps its own height, and the main HOD results fill the space below it.
Table, Cards and Two rows use the same sizing contract. The browser check
covers actual layout handles, bottom and top resizing, reducing the height,
saved sizes after reload, and scrolling. Mobile retains its content height.
Verified against production source b48bc1d71. All 15 scanner/view combinations
passed actual bottom-edge and top-edge dragging, shrinking, saved-size reload,
scroll containment and the styled scrollbar checks. Another 20 browser cases
covered mobile portrait and landscape, light mode at 1024px and dark mode at
2560px. HOD rapid rows retained their height; Momentum Early signals remained
reachable. After the fix a 200px card increase expands its results by 200px,
and a further 120px top-edge expansion increases the results by 120px. The
remaining 11px below the scroll area is the existing card padding and border.
The four existing focused tests, changed-file TypeScript and lint passed.
Browser data was synthetic; no signed-in live verification or deployment was
performed. The fix adds CSS sizing rules and two DOM attributes.

## Additional scanner cards

See the [additional-card implementation and mobile verification](workspace-additional-cards-progress.md).
