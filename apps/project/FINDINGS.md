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

1. **`Table` has no group rows.** Both tables in this slice are grouped — All projects by
   health, a project's List by phase — under a `Group /` row: a chevron, the name in sm
   semibold, a neutral count Badge and a subtle note, on `Surface/Background Subtle` with a 1px
   top rule, and the chevron folds the group. The file draws that row as a local frame, not a
   library part. `components/GroupedTable.tsx` composes `Table`'s children-mode parts around one
   `<tbody>` per group, whose first row is a `<th scope="rowgroup" colSpan>` holding the fold
   button. Two grouped tables in one slice, and the file groups most of its task tables, so this
   is a candidate for `Table` itself: a `groupBy` on the columns API, or a `Table.GroupRow` part.
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
4. **`Table.Cell` wraps its children in a span that hugs them.** A cell cannot hold a row that
   spreads to its edges: `_Task Name Cell`'s subtask count sat right after the name instead of
   at the cell's right padding, and All projects' progress bar measured **0px** wide, because a
   `flex-1` bar inside a hugging span has nothing to grow into. `Table`'s own record already
   notes it for skeletons ("a cell's content wrapper hugs"). The app's `GroupedColumn.spread` stretches that
   span from outside with `*:*:flex-1` on the cell, which reaches into the library's markup.
   The library wants a way to say it: a `fill` on `Table.Cell` and on `TableColumn`.

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
