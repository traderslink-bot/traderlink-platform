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
