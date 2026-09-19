import { tv, type VariantProps } from 'tailwind-variants'

/**
 * The Panel is three boxes, and each has one job.
 *
 * The **aside** is the animated box — its width is the variable on a desktop,
 * its height the variable on a phone — and the box the resize handle is
 * positioned off. It never clips: the handle is translated *outside* it, into
 * the shell's gap, and an `overflow-clip` here would swallow it.
 *
 * The **clip** bounds the card while the aside animates — and only then. The
 * card is anchored to the aside's *near* edge, so as the aside grows the card
 * travels in from the far one: its leading edge is where the aside's leading
 * edge is, and the rest hangs past the viewport until the width catches up.
 * That is what makes an in-flow width transition read as the panel sliding in
 * and pushing the page, rather than the page sliding aside to reveal a panel
 * that was already there (which is what anchoring it to the *far* edge did,
 * and what it looked like). At rest the clip is off, so the card's shadow
 * paints; on, it would have been the thing clipping the shadow.
 *
 * The **card** is held at the variable's size so nothing inside reflows while
 * the aside is moving, and it carries the surface: Figma's 384-wide
 * `Surface/Background Primary` card in `Surface/Border` at `rounded-lg`.
 *
 * **A stack adds a fourth, and moves the numbers.** A panel written inside a
 * panel portals into the root's aside and sits on top of it; each level
 * behind the front one steps 12px (`spacing/3`) toward the page and loses
 * 12px at each end — Figma's `Panel Stacking`, where the widths never change
 * and nothing scales. `--nested-panels` on each aside is how many are in
 * front of it, `--panel-stack` is that in pixels, and the geometry follows:
 * the root aside grows by the stack so the page moves over, the root's clip
 * pads by it so the card shrinks at the ends, and a nested aside is
 * positioned `--panel-stack` in from the far edge and the ends. On a phone
 * the panel is under the page, so the stack peeks out *above* the front card:
 * the same numbers on the other axis.
 */
export const PANEL_STACK = '[--panel-stack:calc(var(--nested-panels,0)*var(--spacing)*3)]'

export const panel = tv({
  base: [
    'relative flex shrink-0 outline-none',
    PANEL_STACK,
    // Desktop: the width is the variable plus the stack; the height is the row's.
    'w-[calc(var(--panel-width)+var(--panel-stack))]',
    // Phone: the full width of the column; the height is the second variable plus the stack.
    'max-md:h-[calc(var(--panel-height)+var(--panel-stack))] max-md:w-full',
    // The slide is the size going 0 → variable. Each regime animates only its
    // own axis, so both presence classes are breakpoint-scoped: an unscoped
    // `data-[starting-style]:w-0` would zero the width on a phone as well.
    'md:data-[starting-style]:w-0 md:data-[ending-style]:w-0',
    'max-md:data-[starting-style]:h-0 max-md:data-[ending-style]:h-0',
    'transition-[width,height,margin] duration-medium ease-standard',
  ],
  variants: {
    side: {
      right: '',
      left: '',
    },
    /**
     * Inside a framed shell the 8px gap would snap in a frame before the width
     * starts to move; a negative margin the same size, eased in with it, keeps
     * the page still until the panel is actually there.
     */
    framed: {
      true: '',
      false: '',
    },
    /** A pointer drag is in flight: the transition is off for its length. SideNav's switch. */
    resizing: {
      true: 'transition-none',
      false: '',
    },
    /**
     * The phone's arrangement at every width: under the page, full width,
     * sized by height. A `navigation="top"` shell is a column, and a column
     * has no "beside the page" to be. The `md:` classes above are overridden
     * at their own prefix so the breakpoint stops mattering.
     */
    stacked: {
      true: [
        'h-[calc(var(--panel-height)+var(--panel-stack))] w-full',
        'md:data-[starting-style]:w-full md:data-[ending-style]:w-full',
        'data-[starting-style]:h-0 data-[ending-style]:h-0',
      ],
      false: '',
    },
  },
  compoundVariants: [
    {
      side: 'right',
      framed: true,
      class: [
        'md:data-[starting-style]:-ml-2 md:data-[ending-style]:-ml-2',
        'max-md:data-[starting-style]:-mt-2 max-md:data-[ending-style]:-mt-2',
      ],
    },
    {
      side: 'left',
      framed: true,
      class: [
        'md:data-[starting-style]:-mr-2 md:data-[ending-style]:-mr-2',
        'max-md:data-[starting-style]:-mb-2 max-md:data-[ending-style]:-mb-2',
      ],
    },
    {
      side: 'right',
      framed: true,
      stacked: true,
      class:
        'md:data-[starting-style]:ml-0 md:data-[ending-style]:ml-0 data-[starting-style]:-mt-2 data-[ending-style]:-mt-2',
    },
    {
      side: 'left',
      framed: true,
      stacked: true,
      class:
        'md:data-[starting-style]:mr-0 md:data-[ending-style]:mr-0 data-[starting-style]:-mb-2 data-[ending-style]:-mb-2',
    },
  ],
  defaultVariants: {
    side: 'right',
    framed: false,
    resizing: false,
    stacked: false,
  },
})

/**
 * A nested panel's aside: absolutely positioned inside the root's, on the far
 * edge, `--panel-stack` in from it and from each end — so the front one sits
 * flush and full-height, and every level behind it peeks out toward the
 * page. Its entrance is the root's, one level in: the width (the height, on a
 * phone) goes 0 → variable with the card anchored to the near edge, so the
 * card travels in from the viewport edge over its parent. The variables are
 * inherited from the root aside, which is why a nested panel writes none.
 *
 * The desktop classes are only emitted when the shell is not `stacked`: a
 * column shell takes the phone's arrangement at every width, and there is no
 * clean way to un-position a `md:` rule from a later class.
 */
export const panelNested = tv({
  base: [
    'absolute flex outline-none',
    PANEL_STACK,
    // The inset eases too, so a level stepping back moves on the same clock
    // as the one sliding in over it.
    'transition-[width,height,inset] duration-medium ease-standard',
  ],
  variants: {
    side: {
      right: '',
      left: '',
    },
    stacked: {
      true: '',
      false: '',
    },
    /** The root's handle is being dragged: every level follows the variable with no easing. */
    resizing: {
      true: 'transition-none',
      false: '',
    },
  },
  compoundVariants: [
    {
      side: 'right',
      stacked: false,
      class: [
        // Desktop: on the right edge, in by the stack, sized by the width.
        'md:inset-y-(--panel-stack) md:right-(--panel-stack) md:w-(--panel-width)',
        'md:data-[starting-style]:w-0 md:data-[ending-style]:w-0',
        // Phone: under the page, so on the bottom edge and up by the stack.
        'max-md:inset-x-(--panel-stack) max-md:bottom-(--panel-stack) max-md:h-(--panel-height)',
        'max-md:data-[starting-style]:h-0 max-md:data-[ending-style]:h-0',
      ],
    },
    {
      side: 'left',
      stacked: false,
      class: [
        'md:inset-y-(--panel-stack) md:left-(--panel-stack) md:w-(--panel-width)',
        'md:data-[starting-style]:w-0 md:data-[ending-style]:w-0',
        // A left panel sits above the page on a phone, so its stack peeks below.
        'max-md:inset-x-(--panel-stack) max-md:top-(--panel-stack) max-md:h-(--panel-height)',
        'max-md:data-[starting-style]:h-0 max-md:data-[ending-style]:h-0',
      ],
    },
    {
      side: 'right',
      stacked: true,
      class: [
        'inset-x-(--panel-stack) bottom-(--panel-stack) h-(--panel-height)',
        'data-[starting-style]:h-0 data-[ending-style]:h-0',
      ],
    },
    {
      side: 'left',
      stacked: true,
      class: [
        'inset-x-(--panel-stack) top-(--panel-stack) h-(--panel-height)',
        'data-[starting-style]:h-0 data-[ending-style]:h-0',
      ],
    },
  ],
  defaultVariants: {
    side: 'right',
    stacked: false,
    resizing: false,
  },
})

export const panelClip = tv({
  base: [
    'flex h-full w-full',
    // The stack's inset, on the axis the stack peeks along; the card is
    // `h-full` / `w-full` inside, so padding here is what shrinks it at the ends.
    'transition-[padding] duration-medium ease-standard',
  ],
  variants: {
    side: {
      // Anchored to the left edge, so it travels in from the right; on a
      // phone, anchored to the top, so it travels up from the bottom.
      right: 'md:justify-start max-md:items-start',
      // The mirror: anchored right, in from the left; on a phone — written
      // before the page, so above it — anchored to the bottom, down from the top.
      left: 'md:justify-end max-md:items-end',
    },
    stacked: {
      true: '',
      false: '',
    },
    /**
     * The root's clip carries the stack's inset — its card is in-flow, so
     * padding is the only way to shrink it at the ends. A nested aside is
     * positioned by the same number already, so its clip pads nothing.
     */
    nested: {
      true: '',
      false: '',
    },
    /** Clipped only while the aside is moving; the aside writes the status. */
    transitioning: {
      true: 'overflow-clip',
      false: '',
    },
    /** The root's handle is being dragged: no easing on the padding either. */
    resizing: {
      true: 'transition-none',
      false: '',
    },
  },
  compoundVariants: [
    { side: 'right', stacked: true, class: 'md:justify-start md:items-start' },
    { side: 'left', stacked: true, class: 'md:justify-start md:items-end' },
    {
      nested: false,
      stacked: false,
      class: 'md:py-(--panel-stack) max-md:px-(--panel-stack)',
    },
    { nested: false, stacked: true, class: 'px-(--panel-stack)' },
  ],
  defaultVariants: {
    side: 'right',
    stacked: false,
    nested: false,
    transitioning: false,
    resizing: false,
  },
})

export const panelCard = tv({
  base: [
    'flex shrink-0 flex-col',
    // Held at the variables, so the content does not reflow while the aside animates.
    'h-full w-(--panel-width)',
    'max-md:h-(--panel-height) max-md:w-full',
    // ContentBlock's default surface. Only that one: a panel is a region of
    // the page, not a bento cell, so there is no subtle or accent here.
    'rounded-lg border border-surface-border bg-surface-background-primary',
    'font-sans text-base text-content-primary',
    // The square-cornered scrolling Body inside would otherwise paint through
    // the rounded corners — the contained Page's reason and spelling. The
    // Header's and the Body's `px-4` leave every ring inside 16px of room, so
    // no clip margin is needed.
    'overflow-clip',
  ],
  variants: {
    /** ContentBlock's `Floating`: the low shadow lifts the card off the canvas. */
    floating: {
      true: 'shadow-low',
      false: '',
    },
    /**
     * Docked to the window edge, a rounded corner shows canvas behind it —
     * navSurface's rule, and the contained Page's.
     */
    docked: {
      true: 'rounded-none',
      false: '',
    },
    /** The phone's size at every width; see `panel`. */
    stacked: {
      true: 'h-(--panel-height) w-full',
      false: '',
    },
    /** A panel is in front of it: the edge that peeks is a way back to this level. */
    covered: {
      true: 'cursor-pointer',
      false: '',
    },
  },
  defaultVariants: {
    floating: false,
    docked: false,
    stacked: false,
    covered: false,
  },
})

/**
 * The column inside the card that the Header and the Body stack in. It exists
 * for the stack: a panel with another in front of it keeps its surface and
 * its shadow — that is the 12px that peeks out — and loses its *content*,
 * which fades over the slide and is `inert` for the duration, so the × and
 * the fields under the front card are out of the tab order. Base UI's
 * nested-drawer demo hides the parent's content the same way.
 */
export const panelContent = tv({
  base: 'flex min-h-0 flex-1 flex-col transition-opacity duration-medium ease-standard',
  variants: {
    covered: {
      true: 'opacity-0',
      false: '',
    },
  },
  defaultVariants: {
    covered: false,
  },
})

export const panelBody = tv({
  // Dialog's Body, with ContentBlock's Content padding. `first:pt-4` puts the
  // 16 back for a panel with no Header — derived from position, not a prop.
  base: 'min-h-0 flex-1 overflow-y-auto px-4 pt-0 pb-4 first:pt-4',
})

type PanelVariants = VariantProps<typeof panel>
export type PanelSide = NonNullable<PanelVariants['side']>
