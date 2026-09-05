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
- **The month card is 304 tall, which is a five-row January 2025** — so the row
  count is variable, 5 or 6, and the panel changes height as you navigate. Astryx
  takes the other side (`hasVariableRowCount: false` by default). The file is the
  source of truth here and nothing has asked for the other behavior yet; if it
  ever does, the prop already has a name.
- **The nav arrows are `ArrowLeft`/`ArrowRight`, not chevrons** — the exported
  assets are named arrow. They are ghost icon-only Buttons at the default size,
  which is what the file's instances say and where their 42 × 32 comes from.
- **The presets are `Appearance=Secondary`, full width, in a 224 rail.**
- **The footer's two shapes are one component.** 136 tall at 312 wide and 88 at
  624 is `flex-wrap` plus `min-w-70 max-w-80` on the inputs, not two drawings.

**One measured miss, kept deliberately: the panel is 441 tall where the file
says 440.** Figma's footer rule is an INSIDE stroke, so its 1px lives inside the
136; a CSS `border-t` on an auto-height element adds its 1px outside the padding
box. Matching the file exactly would mean shaving `pt-2` to a magic 7px, trading
a token for a number. One pixel on a 440px panel is the better side of that
trade. The panel's **width** is exact at every variant — 312 / 536 / 848 — and
`Type=Single` measures 312 × 304 to the pixel.

## The footer wrap needed a width

The panel is `inline-flex`, so it sizes to its widest child's **max-content** —
and for a `flex-wrap` footer that is everything on one row. The file's 536 came
out **731** and the footer never wrapped. The fix is to pin the calendar column
to the calendar's own width (`w-78`, or `w-156` for two months), which is what
the file's layout means anyway: the panel is as wide as the grid, and the footer
wraps inside it. **Do not remove that class** — the failure is silent and it
looks like a footer bug rather than a sizing one.

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

**Source: written here, not mirrored.** The Docs frame (`40004972:33825`) still
carries the template — "Description goes here." and "Usage rule." on both Do and
Don't — which the root record says is a page's normal unfilled state rather than
evidence of neglect. These are Astryx's Calendar rules, checked against this API
before being written down. **This component owes the file a filled block**, and
when one is written the two copies have to move together.

| | |
|---|---|
| **Do** | Set `min` and `max` to the window that is actually valid — future dates only for a booking, the current quarter for a report. |
| **Do** | Pass a pair to `value` when the user needs a start and an end. Range mode is the value's shape, not a prop. |
| **Do** | Use `dateConstraints` for rules a range cannot express — weekends, holidays — and say somewhere why those days are unavailable. |
| **Do** | Use `numberOfMonths={2}` when the two ends usually fall in different months, which is most booking and travel flows. |
| **Don't** | Reach for a calendar for a date far from today, like a birth date. A text field is faster for open-ended entry; `monthHeader="picker"` only narrows the gap. |
| **Don't** | Disable large blocks of dates with no explanation. A user who cannot tell why half the month is grey assumes the picker is broken. |
