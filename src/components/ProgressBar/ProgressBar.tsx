import { useMemo } from 'react'
import type { ComponentPropsWithRef, ReactNode } from 'react'
import { Progress as ProgressPrimitive } from '@base-ui/react/progress'
import { tv } from 'tailwind-variants'

import { cn } from '../../lib/cn'

/**
 * ProgressBar — a horizontal bar reporting how far along a task is.
 *
 * The Figma page is `↪ Progress Bar` (`40004748:43527`), and this component was
 * built before it had anything on it: the page was one of the empty
 * `(In Progress)` scaffolds, so the set was drawn from this code rather than the
 * other way round. Same direction as Calendar, Pagination, NumberInput and
 * OTPInput — asked for directly with the node in hand, and the file caught up in
 * the same sitting.
 *
 *     <ProgressBar label="Uploading" value={40} />
 *     <ProgressBar label="Preparing" value={null} />
 *
 * **Twenty-first Base UI component**, on `Progress`. Base UI supplies the whole
 * accessibility surface — `role="progressbar"`, `aria-valuemin`/`max`/`now`, a
 * formatted `aria-valuetext`, and the `indeterminate | progressing | complete`
 * status as data attributes on every part. **Nothing to patch**, read out of
 * `node_modules` rather than assumed. All the styling is ours.
 *
 * **Reach for it when the system is reporting, not when the user is choosing.**
 * A file upload, an import, a storage quota. For a number the user *sets*, use
 * **Slider**; for a value with no task behind it — a score, a rating out of five
 * — Base UI's `Meter` is the right primitive and is not wrapped here yet.
 *
 * **`indeterminate` is derived, not a prop.** Pass `value={null}` and the bar
 * sweeps instead of filling, which is Base UI's own signal for it. The same move
 * as Slider's `range`, Avatar's `Content` and Button's icon-only. Astryx spells
 * it `isIndeterminate` beside a `value` that is then ignored; one source of
 * truth is better than two that can disagree.
 *
 * **Completion does not recolor itself.** `data-complete` is on every part and
 * it would be one line to turn a finished bar green, but Astryx's own guidance
 * is that the caller picks the variant to match the context — a quota bar
 * reaching 100% is bad news, not good. So the component holds no opinion the
 * file does not draw.
 */

/**
 * The column: label row over the bar, `gap-1` (4px) apart, which is Astryx's
 * measured gap.
 *
 * **`disabled` is Slider's idiom, deliberately.** A `pointer-events-none
 * opacity-40` wash over the whole component, paired with `aria-disabled` on the
 * root — and the pairing is load-bearing rather than decorative, for exactly the
 * reason written up in Slider: `opacity-40` drops the label to about 2.3:1, WCAG
 * 1.4.3 exempts inactive components, and axe implements that exemption by
 * walking up from the text looking for a disabled control or
 * `aria-disabled="true"`. Neither the label nor the value is inside a `<label>`
 * here, so without it the story suite fails on `color-contrast`.
 *
 * It is valid on this element: `progressbar` inherits from `range` and so from
 * `widget`, which supports the state. Verified against axe rather than read off
 * the spec — `aria-allowed-attr` runs on every story in this file.
 *
 * `markLabels` reserves room for the tick labels, which are positioned rather
 * than laid out and would otherwise hang out of the bottom of the component.
 * Slider's problem, and its arithmetic re-run for this geometry: the bar row is
 * the track's own 8px, a label starts 10px below its center and is 20px tall
 * (`text-sm`'s line-height), so it ends 36px down and 28px past the row.
 * `pb-8` is 32 — the next step up, with 4px of slack.
 *
 * **It goes on the root, not the bar row**, which is Slider's finding rather
 * than a fresh one: padding on the row would change the box the track is laid
 * out in, so a bar with marks and one without would put their tracks in
 * different places.
 */
const root = tv({
  base: 'flex w-full flex-col gap-1 font-sans',

  variants: {
    disabled: {
      true: 'pointer-events-none opacity-40',
      false: '',
    },
    markLabels: {
      true: 'pb-8',
      false: '',
    },
  },

  defaultVariants: { disabled: false, markLabels: false },
})

/**
 * Label on the left, value on the right — Astryx's `justify-content:
 * space-between`, written as `ml-auto` on the value instead.
 *
 * That is not a style preference. `labelHidden` renders the label as `sr-only`,
 * which is `position: absolute` and therefore **not a flex item** (the same fact
 * OTPInput's record turns on). Under `justify-between` the value would then be
 * the only child and would sit hard left. `ml-auto` puts it on the right in
 * every combination of the two.
 */
const labelRow = tv({
  base: 'flex items-baseline gap-2',
})

/**
 * The label: `text-base` in Content/Primary, semibold.
 *
 * **14px, which is `text-base` here and not `text-sm`.** This library's type
 * scale is one step off Tailwind's default — `text-sm` is 12px and `text-base`
 * is 14 — so Astryx's measured 14px label is `text-base`. Getting that wrong is
 * silent: a 12px label looks deliberate.
 *
 * **Semibold, not Astryx's 500.** The scale has three weights — normal,
 * semibold, bold — and no medium. `font-medium` compiles to
 * `font-weight: var(--font-weight-medium)`, a variable this theme never defines,
 * so the declaration is dropped and the text renders at 400 while the class list
 * says otherwise. Semibold is also what Field, and therefore Slider, settled on
 * for a label above a control.
 */
const labelText = tv({
  base: 'text-base font-semibold text-content-primary',

  variants: {
    hidden: { true: 'sr-only', false: '' },
  },

  defaultVariants: { hidden: false },
})

/** The value readout: the label's size in Content/Subtle, and never bold. */
const valueText = tv({
  base: 'ml-auto text-base font-normal text-content-subtle',
})

/**
 * The wrapper the marks and the track share, so a tick can sit *behind* the
 * track and still overhang it. The track clips; this does not.
 */
const barRow = tv({
  base: 'relative w-full',
})

/**
 * The unfilled trough: 8px, `rounded-full`, `Surface/Border` — Slider's track
 * token at twice its height, which is Astryx's measured 8.
 *
 * **`overflow-hidden` is the deliberate departure from Slider**, whose record
 * says Figma's `overflow-clip` was not ported because it would have taken the
 * thumb and its focus ring with it. There is neither here, and the clip is doing
 * two jobs: it gives the indeterminate sweep its ends, and it keeps the fill
 * inside the pill at values under 100% — an unclipped `rounded-full` indicator
 * rounds its own leading edge, which is not what a partially filled trough looks
 * like.
 *
 * `relative z-10` is Slider's again and for the same reason: the marks are
 * absolutely positioned siblings, and an absolutely positioned element paints
 * over a statically positioned one whatever the DOM order.
 */
const track = tv({
  base: 'relative z-10 h-2 w-full overflow-hidden rounded-full bg-surface-border',
})

/**
 * The fill.
 *
 * **Two things about Base UI's `Progress.Indicator` that paint nothing if you
 * miss them**, both read out of `node_modules/@base-ui/react/progress`:
 *
 * 1. It sets `{ insetInlineStart: 0, height: 'inherit', width: '<n>%' }` as an
 *    **inline style**, and returns `{}` when the value is `null`. So an
 *    indeterminate bar loses `height: inherit` and collapses to zero height.
 *    `h-full` here is load-bearing, not tidiness.
 * 2. That inline `width` beats any `w-*` utility — which is *why* the 40% sweep
 *    width can be a class at all. It only works because the indeterminate case
 *    is the one with no inline style.
 *
 * **Unlike Slider, the width is animated.** Slider deliberately does not,
 * because Base UI drives its indicator straight from the pointer and animating
 * it puts the handle on elastic. Progress has no pointer, and Astryx transitions
 * `width` over 300ms on `cubic-bezier(0.24, 1, 0.4, 1)` — which is
 * `--ease-standard` exactly, so the pair was already in the file.
 *
 * **Reduced motion is a real bug here, not a courtesy.** Section 5 of
 * `theme.css` clamps every animation to 1ms with a single iteration, which would
 * run the sweep instantly to its `translateX(250%)` end and leave an empty
 * track. `motion-reduce:` turns the animation off and settles the fill full
 * width at 40% opacity instead — full width at full strength would read as
 * *complete*, which is the failure worth avoiding.
 */
const indicator = tv({
  base: [
    'h-full rounded-full',
    'transition-[width] duration-fast ease-standard',
    'data-indeterminate:w-2/5 data-indeterminate:animate-progress-indeterminate',
    'motion-reduce:data-indeterminate:w-full motion-reduce:data-indeterminate:animate-none',
    'motion-reduce:data-indeterminate:opacity-40',
  ],

  variants: {
    type: {
      default: 'bg-input-selected',
      success: 'bg-feedback-success-highlight',
      warning: 'bg-feedback-warning-highlight',
      danger: 'bg-feedback-danger-highlight',
    },
  },

  defaultVariants: { type: 'default' },
})

/**
 * A target tick — a goal line, a quota, the point a download becomes playable.
 *
 * **Drawn behind the track, poking 4px out of each side** — Slider's tick at
 * this component's scale rather than at its own. Slider draws 12px against a 4px
 * track, so the overhang is 4; 12px against this 8px trough would have halved it
 * to 2, and at 2px a tick reads as a speck rather than a line. 16px keeps the
 * proportion. Astryx draws its marks *on* the
 * bar instead, taking their color from whatever they sit on — the fill's
 * on-color inside the filled region, the primary text color out on the bare
 * track — and that is the one rule from Astryx this component does not follow.
 *
 * **It was measured before it was dropped.** An on-fill tick owes 3:1 under WCAG
 * 1.4.11, and the five fills need an on-color that clears it in both themes.
 * There is no token that does. `Feedback/Warning/Highlight` is Yellow/600 in
 * *both* themes, so its on-color has to be dark in both — and every token that
 * is dark in light mode is light in dark mode, by construction. The closest
 * candidates measured 4.97:1 light against 1.87:1 dark
 * (`Feedback/Warning/Foreground`) and 5.18:1 against 2.69:1 (`Content/Primary`).
 * A rule that cannot hold in one theme is not a rule.
 *
 * Behind the track there is no matrix: the visible 2px sits on the page, and
 * `Content/Primary` on any surface in either theme is comfortable. It is also
 * the idiom the library already has.
 *
 * `Content/Primary` rather than Slider's `Surface/Border`, because these are not
 * the same object. Slider's ticks are decoration marking a scale the value text
 * already states; a progress mark is a target, and nothing else on the component
 * says where it is.
 */
const markTick = tv({
  base: 'absolute top-1/2 h-4 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-content-primary',
})

/**
 * A tick's label, under the track.
 *
 * **Not `font-mono`, where Slider's is.** Slider's mark labels are *numbers* off
 * the same scale as its bounds, and a monospaced digit keeps the track from
 * shifting as they count. A progress mark's label is a name — "Free tier", "Goal"
 * — so it takes the component's own sans and inherits its width from the text
 * (`w-max whitespace-nowrap`) rather than from a fixed box. `w-10` was tried
 * first and wrapped "Free tier" onto two lines.
 */
const markLabel = tv({
  base: 'absolute top-1/2 mt-3 w-max -translate-x-1/2 text-center text-sm font-normal whitespace-nowrap text-content-subtle',
})

/**
 * Astryx's semantic color variants, in this library's spelling — and one short
 * of Astryx's list.
 *
 * **There is no `neutral`, because there is nowhere for it to be.** Astryx's
 * accent is blue and its neutral is gray, so the two are plainly different
 * things. Here `default` is already gray — `Input/Selected`, Slider's fill — and
 * every other gray in the semantic layer collides with it in one theme or the
 * other: `Surface/Background Emphasized` and `Surface/Border Emphasized` are both
 * Stone/100 in dark, exactly what `Input/Selected` is, and `Content/Subtle` is
 * Stone/600 in light, exactly what `Input/Selected` is. It was built with a
 * neutral first, and the dark preview is where the collision showed.
 *
 * A variant that disappears into another one in half of the themes is worse than
 * an absent variant, so `default` carries the quiet case on its own.
 */
export type ProgressBarType = 'default' | 'success' | 'warning' | 'danger'

/**
 * A target on the track. A bare number is an unlabeled tick; give it a `label`
 * and the label is drawn under the tick *and* spoken as part of the bar's value.
 *
 * The label is a `string` rather than a `ReactNode` on purpose — it has to go
 * into `aria-valuetext`, and a node cannot.
 */
export type ProgressBarMark = number | { value: number; label?: string }

type ProgressRootProps = ComponentPropsWithRef<typeof ProgressPrimitive.Root>

interface ProgressBarBaseProps
  extends Omit<ProgressRootProps, 'className' | 'render' | 'children'> {
  /** Astryx's `variant`, named for the axis Banner and Toast already use. */
  type?: ProgressBarType
  /**
   * Hides the label from the page but keeps it for screen readers. Astryx's
   * `isLabelHidden` — the label itself stays required either way.
   */
  labelHidden?: boolean
  /**
   * Shows the formatted value beside the label. Astryx's `hasValueLabel`, off by
   * default as it is there, and ignored when indeterminate — there is no value
   * to print.
   */
  valueLabel?: boolean
  /**
   * Overrides the value text. Base UI's signature rather than Astryx's
   * `(value, max)`, because this is passed straight to `Progress.Value` and
   * Base UI has already done the `Intl.NumberFormat` work `format` asked for.
   */
  formatValue?: (formattedValue: string | null, value: number | null) => ReactNode
  /** Targets on the track. Ignored when indeterminate. */
  marks?: readonly ProgressBarMark[]
  /**
   * Astryx's `isDisabled`: a canceled or inactive operation. Fades the whole
   * component and stops it taking pointer events.
   */
  disabled?: boolean
  /** Extra classes for the outermost element. */
  className?: string
}

/**
 * A progress bar cannot compile without a name — Astryx's first rule for this
 * component, and Slider's union enforcing it. Either a visible `label`, or an
 * `aria-label` when there is nowhere to put one.
 */
export type ProgressBarProps = ProgressBarBaseProps &
  (
    | {
        label: ReactNode
        'aria-label'?: string
      }
    | {
        label?: never
        /** Required: with no visible label, nothing else names the bar. */
        'aria-label': string
      }
  )

export function ProgressBar({
  label,
  labelHidden = false,
  type = 'default',
  valueLabel = false,
  formatValue,
  marks,
  disabled = false,
  className,
  value,
  min = 0,
  max = 100,
  format,
  locale,
  getAriaValueText,
  ...props
}: ProgressBarProps) {
  // Base UI's own signal: a null value is an indeterminate bar. Everything that
  // depends on knowing a number reads this rather than testing again.
  const indeterminate = value == null

  /**
   * One formatter for the tick values, so a bar reading "75%" is not marked up
   * with a bare "80". Slider builds this the same way, but there is one more
   * step here, read out of `ProgressRoot.js` rather than assumed: **with no
   * `format`, Base UI does not print the value at all** — it prints
   * `(value - min) / (max - min)` as a percentage. Handing `Intl.NumberFormat`
   * the raw number instead gives "80" beside a bar that says "75%", which is
   * the kind of mismatch a screenshot cannot show.
   */
  const formatMarkValue = useMemo(() => {
    const options = locale as Parameters<typeof Intl.NumberFormat>[0]
    if (format) {
      const formatter = new Intl.NumberFormat(options, format)
      return (markValue: number) => formatter.format(markValue)
    }
    const percent = new Intl.NumberFormat(options, { style: 'percent' })
    return (markValue: number) => percent.format((markValue - min) / (max - min))
  }, [locale, format, min, max])

  const resolvedMarks = useMemo(
    () =>
      indeterminate
        ? []
        : (marks ?? [])
            .map((mark) => (typeof mark === 'number' ? { value: mark } : mark))
            .filter(({ value: markValue }) => markValue >= min && markValue <= max),
    [marks, indeterminate, min, max],
  )

  const hasMarkLabels = resolvedMarks.some((mark) => mark.label != null)

  /**
   * A mark is information the bar does not otherwise carry — `aria-valuemin` and
   * `aria-valuemax` describe the scale, not a target on it — so the ticks are
   * `aria-hidden` decoration and their labels are folded into the value text
   * instead: "75%, Free tier 80%". Slider's marks announce nothing for the
   * opposite reason: there, every tick's value is already in the input's range.
   *
   * A caller's own `getAriaValueText` wins outright rather than being appended
   * to. Somebody who has written that sentence has decided what the bar says.
   */
  const composedAriaValueText = useMemo(() => {
    if (getAriaValueText) return getAriaValueText
    if (resolvedMarks.length === 0) return undefined

    return (formattedValue: string) =>
      [
        formattedValue,
        ...resolvedMarks.map((mark) =>
          mark.label == null
            ? formatMarkValue(mark.value)
            : `${mark.label} ${formatMarkValue(mark.value)}`,
        ),
      ].join(', ')
  }, [getAriaValueText, resolvedMarks, formatMarkValue])

  return (
    <ProgressPrimitive.Root
      value={value}
      min={min}
      max={max}
      format={format}
      locale={locale}
      getAriaValueText={composedAriaValueText}
      // Paired with the `opacity-40` in `root` above, and required by it — see
      // that recipe for why axe needs this to be here.
      aria-disabled={disabled || undefined}
      className={cn(root({ disabled, markLabels: hasMarkLabels }), className)}
      {...props}
    >
      {(label != null || (valueLabel && !indeterminate)) && (
        <div className={labelRow()}>
          {label != null && (
            <ProgressPrimitive.Label className={labelText({ hidden: labelHidden })}>
              {label}
            </ProgressPrimitive.Label>
          )}
          {valueLabel && !indeterminate && (
            <ProgressPrimitive.Value className={valueText()}>
              {formatValue}
            </ProgressPrimitive.Value>
          )}
        </div>
      )}

      <div className={barRow()}>
        {resolvedMarks.length > 0 && (
          <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
            {resolvedMarks.map((mark) => {
              const percent = ((mark.value - min) / (max - min)) * 100
              if (!Number.isFinite(percent)) return null

              return (
                <span key={mark.value} style={{ left: `${percent}%` }} className="absolute inset-y-0">
                  <span className={markTick()} />
                  {mark.label != null && <span className={markLabel()}>{mark.label}</span>}
                </span>
              )
            })}
          </div>
        )}

        <ProgressPrimitive.Track className={track()}>
          <ProgressPrimitive.Indicator className={indicator({ type })} />
        </ProgressPrimitive.Track>
      </div>
    </ProgressPrimitive.Root>
  )
}

ProgressBar.displayName = 'ProgressBar'

/**
 * The raw Base UI parts, for a bar that needs a different shape than "label,
 * value, track" — a value under the bar, say, or a label that is not text.
 */
ProgressBar.Root = ProgressPrimitive.Root
ProgressBar.Label = ProgressPrimitive.Label
ProgressBar.Value = ProgressPrimitive.Value
ProgressBar.Track = ProgressPrimitive.Track
ProgressBar.Indicator = ProgressPrimitive.Indicator
