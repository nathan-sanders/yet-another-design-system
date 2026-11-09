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

2. **A clickable Token cannot be a menu trigger.** Rendering `Menu.Trigger` onto a Token does not
   work — Token's `onClick` makes a hidden button of its own, so there are two tab stops and
   Enter does nothing. `TaskTokens.tsx` copies Yet Social's `TokenTrigger` (its FINDINGS 24): a
   real `<button>` wearing a view-only `Token interactive`. That is the second app to write it,
   which is the bar for moving it into the library — `Token` taking `render`, or a
   `Token.Trigger`.
3. **`ClickableCard` has no subtle emphasis.** Home's "Your projects" cards are wells on
   `Surface/Background Subtle` that open the project. `ClickableCard` offers `default` and
   `ghost`, and both hover *to* the subtle fill, so a subtle card would not change under the
   pointer. The app uses `ghost` with the subtle fill and hovers to `surface-overlay-subtle`,
   the translucent wash Table's striped rows hover to, which adds ink to whatever it covers.

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

5. **"Today" is always a Thursday.** Every frame is drawn on Thu Nov 5, 2026, and the page's
   dates are cross-checked against it (the permit on Nov 18 plus a 5-day lag, six buffer days
   before crew training). `data/dates.ts` keeps the data in the file's dates and `day()` slides
   them by whole weeks so the file's Thursday lands on this week's. Weekdays and gaps never
   change. Yet Social does the same around a Monday.
6. **Faces come from Figma by image hash.** A Figma `imageHash` is the SHA-1 of the file, so
   `shasum` matched Dana, Sofia and Maya to photos Yet Social already carries (its `maya.jpg`,
   `priya.jpg` and `jonah.jpg`, under other names there). The other four came out of
   `download_assets` and were labeled the same way, with no contact sheet needed.
7. **A project opens on List, not Overview.** Overview is the file's first tab but is not built,
   so `DEFAULT_TAB` in `screens/project/paths.ts` is `list` for now. Change it when Overview
   lands.
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
