import { tv, type VariantProps } from 'tailwind-variants'

/**
 * The Panel is three boxes, and each has one job.
 *
 * The **aside** is the animated box — its width is the variable on a desktop,
 * its height the variable on a phone — and the box the resize handle is
 * positioned off. It never clips: the handle is translated *outside* it, into
 * the shell's gap, and an `overflow-clip` here would swallow it.
 *
 * The **clip** bounds the card while the aside animates, anchored to the edge
 * the panel enters from, so the visible part grows *from* that edge. That is
 * what makes an in-flow width transition read as a slide rather than a reveal.
 *
 * The **card** is held at the variable's size so nothing inside reflows while
 * the aside is moving, and it carries the surface: Figma's 384-wide
 * `Surface/Background Primary` card in `Surface/Border` at `rounded-lg`.
 */
export const panel = tv({
  base: [
    'relative flex shrink-0 outline-none',
    // Desktop: the width is the variable; the height is the row's.
    'w-(--panel-width)',
    // Phone: the full width of the column; the height is the second variable.
    'max-md:h-(--panel-height) max-md:w-full',
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
  ],
  defaultVariants: {
    side: 'right',
    framed: false,
    resizing: false,
  },
})

export const panelClip = tv({
  base: 'flex h-full w-full overflow-clip',
  variants: {
    side: {
      // Enters from the right; on a phone, from the bottom.
      right: 'md:justify-end max-md:items-end',
      // Enters from the left; on a phone — written before the page, so above it — from the top.
      left: 'md:justify-start max-md:items-start',
    },
  },
  defaultVariants: {
    side: 'right',
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
  },
  defaultVariants: {
    floating: false,
    docked: false,
  },
})

export const panelBody = tv({
  // Dialog's Body, with ContentBlock's Content padding. `first:pt-4` puts the
  // 16 back for a panel with no Header — derived from position, not a prop.
  base: 'min-h-0 flex-1 overflow-y-auto px-4 pt-0 pb-4 first:pt-4',
})

type PanelVariants = VariantProps<typeof panel>
export type PanelSide = NonNullable<PanelVariants['side']>
