# Links First Impression And Relationship Memory Design

## Status

**Owner approved on 2026-08-20 with the requested clarifications incorporated:
Links is generally helpful and may surface useful information users did not know
to ask for without following a fixed response pattern, and Meet Links positively
introduces “remember this” as a continuing relationship capability. No visible
UI or data implementation has started.**

This design is controlled by the
[Links AI Chat Professional Agent Remediation Plan](ai-chat-professional-agent-remediation-plan.md)
and tracked in
[Links AI Chat Professional Agent Remediation Progress](ai-chat-professional-agent-remediation-progress.md).

## Purpose

This design defines the first experience a trader has with Links and the exact
way relationship memories are proposed, saved, used, reviewed, corrected,
disabled, and forgotten. The experience should make Links feel like one smart,
successful, knowledgeable and supportive TradersLink buddy while keeping every
memory transparent and controlled by the trader.

The design does not implement provider readiness, factual-claim rendering,
adaptive context, database storage, the owner personality controls, or any
visible component. Those remain later approved checkpoints.

## Locked identity direction

- Feature name: **Links AI Chat**
- Assistant name: **Links**
- Descriptor: **Your TradersLink AI assistant**
- Avatar: existing `public/icons/traderlink-512.png` continuous interlocking
  chain on a deep-blue background
- Personality: one owner-defined Links personality for every user
- Relationship rule: memory changes what Links knows about the trader, not who
  Links becomes
- Voice: confident, socially natural, polished, perceptive, engaging,
  knowledgeable, supportive and evidence-led without sounding clinical

## Existing surface retained

The current shared page/drawer structure remains the starting point:

- desktop conversation list beside the active conversation;
- mobile conversation list behind its own reachable control;
- selected conversation title, rename and archive/restore actions;
- selected-account and analysis-scope behavior;
- Daily Trade Tracker context when deliberately opened from a trading day;
- bounded message history with earlier-message loading;
- evidence and confirmation cards;
- pinned multiline composer; and
- separate close controls for the mobile conversation list and global Chat.

The approved light Material dashboard remains authoritative. This design does
not add a second shell, dark AI theme, gradient orb, robot, human face, or
separate Chat application.

## Information hierarchy

The active Chat surface uses this order:

1. Links identity and current conversation controls
2. Exact selected account or deliberate page/day context
3. Optional analysis scope
4. Conversation, first impression, or memory management body
5. Pinned composer and clear send status

The first-impression content disappears once the trader sends the first message.
It never occupies space above an active conversation.

## Meet Links — optional first-use introduction

Links should not need several conversations to learn basic user-declared context,
and it is not allowed to infer a trader's style, experience, setups, goals or
emotional patterns from P/L or executions. A short structured introduction gives
the relationship an accurate starting point.

The experience is conversational but deterministic. It uses fixed reviewed
questions and controls rather than a provider generation, saves nothing until
the final review, and can be skipped completely.

### Opening copy

- Heading: **Hey, I’m Links. Let’s get to know each other.**
- Body: **Tell me a little about how you trade and what you want to work on. You
  can skip anything, and I’ll show you exactly what I’m going to remember before
  anything is saved.**
- Primary action: **Let’s do it**
- Secondary action: **Skip for now**

The introduction also presents memory as a useful Links capability rather than a
warning:

- Label: **One useful thing about Links**
- Body: **When something matters for future conversations, just say “remember
  this.” I’ll carry it forward so we can build on it next time.**

Skipping opens the normal first-ever Chat experience with no missing-feature
penalty, reminder pressure or incomplete-profile warning. **Meet Links** remains
available later from **What Links remembers**.

### Flow and navigation

The first-ever **Meet Links** experience temporarily uses the full interior of
the existing Links AI Chat drawer or direct page. The desktop conversation list is not
shown because no conversation is needed yet. The Links AI Chat drawer retains its
approved width and close control; the current dashboard route does not change.

```text
Open Links AI Chat
    │
    ▼
Meet Links introduction ── Skip for now ──► Normal first-ever Chat
    │
    ▼
Eight optional question sections
    │
    ▼
What Links will remember
    ├── Remember and start chatting ──► Blank Chat with saved memories
    └── Start without saving ─────────► Blank Chat with no memories
```

Navigation rules:

- The introduction is not counted as a question.
- Show **1 of 8** through **8 of 8** as neutral orientation, not a streak,
  score, completion percentage or engagement reward.
- **Back** preserves the current unsaved answer and returns to the prior section.
- **Skip** leaves only the current question blank and advances.
- **Skip for now** exits the entire introduction after a confirmation only when
  the trader has already entered unsaved answers.
- Closing Links AI Chat after entering an answer shows **Leave Meet Links?** / **Your
  answers haven’t been saved and will be cleared.** / **Leave without saving** /
  **Keep going**. No local or server draft survives a deliberate exit.
- Switching Journal accounts during the flow is not allowed. **Change account**
  exits after warning that unsaved account-specific answers will be cleared.

### Desktop shell

The 860-pixel drawer uses a centered question area with a maximum readable width
of approximately 600 pixels. The header remains compact and the actions stay at
the bottom of the introduction body rather than at the bottom of the browser.

```text
┌──────────────────────────────────────────────────────────────┐
│ [chain] Links · Meet Links                         [Close]   │
│         Your TradersLink AI assistant                        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  3 of 8                                      [Skip for now] │
│                                                              │
│  How do you trade most often?                                │
│  Choose the answer that feels closest.                       │
│                                                              │
│  [Day trading] [Swing trading] [Both]                        │
│  [Still figuring it out] [Something else]                    │
│                                                              │
│  Something else                                              │
│  [________________________________________________________]  │
│                                                              │
│  [Back]                                      [Continue]      │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

- The selected Journal account display name appears beneath the progress line on
  every account-scoped question.
- Single-choice controls use selectable cards or chips with visible selected,
  focus and disabled states.
- Multiple-choice controls state **Choose any that fit** and permit deselection.
- Free-text fields remain secondary to the question and do not submit on Enter
  when multiline input is expected.
- **Continue** is enabled with a valid selection or free-text answer. **Skip** is
  always available.

### Questions

Links asks one question at a time and always provides **Skip** and **Back**.

1. **What should I call you?**
   - Optional free text, suggested from the stable Platform profile when an
     approved display name already exists.
   - Proposed scope: **Across TradersLink**.
   - Field label: **Name**.
   - Primary action: **Continue**.

2. **How would you describe your trading experience?**
   - Choices: **Getting started**, **Building experience**, **Experienced**,
     **Long-time trader**, and **I’ll describe it**.
   - The optional own-words field preserves the trader's wording.
   - Proposed scope: **Across TradersLink**.
   - Experience helps Links select relevant examples and avoid talking above or
     below the trader. It does not select another personality or expose a user
     answer-depth control.
   - Selecting **I’ll describe it** opens the field **Describe your experience**.

3. **How do you trade most often?**
   - Choices: **Day trading**, **Swing trading**, **Both**, **Still figuring it
     out**, and **Something else**.
   - Follow-up: **What markets or products do you trade?** with supported visible
     choices and optional own wording.
   - Proposed scope: **{Journal account name} only**.
   - This describes the trader's general approach. It never classifies an
     individual trade or implies that TradersLink currently supports every named
     source or product.
   - This section has two short screens under **3 of 8**: trading approach first,
     then **What markets or products do you trade?**
   - Market/product choices: **Stocks**, **Options**, **Futures**, **Forex**,
     **Crypto**, and **Something else**. Show **Choose any that fit**.
   - Supporting copy: **This helps Links know your trading. It doesn’t mean every
     market or broker can be imported yet.**

4. **What types of setups do you look for?**
   - Optional free text with examples such as breakouts, pullbacks, reversals,
     momentum or catalyst-driven setups.
   - When accepted saved setup names, tags or rules already exist, Links may show
     them for selection without inventing a match.
   - Proposed scope: **{Journal account name} only**.
   - A stated setup is relationship context, not proof that any execution used
     that setup. Applying a setup or tag to a trade remains a separate explicit
     action.
   - Suggested choices: **Breakouts**, **Pullbacks**, **Reversals**,
     **Momentum**, **Catalyst-driven**, and **Something else**. Show **Choose any
     that fit**.
   - Selecting **Something else** opens **Add your setup wording**. The trader can
     add more than one bounded custom setup and remove any before review.

5. **What are you working on right now?**
   - Optional choices include entries, exits, following rules, selectivity,
     position-sizing process, patience, review consistency, understanding data,
     or the trader's own wording.
   - Proposed scope: **{Journal account name} only** unless the trader deliberately
     chooses **Across TradersLink**.
   - Suggested choices: **Entries**, **Exits**, **Following rules**,
     **Selectivity**, **Position sizing**, **Patience**, **Review consistency**,
     **Understanding my data**, and **Something else**. Show **Choose any that
     fit**.

6. **Are there emotions or situations that tend to affect your trading?**
   - Supporting copy: **Share only what you want Links to keep in mind.**
   - Optional choices may include FOMO, hesitation, impatience, frustration after
     a loss, overconfidence after a win, revenge trading, fear, boredom, and the
     trader's own wording.
   - Proposed scope: **{Journal account name} only**.
   - The product does not label the trader's answer a weakness unless the trader
     uses that word. Links can help the trader notice and reflect on an explicitly
     shared pattern, but cannot diagnose, shame, predict behavior, infer emotion
     from P/L, or automatically tag a trade.
   - Show **Choose any that fit**, **Nothing right now**, and **Skip**. Selecting
     **Nothing right now** clears and disables the other selections until it is
     deselected.
   - Selecting the own-words choice opens **Describe what tends to affect your
     trading**.

7. **Is there a review routine you want to build?**
   - Optional choices: **After each session**, **Weekly**, **Monthly**, **Something
     else**, and **Not right now**.
   - This proposes a relationship memory only. Any notification or scheduled
     reminder requires its own exact preview and confirmation.
   - Show **Choose any that fit**. Selecting **Not right now** clears and disables
     the routine selections until it is deselected.

8. **Is there anything else I should know?**
   - Supporting copy: **Share anything else you’d like Links to keep in mind.
     Don’t include passwords, broker login details, account numbers or other
     secrets.**
   - Optional bounded free text with **Skip** and **Back**.
   - Proposed scope: **{Journal account name} only**, with an explicit option to
     change it to **Across TradersLink** during final review.
   - The final review preserves the trader's wording. Links does not silently
     reinterpret the text, turn it into a diagnosis, infer additional memories,
     or treat it as authorization for an action.
   - Credential-like, account-secret or otherwise prohibited content is rejected
     before a memory proposal can be saved, with plain guidance about what can be
     remembered safely.
   - The multiline field label is **Anything else** and displays a visible
     500-character limit.
   - **Continue to review** replaces **Continue** on this final question.

Links does not ask the trader to define how Links should help. Links is expected
to understand its complete capabilities, answer the immediate question and
surface useful help the trader may not know is available.

The trader's Meet Links answers provide relationship context, not a boundary on
how Links may be useful. Links can answer a direct question, surface other
relevant deterministic information, connect data, or point out a useful
TradersLink capability the trader may not have known to ask about.

There is no required response structure, depth, timing, number of observations,
or after-answer step. Sometimes the most helpful response is brief. Sometimes
additional supported context is useful. Links uses its stable personality and
good judgment rather than following a mechanical helpfulness template.

### Final review

- Title: **What Links will remember**
- Body: **Review the wording and where each memory will be used. You can change
  or remove anything before saving.**
- Each proposed item shows its exact wording, **Across TradersLink** or exact
  Journal-account scope, **Edit** and **Remove**.
- Primary action: **Remember and start chatting**
- Secondary action: **Start without saving**

No memory record is created until **Remember and start chatting** is selected.
The complete set saves atomically or not at all. The trader can later edit,
reconfirm or forget every item through **What Links remembers**.

### Desktop final-review layout

```text
┌──────────────────────────────────────────────────────────────┐
│ [chain] Links · Meet Links                         [Close]   │
├──────────────────────────────────────────────────────────────┤
│ What Links will remember                                     │
│ Review the wording and where each memory will be used.       │
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Call me Jordan.                         Across TradersLink│ │
│ │ [Edit] [Remove]                                         │ │
│ └──────────────────────────────────────────────────────────┘ │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ I look for breakouts and pullbacks.                     │ │
│ │ Day Trading Account only                                │ │
│ │ [Edit] [Remove]                                         │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ [Back] [Start without saving] [Remember and start chatting] │
└──────────────────────────────────────────────────────────────┘
```

- Review groups **Across TradersLink** memories before exact Journal-account
  memories.
- Every item has independent **Edit**, **Remove**, and scope controls where both
  scopes are valid.
- The review does not display empty or skipped questions.
- **Start without saving** requires confirmation when at least one proposed
  memory exists: **Start without saving these memories?** / **Nothing from Meet
  Links will be saved.** / **Start without saving** / **Keep reviewing**.
- If every question was skipped, the review explains **You haven’t asked Links to
  remember anything yet.** and the primary action becomes **Start chatting**.

### Completion state

After an atomic save, return directly to the normal blank Chat composer and show:

- Heading with an approved name: **Good to meet you, {first name}.**
- Heading without an approved name: **Good to meet you.**
- Body: **We’re set. What’s on your mind?**
- Utility action: **What Links remembers**

The composer is focused and ready. No conversation is created until the trader
submits a question or selects a starting question. Opening the memory view does
not create one.

### New Journal account behavior

An existing user adding another Journal account does not repeat the full
introduction. Links retains approved **Across TradersLink** memories and offers a
short **Tell Links about this account** flow containing only trading approach,
markets/products, setups, current focus, emotional patterns and account-specific
routines, followed by the optional **Is there anything else I should know?**
question scoped to that account. It remains optional and saves through the same
final review.

The short account flow uses the same full-width shell and question components,
labels itself **Tell Links about {Journal account name}**, and omits name and
experience because those approved memories already apply across TradersLink.

## Meet Links mobile flow — 390 by 844

The mobile experience uses the full-width Links AI Chat surface with no conversation
panel underneath it.

```text
┌──────────────────────────────────┐
│ [chain] Links            [Close] │
│ Meet Links                       │
├──────────────────────────────────┤
│ 6 of 8            [Skip for now]│
│ Day Trading Account              │
│                                  │
│ Are there emotions or situations │
│ that tend to affect your trading?│
│                                  │
│ Share only what you want Links   │
│ to keep in mind.                 │
│                                  │
│ [FOMO] [Hesitation]              │
│ [Impatience]                     │
│ [Frustration after a loss]       │
│ [Overconfidence after a win]     │
│ [Revenge trading] [Fear]         │
│ [Boredom] [Something else]       │
│ [Nothing right now]              │
│                                  │
│ [Back]                 [Continue]│
└──────────────────────────────────┘
```

Mobile requirements:

- Header, progress, question, supporting copy and selected-account label remain
  visible without horizontal scrolling.
- The question body scrolls independently when choices exceed the available
  height. **Back** and **Continue** remain in a sticky bottom action area above
  the safe-area inset.
- **Skip for now** has a 44-pixel target and never competes visually with the
  primary action.
- Selectable cards/chips wrap to content width; long labels become full-width
  rows rather than shrinking text.
- Opening a text field moves the question and field above the software keyboard.
  The sticky actions remain reachable after the user dismisses or scrolls above
  the keyboard.
- The 500-character field shows its counter beneath the input without covering
  the action area.
- Final-review cards stack scope, source and actions under their wording. The
  primary **Remember and start chatting** action is full width; **Back** and
  **Start without saving** remain separately reachable.
- Screen-reader announcements state the question number, question, selection
  mode and selected-account scope without announcing decorative avatar repeats.
- Closing after entering an answer uses the approved leave-without-saving warning;
  unsaved answers are never silently retained on the device.

### Sensitive-memory safeguards

- Experience, setup, goal and emotion answers are user-declared relationship
  context, not deterministic Journal facts.
- Emotional patterns are never used for upgrade targeting, promotional messages,
  engagement pressure, risk classification or hidden psychological profiling.
- Links refers to these memories as **You told me…** or **You asked me to
  remember…**, not as independently proven truths.
- Time-sensitive goals, setups, routines and emotional patterns are periodically
  offered for reconfirmation.
- New emotion tags may be offered in the owning review workflow, but relationship
  memory never applies a tag or rule outcome without a separate explicit trader
  confirmation.

## First impression — first-ever conversation

### Desktop layout

```text
┌──────────────────────────────────────────────────────────────┐
│ [chain] Links                           [Memory] [Close]      │
│         Your TradersLink AI assistant                       │
├──────────────────────────────────────────────────────────────┤
│ Explore  [Recent 90 days ▾]                                 │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│                    [large chain avatar]                       │
│                                                              │
│                       Hey, I’m Links.                         │
│                                                              │
│  I can connect your trades, reviews, rules, analytics and    │
│  goals so we can look at the full picture together. I’ll     │
│  remember only what you ask me to remember, and you stay     │
│  in control.                                                 │
│                                                              │
│  A few ways we can start                                     │
│  [Show me what you can help with]                             │
│  [Review my recent trading]                                  │
│  [Help me choose a trading focus]                            │
│                                                              │
│  Nothing becomes a memory unless you ask or approve it.      │
│  [How memory works]                                          │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│ Ask Links about your trading…                         [Send] │
└──────────────────────────────────────────────────────────────┘
```

### Exact first-ever copy

- Heading: **Hey, I’m Links.**
- Body: **I can connect your trades, reviews, rules, analytics and goals so we
  can look at the full picture together. I’ll remember only what you ask me to
  remember, and you stay in control.**
- Suggestion label: **A few ways we can start**
- Suggestions:
  - **Show me what you can help with**
  - **Review my recent trading**
  - **Help me choose a trading focus**
- Memory note: **Nothing becomes a memory unless you ask or approve it.**
- Memory action: **How memory works**
- Composer placeholder: **Ask Links about your trading…**

Selecting **How memory works** opens a short explanation:

- Title: **How Links remembers**
- Body: **Links remembers only what you ask or approve. Memories help future
  conversations, but they never replace current trading data. You can review,
  change, turn off or forget them anytime.**
- Primary action: **Got it**
- Secondary action: **What Links remembers**

The suggestions submit only after the trader selects one. They do not create a
conversation, message, generation attempt, memory, or provider request merely
because the surface opened.

## First impression — returning trader, new conversation

When the trader has used Links before but starts a blank conversation, Links
uses the approved name only when one has been saved across TradersLink.

- Heading with approved name: **Good to see you, {first name}.**
- Heading without an approved name: **Good to see you.**
- Body: **What are we working on today?**

The surface may show no more than three useful starting actions:

1. **Continue where we left off** only when a valid unresolved task exists.
2. **See what changed** only when current deterministic TraderLink state proves
   that something relevant changed.
3. One generic supported starting question.

Links does not mention how long the trader was away, congratulate them merely
for returning, manufacture a change, or create pressure to continue old work.

## Continue where we left off

The continuation card appears only in a blank new conversation. It never
interrupts an active conversation.

- Title: **Continue where we left off**
- Summary: a server-validated one-or-two-sentence description of the unresolved
  task without fresh financial claims
- Optional memory line: **You asked Links to remember:** followed by one exact
  approved memory
- Primary action: **Continue**
- Secondary action: **Start something new**
- Utility action: **Not this anymore** when an unresolved goal or routine should
  be corrected or forgotten

Selecting **Continue** begins with the relevant conversation state and re-reads
all current facts. The summary itself never becomes evidence.

## Links inside an active conversation

### Header

- Show the chain avatar at a compact size beside **Links**.
- Show the active conversation title as secondary text.
- Keep rename, archive/restore, mobile conversations and close actions reachable.
- Provide a clearly labelled **Memory** action. Its accessible name is
  **What Links remembers**.
- Preserve the selected account/context presentation so the trader knows which
  Journal account owns account-specific facts and memories.

### Messages

- Links messages use the small chain avatar and a **Links** label at the start of
  each uninterrupted assistant-message group.
- Trader messages retain the current primary-color treatment.
- Links messages retain the current restrained light-blue treatment and do not
  become character speech balloons or social-media chat bubbles.
- Generated text must use an approved streaming Markdown renderer; factual claim,
  evidence, proposal and confirmation cards remain server-authored components.
- Links may sound natural and warm, but no visual treatment implies a human is
  typing.

### Owner-approved working copy

- Label: **Links is thinking…**
- Use the chain avatar with a restrained outline pulse or moving highlight around
  the avatar boundary.
- Do not distort, rotate or break apart the chain mark.
- Do not rotate through speculative phrases such as “analyzing your behavior” or
  expose provider/tool terminology.
- The saved trader question remains visible and only one active working state may
  exist in the conversation.

## Relationship memory entry points

There are three valid ways a relationship memory can begin:

1. The trader uses the advertised capability by saying **remember this**,
   **remember that…**, or by using the memory management surface.
2. Links offers one memory suggestion after the trader clearly states something
   useful across future conversations.
3. A time-sensitive existing memory reaches its reconfirmation point.

Links never silently saves an inferred memory. Ordinary questions, emotional
language, private notes, performance, repeated behavior and model-generated
interpretations do not create relationship memories.

## Remember this proposal

When Links identifies an explicit useful statement, it may show one inline card
after answering the trader's immediate question.

```text
┌────────────────────────────────────────────────────┐
│ Remember this?                                     │
│                                                    │
│ Focus on following my exit plan before judging     │
│ the result.                                        │
│                                                    │
│ Use in: [Day Trading Account only ▾]               │
│                                                    │
│ Links can use this in future conversations.        │
│                                                    │
│ [Remember]  [Edit wording]  [Not now]              │
└────────────────────────────────────────────────────┘
```

### Exact proposal copy

- Title: **Remember this?**
- Explanation: **Links can use this in future conversations.**
- Primary action: **Remember**
- Secondary action: **Edit wording**
- Dismiss action: **Not now**

Links may ask once. **Not now** dismisses the proposal without saving anything,
and the same statement is not repeatedly proposed.

## Memory scopes

Visible scope labels remain trader-facing:

- **Across TradersLink** for the approved name, long-term learning goals,
  general routines and non-account-specific areas of focus
- **{Journal account name} only** for trading-process goals, review focus,
  routines and reminders belonging to one Journal account

The server recommends the narrowest truthful scope. The trader can review the
scope before confirming. Internal user, workspace and account identifiers never
appear.

## Direct remember request

A direct request such as “Remember that I want to review exits every Friday” is
itself the explicit save instruction when the memory text and scope are
unambiguous.

Meet Links has already explained this capability in positive language, so the
trader does not need to discover a hidden command or navigate to settings before
using it.

After saving, show:

- Status: **Remembered**
- Body: **I’ll keep this in mind for {visible scope}.**
- Utility action: **Review memory**
- Undo action: **Forget**

If the wording or scope is ambiguous, Links shows the **Remember this?** card
instead of guessing.

## Showing when memory influenced an answer

Links should feel natural, so the UI does not attach a technical memory ledger to
every message. When a relationship memory materially changes the question,
answer, follow-up, or tone, show a small disclosure beneath the response:

- Label: **From what you asked me to remember**
- Memory: the exact active memory text used
- Action: **Review memory**

Current trading facts never appear in this disclosure because they are evidence,
not relationship memory.

## What Links remembers

The **Memory** header action opens a temporary memory screen inside the existing
Links AI Chat drawer or direct page. It does not open a second drawer, modal over the
conversation, or narrow panel inside the active thread.

While the memory screen is open, the interior below the Links AI Chat header changes
from the conversation list and active thread to the full-width memory experience.
The Links AI Chat drawer itself stays open at the same approved width, the current
dashboard route does not change, and the active conversation, unsent composer
text and scroll position remain preserved. **Back to chat** restores that exact
conversation state. The global Chat close control remains independently
reachable on desktop and mobile.

### Desktop layout

```text
┌──────────────────────────────────────────────────────────────┐
│ [Back]  What Links remembers                          [Close]│
├──────────────────────────────────────────────────────────────┤
│ These are the things you asked Links to carry into future   │
│ conversations. You can change or forget any of them.        │
│                                                              │
│ Relationship memory                         [On ▾]           │
│                                                              │
│ About you                                                   │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Call me Jordan.                          Across TradersLink│ │
│ │ Remembered from Weekly review · Aug 20, 2026             │ │
│ │ [Edit] [Forget]                                          │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ Day Trading Account                                         │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Focus on following my exit plan before judging results.  │ │
│ │ Day Trading Account only                                 │ │
│ │ [Edit] [Forget]                                          │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ [Tell Links something to remember]                           │
└──────────────────────────────────────────────────────────────┘
```

### Exact memory-surface copy

- Title: **What Links remembers**
- Introduction: **These are the things you asked Links to carry into future
  conversations. You can change or forget any of them.**
- User-wide section: **About you**
- Account section: the exact current Journal account display name
- Add action: **Tell Links something to remember**
- Navigation action: **Back to chat**
- Item actions: **Edit** and **Forget**

Each item shows its exact saved wording, visible scope, source conversation title
and saved date. It does not expose internal identifiers or the private message
around the memory.

## Time-sensitive memory review

Goals, routines and current areas of focus can become stale. They remain saved,
but Links does not assert them as current after their review boundary.

- Title: **Still true?**
- Body: the exact existing memory
- Context: **You asked Links to remember this on {date}.**
- Actions: **Keep it**, **Update it**, and **Forget it**

Ignoring the review does not delete the memory. Until reconfirmed, Links may say
**You previously told me…** but cannot present the memory as the trader's current
goal or intent.

## Edit and forget behavior

### Edit

- Title: **Update this memory**
- The exact current wording and scope are editable.
- Primary action: **Update memory**
- Secondary action: **Cancel**
- Saving creates a new version and supersedes the earlier active wording.

### Forget one memory

- Title: **Forget this?**
- Body: **Links will stop using this in future conversations. Past messages
  won’t change.**
- Destructive action: **Forget**
- Secondary action: **Keep it**

The forgotten memory is excluded from the next request. Any privacy-safe
content-free audit marker required for integrity cannot contain the forgotten
memory text.

## Turning relationship memory off

Turning memory off and forgetting memories are different actions.

- Title: **Turn off relationship memory?**
- Body: **Links will stop using and suggesting memories. Your saved memories
  will stay here until you forget them.**
- Primary action: **Turn off**
- Secondary action: **Keep on**

When off:

- Links does not retrieve, use, suggest or reconfirm relationship memories;
- saved items remain visible and individually forgettable;
- direct “remember this” requests explain that memory is off and ask whether the
  trader wants to turn it back on; and
- current deterministic facts and ordinary conversation history remain separate
  and unaffected.

## Forget all memories

The memory surface includes a low-prominence **Forget all memories** action after
the individual sections.

- Title: **Forget everything Links remembers?**
- Body: **Links will stop using every saved relationship memory. Past
  conversations won’t change.**
- Destructive action: **Forget all memories**
- Secondary action: **Cancel**

This action cannot delete Journal facts, conversations, messages, evidence,
receipts, settings or approved product changes.

## Empty memory state

- Heading: **Links isn’t remembering anything yet.**
- Body: **When something would help future conversations, you can ask Links to
  remember it. Nothing is saved without your approval.**
- Action: **Tell Links something to remember**

The action returns to Chat and focuses the composer with a non-submitted prompt
starter. It does not create a memory by itself.

## Mobile behavior

- The first impression stacks in one column with the avatar, copy, suggestion
  actions and composer fully visible without horizontal scrolling.
- Suggestions use full-width or wrapping buttons with 44-pixel minimum targets.
- **What Links remembers** uses the same temporary full-width memory screen and
  retains **Back to chat** and the global close control; it never opens behind
  the conversations panel.
- Memory scope, source and actions stack under the memory wording.
- Dialog actions remain reachable above the safe-area inset.
- Editing memory wording never hides the scope or destructive/cancel actions
  behind the keyboard.
- The 390 by 844 acceptance viewport remains mandatory.

## Accessibility and visual restraint

- The chain avatar has accessible text **Links, TradersLink AI assistant** where
  it conveys identity; decorative repeats are hidden from assistive technology.
- Identity is never communicated by color or animation alone.
- Working animation respects reduced-motion preferences and retains visible text.
- Memory status, scope and action labels remain readable without tooltips.
- Focus returns to the triggering control after closing a dialog or returning to
  Chat.
- The existing blue chain asset is not recolored, distorted or animated internally.
- No AI sparkle, gradient orb, robot face, human portrait, streak flame, confetti,
  typing dots that imply a human, or emotional facial state is introduced.

## Approval checklist

- [x] **Meet Links** opening, skip behavior and deterministic presentation
- [x] Experience, trading approach, markets/products and setup questions
- [x] Current-focus, emotional-pattern and routine questions
- [x] Final **Is there anything else I should know?** question and safe free-text
  handling
- [x] **What Links will remember** review and atomic save behavior
- [x] Short **Tell Links about this account** flow
- [x] Sensitive-memory and future emotion-tag boundaries
- [x] First-ever desktop layout and exact copy
- [x] First-ever mobile layout and exact copy
- [x] Returning-trader and continuation behavior
- [x] Links header, avatar and active-message treatment
- [x] **Links is thinking…** working copy
- [x] **Remember this?** proposal and scope selection
- [x] Direct remember confirmation and material-use disclosure
- [x] Temporary full-width **What Links remembers** desktop/mobile navigation
  pattern with preserved Chat state and **Back to chat**
- [x] **What Links remembers** content layout and exact copy
- [x] Edit, reconfirm, forget, turn-off and forget-all behavior/copy
- [x] Empty memory state
- [x] Accessibility and restrained animation direction

Implementation begins only after the owner approves the applicable checklist
items and the first implementation allowlist is audited against the concurrent
working tree.
