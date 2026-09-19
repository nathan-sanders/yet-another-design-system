import { tv } from 'tailwind-variants'

/**
 * The header row, which `ContentBlock`, `Panel` and `Drawer` share — one
 * recipe, so a panel's title row cannot drift a pixel from a block's. Moved
 * out of `ContentBlock.tsx` when the other two arrived; nothing here changed.
 */
export const header = tv({
  base: [
    'flex items-center gap-2',
    // min-h-12 = height/h-12 (48px), px-4 = spacing/4, py-2 = spacing/2.
    // Symmetric left and right, so the title and the right edge sit the same 16
    // off the block's border whether or not there are actions. Figma drew 8 on
    // the right until this landed, betting there is always a button in the
    // actions slot: a 32px ghost Button carries its own 12px, which lands the
    // glyph at 16 and the box at 8. The bet fails on a header with no actions,
    // which is why both sides are 16 now. The cost is an icon-only action
    // reading optically inset, at 16 + the Button's 12.
    'px-4',
    // A min-height rather than a height: a title that wraps grows the row
    // instead of spilling out of it. Accordion's trigger makes the same call.
  ],
  variants: {
    /**
     * How tall the row is. `block` is ContentBlock's 48 on 8 of padding.
     * `bar` is Panel's and Drawer's 56 on 12 — the TopBar's height, so a
     * panel's title row lines up with the bar beside it (Nathan's call,
     * 2026-09-19). Either way the 32px a default Button needs is there.
     */
    height: {
      block: 'min-h-12 py-2',
      bar: 'min-h-14 py-3',
    },
  },
  defaultVariants: {
    height: 'block',
  },
})

export const title = tv({
  base: 'min-w-0 font-semibold [word-break:break-word]',
  variants: {
    emphasis: {
      /** Figma's Content/Emphasized — the title outranks the body text. */
      default: 'text-content-emphasized',
      subtle: 'text-content-emphasized',
      /**
       * On the anchor cell there is no second color to promote to: the root
       * already carries Content/Inverse, and Content/Emphasized on that
       * background is unreadable. Weight does the work instead.
       */
      accent: 'text-current',
    },
  },
  defaultVariants: {
    emphasis: 'default',
  },
})

/**
 * The tag names the three headers pick from. An explicit map rather than a
 * computed tag, so TypeScript can see the whole set — `` `h${level}` `` widens
 * to `string`, which is not a JSX tag.
 */
export const HEADING: Record<2 | 3 | 4 | 5 | 6, 'h2' | 'h3' | 'h4' | 'h5' | 'h6'> = {
  2: 'h2',
  3: 'h3',
  4: 'h4',
  5: 'h5',
  6: 'h6',
}
