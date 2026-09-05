# Calendar / DatePicker

Two public components out of one Figma page: `Calendar` is the month grid,
`DatePicker` is the panel that wraps it with a presets rail and a footer.

Source: **↪ Date Picker (In Progress)** (page `40004748:43526`).

| Figma | Node | Becomes |
|---|---|---|
| `Calendar Month` | `40004972:35021` | `Calendar` |
| `Date Picker` — Single / Range - 1 Column / Range - 2 Columns | `40004972:34964` | `DatePicker` |
| `_Day Button` — `Type` × `State`, 33 variants | `40004972:34892` | the `dayButton` recipe |
| `_Day Header` | `40004972:34947` | the `dayHeader` class |
| `_Month Header` — Default / Month Picker | `40004972:35010` | the `monthHeader` prop |
| `_Calendar Presets` | `40004972:34989` | the presets rail + `DATE_RANGE_PRESETS` |
| `_Footer` | `40004972:34980` | the range footer |

Five of the seven are underscored, which the root record reads as *drawing
mechanism, not API*. That is the right reading here: `_Day Button`'s 33 variants
are two enums and three CSS states, not 33 components.

## The one thing that makes this component different

**Base UI ships no calendar, at any level.** Its `exports` map at 1.7.0 has
forty-odd subpaths and none of them is date-related. There *is* an
`internals/temporal` folder — a `TemporalAdapter` interface, adapters for
date-fns and luxon, and types naming `date-range` / `time-range` components — but
no shipped component imports it, neither adapter library is installed, and
`TemporalSupportedObject` currently resolves to `any`. It is a pre-release
skeleton for a Base UI date family that does not exist yet, and building on it
would be building on an unversioned private path.

So this is the first component in the library with **no headless primitive
underneath it**. The grid, the roving tabindex, the keyboard map, the range
state machine and the ARIA are all written here. Everything else in the library
gets those from Base UI; check this one by hand when Base UI upgrades, and
**revisit it the day Base UI ships a real date family** — that is the upgrade
that would delete most of `Calendar.tsx`.

## No date library

`month.ts` is ~200 lines of native `Date`, and it is the whole dependency
story. `Chart/axes.ts` set the precedent: date work that is small enough to own
is worth owning, and owning it buys a **node test** — `month.test.ts` runs in
the fast project with no browser, which is the only reason there are assertions
about leap Februaries at all.

Two rules keep it right, both stated in the module header:

- **Never move a date by adding milliseconds.** Every function goes through
  `new Date(y, m, d)`, which is DST-proof and normalizes out-of-range
  components for free — that normalization is what makes the leading and
  trailing cells of a grid fall out of one expression instead of three branches.
- **Everything is local midnight.** `dayKey` is built by hand rather than from
  `toISOString`, which converts to UTC first and names the previous day for
  anyone west of Greenwich.

`parseDateInput` refuses more than it accepts on purpose: three numbers, read in
the order `Intl` puts them for the active locale. No `Date.parse` fallback —
it accepts "Tuesday", and it reads a bare `2025-01-12` as UTC, which is the one
input shape most likely to be pasted and the one it would shift by a day. A
two-digit year is refused rather than resolved, because the constructor silently
turns `25` into 1925.

## Range mode is derived, not declared

Pass an array to `value` or `defaultValue` and it is a range picker; pass a
`Date` and it is a single one. `Slider.tsx:34` says the same thing in the same
words — a `mode` prop can contradict the value it describes, and then one of
them has to win silently.

The cost is that an uncontrolled range picker with nothing chosen has to seed
itself with `defaultValue={[null, null]}`, which reads oddly the first time. The
alternative reads worse: `mode="range" value={someDate}`.

**Two of Figma's three `Date Picker` variants fall out of this for free.**
`Type=Single` has its presets rail and its footer switched off in the file
(`_Footer` is `visible: false`, checked), so both belong to range mode and
neither needs a prop. The remaining difference between `Range - 1 Column` and
`Range - 2 Columns` is `numberOfMonths`.

## What was measured, and what it changed

Every number below came off the canvas rather than from the screenshot.

- **Every stroke in the set is `strokeAlign: INSIDE`.** For the day cell that
  changes nothing — it is a fixed 40 × 32 under Tailwind's `border-box`, so a
  CSS border reproduces an inside stroke exactly. For the **panel** it does: it
  hugs its contents, so a border would push it 2px past the file's 312 / 536 /
  848, and it is an `inset-ring` instead. That is the general shape of the
  inset-ring rule — it is about hug-sized elements, not about strokes.
- **`Surface/Background Emphasized` and `Surface/Border Emphasized` are the same
  value in both themes** (`--neutral-800` light, `--neutral-100` dark). So the
  top-and-bottom stroke the file gives an in-range day is invisible against its
  own fill; it is there to keep the cell 32px tall beside its neighbours, and
  the fill alone reproduces it. Worth knowing before someone "fixes" the missing
  border — and it also dodges a `border-y-<token>` utility, which `tokens.test.ts`
  cannot see (its regex matches `border-surface-*`, not `border-y-surface-*`).
- **The month card was 304 tall, which is a five-row January 2025.** A variable
  row count meant the panel jumped 40px as you navigated between a 5-row month
  and a 6-row one, so it follows Astryx instead (`hasVariableRowCount: false` is
  its default): **a fixed six rows**. No prop — a fixed grid is the only
  behavior anyone has asked for, and the test sweeps every month of four years
  at three week-starts to keep it that way. **The file was redrawn to match**: a
  sixth `Days Wrapper` was added to `Calendar Month`, and the three `Date
  Picker` variants now measure 312 × 344, 536 × 480 and 848 × 432 — the same
  numbers the code produces.
- **The nav arrows are `ArrowLeft`/`ArrowRight`, not chevrons** — the exported
  assets are named arrow. They are ghost icon-only Buttons at the default size,
  which is what the file's instances say and where their 42 × 32 comes from.
- **The presets are `Appearance=Secondary`, full width, in a 224 rail.**
- **The footer's two shapes are one component.** 136 tall at 312 wide and 88 at
  624 is `flex-wrap` plus `min-w-70 max-w-80` on the inputs, not two drawings.

**Code and file now agree on every dimension** — 312 × 344, 536 × 480,
848 × 432.

Getting the heights there took one small thing worth knowing. Figma's footer
rule is an INSIDE stroke, so it occupies the footer's own first pixel row and
the footer is 136; a CSS `border-t` on an auto-height element adds its pixel
*outside* the padding box, which made every panel a pixel tall. `-mt-px` on the
footer pulls that pixel back, landing the rule on the boundary itself — which is
what INSIDE means for a stroke on the top edge of a stacked frame. The
alternative was shaving `pt-2` to a magic 7px, trading a token for a number.

## The footer wrap needed a width

The panel is `inline-flex`, so it sizes to its widest child's **max-content** —
and for a `flex-wrap` footer that is everything on one row. The file's 536 came
out **731** and the footer never wrapped. The fix is to pin the calendar column
to the calendar's own width (`w-78`, or `w-156` for two months), which is what
the file's layout means anyway: the panel is as wide as the grid, and the footer
wraps inside it. **Do not remove that class** — the failure is silent and it
looks like a footer bug rather than a sizing one.

## Four bugs found in review, and what caused them

Worth keeping, because none of them looked like what it was.

**The DatePicker's month arrows did nothing.** The panel holds the visible month
as well as the calendar does — a preset and the footer inputs both move it
without going through the grid — and `DatePickerProps` omitted
`defaultFocusMonth`. So setting the opening month meant `focusMonth`, a
*controlled* prop, and nothing was updating it: the arrows fired
`onFocusMonthChange`, the panel deferred to the prop, and the prop never moved.
The gap was in the prop surface, not in the handler. `defaultFocusMonth` is back,
and `DatePicker.stories` has a `Navigation` play that would have caught it —
`Calendar` had one from the start, which is exactly why the bug lived in the one
component that did not.

**Picking a range flashed every day as a fully rounded selected cell.** Two
causes stacked. `onDayHover(null)` was on each cell's `onPointerLeave`, so
crossing from one day to the next left a frame with nothing hovered and the
tentative range collapsed and re-expanded on every step. And `transition-colors`
animated the background while the radius changed instantly — so in that frame
every cell snapped to `rounded-md` while still painted dark. The fix is both:
the preview clears on leaving the **grid**, and only `border-color` transitions.
**Selection is a state, not an animation** — the only thing here that wants
easing is the hover stroke.

**A multi-row range drew as square-ended slabs, not stacked pills — and the
Figma file is what caught it.** `rangePosition` is about the *range*, so only
the true first and last day were rounded; every other row ran square into the
edge of the grid. The file says otherwise in plain variant names: in
`Range - 2 Columns` the 19th and the 26th are `Selected Start` and the 25th and
the 1st are `Selected End`, on rows that are entirely mid-range. A range is
continuous in time and **discontinuous on screen**, one bar per week, and each
bar needs its own ends. That is `selectionInRow`, which folds the two ends
independently so the awkward case falls out for free: a range starting on a
Saturday is the only day in its bar, so it draws as `single` rather than as a
start rounded on the side nothing follows it on. **Read the variant names on a
component set as claims about behavior** — this one was sitting in the file the
whole time and no screenshot of a single-row range would ever have shown it.

**`Apply` left a hole in the single-month footer.** At 312 the footer wraps, so
the actions get a row to themselves, and two hug-width buttons pinned right left
most of it empty. `Apply` stretches into it at `numberOfMonths === 1` only; at
two months everything is on one line beside the inputs and stretching would just
push them apart.

## Accessibility

`preview.tsx` sets `a11y: { test: 'error' }`, so this was built to the APG grid
pattern from the start rather than retrofitted.

- `role="grid"` on plain elements rather than a `<table>`. The file's 8px row
  gap is a flex `gap`, and a table cannot have one: `border-collapse` has no row
  spacing, and `border-separate` puts the same spacing *around* the grid as
  between its rows, which would make the block 296 rather than 280. The roles
  carry identical semantics.
- Each grid is named with its own month, so a two-month calendar announces
  "January 2025" and "February 2025" separately.
- Column headings are `role="columnheader"` with `aria-label` carrying the full
  day name. `abbr` would be the markup for this and is only valid on a `<th>`.
- Each day button is named with the full date (`dateStyle: 'long'`), and
  `aria-selected` sits on the **cell**, which is where a grid puts it.
- **Roving tabindex**: exactly one day is tabbable, so Tab crosses the grid in
  one step instead of 35. Arrows move by day, Home/End to the ends of the week,
  PageUp/PageDown by month, Shift+Page by year.
- **Disabled days carry `aria-disabled`, not the `disabled` attribute**, so they
  stay focusable and a long unavailable stretch is traversable rather than a
  wall. The click handler guards for it, because the element is still clickable.
- The visible month is announced through a polite live region: navigating moves
  nothing a screen reader would otherwise read.

Two traps that shaped the tests: `:focus-visible` never matches a scripted
`element.focus()`, so the keyboard story drives real key presses — measured, the
ring is `focusRing` exactly, two concentric strokes at 2px and 4px. And the
keydown handler checks the event target carries `data-day` before acting, or the
month-picker Selects lose their own arrow keys to `preventDefault`.

## Left out on purpose

- **A trigger.** Nothing on the canvas opens the panel. Putting it in a
  `Popover.Popup` is a line of a caller's code; a `DatePickerField` here would be
  a component the file has never drawn.
- **From Astryx's API**: `hasWeekNumbers`, `hasVariableRowCount`, `handleRef`,
  `minRangeSpan` / `maxRangeSpan`. The file draws none of them, and the bar is
  that the file draws it *and* something has been reinvented without it.
- **Time.** This is dates. A time field is a different component and the file
  does not draw one.

## Added ahead of the file

- **The range hover preview** — with a start picked, the days under the pointer
  fill in before the second click commits them. Behavior the canvas cannot draw,
  in the same category as `Dialog.Body`'s scrolling, and a range picker without
  it gives no feedback between the two clicks.
- **`DATE_RANGE_PRESETS` as an export.** The file hard-codes eight buttons; the
  code takes a list and falls back to those eight, so a fiscal-quarter rail does
  not need a fork. The windows include today — "Last 7 days" is today and the six
  before it.
- **`monthHeader` defaults to `default` in both components.** The file draws
  `Type=Single` with the month-picker header, but that is an instance override on
  one of three variants rather than a rule, and one sample does not make one.
  Pass `monthHeader="picker"` to reproduce the file's Single exactly; the
  `Single` story does.

## Best practices

**Source: the Docs frame `40004972:33825`, Guidance block `40004972:33832`.**
It carried the unfilled template — "Description goes here." and "Usage rule." on
both Do and Don't — and was written on 2026-09-04, four Dos and two Don'ts, from
Astryx's Calendar rules checked against this API first. **The two copies are one
text in two places**: change a rule here and change it in Figma in the same
breath.

The header description was written in the same pass, to the house pattern
(subject, then `Use it for…` with concrete examples, then the pointer at the
component people confuse it with): *"Date Picker pairs a month grid with preset
shortcuts and a footer that shows the selected range as text. Use it for report
filters, booking flows, and time-off requests, where someone picks a start and
an end date and needs to see the days around them. For one date with no presets
or footer, use Calendar Month."*

| | |
|---|---|
| **Do** | Set `min` and `max` to the window that is actually valid — future dates only for a booking, the current quarter for a report. |
| **Do** | Pass a pair to `value` when the user needs a start and an end. Range mode is the value's shape, not a prop. |
| **Do** | Use `dateConstraints` for rules a range cannot express — weekends, holidays — and say somewhere why those days are unavailable. |
| **Do** | Use `numberOfMonths={2}` when the two ends usually fall in different months, which is most booking and travel flows. |
| **Don't** | Reach for a calendar for a date far from today, like a birth date. A text field is faster for open-ended entry; `monthHeader="picker"` only narrows the gap. |
| **Don't** | Disable large blocks of dates with no explanation. A user who cannot tell why half the month is grey assumes the picker is broken. |
