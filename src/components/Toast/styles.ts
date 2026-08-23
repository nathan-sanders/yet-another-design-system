import { tv, type VariantProps } from 'tailwind-variants'

import { focusRing } from '../../lib/focus'

/**
 * The shared look of a toast, plus the geometry of the stack it sits in.
 *
 * These live in their own module for the same reason Avatar's do: the card is
 * drawn twice — once by the inline `<Toast>` (the Figma component, for stories
 * and docs) and once by the `Toast.Viewport` that Base UI's manager feeds — and
 * a file exporting both components and constants breaks React Fast Refresh.
 *
 * ## The card is Figma, the stack is Base UI
 *
 * `toastCard` below is node `40004135:15969` measured value for value.
 * `toastStack` is not in Figma at all — Figma draws one toast on a canvas, not a
 * viewport — so it comes from Base UI, which publishes the geometry as CSS
 * variables on each `Toast.Root`:
 *
 * - `--toast-index` — 0 is frontmost.
 * - `--toast-offset-y` — a **positive** running sum of the heights of the toasts
 *   in front of this one, so an upward-growing stack has to negate it. It is a
 *   pure height sum with no gap in it, which is why the gap is added here as
 *   `--toast-index * 8px`.
 * - `--toast-height` / `--toast-frontmost-height` — the measured heights, which
 *   are what let a collapsed stack clamp to a single card's worth of space.
 * - `--toast-swipe-movement-x` / `-y` — live drag offset.
 *
 * ## Why the transform is one arbitrary declaration
 *
 * Tailwind's `translate-*` and `scale-*` utilities compose through their own
 * variables, and the swipe offset has to land inside the *same* transform as the
 * stack offset. So there is one authoritative `[transform:…]`, and the states
 * feed it through two custom properties, `--stack-y` and `--stack-scale`.
 *
 * That also settles a specificity question. `data-[expanded]:` only sets those
 * two properties (specificity 0,2,0), so it beats the base declaration (0,1,0)
 * whatever order Tailwind emits them in. Entry and exit replace `transform`
 * outright at the same 0,2,0, and the swipe-direction exits stack a third
 * attribute to reach 0,3,0 and beat those. Nothing here depends on source order.
 */

/**
 * The card itself — Figma node `40004135:15969`, 400x72.
 *
 * `Type` is the only variant the file draws. Note that **Default is the
 * Decorative/Neutral ramp, not Banner's blue `feedback-info`**: a toast that just
 * confirms something happened is neutral, and the file says so. Success and
 * danger are the same `feedback-*` pairs Banner uses, each a background with a
 * foreground already tuned for contrast on it in both themes — so, as in Banner,
 * there is not one `dark:` class in this component.
 *
 * **There is no icon rail.** Banner centres a status glyph in a 16px column
 * before its text; Toast's content starts flush against the 16px padding. A
 * deliberate difference between the two components, not an omission here.
 */
export const toastCard = tv({
  base: [
    'flex w-full items-start',
    // gap-1 = 4px (spacing/1), px-4 = 16px, py-3 = 12px. Banner's box exactly.
    'gap-1 px-4 py-3',
    'rounded-lg shadow-medium',
    // 14/24 body type, inherited by both rows.
    'font-sans text-base [word-break:break-word]',
    // Figma has overflow-clip on the frame. Not ported, for the third time in
    // this library: nothing overflows, and it would slice the 2px focus ring off
    // the dismiss button sitting 16px from the edge.
  ],

  variants: {
    /** Figma's `Type`. The foreground lands on the root so both rows inherit it. */
    type: {
      default: 'bg-decorative-neutral-background text-decorative-neutral-foreground',
      success: 'bg-feedback-success-background text-feedback-success-foreground',
      danger: 'bg-feedback-danger-background text-feedback-danger-foreground',
    },
  },

  defaultVariants: {
    type: 'default',
  },
})

type ToastCardVariants = VariantProps<typeof toastCard>

/** Maps to the Figma `Type` property: Default | Success | Danger. */
export type ToastType = NonNullable<ToastCardVariants['type']>

/**
 * Where the stack lives on screen. Not a Figma property — the file draws a card,
 * never a viewport — so this is ours, and everything else about the stack is
 * derived from it rather than exposed as a second knob.
 */
export type ToastPosition = 'bottom-right' | 'bottom-center' | 'top-right' | 'top-center'

/** The fixed box the stack is anchored to. Inset 16px from the corner. */
export const toastViewport = tv({
  base: [
    'fixed z-50 w-100 max-w-[calc(100vw-2rem)]',
    // The viewport's own box is what Base UI watches for the hover that expands
    // the stack, and its children are absolutely positioned — so without a
    // height it would be a zero-pixel target. `--toast-frontmost-height` is
    // published for exactly this. With no toasts the variable is unset, the
    // declaration is invalid at computed-value time, and the box collapses.
    'h-[var(--toast-frontmost-height)]',
  ],

  variants: {
    position: {
      'bottom-right': 'right-4 bottom-4',
      'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
      'top-right': 'top-4 right-4',
      'top-center': 'top-4 left-1/2 -translate-x-1/2',
    },
  },

  defaultVariants: {
    position: 'bottom-right',
  },
})

/**
 * The stacking behaviour, applied to `Toast.Root` on top of `toastCard`.
 *
 * Collapsed, the toasts behind peek out by 12px each and shrink 5% each, capped
 * at three deep so a long queue does not walk off the screen. Expanded — which
 * Base UI turns on for hover *and* for focus — each toast moves to its own
 * measured offset at full scale.
 */
export const toastStack = tv({
  base: [
    'absolute inset-x-0',
    // Frontmost paints on top.
    'z-[calc(1000-var(--toast-index))]',

    // The one authoritative transform. Everything else moves --stack-y/--stack-scale.
    '[transform:translateX(var(--toast-swipe-movement-x,0px))_translateY(calc(var(--toast-swipe-movement-y,0px)_+_var(--stack-y)))_scale(var(--stack-scale))]',
    '[--stack-scale:calc(max(0,1-(min(var(--toast-index),3)*0.05)))]',
    'data-[expanded]:[--stack-scale:1]',

    // Collapsed, every card clamps to the frontmost card's height so the stack
    // reads as one object; expanded, each returns to its own.
    'h-[var(--toast-frontmost-height,var(--toast-height))]',
    'data-[expanded]:h-[var(--toast-height)]',

    // Motion, on the tokens. duration-medium-min is 310ms — the nearest token to
    // the ~300-500ms Base UI's own demo settles the stack at. The content fades
    // faster (duration-fast) from `toastText` below, so the crossfade finishes
    // before the move does rather than trailing it.
    'transition-[transform,height,opacity] duration-medium-min ease-standard',

    // Toasts past `limit` stay mounted (Base UI marks them inert) so they can
    // animate rather than vanish.
    'data-[limited]:opacity-0',

    // Focus: Root carries tabIndex=0, so it is a real stop. The library's shared
    // ring (src/lib/focus.ts) is pure `box-shadow`, which matters here more than
    // anywhere: this card's height is animated, so anything that changed its box
    // would fight the transition.
    ...focusRing,

    // Bridges the 8px gap between expanded toasts. Base UI collapses the stack
    // on mouseleave, and mouseleave does not fire while the pointer is over a
    // descendant — but the gap between two toasts belongs to neither, so without
    // this the stack collapses as you move down it.
    'after:absolute after:inset-x-0 after:h-2 after:content-[""]',
  ],

  variants: {
    position: {
      'bottom-right': '',
      'bottom-center': '',
      'top-right': '',
      'top-center': '',
    },
  },

  compoundVariants: [
    {
      position: ['bottom-right', 'bottom-center'],
      class: [
        'bottom-0 after:bottom-full',
        // Behind toasts peek upward, so the offset is negative.
        '[--stack-y:calc(min(var(--toast-index),3)*-12px)]',
        'data-[expanded]:[--stack-y:calc((var(--toast-offset-y)+(var(--toast-index)*8px))*-1)]',
        // Enter and leave downward, off the bottom edge.
        'data-[starting-style]:[transform:translateY(150%)] data-[starting-style]:opacity-0',
        'data-[ending-style]:[transform:translateY(150%)] data-[ending-style]:opacity-0',
      ],
    },
    {
      position: ['top-right', 'top-center'],
      class: [
        'top-0 after:top-full',
        '[--stack-y:calc(min(var(--toast-index),3)*12px)]',
        'data-[expanded]:[--stack-y:calc(var(--toast-offset-y)+(var(--toast-index)*8px))]',
        'data-[starting-style]:[transform:translateY(-150%)] data-[starting-style]:opacity-0',
        'data-[ending-style]:[transform:translateY(-150%)] data-[ending-style]:opacity-0',
      ],
    },
  ],

  defaultVariants: {
    position: 'bottom-right',
  },
})

/**
 * A swiped toast leaves the way it was thrown rather than the way its position
 * would normally send it. Three attributes deep, so these beat the plain
 * `data-[ending-style]` rules above without relying on source order.
 */
export const TOAST_SWIPE_EXIT = [
  'data-[ending-style]:data-[swipe-direction=up]:[transform:translateY(calc(var(--toast-swipe-movement-y)-150%))]',
  'data-[ending-style]:data-[swipe-direction=down]:[transform:translateY(calc(var(--toast-swipe-movement-y)+150%))]',
  'data-[ending-style]:data-[swipe-direction=left]:[transform:translateX(calc(var(--toast-swipe-movement-x)-150%))]',
  'data-[ending-style]:data-[swipe-direction=right]:[transform:translateX(calc(var(--toast-swipe-movement-x)+150%))]',
]

/**
 * Which way a toast can be thrown to dismiss it — derived from where the stack
 * sits, so it is never a second knob that can disagree with `position`. A
 * centred stack has no sideways home to be thrown to, so it only swipes on the
 * axis it entered from.
 */
export const TOAST_SWIPE_DIRECTION: Record<ToastPosition, ('up' | 'down' | 'left' | 'right')[]> = {
  'bottom-right': ['down', 'right'],
  'bottom-center': ['down'],
  'top-right': ['up', 'right'],
  'top-center': ['up'],
}

/**
 * `Toast.Content` — the part Base UI flags with `data-behind` while a toast is
 * buried, which is what keeps a collapsed stack from showing three sets of text
 * through each other. Faster than the stack's own move, as in Base UI's demo.
 */
export const toastContent = tv({
  base: [
    'flex w-full items-start gap-1',
    'transition-opacity duration-fast ease-standard',
    'data-[behind]:opacity-0 data-[expanded]:opacity-100',
  ],
})

/**
 * The text column. `pr-2` is Figma's — 8px here plus the root's 4px gap is the
 * 12px between the description and the action button. `min-w-0` lets a long
 * unbroken word wrap instead of pushing the buttons out, as in Banner.
 */
export const toastText = tv({
  base: 'flex min-w-0 flex-1 flex-col pr-2',
})
