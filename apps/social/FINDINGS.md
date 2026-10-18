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
41. **`board.ts` has no way to start a row.** A block only moves into a row that exists, so once two
    widgets share a row they could never be taken apart. The app keeps one empty row at the foot
    (`withSpareRow`), drawn as the file's dashed Add widget zone. **It must take a widget on release,
    not while carried.** Joining it mid-drag reflows the board under the pointer: the row the widget
    left shrinks, the spare grows, and `closestCorners` then flips between the spare and the row above
    on every frame. Each flip remounts the chart, and React stopped it with "Maximum update depth
    exceeded" inside Recharts. Playwright measured 33 `onDragOver`s in one drag. Between existing rows
    there were 6, and that path is fine. The spare row is skipped in `onDragOver` and settled in
    `onDragEnd`. A spare row, and that rule, belong in `board.ts` if a second board wants them.

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

48. **The whole report row opens the report.** Table has no `onRowClick` on purpose, because a click on
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
    - **Carrying a widget opens the spare row to 240px.** Collisions are read off the carried block's
      corners, not the pointer. A 400px trend aimed at the 64px strip landed in the row above it as
      soon as the row heights around it changed. The spare row is last, so growing it moves nothing
      under the pointer (finding 41's trap).

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

50. **The row-height strip**, the open spare row while carrying, and the whole-row click on the
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
