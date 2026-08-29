# Metric

The labelled-number family: `Metric`, `MetricCard`, `MetricGrid`, `TrendBadge`. Figma's `Metric Grid`
section (`40004341:12479`). **No Recharts anywhere in this folder** — it is layout, and it is what
the top row of a dashboard is made of.

## Two of the four are wrappers, and that is the point

Figma builds its own components out of components this library already ships, and every token lines
up. Reading that off the file is what made this the smallest batch of the four:

| Figma contains | We reuse | The match |
|---|---|---|
| a `Badge` instance | `Badge` | `color="green" \| "neutral" \| "red"` already emit `bg-decorative-{hue}-background text-decorative-{hue}-foreground`, exactly what Figma binds. `min-h-5` is its 20px; `startIcon` renders at 12px, its size. |
| a `Card` instance | `Card` | `emphasis="subtle"` is already `bg-surface-background-subtle border-surface-background-subtle` — Figma fills *and* strokes with that token. `padding={3}` is its 12px; `rounded-md` is its radius 8. |

So `TrendBadge` contributes one thing — a number mapped to a direction — and `MetricCard` contributes
one thing: the pairing. Neither should grow padding, a radius or a colour of its own; the moment
either does, it is a second badge or a second card.

## `TrendBadge` keeps direction and sentiment apart

**Direction comes from the sign.** `trend={8}` is up, `trend={-3}` down, `trend={0}` neutral. Taking
a number *and* a direction would let the two contradict each other — the same reasoning that removed
Button's `iconOnly` and Slider's `range`.

**Sentiment is a separate question, because "up is good" is not universal.** Sessions rising is good;
churn, load time, cost and error rate rising are not. `goodDirection="down"` flips the **colour** and
leaves the **arrow** alone: the arrow reports what the number did, the colour says how to feel about
it. A component that fused them would be wrong on roughly half of every dashboard, and the failure
would look like a design choice rather than a bug.

## The value is mono and tabular; a hero number would not be

`text-xl` mono bold against a `text-base` sans label, straight from Figma. Mono and `tabular-nums`
because a row of four of these has to align down a dashboard.

That is the **opposite** of the rule for a hero figure, where proportional digits look better —
`tabular-nums` gives every digit the width of a `0`, and at display sizes a number like `121` reads
loose. At 18px in a row, alignment wins; at 48px alone, fit does.

## `Metric` has no card, and that is what makes the donut work

A `Metric` is content: no background, no border, no padding. `MetricCard` is the version with a
surface — and `Donut` and `Gauge` put the *same* component in the middle of a ring, where a card
would be wrong. That split is why the metric in a donut's hole needed no new component.

**The trap that comes with it:** `--surface-background-subtle` and `--surface-canvas` are the same
stone in both themes, so a `MetricCard` sitting straight on the canvas is **invisible**. `Card`'s own
record warns about this and a metric row was the first thing to walk into it. These belong on a
primary surface — inside a `ContentBlock`, which is where Figma draws them too, and what every story
here does.

## Why `MetricGrid` exists next to `BentoGrid`

It very nearly does not, and the question was asked before building it: `BentoGrid` already does
columns and a gutter, and its default gap is the same 16px.

**The difference is what happens on a phone.** `BentoGrid` collapses to one column, which is right
for content blocks — a chart at half a phone's width is unreadable. Four *numbers* are not: they stay
legible two-up, and stacking them turns a glance into four screens of scrolling. So `MetricGrid`
collapses to **two** columns and stops.

That is the whole of its reason to exist. **If it stops being true, delete this component and use
`BentoGrid`** — from the outside the two look like duplicates, and without this note someone would be
right to remove it.
