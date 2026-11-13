# Yet Project — findings

What building this app found out about the library. Each entry says what happened, where, and
what was done about it: **fixed** in the library, **kept** in the app as a local answer, or
**open** — a library change worth making, waiting for its own PR.

Library fixes land as their own small PRs to `src/`, never mixed into an app PR.

## Slice 1 — shell, Home, All projects, a project's List (2026-11-08)

From the Figma page **↪ Yet Project** (`40006256:61847`): `Yet Project / Shell`
(`40006259:45550`), `Home - Daily brief` (`40006266:3768`), `Projects - All projects`
(`40006264:1069`) and `Project - List` (`40006268:6554`). Every other rail item and project tab
lands on a "Designed, not built yet" page that links its frame.

### Open: library changes worth making

None open.

### Fixed in the library

1. **`Table` has no group rows.** *Fixed in #376.* Both tables in this slice are grouped — All
   projects by health, a project's List by phase — under a `Group /` row: a chevron, the name in
   sm semibold, a neutral count Badge and a subtle note, on `Surface/Background Subtle` with a 1px
   top rule, and the chevron folds the group. The file draws that row as a local frame, not a
   library part. The app composed `Table`'s children-mode parts into a `GroupedTable` of its own.
   `Table` now has `groupBy` and `groups` on the columns API, rendering through a new
   `Table.GroupRow` part: one `<tbody>` per group under a `<th scope="rowgroup">` that is the fold
   button. `GroupedTable` is gone and both screens are a plain `<Table>`; the heading rows measure
   36 and the rows 40, as drawn.
2. **A clickable Token cannot be a menu trigger.** *Fixed in #383.* Rendering `Menu.Trigger`
   onto a Token did not work — Token's `onClick` makes a hidden button of its own, so there were
   two tab stops and Enter did nothing. `TaskTokens.tsx` copied Yet Social's `TokenTrigger`, a real
   `<button>` wearing a view-only `Token interactive`: the second app to write it, which was the
   bar. Token's full-pill button is now a part, `Token.Action`, handed to its `action` prop, and
   the wrapper is gone. The tokens sit in a block `<span className="flex">`, as the due date's
   does, so rows stay 40.
4. **`Table.Cell` wraps its children in a span that hugs them.** *Fixed in #376.* A cell could
   not hold a row that spreads to its edges: `_Task Name Cell`'s subtask count sat right after the
   name instead of at the cell's right padding, and All projects' progress bar measured **0px**
   wide, because a `flex-1` bar inside a hugging span has nothing to grow into. The app stretched
   that span from outside with `*:*:flex-1`. `layout: 'fill'` on a column (or `Table.Cell`) now
   gives the content the cell's width; the bar measures 131–134 (the file's 133) and the count
   sits on the cell's padding.
13. **The library's table frame has no focus ring.** *Fixed in #379.* `GroupedTable` put
    `focusRing` on its scroll region; `Table`'s own frame takes focus (`tabIndex={0}`, for
    keyboard scrolling) and drew nothing when it had it, and `className` reaches the `<table>`,
    not the frame, so the app could not add one. Moving onto `Table` lost the ring here, and every
    Yet Social table had the same gap. `scrollRegion` now carries `focusRing`: a real Tab onto All
    projects' frame paints the 2px gap and the ring, Tab on to a control inside moves it rather
    than adding a second, and no ancestor in either app clips it.

### Kept in the app, worth knowing

3. **`ClickableCard` has no subtle emphasis.** *Closed, not needed.* Home's "Your projects"
   cards are drawn as wells on `Surface/Background Subtle`, and `ClickableCard` offers only
   `default` and `ghost`, so the app first faked a subtle card on `ghost`. Nathan's call
   (2026-11-09): use the default card. The subtle well was the file's drawing, not something the
   library is missing, so the cards are `ClickableCard` at its default and nothing is overridden.

5. **"Today" is always a Thursday.** Every frame is drawn on Thu Nov 5, 2026, and the page's
   dates are cross-checked against it (the permit on Nov 18 plus a 5-day lag, six buffer days
   before crew training). `data/dates.ts` keeps the data in the file's dates and `day()` slides
   them by whole weeks so the file's Thursday lands on this week's. Weekdays and gaps never
   change. Yet Social does the same around a Monday.
6. **Faces come from Figma by image hash.** A Figma `imageHash` is the SHA-1 of the file, so
   `shasum` matched Dana, Sofia and Maya to photos Yet Social already carries (its `maya.jpg`,
   `priya.jpg` and `jonah.jpg`, under other names there). The other four came out of
   `download_assets` and were labeled the same way, with no contact sheet needed.
7. **A project opened on List, not Overview,** while Overview was not built. Slice 4 built it and
   made it `DEFAULT_TAB`, so a project now opens on the file's first tab (entry 33).
8. **Only Austin has tasks.** Every project has a page, and the others' List says so with a link
   to Austin. Their start dates are placeholders; only Austin's (Nov 2) is drawn.
9. **The due date is a Token with no menu yet.** Status, priority and assignee change from their
   tokens; the due date picker (`Task - Due date`, `40006306:34048`, with the Apply-when-it-
   ripples rule) is a later slice, and the token says so.
10. **The row height came out 41.** The clickable due Token is `inline-flex`, and on the text
    line `Table.Cell` wraps it in, it took a descender's worth of room. It sits in a block
    `<span className="flex">` now, and every row measures the file's 40.
11. **Yak is in the rail and the floating bar, and not built.** Nathan chose Yak exactly as in
    Yet Social. It is the next big piece; for now each way in says it is not built yet.
12. **The browser pane drops menu picks.** Clicking a status in its open menu closed the menu with
    no change in the pane, and a second click did not reopen it; the keyboard path worked, and in
    real Chromium (Playwright) every pointer pick worked. Verify menus there.

## Slice 2 — the task panel (2026-11-08)

From `Task - Panel over List` (`40006275:8516`), with the Activity tab from `Task - Activity
log` (`40006307:38076`). Press any row of a project's List and the task opens in a `Panel`
beside it, at `#/projects/austin/list?task=AUS-24`, so every task has a link and Back closes
it. Status, assignee and priority change from their tokens and the List follows; subtasks
tick; a dependency or the blocked banner's Open swaps the panel to that task; a comment posts;
every edit is written into Activity as yours. The full view, the due date picker, Phase,
Project and Estimate, replies, mentions and the activity filter are drawn and not built.

### Kept in the app, worth knowing

14. **The panel is always mounted.** `Panel` moves focus in when `open` goes from false to true,
    and leaves it alone when it mounts already open, because that is a panel that was there on
    load. Rendering it only once a task was chosen made every row press look like a page load,
    and focus stayed on the table. `TaskPanel` keeps the `Panel` mounted and empty until asked,
    as Yet Social's drafts panel does; a link opened cold still leaves focus on the page.
15. **With the panel open the List drops Priority.** The file's own frame does, and the
    remaining columns keep the file's widths, and `Table` works out its own minimum from them, so
    the table fits beside 384 of panel at 1440 without scrolling sideways.
16. **The selected row is `Table`'s selected state, not the frame's drawing.** The frame paints
    the open row by hand, `Surface/Background Subtle` with a `Surface/Border` stroke (which is
    why it measures 41). The library's selected row is the overlay wash with its rule stepped up
    to emphasized, which is what keeps "open" apart from "hovered". The frame should use the
    Table Row's Selected state rather than a local fill.
17. **Subtask counts come from the checklist.** The List's `list-tree` meta is now counted from
    each task's subtasks rather than written beside them, so ticking one in the panel moves both.
    That gives Health permit approval a `1/3` in the List, which the frame's List never shows
    although its panel lists three; the count is the honest one. Hire 14 crew members' checklist
    is one line a hire, by role, nine made.
18. **Edits made here are dated the mock's today.** Activity buckets lines into Today, Yesterday
    and Earlier around this week's Thursday (entry 5). An edit stamped with the real clock landed
    under Earlier on any day but Thursday, so `TasksProvider` dates it `today`.
19. **`Card` is a column.** Its base is `flex-col gap-2` on purpose (its record explains), so the
    one-line blocked banner — Badge, the waiting-on text, Open — says `flex-row` to sit in a row,
    as the file's horizontal wrapper does.

## Slice 3 — the Board (2026-11-09)

From `Project - Board` (`40006268:8728`) and `Project - Board / Dragging a blocked task`
(`40006292:21137`). Four columns, To do to Done, each a Subtle `ContentBlock` holding the task
cards; a card opens its task's panel over the Board (`#/projects/austin/board?task=AUS-24`), and
a card dragged to another column, by pointer or by its grip and the arrow keys, takes that
column's status, which the List and the panel follow. A blocked card carried out of In progress
turns the slot it would land in into the file's "Still blocked" notice; dropped there it moves
anyway, its Activity says so, and a toast says who got the heads-up. The column's add button,
swimlanes and limits (`40006292:23183`) and card quick actions and quick add (`40006292:24934`)
are drawn and not built.

### Open: library changes worth making

21. **`DragAndDrop.Overlay` measures the copy's first child, so tilting that child breaks the
    keyboard.** The file draws the carried card turned 2°. With `-rotate-2` on the overlay's
    child, the measured box grew to 266×119 from the card's 263×110, and dnd-kit's keyboard
    coordinates then counted the card *below* as "to the right": ArrowRight from Equipment
    delivery moved it down To do instead of into In progress. The pointer path was fine, which is
    why only a keyboard test showed it. The tilt is one element further in now and the arrows
    cross columns. Worth a line in the record, or an Overlay that owns the tilt on an inner
    element if a second board draws it.
22. **With an overlay, the ring on the card under the pointer doubles the slot.** `Sortable.Item`
    rings the item the carried one is over (`over && !dragging`), which is the only landing cue
    when the item itself is carried. Under `DragAndDrop.Overlay` the item left behind already
    sits in its landing slot, so the ring marked a second, wrong target — Signage proof, ringed
    beside the notice slot under it. The frame rings only the slot, so the Board sets
    `data-over:ring-0` on its items. The library could drop that ring whenever an overlay is
    carrying the item.

### Kept in the app, worth knowing

20. **The Board has no Blocked column.** Blocked is one of the List's five statuses, and the
    Board draws four columns. Health permit approval sits in In progress with a red Blocked badge,
    so blocked is read as work that started and stopped: `columnOf` files a blocked task under In
    progress, and dropping it back in In progress keeps it blocked. `blockerOf` names what it waits
    on, its first dependency that is not done, and the panel's banner now uses the same helper.
    A To do task with an unfinished dependency is not blocked and gets no notice.
23. **The carried card is a copy, and its slot stays in the board.** The frame draws the lifted
    card under the pointer *and* the notice where it would land, which one moving element cannot
    do, so the Board uses `DragAndDrop.Overlay`: a tilted copy rides the pointer (`aria-hidden`
    and `inert`, so it is a picture, not a second button), and the real card stays as the slot,
    faded with no shadow. The frame also leaves a faded copy in In progress; with the card already
    showing in its slot, that would be a third, so it is not drawn.
24. **Two tasks came from the Board.** Signage proof (AUS-31, Katie, In review, due the file's
    Thursday) and Sign the lease (AUS-11, Dana, Done) are drawn on the Board and not on the List
    frame, so they are new in the data and the List has two more rows. Faces matched by image
    hash to Local PR's and the permit's. Install hood and ventilation is in the data and not on
    the Board frame; it goes under the permit, where the swimlanes frame puts it.
25. **The counts are the task's own.** Cards count subtasks from the checklist (entry 17) and
    comments from the thread, replies included, so a card agrees with the panel it opens. That
    makes them smaller than drawn: Final electrical inspection shows 1 comment where the file says
    4, Health permit approval 2 for 3, and Equipment delivery and Signage proof none for 2 each;
    Grand opening campaign's 0/6 is not shown because it has no checklist yet.
26. **The Board keeps its own order.** `boardOrder` in `data/tasks.ts` is the frame's top to
    bottom, and a drop rewrites it in `TasksProvider`. The List still lists by phase in the data's
    order, so reordering cards does not reorder rows.
27. **Columns share the row and stop at 256.** Four columns are 281 wide at 1440, as drawn. Past
    `min-w-64` the board scrolls sideways inside itself, which is what happens when a task's
    panel opens beside it (1076 of board in 798 of room) and on a phone. The board is the
    scroller both ways, as Yet Social's Ideas board is, so it fills what is left of the page
    under the header and tabs; that took `flex-1` on every level from `AppShell.Content` down.
28. **A card's name is its title.** The card is one `<button>`, and reading all of it made a name
    like "SupplyPriority: High3Equipment delivery". It is named by the title and described by the
    rest, with the words a glyph stands for written out for a screen reader: "Supply, Priority:
    High", "Marcus Bell, Due Dec 8, Subtasks: 2/3, Comments: 1".

## Slice 4 — a project's Overview (2026-11-13)

From `Project - Overview` (`40006268:5150`). A project now opens on it: Yak's summary, the latest
update and the milestones in an 806 column, the properties and the activity in a 340 one beside
it, below each other under `xl`. Every block measured the frame's height (170, 218, 246, 238;
36-tall milestone rows; 40/20 activity rows) except Properties (entry 30). Regenerate and Ask
are Yak's and say so; the update's ⋯ leads to Post update and the update history, drawn and not
built; the milestones' ⋯ opens the Timeline tab.

### Open: library changes worth making

None open.

### Kept in the app, worth knowing

29. **Dates in words now move with the schedule.** `day()` slides every date onto this week, and
    the List, the Board and the header followed it, while the words did not: AUS-21's
    description, its Activity tokens and Dana's comment still said Nov 10 when the List said
    Nov 17. Dates in prose are now written `{2026-11-10}` (or `{2026-11-10:th}` for "the 10th")
    and `datedText` in `data/dates.ts` moves them, in the task panel and the Overview alike. Two
    numbers disagreed underneath it. The Overview frame says the inspection moved from Nov 4 to
    Nov 10 and calls that "six days behind"; AUS-21, which was invented for the panel, said Nov 7.
    The frame's six days settle it, so AUS-21 now slipped from Nov 4, and its move is today's,
    as the Overview's "2h" has it.
30. **A property value wraps rather than being cut off.** "Ops, People, Marketing" is 155px in
    Chrome and the file's value column is 154, so the row truncated it to "Marketi…". `PropertyRow`
    now lets a value wrap: the label keeps the first line's 32, the value has 4px above and below,
    and a one-line row is still 32 (the task panel's seven measured 32 after the change). Team
    takes two lines, so Properties is 282 tall to the frame's 258.
31. **Two pieces moved to `components/` because a second screen needed them.** `PropertyRow` was
    the task panel's `_Property Row`, and `MenuBlock` was Home's Content Block with its ⋯ menu.
    The Overview's Properties and Activity draw the header's `Actions Items` slot empty, so
    `MenuBlock` takes no menu for them and leaves the slot out.
32. **Only Austin has an overview.** Its numbers are the rest of the app's: 9 of 14 crew is the
    crew task's checklist, 46% the project's progress, the milestones' dates the List's. The
    other projects' Overview says it is not in the mock yet and links Austin's, as their List
    does. Goal and Portfolio are view-only Tokens in the file, so they are links, to Plan ›
    Goals and Portfolios, as the task panel's Linked rows are.
33. **Overview is the default tab.** `#/projects/austin`, the rail and the project cards now land
    on `#/projects/austin/overview`; Home's "Health permit is blocked" still opens the List,
    where the task is.

