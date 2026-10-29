# Yet Social — findings

What building this app found out about the library. Each entry says what happened, where, and
what was done about it: **fixed** in the library, **kept** in the app as a local answer, or
**open** — a library change worth making, waiting for its own PR.

Library fixes land as their own small PRs to `src/`, never mixed into an app PR.

## Slice 1 — shell and calendar (2026-10-17)

### Fixed in the library (2026-10-17)

1. **Fixed (#231): `Panel.Body` is `relative`.** An `sr-only` span (`ChatMessage`'s `sender`) in
   a scrolled post detail panel belonged to the *document*, which then scrolled 341px on a phone
   (`scrollHeight` 1153 in 812) — the bug `AppShell.Content` had already fixed for itself, one
   region over. The body is the containing block now, the `Phone, screen-reader text` story
   guards it, and the app's `className="relative"` on every `Panel.Body` is gone.
2. **Fixed (#233): `ChatMessage` has a visible sender.** Figma's post detail (`40005911:33082`)
   is a *team* thread: each note shows the author's name, an `Internal` badge and the time above
   the bubble. The app drew that row itself, `aria-hidden` so the name was not read twice; it is
   `header={<ChatMessage.Header name badge timestamp />}` now, which moves the avatar up beside
   the name and reads the name as the sender. The time moved from the metadata row to the
   header, where the file draws it.
3. **Fixed (#234): `Panel.Footer`.** Both Yak and post detail pin a composer under a scrolling
   body, and the app wrote a padded `div` after `Panel.Body` for it. Both use `Panel.Footer` now.
4. **Fixed (#232): a `SideNav.Group` holding the selected item opens by itself.** The shell held
   every group's `open` so the group you navigate into would open, because a `defaultOpen` that
   changes after mount is ignored. The group derives it now — it starts open when it holds the
   `selected` row and opens when one becomes selected — and the shell's group state is gone.

5. **Fixed (#236): `SideNav`'s `top` and `bottom` slots are columns.** Search and Yak passed
   as a fragment came out 12px apart, because each row became a child of the rail, whose
   children are `gap-3`. Figma's `Top Slot Content` is one column with no gap. The rail wraps
   both slots in one now, and the app's wrapper `div` is gone.

### Open: library changes worth making

None right now.

### Kept in the app, worth knowing

5. **An app outside `src/` must add the library to Tailwind's scan.** Tailwind scans from Vite's
   `root`; with `root: apps/` it saw none of the library's classes, and every component rendered
   unstyled with no error anywhere. `apps/shared/app.css` adds `@source '../../src'`. Any future
   consumer of the library, packaged or not, will hit the same wall.
6. **`TopBar`'s start slot stretches every child.** It is `*:flex-1 *:max-w-150`, shaped for one
   search field. The calendar's title, segmented control and arrows went in as one wrapper `div`,
   or each would have taken a third of the bar. Worth a sentence in the TopBar record, or a
   toolbar shape if a second app does the same.
7. **A navigating call to action has no button look.** `Button` is always a `<button>`, on
   purpose ("Do not use a button to navigate"), so the showcase's "Open Yet Social" is a `Link`.
   That is correct. Whether a primary call to action that navigates needs a heavier look than
   an underlined link is a design question, not a bug.
8. **The month chip is not a `ClickableCard`.** `_Calendar Post Chip` is a 24px row on
   `rounded-sm`, and the card's radius and 12px padding come with it even at `padding={0}`. It is
   a `button` carrying the card's surface, border, hover and `selected` tokens, plus `focusRing`.
   If a second compact clickable row appears, that is a variant to consider.
9. **There is no hatch token.** Figma's `_Past Day Pattern` is an image. The app draws it as a
   repeating gradient in `var(--surface-border)`, so it follows the theme and the neutral ramp,
   with the stripe pitch written in the class.
10. **The assistant mark and the wordmark live in story fixtures.** Yak imports `Mark` from
    `Chat/story-mark.tsx`, and the shell copies `Nav/story-logo.tsx`. Both are brand art rather
    than library components, but an app reaching into a story file is a sign they want a home.
11. **Network marks follow the text color.** Figma's `_instagram` … `_bluesky` export with a
    hard `#292423` fill. `NetworkIcon` uses the same paths with `currentColor`, so they turn light
    in dark mode the way the file binds them (`Content/Primary`).

### Figma owes

12. **No day view and no phone calendar.** The day view is the week grid with one column and
    the `_Calendar Agenda Content` card the file already has. On a phone the week keeps 112px
    columns and scrolls sideways. Both were decided here, not designed.
13. **The schedule slides to today.** The posts and Yak's insights are written around Figma's
    Monday "today". The app uses the real date and shifts the whole schedule so that Monday
    lands on it (`postDate` in `screens/calendar/model.ts`). Whatever day the mock opens on,
    today has posts, the next days are scheduled into next week, and the days behind hold
    what was published. That is a mock-data decision, recorded here so it does not read as a
    bug.

### Measured, and fine

- Week card against `_Calendar Post Content`: 12px padding, `rounded-md` 8, 1px border, 48×48
  thumbnail at `rounded-md`, copy clamped at two lines of 12/20.
- Now line: 7.3px into a 56px row at 4:08, which is 8/60 of the row.
- Today's highlight: 2px in Surface/Border Emphasized, square ends, the full column width
  including its left border (Figma `40005911:32818`, updated 2026-10-17).
- Hour labels stick 8px under the day header while a tall row scrolls past (a 293px 10 am row
  measured), and are pushed out by the row's own bottom.
- Day view cards: 736px at most, centered in the column.
- Panel 384 wide; History stacks over Yak at 384 with Yak's root 396 (the 12px peek).
- Phone (375 × 812): rail hidden, `MobileNav` shown, panel under the page at 320 tall, document
  not scrolling, grid scrolling sideways inside `<main>`.
- axe (the version the stories use, run on the live app): no violations across week, month, day,
  Yak, History, post detail, the placeholder pages, light and dark.

## Slice 2 — Engage › All messages (2026-10-17)

The conversation (`40005911:33580`), the public thread (`33732`) and the contact panel (`33894`).

### Fixed in the library (2026-10-17)

14. **Fixed (#239): a disabled button no longer fades `InputGroup`.** The box carried
    `has-[:disabled]:opacity-40 pointer-events-none`, which faded and froze the whole reply box,
    the account picker and Yak's draft with it, the moment Reply was disabled for an empty field.
    It keys off the field's own control now (`has-[input:disabled]`, `has-[textarea:disabled]`),
    so Reply is disabled while the field is blank, as the file draws it, and the box stays live.
15. **Fixed (#239): `InputGroup` takes `ring`.** Its box rang for focus anywhere inside it, so a
    reply box holding a Select and seven buttons drew two rings on every one of them. The reply
    box passes `ring="input"` now, ChatComposer's and NumberInput's answer, and the app's
    `RING_ON_INPUT_ONLY` override is gone.

### Open: library changes worth making

16. **`ChatComposer` has no top slot.** Figma's `Reply Box` puts the sending account, "Public reply
    to @…" and Yak's drafted reply above the field. ChatComposer could not hold them, so the box is
    an `InputGroup` with stacked addons, which is also how the file builds it. If a second composer
    wants a header, that is the slot to add.

### Kept in the app, worth knowing

17. **`_Inbox Comment` is not a `ChatMessage`.** It is a customer's words on a public post, with
    no bubble, a `⋯` in the header row and the face beside the name. ChatMessage's header has no
    actions slot and its body is a bubble. `components/InboxComment.tsx` is a local row.
18. **The collapsed list row is not a `ClickableCard`**, for finding 8's reason: the rail draws
    63 × 78 with 8px of padding, and the card brings 12. A button wearing the ghost card's tokens,
    with `aria-current` for the open message as the card has. Two compact clickable rows now: the
    variant finding 8 asked about has its second caller.
19. **Ticket meta reads as sentences.** Each pill has a word only a screen reader hears ("Priority:
    Low", "Assigned to Nathan Sanders"), so the row is not five bare words.

### Figma owes

20. **No phone inbox.** Decided here: the list and the conversation are two screens, `message` in
    the URL picks which, and the whole conversation scrolls as one with the header pinned, so a
    drafted reply cannot push the message off the screen. Above 768 the first message opens by
    itself, as drawn.
21. **Contact tags are removable here.** The file draws view-only tokens beside an "Add tags…"
    field; a field that adds with no way to take one back was a dead end in a clickable mock.
22. **Talan's sentiment is Positive in two frames and Neutral in the third** (the thread's
    selected comment). The app uses Positive everywhere.
23. **Five of the twelve rail faces have no ticket in the file.** Cooper, Kaylynn, Nolan, Lindsey
    and Mango got tickets written for them (`data/inbox.ts`). Portraits are the file's own.

### Measured, and fine

- List 380, toolbar 56, cards 363 × 142 / 158 / 170 at 12px padding and `rounded-md`, as drawn.
- Conversation header 56, ticket toolbar 48, comment 60, system note 486 × 28, Reply / Internal
  note 178 × 32, the reply box's top slot 156 and foot 56. The box is 252 against Figma's 254: the
  drafted reply is 96 against 98.
- With a panel open: the list folds to 72, its rows 63 × 78, the panel 384, Filter icon-only.
- Phone (375 × 812): one column either way, document not scrolling, the header sticky.
- axe on the live app: no violations on the list, the conversation, the thread and the contact
  panel, light and dark, desktop and phone.

## Slice 3 — ticket meta menus (2026-10-17)

In the open conversation and the thread's marked comment, status, assignee, priority and sentiment
each open a menu of their values. The ticket number does not, and neither does anything in the
message list, where the whole card is the hit target. Changes live for the session and reach the
list's card and the Unassigned filter.

### Open: library changes worth making

24. **A `Token` cannot be a menu trigger.** Rendering `Menu.Trigger` onto a Token
    (`render={<Token />}`, `nativeButton={false}`) half works. Token takes `onClick` for an
    invisible `<button>` of its own, so Base UI's handler lands there. A click opens the menu,
    Enter on the focused token does nothing, the token has two tab stops, and no ring shows. The
    app wraps a view-only Token in the trigger's own `<button>` (`MenuToken` in
    `components/TicketMeta.tsx`). That is correct, but every caller has to know to do it. Either
    Token forwards a trigger's props to its overlay, or its record says "wrap it", the way
    Combobox's chips are documented.

### Kept in the app, worth knowing

25. **A menu radio pick keeps the menu open.** That is Base UI's default for `Menu.RadioItem`,
    right for a view-settings menu and wrong for a picker of one value. Each choice here sets
    `closeOnClick`. If a second picker menu appears, the Menu record could say so.
26. **An open menu trips axe's `region` rule.** The popup is portalled to `<body>`, outside every
    landmark, so axe reports it as content outside a region. `region` is a best-practice rule, not
    a WCAG one. It applies to every portalled Menu in the library, so it is recorded here rather
    than worked around in the app. With the menus closed, both views are clean in light and dark.

### Figma owes

27. **The values and the menus.** The file draws New, Low/Medium/High and
    Positive/Neutral/Negative as static tokens. These were decided here:
    - **Statuses:** New, In progress, On hold and Complete. Complete replaced the drawn "Closed"
      on past conversations.
    - **Sentiment:** an Undefined value, with the `CircleHelp` icon.
    - **Status icons:** `CircleDot` and `CirclePause` for the new statuses.
    - **Menu layout:** the menus themselves, with a radio row and the option's icon, face or mark.
28. **Priority is a number, 0 to 4.** No priority, Low, Medium, High and Critical, each a digit in
    a 16 × 14 box at a 4px radius (`rounded-xs`). The model is Nathan's `Token - Priority` set on
    the page (`40005917:33421`…`33425`), whose instances come from the Sprout UI Theme library.
    The colors are YADS's own Decorative Neutral, Green, Yellow, Orange and Red, Badge's pair. They
    are stronger tints than Sprout's, and they follow the theme. The mark is `aria-hidden`
    because the label beside it already says the priority. The `_Ticket Meta` symbol still draws
    the signal glyph.
29. **There is no assignee token on an unassigned ticket.** The toolbar's Assign button
    (`Assign to`, first of Assign, Tag, Complete, More) opens the same menu the assignee token
    does, and so does the thread's Assign. Unassigning from the token removes it, and focus moves
    to the next token rather than being lost.
30. **"Currently viewing" follows you.** Your face sits on whichever message you have open, in
    its list card and in the conversation header. Teammates' faces stay on the message they have
    open: Katie on #1285 and Dana on #1291 in the fixtures (`withViewer` in
    `screens/inbox/model.ts`). The file drew it on #1283 because that was the open one. In the
    header it sits in Figma's `Currently Viewing` frame (`40005911:33672`), 32 tall with 12px
    either side, the footprint of an icon-only Button. Before this it was a bare inline span, and
    it sat off the button's line.

## Slice 3 — published posts (2026-10-17)

A past post on Plan › Calendar now shows what it earned. Week and day cards carry impressions,
likes and comments as `Token`s, and the post detail panel grows tabs: **Comments** (the public
thread, each comment a ticket with the inbox's `TicketMeta` and toolbar), **Notes** (the team's
thread and composer, as before), **Activity** (created, approved, scheduled, published, first
comment, milestones, notes) and **Measure** (`MetricGrid` of `MetricCard`s, an `AreaSeries`
of the first 24 hours, a `HorizontalBar` breakdown). No Figma frame yet; the comments tab follows
Nathan's screenshot of the Sprout thread. Numbers are seeded from the post id
(`data/performance.ts`); `p-10`'s thread is written out.

### Kept in the app, worth knowing

31. **The charts' time axis is UTC unless told otherwise.** `AreaSeries` with `xPreset="hours"`
    drew a noon post's first hour as 5 PM. That is the documented default, `timeZone` is a prop,
    and the app passes the browser's zone. Any chart of local events will need the same line.
32. **The composer belongs to one tab.** `Panel.Footer` pins the notes composer under the body;
    on Comments, Activity and Measure it would be writing to a thread you can't see, so the
    footer only renders on Notes.

### Figma owes

33. **The published post detail.** Tabs, the stats row and the three new tabs are code-first.
    The week and agenda card components (`_Calendar Post Content`, `_Calendar Agenda Content`)
    also want a published state with the three stat tokens.
31. **The list folds by width, not by the panel.** The rail of faces shows when the page is
    narrower than 860px, which is a 380 list beside a conversation of at least 480. The
    `Filter` label drops to an icon at the same point. `AppShell.Page` is a size container
    (`@container/page` in `SocialShell`), and both list forms are rendered with
    `md:@max-[860px]/page:` choosing one. That way the switch follows a panel drag live and
    nothing measures in script. Measured:

    | Layout | Page | List |
    |---|---|---|
    | 1440, no panel | 1192 | full |
    | 1440, 384 panel | 800 | folded (the file's frame) |
    | 1440, panel dragged to its 320 minimum | 864 | full again |
    | 1920, panel open | 1280 | full |
    | Phone | n/a | never folds; the list is a screen of its own |

    It is the first container query in the repo. Worth a library question: whether
    `AppShell.Page` should be a container by default, since "how much room does the page
    have" is exactly what a panel changes.
32. **Status and sentiment glyphs are colored**, after Nathan's filter menus. New is pink, In
    progress green, On hold yellow and Complete gray. Positive is blue, Neutral gray, Negative red,
    and Undefined takes the text color. Each hue is a Decorative `highlight` and the grays are
    `content-subtle`. Against the card the lowest is 3.76:1 (blue, light) and 3.85:1 (pink, dark),
    so every glyph clears 3:1 in both themes. **`Token`'s `startIcon` takes no color.** It draws
    in the label's color, so a tinted glyph goes in the leading `avatar` slot as an `Icon` with a
    text class. Measured, it lands exactly where `startIcon` does: 14px, 9 in and 5 down. A
    `startIconClassName`, or an `icon` slot that takes a node, would say what this is. The
    shapes are unchanged. The menus Nathan shared draw a half-filled circle for In progress and
    solid faces for sentiment. Lucide's line glyphs have neither, and Nathan asked for color.

## Post detail tabs (2026-10-17)

### Fixed in the library (2026-10-17)

34. **Fixed (#251): `Tabs` hugs its tabs on a full-width rule.** Nathan wanted the Creator
    details shape: tabs sized to their labels, the 1px rule running the full width under them.
    `layout="hug"` made the whole `Tabs.List` `inline-flex`, so the rule (its `::before`) shrank
    with the tabs — 140px under Notes and Activity in a 350px panel body. `layout` now sizes the
    tabs only; the strip is full width at both layouts, the `Hug on full width rule` story
    asserts it, and the post detail's `className="flex"` on `Tabs.List` is gone. Figma's Tabs
    already behaved this way (its Separator stretches), so nothing was owed there.
33. **My inbox is All messages, scoped to you.** It is the same `InboxScreen` with
    `scope="mine"`: only tickets assigned to you, titled My inbox, and no All / Unassigned
    control. The file has no frame for it. The session's edits and sent replies moved above the
    routes (`InboxProvider` in `main.tsx`, `useInbox`), so the two screens are views of one set
    of tickets. Assign a message to yourself in All messages and it is in My inbox, and the
    nav's My inbox count goes up with it (live, from 3). Unassign one while it is open in My
    inbox and it leaves the list but stays open, so the reply you were writing is not lost.
    #1285 and #1289 are now assigned to Nathan too, so the count starts at the 3 the nav
    already showed.
34. **On a phone nothing opens by itself.** On a desktop the first message opens when no
    `message` is in the URL, as the file draws it. On a phone that made the first card look
    selected, with your face on it, in a list you had not picked from yet. The screen now reads
    the library's `usePhone` (`src/lib/viewport.ts`) and opens nothing there. That hook is
    documented as popup-only, because on a server-rendered page a `matchMedia` hook paints the
    wrong layout first. Yet Social renders only in the browser, so the first render already has
    the real answer, and CSS alone could not have taken `aria-current` off the card. If the
    library ever wants a rule here, it is "popup-only *unless the consumer never server-renders*".
35. **Fixed (#255, #257): the message list's meta tokens show only their glyph.** Nathan wanted
    the card's status, assignee, priority and sentiment as icons, with only the ticket number
    labelled. Token had no way to hide its label, so it gained `labelHidden`: the glyph with the
    usual 8px either side, and the label kept as the name, `sr-only`. It shipped square first;
    the 8px came back in #257. Only the view-only `TicketMeta` uses it,
    which is the card; the conversation toolbar and thread comments keep their labelled menus.
36. **Open: `Badge` has no inverse color.** Internal notes in Plan and Engage now share one
    component, `components/InternalNote.tsx`: a sticky-note slip (the decorative yellow at 30%,
    its corner folded), a dark `Internal` pill, and replies threaded one step in. Nathan wanted
    both sections to match his Sprout reference, and not to use `ChatMessage` — a note is pinned
    to a post or a conversation, not a turn in a chat. The dark pill is a neutral Badge with
    `bg-surface-background-emphasized text-content-inverse` laid over it, because none of the 18
    hues is the inverse pair. If a second place wants it, it is an `inverse` color in `src/`.

## Slice 4 — Measure › Reports (2026-10-18)

The reports list (`40005911:34877`), the report board (`34608`, and its two-up layout `40005912:29853`),
the widget detail (`40005911:35384`) and its Edit panel (`35514`). Veggie Vault Brand Pulse is written
out from the file; every other topic monitor and custom report opens a board of the same widgets on
its own topics; Yet's built-in reports open a "not designed yet" page. Rearranging, resizing, Apply
and Remove live for the session (`ReportsProvider`, the inbox's pattern from finding 33).

### Fixed in the library (2026-10-18)

41. **Fixed (#262): `board.ts` can start a row.** A block only moved into a row that existed, so
    once two widgets shared a row they could never be taken apart. The app kept one empty row at
    the foot (`withSpareRow`), drawn as the file's dashed Add widget zone, and it had to take a
    widget on release, not while carried. Joining it mid-drag reflowed the board under the
    pointer: the row the widget left shrank, the spare grew, and `closestCorners` flipped between
    the spare and the row above on every frame. Playwright measured 33 `onDragOver`s in one drag
    (6 between existing rows, which is fine). Each flip remounted the chart, and React stopped it
    with "Maximum update depth exceeded" inside Recharts. The spare row is now the library's:
    `withSpareRow` and `spareRow` in `board.ts`. `dragOver` refuses the spare, so it joins on
    drop only, and `addBlock`, `removeBlock` and `dragEnd` keep it at the foot.
    `spareRowCollision` lets the keyboard reach it too, which `closestCorners` alone never did.
    The rule is in `DragAndDrop/CLAUDE.md`. The app's copy and its `onDragOver` skip are gone.

### Open: library changes worth making

37. **`ContentBlock.Header` has no start slot for a control.** The file puts the grip *before* the
    title, in the header's icon slot, and `icon` takes a glyph, not a `DragHandle`. The board lays the
    handle over the header's start (`absolute left-2 top-3`, `size="small"`) and pads the header to
    `pl-10`, which puts the glyph at 16–32px and the title at 40, the file's numbers. The library's
    own dashboards put the grip in `actions` instead. If the file's spelling is the house one, the
    header wants a `start` node slot.
39. **`LineSeries` has no annotation layer.** The Edit panel's "Mark spikes on the chart" has
    nothing to draw with, so it is shown disabled with "Not built yet" rather than as a switch that
    does nothing (finding 21's reasoning).

### Kept in the app, worth knowing

38. **A name that opens something, in a table cell, has no library look.** `Link` is the blue,
    underlined link for prose; the file draws the report's name as plain cell text. `ReportCell` is
    a plain anchor in the cell's color with `focusRing` and a hover underline. The widget titles on the
    board are the same.
40. **Open: there is no selectable card.** `_Pulse Viz Option` is a Clickable Card tile, glyph over
    word, wearing `State=Selected` when chosen. It first shipped as `Radio inContainer`, with a dial
    the file doesn't draw, and Nathan asked for the card. Each tile is now the library's `Radio.Root`
    rendered onto a `ClickableCard` (`nativeButton`), so the six are one radio group with one tab
    stop and arrow keys. The card's `selected` look comes with its `aria-current`, which is
    harmless on a radio but says "current" as well as "checked". The Card record says a card you
    switch on and off is a different component (Astryx's `SelectableCard`) "and nothing in the file
    asks for one yet". This is the file asking.
42. **Back is a `Button` that navigates** (finding 7 again). The file draws an icon-only button and
    a `Link` cannot be one. It goes to the list or the board, not back in history, so a link opened
    cold still has somewhere to go. The detail page's `h1` is `sr-only` beside the breadcrumbs,
    because a heading cannot sit in a trail item's `<span>`.
43. **`ContentBlock` is `h-full`.** That is right in a grid cell and wrong stacked in
    `AppShell.Content`: the detail page's chart and Breakdown each stretched to 981px of a 1088
    window. They pass `h-auto`; on the board the stretch is what lines a pair's bottoms up.
44. **A widget on the board opens on a plain click.** The drag foundation swallows the click after a
    pointer drag, and that stops a handler but not an anchor's navigation. The title is a link
    (`draggable={false}`), so a one-shot capture listener on `window` cancels the click after a drag
    (`swallowNextClick`). That is the DragAndDrop record's "link cards" trap, met head on.

48. **Closed by #344 (2026-10-22): the name column is Table's `rowTarget`; the wrapper is gone.** **The whole report row opens the report.** Table has no `onRowClick` on purpose, because a click on
    a `<tr>` has no keyboard equivalent. The list wraps the table in a click handler that follows the
    row's own name link, so the link stays the keyboard and screen-reader path. `hasHover` and a
    pointer cursor say the row is a target. The dashed Add widget zone is likewise one full-width
    ghost `Button` now, not a button inside a box.
49. **Rows resize by height too** (the Composable story's row strip). The 12px strip under each row is
    both its height handle and the gap between rows, as in the library's dashboard.
    - **Content-sized until resized.** A row is as tall as its widgets until somebody drags its strip.
      From then on it holds that height, the charts take what's left after the block's chrome, and a
      table or list scrolls inside its block. Shrunk to 160px, Top stories' table scrolls its own
      404px.
    - **The handle has to start from the real height.** It starts a drag from its `value`, so a
      ResizeObserver keeps every row's measured height. Without it the first drag would jump to a
      guessed default.
    - A tall widget carried down still lands in the spare row: the library's `spareRowCollision`
      (#262) hands it the spare once its top passes the row's top, whatever the rows above did.

### Figma owes

45. **The numbers are generated, and they agree with each other.** The file draws each widget
    separately. Its donut gives Veggie Vault half the share of voice, while its own breakdown has the
    three brands at 1.4K, 1.2K and 962 a day. The app derives every widget from one series per topic,
    seeded on the topic and the date (`data/reports.ts`), using the breakdown's daily rates. So the
    donut is about a third each, and the Overview, trend, share and breakdown agree at every range.
    Top topics is engagements over the range, so its axis reads 600k where the file has 6k.
46. **The range ends today.** The file's "Jan 1 … 31" is the last 30 days here, as the calendar slides
    to today (finding 13). Hour is disabled past 7 days, Week inside four weeks, and a URL asking for one
    falls back to days. Custom says it is not built.
47. **States the file does not draw**: the spare row as a drop zone; generated boards; the built-in
    reports' page; a widget detail for every widget, not just the trend; the phone board, which is one
    column with no resize handles; and the Edit panel for a widget that is not a chart. For those, the
    other visualizations are disabled and Measure, Topics, Sources and Group by are left out. The
    Measure and Sources values were decided here, and the last topic cannot be removed.

50. **The row-height strip** and the whole-row click on the
    reports list are decided here; the file draws none of them. The Compare button uses the
    `calendars` glyph, because it adds a second date range to compare against.

### Measured, and fine

- List: 56px rows, cells at 14px, 14 reports; the sort is in the URL.
- Board: 12px gutter, and a 12px resize handle in it; the row strip starts at the measured height,
  two Shift+↓ make the row 80px taller and the plot follows, a pointer drag of 60px moves it 60; the grip glyph at 16–32 and the title at 40;
  starts as 34608, and one keyboard drag of Overview into the trend's row gives 29853 (6 / 6).
  Keyboard resize 6 → 7 reads "7 of 12 columns".
- Visualization: six card radios, one tab stop, no dial, the selected one on the subtle fill; → moves
  Line to Area and the page previews it. Story, voice and spike titles at 14px.
- Panel 384; the toolbar's Hour / Day / Week leaves while it is open; Cancel, close and Yak drop
  `edit=1`, and a reload with it reopens the panel.
- Phone (375 × 812): one column, widgets 325 wide, document not scrolling on all three screens.
- axe on the live app, in real Chromium: no violations on the list, board, detail and panel in light,
  or on the list, a generated board and the panel in dark.

## Slice 5 — Measure › Discover (2026-10-18)

`Measure - Discover` (`40005911:35187`) contains:
- the Ask bar, which hands its question to Yak
- Trending near your brand
- Creators your audience follows
- Visual trends in your space
- Opportunities to engage
- Brand sentiment
- Your top posts

The date range is in the URL (`?range=30d`).

### Open: library changes worth making

51. **Closed by #342 (2026-10-22): Brand sentiment passes `colorKey`; `SENTIMENT_SCOPE` is gone.** **`Gauge` and `Donut` take no per-slice color.** Every slice takes the categorical scale by
    position, so Brand sentiment's Positive came out purple. The sentiment tokens exist
    (`Data Viz/Sentiment/*`, and `sentiment` in `palette.ts`), but no chart prop can reach them. The
    widget wraps the gauge in a scope that points `--data-viz-categorical-01…03` at the sentiment
    tokens, which turns the arc and its legend swatches green, gray and red together. Measured: the
    three slice fills equal the three sentiment tokens. A `color` on a row (or a `colors` map) is the
    library fix, and Donut wants the same.

### Kept in the app, worth knowing

52. **The Ask bar is a way into Yak, not a second assistant.** A search or a starter opens Yak with the
    question and asks it in a new chat. The Yak shell panel can now carry
    `ask: { id, text }`, and Yak asks once per `id`. Yak also has a Measure line for what it is
    reading ("Reading what people are posting").
53. **Your top posts are the calendar's posts.** They are the brand's published posts in the range,
    ranked by impressions (`statsFor`), so a card opens the same post detail as Plan › Calendar, and
    the range changes which posts make the four. The file's four (the Silver Lake café opening and the
    rest) are not in the calendar's fixtures. Matching the rest of the app won over matching the
    drawing, as in finding 45.
54. **A clickable card holds spans, not a `<dl>`.** `ClickableCard` is a `<button>`, which may hold
    only phrasing content, so its stat rows render as spans. Visual trends' cards are plain `Card`s
    and keep the `<dl>`.
55. **A widget standing alone in the page column needs `h-auto shrink-0`.** `ContentBlock` is
    `h-full` (finding 43), and `AppShell.Content` is a flex column that shrinks its children. With
    the post panel open, Visual trends and Your top posts were squashed to fit the window, and their
    cards spilled over the next widget. Nothing showed at the frame's full height. A check that
    compares each block's `scrollHeight` with its `clientHeight` fails without the fix and passes
    with it.

### Figma owes

56. **Decided here:**
    - The range menu: Last 24 hours, 7 days or 30 days. Counts scale, and shares hold.
    - A bar under every theme row: the file draws none under the last row of each column.
    - Trends and creators are static rows: nothing in the file says what clicking one does.
    - The suggestion chips are `Token`s, which are outlined. The file fills them gray, and Token has
      no filled interactive look.
    - `Widget / Brand this week` (`40005911:35252`) is hidden in the frame and not built.
57. **Carter is on Threads in Creators and on Reddit in Opportunities**, as drawn.

### Measured, and fine

- 12px between widget rows, at 1088 and at 1180 × 700.
- The gauge's slice fills equal the sentiment tokens.
- The four top-post photos sit on one line, because the copy is always two lines tall.
- The range scales "18.2K posts" to "78K posts" at 30 days.
- Search and the starters land in Yak.
- A post card opens post detail.
- axe on the live app, in real Chromium: no violations in light, dark, or with Yak open.
- Phone: no document scroll, and nothing wider than the page.

## Floating Yak (2026-10-18)

Search left the nav. Yak is search now, and its results come back as a chat in the full view. The
floating bar (`Floating Yak`, `40005929:39292`) replaces Discover's Ask bar and Creators' search
block (`YakSearchBar` is gone with their starters). It floats over the bottom of the page column on
every page except Engage's, which pin a reply box there, and the full view, which has its own
composer. It hides while Yak is in its panel. A question opens the full view, which minimizes to
the panel. On Discover and Creators, a search answers with results.

### Open: library changes worth making

58. **Partly closed by #341 (2026-10-22):** `Panel.Header`'s `icon` takes an element now, but the Yak panel keeps no icon because the file draws none. **The library has no Yak/Yet mark to import.** `Chat/story-mark.tsx` keeps it a story fixture
    on purpose, because the assistant's mark is the application's business. The app still reaches
    into it from three places now: the panel, the nav and the bar. `yak/YakMark.tsx` wraps it as a
    decorative icon. It is `aria-hidden`, because `Mark` is `role="img"` named "Yet" and would
    rename the nav item "Yet Yak". It carries Icon's non-scaling 1.5 stroke, so at 16px it weighs
    what the lucide glyphs beside it weigh. `NavItem.startIcon` takes only a `LucideIcon`, so the
    mark goes in `start`. `Panel.Header`'s `icon` has the same limit, so the Yak panel header lost
    its `Bot` and shows no icon, as the file draws it.
59. **InputGroup has no pill shape and no height past `large`.** The bar is the group's own box,
    which keeps the library's border, hover and ring. `rounded-full` overrides `rounded-md`, and
    `min-h-14.5` gives the file's 58: a 40 row plus 8 of padding and the border on each side.

### Figma owes

60. **Decided here:**
    - Placeholders per page (`yak/floating.ts`). The file draws Discover's, and Creators'
      "Find the best creators for your brand" copied onto Calendar and the rest.
    - `/` puts the caret in the bar where there is one, and opens the panel where there is not
      (Engage).
    - No bar on a phone (below 768), where MobileNav owns the bottom edge.
    - The panel button takes anything already typed into the panel and asks it there.
    - Attach and Voice input are toasts, like the panel composer's.

### Measured, and fine

- At 1440 × 1024, the bar is 700 × 58, 246 in from each side of the page column, as drawn. With
  Post detail open, it is 50 in from each side, as the Week + Post Detail frame has it.
- Scrolled to the bottom, the last content sits 22px above the bar on Calendar, Reports, Discover,
  Home and Ideas (`md:pb-24` on each page's scroll region). Ideas wasn't built when this was
  written; measured once it was, at 1440 × 640, the last "New idea" ends 52px above the bar.
- No bar on `#/engage/all` or `#/yak`, and none while the panel is open. It comes back on close.
- Submitting on Reports opens the full view with the chat. Submitting on Discover opens it with
  creator results. Collapse to panel lands on the page with the panel open and no bar.
- axe on Discover: no violations.

61. **The ticket number is a Badge, at 24px.** In the message cards and the detail view it is
    an identifier you read, never a value you change, so it is a neutral `Badge` with the ticket
    glyph rather than a `Token`. Badge is a 20px pill (`min-h-5`), one size by its Figma spec, so
    the call site adds `min-h-6`. Measured at 24 in the list and the detail, level with the five
    tokens beside it. If a second caller needs a Badge to sit in a row of tokens, a `size` to
    match Token's 24 is the library change to make.

## Plan › Creators: Creator details and the full List view (2026-10-18)

Creator details (`40005911:35788`) is the shell's right `Panel`, opened from a grid card or a list
row (`screens/creators/CreatorDetail.tsx`). Clicking the open creator again closes it, as a
calendar post does, and the card reads `selected` while its panel is open. The List view
(`40005911:35964`) gained the file's Top topic and Engagement columns and the network glyph before
each handle. Brand fit, Audience and Engagement sort from their headers. The Sort by menu and the
headers are one sort in the URL (`?sort=engagement&dir=asc`), and the page's default (Brand fit,
descending) writes nothing.

### Open: library changes worth making

62. **`proportional(n)` weights other than 1 do not reach the browser.** The Table writes
    `calc(63.1579% - 328.421px)` and `calc(36.8421% - 191.579px)` on the two `<col>`s for
    `proportional(2.4)` and `proportional(1.4)` beside four pixel columns. Under `table-fixed`,
    Chrome rendered them 350 / 350 at a 1220 table, not the 442 / 258 those expressions give. Every
    other table in the app uses equal weights, so nothing showed it before. The app now uses two
    `proportional()` columns. Repro and fix belong in `src/components/Table` with a story that
    measures unequal weights.
63. **Withdrawn: Button has no pressed or toggle state.** The panel's Save (star) needed one,
    and was removed from the footer at Nathan's request on 2026-10-18, so nothing in the app asks
    for a toggle Button now. If a second caller wants one, a `pressed` prop or a ToggleButton is
    still the library change to make.

### Kept in the app, worth knowing

64. **The "Engagement rate vs similar creators" bars are plain spans, not ProgressBar.** Figma
    draws two 8px bars with no track, on `Data Viz/Categorical/01` and
    `Decorative/Neutral/Highlight`. ProgressBar always draws a track and has no categorical color.
    The bigger rate fills the row, and the bars are `aria-hidden` because the mono number beside
    each says it. Measured in both themes: each bar's computed color equals its token.
65. **"Similar creators" is a written number per creator** (`peerEngagement`), not an average.
    The file has Alena at 2.1%, and no average over the app's eight creators comes out that low.
66. **Collaborations shows brand initials.** The file's first avatar is a photo, and there are
    no brand logos in the app's assets. `AvatarGroup` sits on `surface="card-primary"` because it
    is inside a Card.
67. **With the panel open, the list is 828px for six columns.** The four short columns are pixel
    widths sized so their headers and sort arrows never clip (120 / 144 / 120 / 152). Creator and
    Top topic share the rest, so a long name truncates while the panel, which shows it in full,
    is open.

### Figma owes

68. **Decided here (code-first):**
    - ~~The Audience, Content and Similar tabs.~~ Figma drew all three on 2026-10-19 and the code
      follows the file now (entry 88).
    - Brand fit words on the card's three tiers: Great match 80+, Good match 40–79, Weak match
      under 40.
    - Brand safety at zero flags: a green ShieldCheck "0" and "No sensitive posts".
    - Location, talking points, channels, collaborations and peer engagement for the seven
      creators the file doesn't detail.
    - No Save action: the footer is Open profile and Add to campaign, both toasts (Campaigns has
      no design).
    - The tab strip is sticky at the top of the panel body, as the file's Tabs frame is.
    - Ten more creators (18 in all), so the grid reads like a real roster. Their faces are inbox
      contacts with creator-like handles. Brand fit is the default sort.
    - Each card scrolls sideways through the creator's latest four posts. The file draws two
      images, the second cut off at 64px, and the strip keeps that look: each post is the card's
      width less 68px, and it snaps one post at a time. It sits inside the card's `<button>`, so
      it can't have its own controls or tab stop. It is `aria-hidden` decoration, scrolled by
      trackpad, swipe or Shift+wheel. The Content tab lists the same four posts for a keyboard or
      a screen reader. The scroll and snap were measured headless; a real trackpad hasn't been
      tried.
    - The app has 17 food photos, so posts repeat across creators. No card repeats one, and no
      two neighbours open on the same photo at the default sort.

### Measured, and fine

- Panel 384 wide at 1504 × 1088. The grid keeps three columns beside it, as drawn.
- Alena's Overview reads exactly the file's values: 92% Great match, 1 Sensitive post, 14 brands,
  the four topics, 4.8% vs 2.1%, IG 820K / TikTok 310K / Facebook 74K.
- At 1504 × 700 the body scrolls, the tabs pin to its top, and the last card ends 16px above the
  footer.
- Header sort on Engagement cycles ascending → descending → the page's order. The URL and the
  Sort by menu follow each step, and the grid sorts the same way.
- A click anywhere on a list row opens that creator (the name button stays the keyboard path).
- axe on the list and the grid with the panel open, on all four tabs: no violations. No console
  errors.

## Plan › Ideas (2026-10-18)

The board from `40005911:32981`: four groups as `ContentBlock`s on the subtle surface, each a
`Sortable` of `_Idea Content` cards (`components/IdeaCard.tsx`) in a `ClickableCard`. It is
DragAndDrop's Kanban story put to work, and it needed no library change. State lives in
`IdeasProvider` beside `ReportsProvider`, so moved cards survive a visit to another page.

### Open: library changes worth making

69. **DragAndDrop's floor for an empty column is too short for tall cards.** Its CLAUDE.md and
    the Kanban story give an empty `Sortable` a `min-h-24` floor. Here the cards are up to 322px
    tall with a photo, and a keyboard-carried card is placed by its corners (`closestCorners`).
    A 48px floor at the top of Done was never closer than the In Progress cards beside it, so
    Arrow Right stopped one column short. The fix in the app is to make the `Sortable` the whole
    column body, "New idea" button included, with the `role="list"` one level in on the cards
    alone. The record should say that the floor has to be about as tall as the cards, or be the
    column.

### Kept in the app, worth knowing

70. **The grip shows on hover and on focus.** Figma draws no grip, but the keyboard path needs
    one. `DragHandle` sits beside the card, as the story's does (a button in a button fails
    axe). It is hidden until the card is hovered or the grip has focus, and it takes the card's
    surface (`bg-surface-background-primary`), because it lands on the photo's corner. A ghost
    button on a photo has no background of its own. `DragHandle` takes no `appearance`, so
    `overlay` wasn't an option.
71. **The board scrolls both ways.** `overflow-x: auto` makes `overflow-y` auto too, so the page
    region never scrolls on Ideas; the board does. Stretched to the board, the columns stopped
    at its height and cards spilled out of them at short viewports. The track inside is
    `items-start` with `min-h-full`, so columns end level and grow with the tallest one. The
    groups share the width between 256 and 320 (267 each at 1440, the file's number), and past
    that the board scrolls sideways.

### Figma owes

72. **Decided here (code-first):**
    - Gallery (`?view=gallery`): the same cards in Creators' responsive grid, each with its group
      as a neutral Badge.
    - Card click, Filter and the top bar's More are toasts; no idea detail or filter is drawn.
    - "New idea" (top bar, a column's `+`, or the row under its cards) adds "Untitled idea" to that
      group, the top bar's to Unassigned, and focuses it. "New group" adds "Untitled group" and
      focuses its `+`.
    - A group's `…` menu: Rename (a toast), Clear ideas, and Delete group, which moves its ideas
      to Unassigned rather than losing them. Unassigned has no menu, as drawn.
    - Two bodies Figma cuts off mid-word are finished in `data/ideas.ts`.
    - The Calendar's Ideas button now opens this page.

### Measured, and fine

- At 1440 × 1024 the four groups are 267 wide with 12 between, and the New group strip is 44, as
  drawn. Nothing scrolls sideways until a fifth group is added; then they go to 256 and scroll.
- Keyboard: Space on Threads' grip, Arrow Right twice, Space. It's announced "over To Do",
  "over In Progress", "over Done", then "dropped in Done, position 1 of 1". The counts follow and
  focus returns to the grip. Escape puts it back ("Move cancelled"). In the hidden Browser pane,
  keys sent faster than it re-measures can leave the card one column short. Paced, it lands every
  time. A pointer drag wasn't tried there; the pane can't run one.
- axe on the board (with a fifth group added), at rest: no violations. Mid-drag, the half-opacity
  carried card fails color contrast, which is the library's drag style and is expected.
- Light and dark, both views.

## Shell › New menu (2026-10-19)

A primary **New** button at the top of the rail, so you can create something from any page.
Figma drew it first: the calendar frame (`40005911:32756`) puts a full-width `Button`
(`40005939:57450`) first in the side nav's Top Slot, above Yak, and the menu it opens is
`40005939:57476`. The code is `shell/NewMenu.tsx`, and it needed no library change: `SideNav`'s
`top`, `Menu.Trigger` rendering a `Button`, and `Menu.Item`'s `startIcon` and `description`.
Every item is a not-built toast for now.

### Kept in the app, worth knowing

73. **The shell holds the rail's `collapsed` state, only for this button.** `top` is the
    caller's content, and SideNav doesn't reshape it for the 56px rail the way it does its own
    rows. So the shell controls `collapsed` and swaps in an icon-only button with a `New`
    tooltip. The tooltip wraps `Menu.Trigger`, not the Button, so both sets of props land on
    the same element. If a second app puts a button in `top`, that's the time to have SideNav
    expose `collapsed` to its slots.
74. **Read the copy off the file on the day.** The first build used sub labels suggested in
    chat the day before, against a 248-wide menu whose 178px text column wrapped two of them.
    By the time it was built, the file had moved to a 284-wide menu (216px column) with its
    own copy. Campaign is "Plan a coordinated push", Report is "Measure how content
    performs", and Topic is "Track conversations on a theme". The code now follows the file.

### Figma owes

75. **Decided here (code-first):**
    - Collapsed rail: an icon-only `large` primary button (40×40) with a `New` tooltip.
    - Phone: an icon-only default-size primary button in `MobileNav`'s utilities, between Yak
      and the theme toggle. The menu flips up above the bar.

### Measured, and fine

- At 1440 × 1024 the button is 208 × 40 at the top of the rail, and Yak starts right below it
  (68 + 40 = 108), as drawn. The popup is 284 wide (`w-71`), as drawn, with rows of 52 (with a
  sub label) and 32 (without). Two-line rows center their icon, which matches the file (y = 18 in 52).
- Click opens, Escape closes and returns focus to New, and an item fires its toast.
- Dark mode: the button takes the inverted `action-primary-background`.
- 393 × 852: the menu opens upward inside the screen and none of its rows wrap.
- axe with the menu open: only `region`, which is entry 26.

## Measure › Messages behind a number (2026-10-19)

Every number on Measure now opens the posts that make it up. On Discover you click the data point
itself: a trend row, a creator, a visual trend card, an opportunity, a sentiment in the gauge's
legend, or a Praised for / Criticized for theme. On a report board, every widget has a **View
messages** button before its `⋯`, as the mock draws it (`40005911:34686`). Both open one shell
panel, `screens/mentions/MentionsPanel.tsx`: a list of `MentionCard`s you can filter by sentiment
and network and sort by Newest or Most engagement, 20 at a time. Each card has Like, Reply,
Share and Open in Engage. A card opens its detail, a `Panel` stacked inside the list's
(like Yak's History), with the full post, Yak's read, its numbers, the replies and a reply field.
**Open in Engage** makes the post a ticket once (`InboxProvider.addTicket`, numbered after the
last) and goes to it at `#/engage/all?message=<n>`.

The posts are generated (`data/mentions.ts`), seeded on the question asked so the same click
gives the same list. Each list is steered by what was clicked, so Packaging waste reads like
packaging complaints. Authors are inbox `customers` (fourteen added, five of them Brand Pulse's
Top voices), so a mention can become a ticket. Every total comes from the same function its
widget draws with, so the panel's count matches the number you clicked: 40.3K on Overview,
26.2K (9.5K + 8.7K + 8K) on Mentions over time at 7D, 68 on Top voices, 2.1K Negative on
Discover at 30 days. A list generates the latest 120 at most and says so: "Showing the latest
120 of 40.3K mentions".

### Open: library changes worth making

76. **Closed by #279; wired in below.** **No chart takes a click on a data point.** `Gauge`, `Donut`, `LineSeries`, `AreaSeries` and
    `HorizontalBar` have no point, slice or bar handler, and none passes extra props through
    to Recharts. Discover works around it for the gauge: `legend={false}` and a row of three
    legend buttons above it, which open Positive, Neutral or Negative. Reports opens the whole
    widget from its header button. An `onPointClick` / `onSliceClick` across the chart family
    would let a click on one day of the trend open that day's mentions.
77. **Closed by #344 (2026-10-22): `rowTarget` on the Author column, in Creators, Discover and the report widgets; `clickableRows.ts` is deleted.** **`Table` has no row click.** The Creators table's Author cell is a `<button>`, which is
    the keyboard path, and a click anywhere else on the row forwards to it. This is the
    Reports list's pattern (entry 48) with `hasHover`, so the row shows the same hover.
78. **Closed by #343 (2026-10-22): `MentionCard` passes `selected`.** **`Card` has no `selected` state; only `ClickableCard` does.** A mention card can't be a
    `ClickableCard` (it's one `<button>`, and the card holds Like, Reply and a menu). So the
    card marks its open detail with `ClickableCard`'s selected tokens written by hand.

### Kept in the app, worth knowing

79. **Clicking the same point again closes the panel.** This is the top-post pattern
    (`open === id ? null : …`), shared through `useMentions().toggle`. The thing that opened
    the panel shows as pressed or selected while it's open.
80. **`Customer.avatar` is optional now.** Not every account that mentions the brand has a
    photo, and `Avatar` draws initials. No existing customer lost its photo.
81. **Likes and replies are held by the panel**, which the shell always renders. They survive a
    filter change, closing the detail, and switching lists. A reply goes out from the brand
    account on the mention's network, or the first account when the brand has none there.

### Figma owes

82. **Decided here (code-first):** the mentions panel (header with the clicked thing's name,
    count and source line, three filters, the card list, Load more), the mention card, the
    stacked Message detail, Discover's clickable legend row under Brand sentiment, the
    clickable theme rows, and hover/selected states on the trend rows and visual trend cards.
    The View messages button follows the mock, and the file draws it only on Mentions over
    time.

### Measured, and fine

- Brand Pulse: all seven widgets have View messages first and `⋯` second. Clicking it opens
  the panel without navigating to the widget's detail page.
- The panel is 384 wide. The detail stacks 12px in (x 1036 → 1048).
- Like and reply carry over to the card after the detail closes. Open in Engage lands on
  #1293 with "Opened from Measure · Packaging waste", and a toast.
- axe on the detail page with the panel open, and on Discover with the list and detail open:
  no violations.
- Dark mode reads correctly. At 390 × 844 the panel goes under the page at 374 wide, and nothing
  overflows.

## Measure › One hover color for clickable rows (2026-10-19)

On Discover, everything you can click (trend rows, visual trend cards, theme rows, the sentiment
legend, and now the opportunity rows, which had no hover) fills to `ClickableCard`'s
Surface/Background Subtle. The clickable table rows didn't: `Table`'s `hasHover` is the
translucent `surface-overlay-subtle`. Nathan asked for one color everywhere, Reports included.

### Fixed in the library (2026-10-19)

83. **Fixed (#278): `Table`'s row hover is `ClickableCard`'s on a table that isn't striped.**
    The Table picked the translucent `surface-overlay-subtle` on purpose: on a zebra table, an
    opaque hover is lighter than one of the two resting fills. A table that isn't striped has one
    resting fill, so `hasHover` there now uses Surface/Background Subtle, and a clickable row and
    a clickable card agree. Striped tables keep the wash. The override in
    `components/clickableRows.ts` on the three clickable tables (Reports, Discover's Creators
    widget, Plan › Creators) is gone; the file keeps only the pointer cursor.

### Measured, and fine

- With a real pointer, the hovered fill is `oklch(0.97 0.001 106.424)`, Surface/Background
  Subtle, on a Reports row, a Discover Creators row, a trend row and an opportunity row, after
  finishing the 0.1s color transition.
- An opportunity row's fill has 8px corners and sits 4px inside the dividers, like a trend row.

## Measure › Click a point (2026-10-19)

The charts take a click on one mark now (#279), so the number under the pointer opens its own
messages. On a report board or a widget's detail page, a day of a line or area trend opens that
day's mentions — Brand Pulse's Mentions over time at 7D, Oct 17, opens "Oct 17 · 2.9K mentions",
which is 1,077 + 1,030 + 796, the three numbers in that day's tooltip. A Share of voice slice opens
that brand over the range (GreenCrate at 7D: 8.7K, the same figure as above), and so does a bar.
On Discover, a slice of the Brand sentiment gauge opens that sentiment, as its legend button does.

### Kept in the app, worth knowing

84. **A point is a window in the past.** `MentionQuery` has `endsHoursAgo`, so a day's mentions
    are generated inside that day: `widgetPointMentionQuery` (beside `widgetMentionQuery` in
    `screens/reports/mentions.ts`) takes the bucket the chart is grouped by — hour, day or week
    — from its start to the next point's, and stops at now. Its count is the point's own, every
    series added up, or the one series when the click landed on a dot or inside an area.
    `widgetSeriesMentionQuery` is the slice and the bar: one series over the range.
85. **"Other" opens nothing.** It is everyone else, and there is nobody to write its posts as
    (the rule `widgetMentionQuery` already had). Its slice shows the halo and stays shut.
86. **A chart on a board block opens mentions, not the widget.** The block's click-anywhere
    goes to the detail page; it skips anything inside `[data-opens-mentions]`, which
    `ChartWidget` wraps round every clickable chart.

### Open: library changes worth making

87. **A mark has no selected state.** The thing that opened the panel shows as pressed (entry
    79), and a slice or a day can't: the halo is hover, and the library has no way to hold one.
    The gauge keeps its row of legend buttons for that reason, so the open sentiment still reads
    as pressed. A day on the trend and a Share of voice slice show nothing while open.

### Measured, and fine

- With a real pointer — hover, then click — every slice opened. A click that moves and presses
  in the same instant (the Browser pane's `left_click`) can be lost on a slice; see the Chart
  record. A person's pointer always arrives first.
- Clicking a chart on the Brand Pulse board left the URL on the board.
- A second click on the same day or slice closes the panel (entry 79's `toggle`).

## Plan › Creator full view (2026-10-19)

Figma: `Plan - Creators / Creator Details / Full View` `40005952:23519`, `… / Content`
`40005955:24767`, `… / Similar` `40005955:75412`. Route `#/plan/creators/:id?tab=&from=`
(`screens/creators/CreatorFullView.tsx`).

### Kept in the app, worth knowing

88. **The tabs are the file's now, in both places.** Audience (four KPIs, age, gender, top
    countries, interests), Content (four KPIs, top three posts, format and channel mix) and Similar
    (Sort by + six cards) replace the code-first tabs. One set of components serves the 384 panel and
    the full view's right column by laying out off `@container/creator` at 560, so the panel gets one
    column and the full view gets the file's grid. Alena's numbers are the file's; everyone else's are
    seeded to her shape (`audienceFor`, `contentFor`). The bars are the Engagement card's plain 8px
    drawing on a 0–100 scale, not `HorizontalBar`, because the file draws them that way. A post card
    is a plain `Card`, not the file's `Clickable Card`: a creator's post has nowhere to open to yet.
89. **Similar is by audience overlap, seeded per pair.** `audienceOverlap` is symmetric and a shared
    category adds 30, so the six differ from the file's six (which were picked by hand). Its Sort by is
    local state, not the URL: it is a small list inside a tab, and the tab itself is in the URL.
90. **Collapse carries the panel through the navigation.** The shell closes a screen's panel when the
    path changes; a navigation can now carry the one the next screen opens with
    (`navigate(from, { state: { panel } })`), so Collapse lands on Creators with the panel open on
    the same tab, and Expand opens the full view on the panel's tab (Audience from Overview, which
    the full view always shows). The panel starts on the requested tab each time it opens and keeps
    its tab when Similar swaps the creator.
91. **The floating Yak bar comes free.** `/plan/creators/:id` matches Creators' prefix in
    `yak/floating.ts`, so it is Creators' bar, as the file draws. Both columns carry
    `floatingYakClearance`; at 1280×700 the last Similar card ends 22px above the bar.
92. **Below 768 of page the columns stack** into one scroll, and Open profile and Add to campaign
    move from the top bar to under the name, where on a phone they had covered the title.


## Plan › Calendar notes (2026-10-19)

Figma: `Calendar Note` `40005949:63968` (10 colors × Default / Hover / Focus, plus `X more`).
Notes live in the week's and day's Notes row and in each month week, and are made and edited in
`screens/calendar/NoteDialog.tsx`. The note is `components/CalendarNote.tsx`.

### Open

93. **The note's colors are not YADS tokens.** The set binds Seeds-style variables
    (`green.background`, `magenta.highlight`, `aqua.foreground`, …) and `Overlay/Background` for the
    fold, none of which exist in `tokens/`. Two of the ten names have no YADS hue at all, so Magenta
    is drawn in `decorative-fuchsia-*` and Aqua in `decorative-cyan-*`. The others map by name to
    `decorative-<hue>-{background,highlight,foreground}`. Those tokens are deeper than the file's
    pastels (the file's green background is `#d7f4d7`; YADS's is `green-300`), so a note in the app
    reads stronger than the drawing. The fold's flap is the hue's foreground at 30%, `InternalNote`'s
    recipe, because there is no `Overlay/Background`. **Owed to the file:** rebind the set to the
    Decorative tokens, and decide Magenta/Aqua. The color picker keeps the file's names.
94. ~~**No swatch picker in the library.**~~ **Closed 2026-10-19.** Figma's `New note` frame
    (`40005957:64172`) answered it: the color is a `Select` whose value shows the swatch. The library
    gained that in #289: `startIcon` takes an element as well as a Lucide icon, and the chosen row's
    icon now shows in the trigger, for Select and single-select Combobox. The app passes
    `noteSwatch(color)` as a 14px dot.
95. **Closed by #338 (2026-10-22): the Body shrinks and never grows now, and the three `flex-initial` overrides are gone.** **`Dialog.Body` stretches a short dialog to the viewport.** It is `flex-1` so it can scroll, which
    also makes it grow: the note dialog came out 868px tall with 470px of form. `flex-initial` on
    the Body (shrink to scroll, never grow) fixed it here. That may be the right default for the
    library.

### Kept in the app, worth knowing

96. **Notes are laid out in lanes, per run of days drawn.** `layoutNotes` in `model.ts` clips each
    note to the days on screen, sorts by start (longest first on a tie), and puts each in the first
    free lane. So a campaign keeps the top lane and one-day callouts fill in under it. A note that runs
    off the days drawn squares that end and drops the fold, because it has not finished there.
97. **The Notes row is a grid, the hour rows are flex.** At 375 wide both give 112px columns at the
    same x (measured: 65, 177, … 737 in both). The day cells span all of the row's lanes behind the
    notes.
98. **Month weeks show two lanes.** Further notes go behind the cell's existing `+N more`, which now
    counts hidden notes and hidden posts together. The lanes take rows from each cell's four, so
    a week with two lanes shows one post and the link.
99. **Two ways in.** The day header's + is now a Menu (Add post, Add note). A click on a day's empty
    part (in the Notes row) starts a one-day note there. (A month cell did too, until finding 101 made it
    open the day panel.) The cell click is a pointer
    shortcut with no tab stop; the + menu is the keyboard route. Past days offer neither. Clicking a
    note opens the same dialog with Delete.
100. **Closed by #336 (2026-10-22): `DateInput` is the library's, in `Calendar`; the app's copy is deleted.** **The dialog follows the file now, and the date field is the app's.** `NoteDialog` was a
    two-column form (radios on the left, an inline range `DatePicker` on the right). It is now Figma's
    single column at 600: Title, Description, Color, then Start date and End date at 280 each, 8 apart.
    Measured against the frame, every field lands on the frame's y. Each date is
    `components/DateInput.tsx`, an `Input` that opens `DatePicker` with a single `Date`, which is
    Figma's `Date Picker Type=Single`. That popover is positioned with `anchor`, not
    `Popover.Trigger`, because the trigger writes `aria-expanded` (not allowed on a textbox) and
    toggles on every click into the field. The library leaves a date-field trigger out on purpose
    (`Calendar/CLAUDE.md`), so this stays in the app. **A second date field anywhere is the signal to
    promote it.** End's grid disables days before the start, a typed date before it reverts, and an
    empty end saves a one-day note. Checked in real Chromium (pick, type, Enter, Tab, ArrowDown into
    the grid, Escape closes only the panel), and axe is clean on the open dialog and panel in both
    themes.

## Plan › Calendar day panel (2026-10-19)

### Kept in the app, worth knowing

101. **A month day opens a day panel.** Clicking a month cell, or its date (the keyboard route, a
    real button with `aria-pressed`), opens `screens/calendar/DayDetail.tsx` as the shell panel
    `{type: 'day', date}`: the day's notes, then its posts by hour. Code-first; Figma has no day
    panel. Its header carries the week view's + menu (Add post, Add note) through `Panel.Header`'s
    `actions`, and a day that has gone by has no + but still opens, since what went out is worth
    reading. A post opens **stacked** on the day (a `PostDetailPanel` written inside the day's
    `Panel.Body`), so closing it lands back on the day. Clicking the open day again closes the
    panel. axe is clean with the day panel open and with a post stacked on it.

    **2026-10-22:** the panel is now laid out as the day view is — `HourGrid` with one column and
    `header={false}` (the panel header already says the date and carries the + menu), so a Notes
    row then a row per hour, with the now line. A click on the Notes row's empty part starts a note
    on the day, and one on an empty hour starts a post at that hour, as in the day view. Posts in
    the panel do not drag: the panel is the shell's, outside the calendar's `DragAndDrop`. axe is
    clean with it open.

## Measure › New report and report types (2026-10-19)

New report opens from the list's New report button and from the New menu's Report and Topic items,
on any page (`?new=report&type=`). The first step picks one of eight types, the second sets the
name, topics, sources and delivery, and Create report lands on the type's board
(`screens/reports/NewReportDialog.tsx`, `reportTypes.ts`, templates in `data/reports.ts`).
Code-first: the file has no flow behind the list's create entry point.

### Open

102. **`LineSeries` has no second y-axis.** Media monitoring's NewsWhip-style timeline puts media
    interest (articles) against public interest (interactions), and the second is about a hundred
    times the first, so on one axis the article line is flat on zero. `TimelineWidget`
    (`widgets/MonitoringWidgets.tsx`) draws two stacked plots on the same days instead. A right
    axis would let it be one chart.
103. **No selectable card, a second time.** The type picker is FINDINGS 40's workaround again
    (`Radio.Root` rendered onto a `ClickableCard`). That is two screens hand-rolling the same
    radio card, which is the bar for a library `SelectableCard` / `Radio` card variant.

### Kept in the app, worth knowing

104. **Each type is a template over the report's own topics**, built by `widget()` like every
    other board, so a new Competitive report on GreenCrate shows the same GreenCrate numbers as
    Brand Pulse. Five widget kinds were added: `feed` and `timeline` (Media monitoring's own),
    and `sentiment`, `trending` and `posts`, which are Discover's widget bodies on a board's frame
    (Discover now exports `SentimentBody`, `TrendingList` and `TopPostsGrid`, and
    `discover/topPosts.ts`). A board's seven ranges map to Discover's three (today and yesterday
    → 24h, 7D → 7d, everything longer → 30d).
105. **Social performance's Overview is still the mentions overview.** Its Engagements counts
    engagement with mentions of the brand, not with the brand's own posts, so it does not add
    up to the posts below it. An owned-profile overview (followers, impressions, engagement
    rate) is the right widget there and does not exist yet.
106. **Add widget works now, on every board.** It puts Mentions over time in a row of its own
    and opens its Edit panel (`?edit=1`). A Blank report opens on an empty state with the same
    button. Reports made this session live in `ReportsProvider` (`createReport`), so the list,
    board and widget detail all read reports through `useReports()` rather than the fixtures.
107. **Weekly grouping starts on a partial week.** Thirty days is four weeks and two days, so a
    weekly line opens on a two-day bucket that reads as a dip. The Trend template groups by day
    for that reason; `seriesPoints` is unchanged.

## Measure › Report widgets open their mentions (2026-10-19)

### Kept in the app, worth knowing

108. **Every number and row on a board opens the mentions behind it, as on Discover.** The four
    Overview metrics and a chart's metric viz are `ClickableMetric`s. Story, feed, voice and
    breakdown rows each have a `RowButton` in their first cell, and a press anywhere on the row
    forwards to it. Spike alerts are ghost `ClickableCard`s, and a timeline point opens that day's
    articles or interactions (`widgets/clickable.tsx`, query builders in `reports/mentions.ts`). The
    mention generator gained `story` and `spike` angles, so a story's list is people sharing that
    story. Everything hovers to Discover's one fill, Surface/Background Subtle, measured on a row
    and a metric card. The Overview cards are bordered `ClickableCard`s now rather than subtle
    `MetricCard`s, because a filled card cannot hover to the fill it already has.
109. **A table row does not stay filled while its list is open.** `Table`'s `selectedKeys` is tied to
    its checkbox selection, so an open row says so through its button's `aria-pressed` only.
    Discover's Creators table behaves the same. A row "current" state with no checkbox would let
    both tables show it.

## Home (2026-10-19)

### Kept in the app, worth knowing

110. **Home follows "Home - B · Daily brief" (`40005972:26336`) with two departures.** The fourth
    task is "Finish the Harvest Glow reel", not the file's Pineapple Sunrise draft, because Open
    goes to Ideas and Harvest Glow is the idea in progress on that board. The week strip's day
    headers pad 8 on the left with no gap before the +, where the calendar pads 12 with a 4px gap.
    The file's week has single-digit dates, and at a 100px column "Mon 19" truncated. Below 768
    each column keeps 104px and the strip scrolls sideways.
111. **`_Calendar Post Chip` gained `thumbnail={false}`**, the symbol's `Show Thumbnail` off. The
    month view still shows the photo. Home's columns are too narrow to give it 20px.

## Creator details style pass (2026-10-19)

### Kept in the app, worth knowing

112. **Audience and Content now draw like Discover and Home.** The file swapped the KPI cards for
    `Metric Card`s (subtle fill, mono value, two to a row at every width) and the bar and post
    cards for headed `Content Block`s; Overview's card labels went from 12 to 14px. Two copy
    departures from the frame: the app keeps "Posts by channel" and "Authentic followers" where
    the file says "Post by channel" and "Authentic follwers". The top posts are still plain
    `Card`s rather than the file's Clickable Cards, for the reason in 88.

## Similar creators stack (2026-10-20)

### Kept in the app, worth knowing

113. **A creator picked on Similar stacks over the panel instead of replacing it.** The panel used
    to swap to the picked creator in place and keep the Similar tab, so the list you were walking
    was gone. Now the pick opens a `Panel` written inside this one's body, which `Panel`'s nested
    stacking slides in 12px over it on Overview, while the panel behind stays on Similar. Closing,
    Escape or a click on the peeking edge goes back to the list, and focus lands on the card you
    picked. The stacked level is the same component (`CreatorPanel`), so its own Similar stacks
    again. A new creator from the grid, or closing the root, clears the stack. The full view's
    Similar still goes to the other creator's full view, because a page has nothing to stack on.

## Notifications (2026-10-20)

Figma `Notifications - D · Activity cards` (`40005993:27777`) and its `_Notification Item`
(`40005993:27689`), as `screens/notifications/NotificationsPanel.tsx` and
`components/NotificationItem.tsx`. The bell on the rail and in the phone sheet opens it.

### Open: library changes worth making

114. **A ghost `ClickableCard` cannot hold a subtle card.** Its hover is
    `Surface/Background Subtle`, which is exactly the fill of the card inside each notification,
    so on hover the inner card disappears into the row. The row overrides the hover to
    `Surface/Overlay Subtle`, which is translucent and darkens the inner card along with the row.
    Table's rows already hover that way (`src/components/Table/CLAUDE.md`). A
    ghost row with nested surfaces probably wants the overlay hover in the library, or a variant
    that has it.
115. **Closed by #337 (2026-10-22): `Avatar`'s `badge`.** A person sender is now `<Avatar badge={kind} />`; the Yak and network tiles are not avatars and keep their own disc, moved to the same 6px placement. **Avatar has no badge slot.** The file lays a 20px Type badge (a white circle with a 14px
    glyph) over the avatar's lower right, 22 in and 20 down. `Avatar` only knows `status`, a
    presence dot in the same corner, so the badge is positioned by hand in `SenderMark`, and the
    Show Icon tile used for Instagram, Yak and the brand account is hand-drawn beside it. A
    `badge` slot on Avatar would cover both.

### Kept in the app, worth knowing

116. **Every row goes somewhere real.** Posts open on the calendar's week with the post panel
    beside it (`state.panel`), the Reddit reply and the assignment open their tickets in Engage
    (1293 is new, for Carter), the comment bundle opens Comments by post on `p-11`, the Yak spike
    opens the performance report's top-posts widget, and the report, follower and report-comment
    rows open that report's board. Approvals have no screen, so the approval opens today's day
    view. When the target is the screen you are on, only the query changes and the shell's
    panel is set by hand, because a carried panel is only read on a path change.
117. **Two card icons follow the data rather than the frame.** The file shows Facebook on
    "Our Green Vitality Smoothie" and Instagram on Talan's conversation, but `p-11` is a Threads
    post and ticket 1283 came in on Threads. The icon now matches the place the click lands.
118. **The section label is 32 tall, as drawn.** The file pads it 12 above and 4 below a 20px
    line in a 32px frame, so the 4 falls inside the first row's 12. The code drops the bottom 4
    to match.
119. **Read state is per session** (`NotificationsProvider`), and the bell's dot is the unread
    count. NavItem draws its new indicator `aria-hidden`, so the count goes in the bell's name
    ("Notifications, 3 unread"). Settings is a not-built toast.
120. **A post panel can be asked to open on a tab, at a note.** `{ type: 'post', postId, tab,
    noteId }`: the mention opens Notes and scrolls Katie's reply into view, because a reply sits
    under its note and starts below the fold. Without a `tab` the panel keeps the one you were on,
    as it always has. Katie's reply on `p-12` (`c-2`) now says what the notification quotes, and
    is 3m old rather than 16d.

## Report type shortcuts (2026-10-21)

Figma's `Report Types` grid (`40006024:33222`) on `Measure - Reports`, as
`screens/reports/ReportTypeShortcuts.tsx`: New report's eight types above the table, four across,
two on a phone.

### Kept in the app, worth knowing

121. **A shortcut skips the picker.** Each card opens New report already on its setup step for that
    type (`?new=report&type=…&step=setup`), so the name, topics and sources start filled and the
    Name field has focus. Back still reaches the picker with that type chosen. The rail's New ›
    Report passes no `step` and still starts on the picker. The 40 between the grid and the table
    is the frame's Content Slot gap, so the screen overrides `AppShell.Content`'s 16.
## Add widget panel (2026-10-21)

A report board's Add widget opens a `Panel` listing every widget a report can hold
(`screens/reports/AddWidgetPanel.tsx`, `widgetCatalog.ts`). Click a tile and the widget goes
in a row of its own at the foot of the board while the panel stays open. Drag one and it goes
where it is dropped. Built code-first, then drawn into the file from the code: `Measure - Report
/ Add widget` (`40006031:28249`, on ↪ Social Media Management) shows the panel mid-drag, with
Mention totals carried over Mentions over time. Its tiles are Clickable Cards holding
`_Measure Widget Tile` (`40006031:28241`, in Components), the `_Measure Report Type Content`
pattern: an exposed Icon, a Title and a two-line Description. The file has no `smile` glyph,
so Sentiment's icon is `heart` on both sides. Numbered after #314's 121.

### Open: library changes worth making

122. **Closed by #339 (2026-10-22): `DragAndDrop.Source` / `useDragSource`**, which the catalog tiles now use. **DragAndDrop has no draggable *source*.** It has sortable containers and items, and
    nothing for a thing that is dragged *onto* a board without being one of its items: a
    palette, a toolbox, this catalog. The tiles use `useDraggable` from `@dnd-kit/core`
    directly, and spread only its `onPointerDown`. A `DragAndDrop.Source` would want the same
    two decisions made once: pointer only, so the keyboard path is a click, and none of
    dnd-kit's drag attributes, which would announce a drag the keyboard cannot do.
123. **A full container is invisible to collision detection.** `Sortable`'s `capacity` turns
    the row and its items off while anything from outside is carried, so a tile over a full
    row is over *nothing*. That is right for refusing it and wrong for aiming it: "start a row
    under this one" needs to know which row the pointer is in. The board finds it by rect
    (`placeFor` in `ReportScreen.tsx`). If the library grows a source, it probably wants a way
    to see a full container without dropping into it.

### Kept in the app, worth knowing

124. **A screen can own a shell panel.** The catalog's tiles have to sit inside the board's
    `DragAndDrop`, which lives inside the page, and the shell's panels are the page's siblings.
    So the board renders the panel itself and portals it into `ShellState.screenPanelHost`, a
    `display: contents` div the shell keeps right after `AppShell.Page`. React context crosses
    the portal, so the drag reaches the board. `AppShell`'s and `Panel`'s contexts cross it
    too, and the phone split still fires, because `has-data-panel` is a descendant `:has()`.
    Opening is still `setPanel({ type: 'add-widget', reportId })`, so it closes when another
    panel opens or the page changes, like every other.
125. **A catalog tile is aimed by the pointer, and lands only on release.** `pointerWithin`
    rather than the board's `closestCorners`, so a tile still over the panel is over nothing;
    `closestCorners` would aim at the nearest row from inside the panel. The board does not
    reflow while a tile is carried, because FINDINGS 41's oscillation came from exactly that.
    The row it would join takes a dashed outline instead, a full row shows a bar under itself,
    and the spare row fills.
126. **In a move event, `over` is a render behind `collisions`.** Aiming from `over` sent a tile
    carried onto the spare into the row above it. `placeFor` reads `collisions[0]`, and the
    drop is worked out again from the release event rather than from state set on the last
    move.
127. **A smooth scroll under a drag crashes the board.** The first build scrolled a just-added
    widget into view smoothly. Grab another widget while that scroll was still carrying the
    board, and dnd-kit re-aimed it on every frame, the rows reflowed, and React stopped with
    "Maximum update depth exceeded" (about one run in eight in real Chromium; never in the
    hidden pane). The scroll is now instant and happens once per add, from the board, not
    from the widget's own mount (a drag remounts widgets). The ring is a class the board
    takes off after 1.6s. A person scrolling with a wheel mid-drag may still be able to reach
    the same state; that was not tested.
128. **A repeated widget is numbered.** A second Top stories is "Top stories 2": its title
    names its table's region, and two regions with one name fail axe (`landmark-unique`).
    The status line says the numbered name, so two adds in a row are both announced.
129. **Add widget no longer opens a starter's Edit panel.** `starterWidget` is gone. The
    catalog's first tile, Mentions over time, is the same widget.

## Calendar drag (2026-10-21)

Plan › Calendar's posts can be moved and its drafts scheduled, the report's Add widget drag
(#316) carried over to a second screen. **Drag a scheduled post** to another hour in the
week or day view, or to another day in the month. **Drag a draft** out of the Drafts panel
onto an hour or a day: it leaves the panel and goes on the calendar as a post. The keyboard
does both through one **Schedule dialog** (`screens/calendar/ScheduleDialog.tsx`), opened
from the post detail's ⋯ (Reschedule…) and from a ⋯ on each draft (Schedule…). Either way a
toast says where it went, with an Undo. Code-first, as the Drafts panel was; Figma has no
drag or scheduling frames. Numbered after #316's 129.

### Open: library changes worth making

130. **Closed by #339 (2026-10-22):** `useCardDrag` is a thin wrapper over `useDragSource` now. **The second draggable source.** FINDINGS 122 asked for a `DragAndDrop.Source` when a
    second palette turned up, and this is it twice over: draft cards out of a panel, and
    post cards that are not `Sortable.Item`s because a calendar cell is not a list. Both
    make 122's two decisions again (`useCardDrag` in `screens/calendar/dragHooks.ts`):
    pointer only, and no drag attributes. They also add a third: the carried copy is
    `DragAndDrop.Overlay` every time, because a source is always being carried *out* of
    something that clips. That is the bar for a library `Source`, in its own PR.

### Kept in the app, worth knowing

131. **Posts and drafts are state now.** `ScheduleProvider` (above the router, beside the
    calendar's notes) holds both. `postsOn(posts, date)` takes the list, and everything that
    can show a scheduled post reads it: the week, day and month, the day panel, the post
    detail, Home's week strip and Yak's week insights. Screens that only show published
    posts (Discover, Comments by post, notifications) still read `data/posts.ts`, because a
    published post never moves. A scheduled draft becomes post `p-<draft id>`.
132. **Where a drop lands is one pure function** (`placeFor` in `drag.ts`, tested in
    `drag.test.ts`, the first test under `apps/`; `vite.config.ts`'s node project now
    includes `apps/**/*.test.ts`). An hour keeps a post's minutes and gives a draft the
    hour itself. A month day keeps a post's time and gives a draft 9:00, or on today, once
    9 has gone, the next whole hour, which is the rule Nathan picked. Nothing lands in the
    past, and dropping a post where it already is changes nothing.
133. **The ring is aimed by `placeFor`, not by dnd-kit's `isOver`.** A cell that would
    refuse the drop, such as an hour gone by or the post's own slot, never rings, so the
    ring promises what the release will do. Days and hours that have passed are disabled
    droppables. Like the report, it reads `collisions[0]` with `pointerWithin`, and nothing
    reflows until release.
134. **The Drafts panel moved from the shell to the calendar**, portalled into
    `screenPanelHost` the way the report's catalog is (124). A draft has to sit inside the
    calendar's `DragAndDrop`.
135. **A card's `<img>` is `draggable={false}`.** A post's thumbnail and a draft's photo are
    natively draggable, and the browser's drag took the pointer from dnd-kit's when a press
    started on the picture. This is DragAndDrop's "link cards" trap, on an image.
136. **The month's day cell is behind its chips and still the drop target.** It is `-z-10`,
    and `pointerWithin` measures rects, not what is painted on top, so a chip let go over
    another chip lands on that day.
137. **The Schedule dialog is the shell's, not the calendar's.** The post detail is a shell
    panel, and Home opens it too, so the request lives in `ScheduleProvider`
    (`requestSchedule`) and the shell renders the one dialog. After a move on the calendar,
    the calendar follows the post to its new day (`?date=`).
138. **Verified in real Chromium with Playwright** (pointer drags, 12 checks): a move and
    its Undo, a refused past day, a published post that will not lift, a draft into an
    hour, a draft let go over the panel, a month chip keeping its time, and ten moves in a
    row with no React errors. The keyboard route was checked with Playwright as well, with
    axe clean while the dialogs were open. The hidden Browser pane cannot run a dnd-kit
    drag (72).

## Private messages (2026-10-21)

Five tickets are private messages (`Ticket.private`), after Nathan's Sprout inbox screens: Maria's
and Skylar's from the file's list, Rayna's (X) and Maya's (Instagram) added, and Cooper's completed
one in My inbox › Complete. No Yet Social frame draws a private message yet.

139. **A private message is a `ChatMessage`; a public comment is not (17).** The customer's runs are
     received bubbles over the ⋯ and the time; the brand's are `emphasized` sent bubbles beside the
     brand's mark, with Read and the time. Consecutive messages from one sender are one message, the
     library's Bubble Group rule (`components/chatEntries.ts`), and a system line ends a run.
     **`ChatMessage` has no slot under its metadata**, and Sprout's screens put a Token there: the
     sentiment under a customer's message, the teammate under the brand's. It is a row after the
     `<article>`, padded 32 to line up with the bubble. Open: a library `footer`, if a second caller
     wants one.
140. **The list's preview bubble vanishes on a hovered or selected card.** The default bubble is
     `Surface/Background Subtle`, and that is exactly the fill `ClickableCard` turns to under the
     pointer and when selected. In those two states the bubble swaps to `Background Primary`
     (`in-[button:hover]`, `in-[[aria-current=true]]`). That is the chat rule ("a log sits on
     primary") seen from a card.
141. **A private message's `ago` is its latest message**, which is what the list shows and sorts by.
     The chat stamps the first message with `startedAgo`, or a reply from 14m ago sits under a first
     message reading 6m.
142. **The reply box knows it is private.** It reads "Private reply to {handle}" with no @, and
     offers only the account the message was written to.

### Figma owes

- A private-message conversation and its list card on ↪ Social Media Management.

## Post composer (2026-10-21)

The composer is a full view at `#/plan/compose` (`Plan - Composer / Full View`, `40006009:29479`),
on the creator full view's shell: Back and the title in the top bar, Save draft, the date and
Schedule at its end, the editor in the wide column and the post as its network shows it beside
it. It opens on a draft, a scheduled post, an idea or a day (`screens/compose/paths.ts`), from
the rail's New, a day's +, the day panel, Home's week strip, a draft card and a post's Edit — every
place that used to say "not built".

143. **Posts stay one channel each; the composer fans out.** Picking Instagram and Threads saves
    two drafts or two posts sharing the caption and media, and the calendar shows two cards, as
    it would for two posts written by hand. The network tabs over the caption write one network's
    own caption (`captions[network]`) rather than forking the whole post, which is what lets Yak
    write "the Threads version" into one tab. Editing a draft or a post locks the channel row to
    the one it was written for.
144. **The Schedule dialog grew a `pick` request.** The composer's date button opens the shell's
    one dialog with `{ source: 'pick', onPick }` and takes the time back without committing
    anything; `firstOffer` and `TIMES` moved to `model.ts` so it and the composer share them. A
    new post is `addPost`, not `addDraft` then `scheduleDraft`: the provider's actions read the
    drafts through a ref that refreshes on render, so a draft added this tick is not there to
    schedule yet.
145. **The caption's label is the block's header**, so the TextArea takes an `aria-label` and the
    error sits under it as a `role="alert"` line rather than in a Field — a Field would have said
    "Caption" twice.

### Open: library changes worth making

146. **Closed by #336 (2026-10-22).** **`DateInput` has a third caller** (the composer, through the dialog). FINDINGS 100 said a
    second field was the signal to promote it; it is overdue.
147. **Closed by #337 (2026-10-22): `ChannelAvatar` passes the network's mark as `badge`.** **Avatar has no slot for a mark on its corner.** The channel row wants the network's glyph
    on the brand's avatar (`components/ChannelAvatar.tsx`); it is an absolutely positioned
    overlay in a canvas-colored ring. A `badge` slot on Avatar, like the status dot, would be the
    library's answer.
148. **Closed by #347 (2026-10-22): Combobox `onCreate`.** Nathan's ruling: a created tag grows the list, so it is still a Combobox. The tag catalog is a small store (`useTagCatalog`, `createTag` in `data/tags.ts`) so a tag made in the composer is in the idea page's list too. **Combobox `multiple` cannot create a value.** Tags are picked from `data/tags.ts`; a tag not
    in the catalog cannot be typed in. Figma's Tokenizer has `hasCreate`.

### Figma owes

- A Threads preview (the column only draws Instagram's), the "Edit post" title state, and a
  Facebook / X options block — the options drawn are Instagram's whichever tab is open.

## Yak beside the editor (2026-10-21)

On the composer and an idea's page the floating Yak bar opens the **panel**, not Yak's full view,
so the work stays in sight while Yak answers (`Plan - Composer / Full View - Yak Panel`,
`40006021:32135`; the reply `40006040:31176`). The replies there are scripted.

149. **`opens: 'panel'` on a page that is an editor.** `yak/floating.ts` says where a page's bar
    opens; the composer and `/plan/ideas/:ideaId` say `panel`, and the bar calls `chat.start` (a
    fresh chat with the typed text as its first turn) and opens the panel. The shell already keeps
    the Yak panel across a path change, so leaving the composer by Back or Schedule leaves Yak open
    beside the next page — by design, and worth knowing.
150. **A turn settles its reply when it is asked** (`yak/replies.ts`, `Turn.reply`). Scripts are
    keyed by page prefix and prompt; anything else gets the house line. `Conversation` draws what
    it is handed: the script's thought row with its extra `ToolCall`s folded inside, one Ghost
    bubble per paragraph, a `Card` for a caption Yak proposes with its buttons inside, and a
    "Next, I can" row of Secondary chips that ask again. The log never changes its mind after the
    fact, which a reply computed at render time from live state would.
151. **Applying goes through the chat, not into the form.** The panel is the shell's and the
    composer is a route, so the card cannot reach the form. The chat holds `applied` actions and a
    `composeTarget` the composer registers; the composer watches `applied`, writes the network's
    caption, and keeps what it replaced so an Undo — the entry going away — restores it. Undos are
    processed before new entries, because "Shorten more" is both in one tick. The chat object is
    memoized; an effect keyed on it looped the shell until it was.
152. **The library has no suggestion-chip or proposal-card part for a chat.** Both are app pieces
    here (`FollowUps` in `YakPanel.tsx`, `yak/CaptionCard.tsx`) built from Button and Card. A
    second caller — the inbox's Yak drafts are the likely one — would be the signal for a
    `ChatMessage.Suggestions`.

### Figma owes

- The proposal card inside a Yak turn as a component (it is a one-off in `40006040:31176`), and
  the "Next, I can" row.

## Ideas: the idea page and where an idea goes (2026-10-21)

An idea now has a page (`#/plan/ideas/:ideaId`, `Plan - Ideas / Idea / Full View`,
`40006058:33896`) on the composer's shell, and `new` is the same page blank, so writing and
editing are one screen. The board keeps the user's groups and gains three columns it reads
rather than keeps.

153. **An idea is intent; a post is the thing with a channel.** The page has a title, notes, a
    photo, a campaign, tags and an assignee, and says "no channel yet" until Make a post opens
    the composer prefilled (`prefillFromIdea`) with the link kept as `ideaId`. The composer is
    the only bridge, and taking it is optional. Ideas never reach the calendar; the Drafts panel
    stays drafts-only.
154. **An idea that has moved on leaves the groups.** The groups stay the user's four plain
    lists. When the composer saves a draft or schedules a post from an idea it calls
    `detachIdea`, and the Schedule toast's Undo puts the card back where it was. Drafting,
    Scheduled and Published are derived from the drafts and posts that carry an `ideaId`
    (`screens/ideas/lifecycle.ts`, pure and tested, with `now` passed in so the split from
    Scheduled to Published does not depend on `isPublished`'s load-time clock). Nothing about
    group membership is derived, so deleting a draft does not resurrect a card; the idea page's
    "Add back to board" does.
155. **Idea notes live in `IdeasProvider`**, not a fourth provider, and the Activity tab reuses
    the post detail's `ActivityTab` with events synthesized from the idea, its notes and its
    linked posts. The seeds put `d-6` (Harvest Glow, a reel) in Drafts and link `p-41` (Back in
    stalk, Threads, next week) and `p-50` (Soup season, published) to ideas, so all three
    derived columns have a card on load and Home's "Finish the Harvest Glow reel" is true.
156. **Closed by #341 (2026-10-22): Token's `startIcon` takes an element.** The derived cards that needed it left with #329, so nothing in the app uses it yet. **The Token takes a network mark through its `avatar` slot.** `startIcon` wants a Lucide
    glyph, so the derived cards' channel Token puts `NetworkIcon` where an avatar would go. Open,
    with 149: a `startSlot` on Token would say what this is.

### Figma owes

- The derived columns beside the user's groups (the file's `Plan - Ideas / Scheduled` board
  draws lifecycle columns on their own), the gallery, and "Add back to board".

## Engage: all assignments, spam and complete (2026-10-22)

The three Engage items that fell through to Not built are now the inbox screen again, filtered:
`InboxScreen scope="assigned" | "spam" | "complete"`. None has a frame of its own. The one
drawn piece is the bar that takes the reply box's place on a closed case
(`40006078:63232`, the Reply Box's `Inputs Box / Type=Case Closed`).

157. **Spam is a pile of its own, not a status.** `Ticket.spam` keeps a flagged ticket out of
    every scope but Spam: All messages, My inbox, All assignments, Complete, the nav counts and
    Yak's inbox numbers. It is a field rather than a fifth `TicketStatus` because spam is a
    judgment about the message, and its status (New) still holds if someone says Not spam.
    The edit sets it back to `false`, which reads the same as missing. A spam ticket is not
    worked, so its status Token is disabled (Token's own `disabled`, Figma's `State=Disabled`,
    on a disabled `Menu.Trigger`): it shows New, faded, and opens nothing until Not spam.
    The Complete buttons are disabled on it for the same reason.
158. **All assignments is open work; Complete is everyone's done.** Assignments lists every open
    ticket anybody owns (a completed one moves to Complete), and Complete lists every completed
    ticket whoever owns it. My inbox keeps its own Open | Complete for yours. The scope-to-filter
    table is `scopeFilter` in `screens/inbox/model.ts`, pinned by `model.test.ts`. The static
    `badge: 20` on All assignments is now a live count, like My inbox's and Spam's.
159. **Complete works now.** The toolbar's and the public thread's Complete buttons were
    `notBuilt` stubs; they toggle (`aria-pressed`) and record `completedBy` and `completedAt`,
    which the bar and the log's "Marked complete by" line read. Reopen clears both.
160. **`StatusBar` is the file's Case Closed row** (`components/StatusBar.tsx`): 48 tall, 8px
    corners, 12 either side, on `surface-background-subtle`, with a 24px avatar, the name in
    bold and a default secondary Button. The frame is drawn in Seeds' 13px type; it is the 14px
    body here, as every other inbox line is. The Reply / Internal note toggle stays above it as
    drawn, and Internal note still writes a note on a closed case. A spam ticket gets the same
    row with "Marked as spam automatically" and Not spam, which no frame draws.
161. **`Intl` puts a narrow no-break space before AM/PM**, so the file's "10:14 am" needs a
    `\s` that knows U+202F (JavaScript's does) rather than a literal space.

### Figma owes

- Frames for All assignments, Spam and Complete, and the spam version of the Case Closed row.

## Library pieces adopted (2026-10-22)

Four open entries became library changes the same day (#336–#339), and this switches the app to
them. Nothing here is new behavior; four things look slightly different, all toward the file:

162. **The composer's channel badge lost its border.** The app drew a 1px `Surface/Border` ring;
    `_Composer Channel`'s 1px stroke is bound to the fill's own token, so the file draws none.
    The badge also moved from the 44px ring's corner (24, 24) to the avatar's (26, 26), which is
    where the file has it.
163. **The notification Type badge sits 2px lower** than `_Notification Item` draws it. The file
    has it 20 down and the composer's 22; the library takes one placement for both, 6px past the
    circle on each axis. The Yak and network tiles follow it too, so every row matches.
164. **A carried card or tile fades to 50%, not 40%** — the file's `opacity/opacity-50`, which
    `Sortable Item`'s Lifted binds and `DragAndDrop.Source` uses.
165. **New report's type step hugs its cards** instead of stretching to the viewport, now that
    `Dialog.Body` does not grow. It still scrolls when the cards are taller than the screen.

## Library pieces adopted, round two (2026-10-22)

166. **Rows are Table's now.** Five tables (Reports, Creators, Discover's creators, and the report
    widgets' story and author lists) mark their name column `rowTarget` instead of wrapping the
    table in a forwarding handler. The Creators table's name button gained its own `onClick`: it
    used to rely on the wrapper catching the bubble. `MentionRows` keeps only its
    `data-opens-mentions` marker, which tells the board block not to open the widget page as well.
167. **A mention card's `aria-current` moved from its open button to the card**, where `Card`'s
    `selected` puts it, so it is said once, on the thing that is current.


## Slice — Asset library, with drag-and-drop upload (2026-10-22)

Plan › Asset library, built from `Plan - Asset Library` (`40006104:39766`) and its details frame
(`40006105:40365`): a Library tree (All assets, Favorites, Unused, Rights expiring) above a
Folders tree, a grid or a table, and Asset details in a screen-owned Panel. Dropping files on the
grid uploads them to the open folder, or to the library's root from a view.

### Fixed in the library

169. **Fixed (#350): `useFileDrop`.** FileInput's drop handling was private, so a grid-sized drop
    zone had nothing to reuse. The hook is exported beside FileInput, and FileInput's dropzone uses
    it. This screen spreads it on the whole grid side, toolbar included.

### Open

170. **FileInput's `screen()` isn't public.** Import › Upload from computer has to apply the same
    rules a drop does (the picker's filter can be overridden with "All files"), so
    `AssetsScreen.tsx` deep-imports `FileInput/files`. Export it from the barrel, or have
    `useFileDrop` hand back a `screenFiles` for a picker that isn't a FileInput.
171. **`Button` has no `render`**, so Asset details' Download can't be an `<a download>` and
    clicks a throwaway link instead. Download is the one icon button here that is really a link.

### Kept in the app

172. **A folder shows its subfolders' files too**, so Summer Menu 2026 is the whole campaign. An
    upload still lands in exactly the open folder. Figma counts the views and not the folders, and
    so does the tree.
173. **A drop in Favorites, Unused or Rights expiring opens All assets.** A new file goes to the
    root, which those views would hide, so the screen switches to where it can be seen landing.
    The overlay says "Drop to upload to Asset library" in any view.
174. **"Used in" is real.** It counts the calendar's posts whose photo is the file, live from
    `useSchedule`, so moving or scheduling a post changes it. Each row opens that post's details.
175. **Use asset opens the composer with the file as its media**, through the composer's existing
    `location.state.prefill`. No composer change was needed. The composer's own Asset library
    button still reads `data/library.ts`, so an upload doesn't reach it yet.
176. **Below 768 the folder column folds into a Folder select**, with subfolders indented by em
    spaces (ASCII spaces collapse). The top bar shows the folder's name instead of the trail,
    and the Grid/List switch and end actions go: the start slot is half the bar there.

### Figma owes

168. **The drop states are code-first.** The file draws neither the drag-over state nor an
    uploading card. In code, the drag-over state is a 2px dashed `Input/Selected` border on the
    `Action/Ghost/Background Hover` wash (FileInput's dropzone pair, no overlay token), with
    "Drop to upload to {folder}" on a `Surface/Background Primary` card with Medium shadow,
    because the 10% wash alone can't carry text over photos. The uploading card puts a
    `ProgressBar` where the status badge goes and "Uploading…" in the meta.
- A phone frame, and the list view (Name, Type, Folder, Used in, Added, Size), both code-first.

177. **The panel's preview opens a lightbox** (`AssetLightbox.tsx`). It's the library's Dialog at
    1040 wide, with the file contained at its own aspect ratio on a `surface-background-subtle`
    stage: an image (a GIF animates, being one), or a video with its controls, playing. Previous,
    Next and the arrow keys step through the grid in its order, and the panel follows. Arrows are
    left to a focused video. Code-first: Figma owes a lightbox frame.
178. **Seeded videos play now.** They were poster photos with a duration badge and nothing to play,
    so `assets/videos/` has four short clips (about 300 kB each), each a slow pan over its poster,
    encoded with Playwright's bundled ffmpeg. `videoSrc` holds them, and the durations are the
    clips' real lengths. The seed's pixel sizes now follow each photo's real shape (most are 2:3
    portrait), since the lightbox shows it. The photos themselves are 316 × 476, so a lightbox
    scales them up and they look soft. Real files would not.

### Measured, and fine

- axe on the live screen, with the panel open, mid-upload, and with the lightbox open: no
  violations. Escape closes the lightbox and returns focus to the preview.
- A drag across a card into the grid and back keeps the overlay up (enter, enter, leave). A PDF
  in the same drop as two photos is refused in its own toast, and the photos still land.

## Slice — Plan › Campaigns, Table and Timeline (2026-10-29)

Figma: `Campaigns list · Table` `40006170:39473` and `Campaigns list · Timeline` `40006178:41785`.
The Filtered frame and the campaign page's frames are not built; Filter says so, and a row or bar
opens a "designed, not built yet" page that links `Campaign page · Overview` `40006129:38303`.

### Found

179. **"Wrapping up" overflows its cell in the file.** The Status column is 130 with 16 padding
    each side, and the small Token is 110, so Figma draws it 12px past the cell. With the table's
    `textOverflow="truncate"` it read "Wrappin…". Status is 150 here and Engagements, whose
    content is at most 113 + 32, gives the 20 back.
180. **New campaign stays in the top bar.** It's the one exception to the rule that the rail's New is
    a page's only create button (#313); Nathan decided it this time. Below 768 it hides, because the
    phone bar's + is New and the bar has no room for both. The title goes `sr-only` there, as
    the calendar's does.
181. **The timeline's today is a Wednesday** (the file's line sits mid-Oct 28), not the calendar's
    Monday, so campaign days are offsets from that Wednesday and slide with the real date. The
    weeks start Monday, as the file's do (the app's `startOfWeek` is Sunday), so the model has its
    own `startOfMondayWeek`.
182. **`_Measure Owner Cell` is an X-Small avatar.** Reports drew it at `small` (24); the shared
    `components/OwnerCell.tsx` draws it at 20 for both screens, as the file binds it.
183. **The timeline scrolls rather than squashes.** Below 64px a week stops being readable, so under
    768 of timeline the frame scrolls sideways and opens with today a third of the way in. It's
    code-first: the file draws only the 1156 width. On a phone a scrolled bar's name scrolls off
    with it. Sticky names would fix that, and it's left for when the page is designed for phones.

184. **The year navigation pages twelve weeks at a time**, one window, so every week of a year can
    be seen. A whole-year step was tried first and dropped the same day, because it skipped the
    40 weeks between. The window's anchor is in `?date=`, as the calendar keeps its own. The year
    between the arrows is the year holding most of the window, so Dec 21 – Mar 14 says 2027.
    Pressing it comes back to today, as the layer name "Button / Today" suggests, so away from
    today its name is "2027, back to today". A window with no today has no line, and a window
    in the past is hatched end to end. Once a date on an edge Token is more than six months from
    the weeks drawn, it gets its year; the default view keeps the file's "starts Jan 13 →". On a
    phone a window away from today opens scrolled to the edge nearest it, and Filter hides, as
    the calendar's does, to give the arrows room.

### Measured, and fine

- Year navigation: 42 / 62 / 42, 8 after the view switch, as `Year Navigation` has it. At 390 the
  bar holds the switch, the arrows and More with no overlap.
- Table: head 32, rows 56, swatch 16 with its 1px highlight ring, Status Token 20 tall, Spark
  68 × 24, owner avatar 20. Dates sorts both ways through `?sort=dates&dir=`.
- Timeline: header 40, rows 44, bars 28 tall and 8 from the row top, 8px corners squared on a
  clipped side (Creator Kitchen both, Holiday Gift Cards its end), frame 12px corners. Positions
  match the file's to the pixel once the one-day slide (real Thursday vs the file's Wednesday) is
  taken out; `model.test.ts` pins Fall Harvest Bowls and the today line against the file's x.
- axe on both views, light and dark (through the app's own toggle): no violations.

## Slice — the campaign page: header, Overview, Cancel (2026-10-29)

Figma: `Campaign page · Overview` `40006129:38303`, `_Campaign Header` `40006130:38525`, and
`Campaign page · Cancel campaign dialog` `40006180:41085`. The other five tabs (Plan
`40006158:66912`, Ideas, Creators, Assets `40006187:42177`/`42949`/`43721`, Measure
`40006187:44493`) are drawn and arrive in their own slices; until then each says so and links its
frame. Every campaign has the page, not only Summer Menu.

### Found

185. **The campaign page and the timeline have different todays.** The page frames are drawn around
    Monday Oct 26 (the Plan tab's highlighted column; "Day 8 of 14"), the timeline around Wednesday
    Oct 28. Summer Menu's run is the timeline's (days −9 to 4), so the page reads "Day 10 of 14",
    and its posts are written against that run rather than the Figma week: the page's numbers
    (7 published, 9 scheduled, 2 of 3 creators, 1 gap) come out of the schedule, not out of the
    text. The weekday in "nothing is scheduled for TikTok on …" moves with the real date.
186. **Cancel is code-first past the dialog.** The file draws the question and not the campaign
    after it, so `cancelled` is a new status (CircleX, "Cancelled") on the list, the timeline and
    the page. Confirming sends the scheduled posts to Drafts with the campaign still on them
    (`returnToDrafts`), ends the run today, and withdraws offers no creator accepted. "Yak drafts
    the note" is the file's promise and isn't built. Each dialog line is counted, and a line with
    nothing to say is left out. The lines hold still while the dialog closes, or confirming would
    shrink the list on its way out.
187. **The file's Metric Cards on this page are Default cards; `MetricCard` is always Subtle.** On a
    white Content Block a subtle tile reads as a well, so the page composes `Card` + `Metric` itself.
    Fine for now; if a second screen does the same, MetricCard wants an `emphasis` prop.
188. **Open: Tabs has no overflow.** Six tabs are 99px wider than a 390 phone, and the library's
    `TabMenu` is still to build (the Tabs record says a strip that must scroll should be a Select).
    The page lets the strip scroll sideways inside a bleed, so the focus ring isn't clipped.
189. **"Gaps this week" counts the next seven days,** not the calendar week, or it would drop to
    nothing every Saturday. A gap is a single empty day between two days a channel posts. Two
    quiet days in a row are a rhythm. That rule gives the file's one gap, TikTok on Thursday, and
    not the other empty cells around it.
190. **Next up is one row a day, three days.** A gap comes first, then a creator's draft due, then
    the earliest scheduled post. That is the file's Tuesday post, Wednesday draft, Thursday gap.
191. **`ReportTopBar` moved to `components/BackTopBar.tsx`** with `Viewing`, now that a second screen
    needs Back plus breadcrumbs. Reports keep a thin `ReportTopBar` that fills in its defaults.

### Measured, and fine

- Blocks against the file: Yak summary 146, Progress 250, Targets 164, Metric Card 86, target card
  98, header row 32, tabs 40, content padding 16, block gap 12. Next up is 260 to the file's 258,
  and Brief 403 to 402: the rules between rows are 1px here and zero-height lines in Figma.
- Cancel dialog: 600 wide, 350 tall to the file's 348, the lead and the bullets 8 apart in
  `Content/Subtle`, focus lands on Keep campaign.
- Back from a page opened off the timeline returns to `?view=timeline`.
- axe on Summer Menu in light and dark, and with the Cancel dialog open: no violations.
