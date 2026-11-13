import { Children, createContext, isValidElement, useContext, useId } from 'react'
import type { ComponentPropsWithRef, ReactElement, ReactNode } from 'react'
import { Check, ChevronLeft, ChevronRight, CircleAlert, CircleCheck, CircleX } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { tv } from 'tailwind-variants'

import { cn } from '../../lib/cn'
import { focusRing } from '../../lib/focus'
import { Button } from '../Button'
import { Icon } from '../Icon'
import { COMPACT_BELOW } from './compact'

/**
 * Stepper — where someone is in a sequence of steps: which are done, which one
 * is current, and what is still ahead.
 *
 * The Figma page is `↪ Stepper` (`40004748:43528`): `_Step
 * Indicator` (`40006524:421`), `Step` (`40006525:524`) and `Stepper`
 * (`40006526:681`). The file was drawn first, from Astryx's Stepper, and this is
 * the code catching up.
 *
 *     <Stepper activeStep={step} onStepClick={setStep}>
 *       <Stepper.Step label="Cart" />
 *       <Stepper.Step label="Shipping" />
 *       <Stepper.Step label="Payment" />
 *     </Stepper>
 *
 * **No Base UI primitive underneath** — Base UI has no stepper, and the
 * accessible shape is small enough to write:
 * an `<ol>` with `aria-current="step"` on the current item, which is Astryx's
 * own model ("an ordered list, not a navigation landmark").
 *
 * **Three things are derived rather than declared**, the house rule:
 *
 * - **Progress** comes from the step's position against `activeStep`, so a
 *   step cannot claim to be current while another one is.
 * - **Clickable** comes from passing `onStepClick`. Without it the steps are
 *   plain list items; with it each one is a `<button>` and gets Figma's
 *   `State=Hover` and `State=Focus`.
 * - **The content slot** is the step's `children`. Figma's `Show Content`
 *   boolean is whether you passed any.
 */

export type StepperOrientation = 'horizontal' | 'vertical'

/**
 * Figma's `Layout` axis. `separated` gives each step its own 4px bar;
 * `on-track` threads the indicators onto one connector, Astryx's
 * `indicatorPosition="on-track"`.
 */
export type StepperLayout = 'separated' | 'on-track'

/**
 * The indicator's `Type`, minus the one that is derived: passing `icon` to a
 * step is what makes it `Type=Icon`, so it is not spelled here.
 */
export type StepperIndicator = 'auto' | 'number' | 'none'

/**
 * A step's semantic status. It changes the indicator's glyph and color and is
 * announced as text — never the track, which still shows progress. Astryx's
 * `accent` is left out because the current step already is the accent.
 */
export type StepperStepStatus = 'success' | 'warning' | 'error'

type Progress = 'complete' | 'current' | 'upcoming'

interface StepperContextValue {
  activeStep: number
  onStepClick?: (index: number) => void
  orientation: StepperOrientation
  layout: StepperLayout
  indicator: StepperIndicator
  count: number
}

const StepperContext = createContext<StepperContextValue | null>(null)
const StepIndexContext = createContext(-1)

/**
 * The root. Only a horizontal, separated stepper is a size container — it is
 * the only shape that collapses, and `container-type: inline-size` would
 * shrink a vertical stepper sitting in a hug-width row to nothing.
 */
const root = tv({
  base: 'font-sans',
  variants: {
    compactable: { true: '@container/stepper w-full', false: '' },
  },
})

/**
 * Everything inside the root. The collapse classes go here and not on the root,
 * because a container query styles the container's descendants, never the
 * container itself — on the root they compiled correctly and matched nothing.
 */
const frame = 'flex flex-col gap-2'

/** The `<ol>`. Separated steps sit 4px apart; on-track steps touch, so the line is one line. */
const list = tv({
  base: 'flex',
  variants: {
    orientation: { horizontal: 'w-full', vertical: 'flex-col' },
    layout: { separated: 'gap-1', 'on-track': 'gap-0' },
  },
})

const item = tv({
  base: 'relative min-w-0',
  variants: {
    orientation: { horizontal: 'flex flex-1', vertical: 'flex' },
    layout: { separated: '', 'on-track': '' },
  },
  compoundVariants: [
    { orientation: 'horizontal', layout: 'separated', className: 'flex-col' },
    // The bar beside the step, 2px off it — Astryx's measured gap.
    { orientation: 'vertical', layout: 'separated', className: 'gap-0.5' },
    { orientation: 'vertical', layout: 'on-track', className: 'flex-col' },
  ],
})

/**
 * Figma's `Target`: the indicator and text, which is what takes the hover wash
 * and the focus ring. Content below a vertical step is never part of it.
 *
 * Hover is the Ghost button's wash on the `button` radius role, the same pair
 * Figma binds. `group/step` lets the parts inside answer the hover — see
 * `track`.
 */
const target = tv({
  base: 'w-full min-w-0 rounded-button text-left',
  variants: {
    clickable: {
      true: [
        'group/step cursor-pointer transition-colors',
        'hover:bg-action-ghost-background-hover',
        ...focusRing,
      ],
      false: '',
    },
    orientation: { horizontal: '', vertical: 'flex' },
    layout: { separated: 'gap-2 p-2', 'on-track': '' },
  },
  compoundVariants: [
    // The one target that disappears when the stepper collapses. Its display
    // is the variable alone — a `flex` beside it wins the cascade, so the
    // other three spell `flex` for themselves.
    {
      orientation: 'horizontal',
      layout: 'separated',
      className: '[display:var(--stepper-full,flex)]',
    },
    {
      orientation: 'horizontal',
      layout: 'on-track',
      className: 'flex flex-col items-center gap-2 py-2',
    },
    { orientation: 'vertical', layout: 'on-track', className: 'gap-2 px-2' },
  ],
})

/**
 * The unfilled part of every bar and connector: `Surface/Border`.
 *
 * **On hover it steps up to `Action/Secondary/Border`**, Figma's override in the
 * Hover variants. The ghost wash is neutral-800 at 10%, which lands within a
 * shade of Stone 200 — so on hover an upcoming badge and its track vanished
 * into the wash. Stone 300 in light, 700 in dark, reads on it in both themes;
 * a white "cutout" was the obvious alternative and disappears in dark.
 */
const track = tv({
  base: 'block overflow-hidden bg-surface-border',
  variants: {
    /**
     * A separated bar is a pill. A connector is square: two of them meet at
     * every step boundary, and rounded ends notch the line there — Figma's
     * connector `Line` has no radius for that reason.
     */
    shape: { bar: 'rounded-full', connector: '' },
    orientation: { horizontal: 'h-1', vertical: 'w-1' },
    hoverable: { true: 'group-hover/step:bg-action-secondary-border', false: '' },
    hidden: { true: 'invisible', false: '' },
  },
})

/**
 * The fill inside a track, scaled rather than swapped so advancing a step grows
 * the line along the track it just covered — Astryx's motion. Tailwind v4's
 * `scale-*` utilities set the `scale` property, not `transform`, so the
 * transition names `scale`.
 */
const fill = tv({
  base: 'block size-full bg-content-primary transition-[scale] duration-medium ease-standard motion-reduce:transition-none',
  variants: {
    orientation: { horizontal: 'origin-left', vertical: 'origin-top' },
    filled: { true: '', false: '' },
  },
  compoundVariants: [
    { orientation: 'horizontal', filled: false, className: 'scale-x-0' },
    { orientation: 'vertical', filled: false, className: 'scale-y-0' },
  ],
})

/**
 * The label. 14px is `text-base` in this scale; the current step is semibold,
 * an upcoming one subtle. Horizontal labels truncate rather than wrap, because
 * a step is a fraction of the row and a second line would push every bar out of
 * alignment.
 */
const labelText = tv({
  base: 'text-base',
  variants: {
    progress: {
      complete: 'font-normal text-content-primary',
      current: 'font-semibold text-content-primary',
      upcoming: 'font-normal text-content-subtle',
    },
    truncate: { true: 'truncate', false: '' },
  },
})

const descriptionText = tv({
  base: 'text-sm text-content-subtle',
  variants: { truncate: { true: 'truncate', false: '' } },
})

/**
 * The number badge: 16px, `text-xs` semibold. Filled in `Content/Primary` for
 * a done or current step in `number` mode, otherwise `Surface/Border` — with
 * the same hover step-up the track takes.
 */
const badge = tv({
  base: 'flex size-4 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums',
  variants: {
    filled: {
      true: 'bg-content-primary text-content-inverse',
      false: 'bg-surface-border text-content-subtle group-hover/step:bg-action-secondary-border',
    },
  },
})

const STATUS_GLYPH: Record<StepperStepStatus, LucideIcon> = {
  success: CircleCheck,
  warning: CircleAlert,
  error: CircleX,
}

const STATUS_COLOR: Record<StepperStepStatus, string> = {
  success: 'text-feedback-success-highlight',
  warning: 'text-feedback-warning-highlight',
  error: 'text-feedback-danger-highlight',
}

interface StepMarkProps {
  mode: StepperIndicator | 'icon'
  icon?: LucideIcon
  progress: Progress
  status?: StepperStepStatus
  number: number
}

/**
 * `_Step Indicator`, every variant of it.
 *
 * **The Complete check is a bare Lucide `Check` at 10px, not an `Icon`.** That
 * was Nathan's call in the file: the check is part of a drawn mark, like the
 * Current ring and dot, not a glyph anybody swaps, and 10px is not one of
 * Icon's four sizes. It still takes Icon's two stroke rules, so it paints the
 * same 1.5px every other icon does. Status glyphs and `icon` stay on `Icon`,
 * because those are full-size icons.
 */
function StepMark({ mode, icon, progress, status, number }: StepMarkProps) {
  if (mode === 'none') return null

  if (status) {
    return (
      <Icon data-stepper-indicator icon={STATUS_GLYPH[status]} className={STATUS_COLOR[status]} />
    )
  }

  if (mode === 'icon' && icon) {
    return (
      <Icon
        data-stepper-indicator
        icon={icon}
        className={progress === 'upcoming' ? 'text-content-subtle' : 'text-content-primary'}
      />
    )
  }

  if (mode === 'auto' && progress === 'complete') {
    return (
      <span
        data-stepper-indicator
        className="flex size-4 shrink-0 items-center justify-center rounded-full bg-content-primary text-content-inverse"
      >
        <Check
          aria-hidden
          className="size-2.5 [stroke-width:var(--icon-stroke-weight)] [&_*]:[vector-effect:non-scaling-stroke]"
        />
      </span>
    )
  }

  if (mode === 'auto' && progress === 'current') {
    // Figma's 2px inside stroke on a 16px ellipse, with an 8px dot centered.
    return (
      <span
        data-stepper-indicator
        className="flex size-4 shrink-0 items-center justify-center rounded-full border-2 border-content-primary"
      >
        <span className="size-2 rounded-full bg-content-primary" />
      </span>
    )
  }

  return (
    <span
      data-stepper-indicator
      className={badge({ filled: mode === 'number' && progress !== 'upcoming' })}
    >
      {number}
    </span>
  )
}

export interface StepperStepProps extends Omit<ComponentPropsWithRef<'li'>, 'children'> {
  /** What the step is. Keep it short: "Payment", not "Enter your payment information". */
  label: ReactNode
  /** Supporting text under the label. */
  description?: ReactNode
  /** Overrides the stepper's `indicator` for this step. */
  indicator?: StepperIndicator
  /** A Lucide glyph for the indicator. Passing one is what makes it `Type=Icon`. */
  icon?: LucideIcon
  /** A semantic status for the indicator — never the track. */
  status?: StepperStepStatus
  /**
   * Content under the label: fields, a summary, a banner. Vertical steppers
   * only — a horizontal step is a fraction of a row and has nowhere to put it,
   * so it is ignored there. Usually rendered for the current step only, so the
   * flow opens one step at a time.
   */
  children?: ReactNode
}

function StepperStep({
  label,
  description,
  indicator,
  icon,
  status,
  children,
  className,
  ...props
}: StepperStepProps) {
  const context = useContext(StepperContext)
  const index = useContext(StepIndexContext)
  const labelId = useId()
  const descriptionId = useId()
  if (!context || index < 0) throw new Error('Stepper.Step has to be a direct child of Stepper')

  const { activeStep, onStepClick, orientation, layout, count } = context
  const progress: Progress =
    index < activeStep ? 'complete' : index === activeStep ? 'current' : 'upcoming'
  const clickable = onStepClick != null
  const horizontal = orientation === 'horizontal'
  const first = index === 0
  const last = index === count - 1

  const mode = icon ? 'icon' : (indicator ?? context.indicator)
  const mark = (
    <StepMark mode={mode} icon={icon} progress={progress} status={status} number={index + 1} />
  )

  // Read out after the label, so a done step is "Cart, completed" and a failed
  // one says so. `aria-current="step"` already marks the current one.
  const statusText =
    status === 'error' || status === 'warning'
      ? status
      : status === 'success' || progress === 'complete'
        ? 'completed'
        : null

  const content =
    orientation === 'vertical' && children != null && children !== false ? children : null

  const text = (
    <span
      className={cn(
        'flex min-w-0 flex-col',
        layout === 'on-track' && horizontal ? 'w-full items-center px-2 text-center' : 'flex-1',
        layout === 'on-track' && !horizontal && 'py-2',
      )}
    >
      <span id={labelId} className={labelText({ progress, truncate: horizontal })}>
        {label}
        {statusText && <span className="sr-only">, {statusText}</span>}
      </span>
      {description != null && (
        <span id={descriptionId} className={descriptionText({ truncate: horizontal })}>
          {description}
        </span>
      )}
    </span>
  )

  const Target = clickable ? 'button' : 'div'
  const targetProps = clickable
    ? {
        type: 'button' as const,
        onClick: () => onStepClick(index),
        'aria-labelledby': labelId,
        'aria-describedby': description != null ? descriptionId : undefined,
      }
    : {}
  const targetClass = target({ clickable, orientation, layout })
  const trackProps = { hoverable: clickable }

  let body: ReactNode

  if (layout === 'separated') {
    const targetNode = (
      <Target {...targetProps} className={targetClass}>
        {mode !== 'none' && (
          <span aria-hidden className="flex h-6 w-4 shrink-0 items-center justify-center">
            {mark}
          </span>
        )}
        {text}
      </Target>
    )

    body = (
      <>
        <span
          aria-hidden
          className={cn(
            track({ orientation, shape: 'bar' }),
            horizontal ? 'w-full' : 'self-stretch',
          )}
        >
          <span className={fill({ orientation, filled: progress !== 'upcoming' })} />
        </span>
        {horizontal ? (
          <>
            {targetNode}
            {/* The step's name while the stepper is collapsed and the target is gone. */}
            <span className="sr-only [display:var(--stepper-compact,none)]">
              {label}
              {statusText && `, ${statusText}`}
            </span>
          </>
        ) : (
          <div className="flex min-w-0 flex-1 flex-col">
            {targetNode}
            {/* 32px in: the target's 8, the indicator's 16 and the gap's 8, so content lines up with the label. */}
            {content && (
              <div className={cn('py-2 pr-2', mode === 'none' ? 'pl-2' : 'pl-8')}>{content}</div>
            )}
          </div>
        )}
      </>
    )
  } else if (horizontal) {
    body = (
      <Target {...targetProps} className={targetClass}>
        <span aria-hidden className="flex h-4 w-full items-center">
          <span
            className={cn(
              track({ orientation, shape: 'connector', hidden: first, ...trackProps }),
              'flex-1',
            )}
          >
            <span className={fill({ orientation, filled: progress !== 'upcoming' })} />
          </span>
          {mark}
          <span
            className={cn(
              track({ orientation, shape: 'connector', hidden: last, ...trackProps }),
              'flex-1',
            )}
          >
            <span className={fill({ orientation, filled: progress === 'complete' })} />
          </span>
        </span>
        {text}
      </Target>
    )
  } else {
    body = (
      <>
        <Target {...targetProps} className={targetClass}>
          {/* The rail: 12px of line, the indicator, then line to the bottom of the step. */}
          <span aria-hidden className="flex w-4 shrink-0 flex-col items-center">
            <span
              className={cn(
                track({ orientation, shape: 'connector', hidden: first, ...trackProps }),
                'h-3 shrink-0',
              )}
            >
              <span className={fill({ orientation, filled: progress !== 'upcoming' })} />
            </span>
            {mark}
            <span
              className={cn(
                track({ orientation, shape: 'connector', hidden: last, ...trackProps }),
                'flex-1',
              )}
            >
              <span className={fill({ orientation, filled: progress === 'complete' })} />
            </span>
          </span>
          {text}
        </Target>
        {content && (
          <div className="flex gap-2 px-2">
            {/* The rail carries on past the content, so the line between steps stays one line. */}
            <span aria-hidden className="flex w-4 shrink-0 justify-center">
              <span className={track({ orientation, shape: 'connector', hidden: last })}>
                <span className={fill({ orientation, filled: progress === 'complete' })} />
              </span>
            </span>
            <div className="min-w-0 flex-1 py-2">{content}</div>
          </div>
        )}
      </>
    )
  }

  return (
    <li
      aria-current={progress === 'current' ? 'step' : undefined}
      data-progress={progress}
      className={cn(item({ orientation, layout }), className)}
      {...props}
    >
      {body}
    </li>
  )
}

StepperStep.displayName = 'Stepper.Step'

export interface StepperProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
  /** The current step, zero-based. Steps before it are complete, steps after it upcoming. */
  activeStep: number
  /**
   * Makes every step a button. Called with the step's index; moving there is
   * the caller's decision, so a flow can refuse to skip ahead.
   */
  onStepClick?: (index: number) => void
  orientation?: StepperOrientation
  layout?: StepperLayout
  /** The indicator every step uses unless it says otherwise. */
  indicator?: StepperIndicator
  /**
   * Previous / Next beside the current step when a horizontal stepper has
   * collapsed. Only drawn when steps are clickable; turn it off when the page
   * already has its own Back and Continue.
   */
  compactControls?: boolean
  /** Names the list. Astryx's default, "Progress". */
  'aria-label'?: string
  /** `Stepper.Step` elements, in order. */
  children: ReactNode
}

export function Stepper({
  activeStep,
  onStepClick,
  orientation = 'horizontal',
  layout = 'separated',
  indicator = 'auto',
  compactControls = true,
  'aria-label': ariaLabel = 'Progress',
  className,
  children,
  ...props
}: StepperProps) {
  const steps = Children.toArray(children).filter(
    isValidElement,
  ) as ReactElement<StepperStepProps>[]
  const count = steps.length
  const compactable = orientation === 'horizontal' && layout === 'separated'
  const current = steps[activeStep]?.props

  return (
    <StepperContext.Provider
      value={{ activeStep, onStepClick, orientation, layout, indicator, count }}
    >
      <div className={cn(root({ compactable }), className)} {...props}>
        <div className={cn(frame, compactable && COMPACT_BELOW[count])}>
          <ol aria-label={ariaLabel} className={list({ orientation, layout })}>
            {steps.map((step, index) => (
              <StepIndexContext.Provider key={step.key ?? index} value={index}>
                {step}
              </StepIndexContext.Provider>
            ))}
          </ol>

          {compactable && current && (
            // Figma's `Layout=Compact` summary. The text is hidden from assistive
            // tech because the list above still names every step; the buttons are
            // not, because they are the only way to move while it is collapsed.
            <div
              data-stepper-summary
              className="items-center gap-2 [display:var(--stepper-compact,none)]"
            >
              {onStepClick && compactControls && (
                <Button
                  appearance="ghost"
                  startIcon={ChevronLeft}
                  aria-label="Previous step"
                  disabled={activeStep <= 0}
                  onClick={() => onStepClick(activeStep - 1)}
                />
              )}
              <div aria-hidden className="flex min-w-0 flex-1 flex-col items-center text-center">
                <span className="w-full truncate text-base font-semibold text-content-primary">
                  {current.label}
                </span>
                <span className="text-sm text-content-subtle">
                  Step {activeStep + 1} of {count}
                </span>
              </div>
              {onStepClick && compactControls && (
                <Button
                  appearance="ghost"
                  startIcon={ChevronRight}
                  aria-label="Next step"
                  disabled={activeStep >= count - 1}
                  onClick={() => onStepClick(activeStep + 1)}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </StepperContext.Provider>
  )
}

Stepper.displayName = 'Stepper'
Stepper.Step = StepperStep
