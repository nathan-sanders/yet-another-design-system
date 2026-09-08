# ProgressBar

A horizontal bar reporting how far along a task is. Figma page `↪ Progress Bar`
(`40004748:43527`).
**Code went first and the file caught up in the same sitting.** The page was one of the empty
`(In Progress)` scaffolds — a Docs frame with `"Description goes here."`, two blank Preview
frames, one `"Usage rule."` card per column, and an empty Components section — so there were no
variants to read. Same route as `Calendar`, `Pagination`, `NumberInput` and `OTPInput`: not on
the roadmap, asked for directly with the node in hand, and drawn into the file rather than left
as a debt.
**Reach for it when the system is reporting, not when the user is choosing.** An upload, an
import, a quota. For a number the user *sets*, that is `Slider`. For a value with no task behind
it — a score, a rating — Base UI's sibling `Meter` primitive is the right one and is
deliberately not wrapped here; the test is "is it the same primitive underneath", not "do they
look alike".
**Twenty-first Base UI component**, first on `Progress`. It supplies `role="progressbar"`,
`aria-valuemin`/`max`/`now`, a formatted `aria-valuetext`, and the
`indeterminate | progressing | complete` status as data attributes. **No ARIA to patch** — read
out of `node_modules`, not assumed, the way Switch's record says to.

## The decisions

**`indeterminate` is derived, not a prop.** `value={null}` is Base UI's own signal for it, so
there is nothing to declare. Astryx spells it `isIndeterminate` beside a `value` that is then
ignored; one source of truth beats two that can disagree. Slider's `range`, Avatar's `Content`
and Button's icon-only again.

**Two things about `Progress.Indicator` that paint nothing if you miss them**, both read out of
`node_modules/@base-ui/react/progress/indicator/ProgressIndicator.js`:

1. It sets `{ insetInlineStart: 0, height: 'inherit', width: '<n>%' }` **as an inline style**,
   and returns `{}` when the value is `null`. An indeterminate bar therefore loses
   `height: inherit` and collapses to **zero height** — `h-full` on the recipe is load-bearing,
   not tidiness, and `Indeterminate`'s play function asserts the 8px rather than trusting it.
2. That inline `width` beats any `w-*` utility, which is precisely *why* the 40% sweep width can
   be a class: the indeterminate case is the one with no inline style. It would silently do
   nothing in any other state.

**The track is clipped, and this is the deliberate departure from Slider.** Slider's record says
Figma's `overflow-clip` was not ported because it would take the thumb and its focus ring with
it. There is neither here, and the clip does two jobs: it gives the sweep its ends, and it keeps
the fill inside the pill — an unclipped `rounded-full` indicator rounds its own leading edge,
which is not what a partly filled trough looks like.

**The width animates, where Slider's does not.** Slider leaves its indicator alone because Base
UI drives it straight from the pointer and animating it puts the handle on elastic. Progress has
no pointer. Astryx transitions `width` over 300ms on `cubic-bezier(0.24, 1, 0.4, 1)`, which is
`--ease-standard` exactly — the pair was already in the file.

**The sweep is a real keyframe in `generate.py`, and reduced motion is a real bug there.**
`@keyframes progress-indeterminate` (`translateX(-100%)` → `translateX(250%)`) had to go into the
generator, because Tailwind can only reference a keyframe that already exists in the stylesheet
and `theme.css` is generated. `linear` rather than `--ease-standard`: that curve is a fast-out
easing for something arriving or leaving, and a loop has neither end. The duration is
`slow-max` (1300ms) — the nearest token to Astryx's 1500, because the rule is tokens.
Then the trap: section 5 of `theme.css` clamps every animation to 1ms with a single iteration
under `prefers-reduced-motion`, which would run the sweep straight to `translateX(250%)` and
leave an **empty track**. `motion-reduce:` turns the animation off and settles the fill full
width at 40% opacity instead. Full width at full strength would read as *complete*, which is the
failure worth avoiding.

**`disabled` is Slider's idiom and needs Slider's `aria-disabled` to be legal.** A
`pointer-events-none opacity-40` wash drops the label to about 2.3:1; WCAG 1.4.3 exempts
inactive components, and axe implements that exemption by walking up from the text looking for a
disabled control or `aria-disabled="true"`. Neither the label nor the value is inside a
`<label>` here, so without it the story suite fails on `color-contrast`. It is valid on this
element — `progressbar` inherits from `range` and so from `widget` — and that was checked by
running axe, not by reading the spec.

**The value is `ml-auto`, not `justify-between`.** `labelHidden` renders the label `sr-only`,
which is `position: absolute` and therefore **not a flex item** — the fact OTPInput's record also
turns on. Under `justify-between` the value would then be the only child and sit hard left.
`ml-auto` is right in every combination. The story measures the right edge rather than reading
`margin-left`, because `getComputedStyle` resolves `auto` to the used pixel value and asserting
the string `'auto'` only ever fails.

**Mark labels are formatted the way Base UI formats the value, which is not the obvious way.**
With no `format`, Base UI does not print the value at all — it prints `(value - min) / (max - min)`
as a percentage. A plain `Intl.NumberFormat` on the raw number gives "80" beside a bar reading
"75%". Slider does not hit this because its bounds *are* raw values on the same scale.

**Completion does not recolor itself.** `data-complete` is on every part and it would be one
line, but Astryx's guidance is that the caller picks the variant for the context — a quota
reaching 100% is bad news, not good. The component holds no opinion the file does not draw.

## Marks, and the one Astryx rule not followed

Marks are targets on the track — a quota, a goal, the point a download becomes playable — drawn
**behind the track and poking 2px out of each side**, which is Slider's tick at 12px against an
8px trough. `relative z-10` on the track is Slider's too, and for the same reason: an absolutely
positioned sibling paints over a static one whatever the DOM order.

**Astryx draws its marks on top of the bar**, taking each one's color from what it sits on — the
fill's on-color inside the filled region, the primary text color out on the bare track. That is
the one rule from Astryx this component does not follow, and it was **measured before it was
dropped**. An on-fill tick owes 3:1 under WCAG 1.4.11, in both themes, for all five fills. No
token clears it. `Feedback/Warning/Highlight` is Yellow/600 in *both* themes, so its on-color has
to be dark in both — and every token that is dark in light mode is light in dark mode, by
construction. The two closest candidates measured 4.97:1 light against 1.87:1 dark
(`Feedback/Warning/Foreground`) and 5.18:1 against 2.69:1 (`Content/Primary`). A rule that cannot
hold in one theme is not a rule.

Behind the track there is no matrix at all: the visible 2px sits on the page, and
`Content/Primary` on any surface in either theme is comfortable. `Content/Primary` rather than
Slider's `Surface/Border`, because these are not the same object — Slider's ticks mark a scale
the bounds labels already state, while a progress mark is a target and nothing else on the
component says where it is.

**So a labeled mark is spoken, where Slider's are silent.** Slider's marks announce nothing
because every tick's value is already in the input's `aria-valuemin`/`max`; a target is not, so
labeled marks are folded into `aria-valuetext` — "45%, Free tier 80%" — through Base UI's
`getAriaValueText`. A caller's own `getAriaValueText` wins outright rather than being appended
to: somebody who has written that sentence has decided what the bar says.

## The contrast debt, which belongs in Figma

`contrast.test.ts` holds each fill to 3:1 against the track, because that boundary *is* how the
value is read and nothing else in the suite can check it — axe does not attempt non-text
contrast, and a low-contrast bar renders as happily as a good one.

**Two pairs do not clear it**, and they are carried as named exceptions in the shape
`nav-contrast.test.ts` used for `Pink`: recorded with their measured numbers, pointing at the
fix, expected to be deleted rather than lived with.

| pair | measured | why |
|---|---|---|
| `warning`, light | 2.33:1 | Yellow/600 fill on a Stone/200 track |
| `danger`, dark | 2.16:1 | Red/600 fill on a Stone/700 track |

Both come from a `Highlight` that is the same step in both themes while the track is not.
**ProgressBar is the first component to paint `Feedback/…/Highlight` as a large fill** —
everywhere else (`Radio`, `Checkbox`, `Input`) it is a 1px invalid border against a page
background, a different pairing — so this is new information about the ramp rather than a
regression. Measured alternatives that clear 3:1 in both themes: Yellow/700 light with Yellow/500
dark (3.92 / 5.37), and Red/600 light with Red/400 dark (3.79 / 3.55) — i.e. make those two
variables theme-aware at source. That moves `Badge` and the whole `Feedback` family with them,
which is why it is a decision for the file rather than an override here. Lowering the threshold
is not the alternative: it would weaken all ten pairs to excuse two.

## Testing

`StoryObj<typeof ProgressBar>` rather than `StoryObj<typeof meta>`, for the reason written up in
`Slider.stories.tsx` — the props are a union and `Omit` does not distribute across one.

**`fillOf()` exists because the obvious selector finds the label.** Base UI stamps the status
attribute on Label, Value, Track *and* Indicator, so `[data-progressing]` matches four elements
and the first is the label — whose background is `rgba(0, 0, 0, 0)` for every variant, which
turns "the five fills differ" into a failure with nothing to do with the fills. The indicator is
the one whose parent also carries the attribute: the only part nested inside another.

**The sweep is asserted, never screenshotted.** A capture is a still, so `Indeterminate` checks
`getAnimations()` and the animation's name instead. Nobody but a person in a real browser can
confirm it actually moves.
