import { tv, type VariantProps } from 'tailwind-variants'

/**
 * The three recipes an `AppShell` is made of: the frame, the page, the content.
 *
 * Every color is a semantic token. The nav inside the frame paints from the
 * navigation tier on its own; the shell never reaches into it — the two tiers
 * meet at the 8px gap and nowhere else.
 */

/**
 * The app frame. Figma's outer "Side Navigation" / "Top Navigation" frames on
 * `↪ App Shell` (`40004484:26624`, `40004484:26784`): `Surface/Canvas`,
 * `spacing/2` padding and gap, a row for a rail and a column for a bar.
 */
export const appShell = tv({
  base: [
    // `h-dvh`: the shell is the viewport. The rail is `h-full` and the content
    // scrolls inside `AppShell.Content`, both of which need a definite height
    // to work against. `min-h-0` so nothing inside can grow it.
    'flex h-dvh min-h-0 w-full',
    'bg-surface-canvas font-sans text-base text-content-primary',
  ],
  variants: {
    /**
     * Only the page paints differently. The frame itself is the same canvas
     * either way — the axis lives here so `Page` and `Content` can read it
     * from one place through context.
     */
    mode: {
      floating: '',
      contained: '',
    },
    /** Which way the nav lies. A rail beside the page, or a bar above it. */
    navigation: {
      side: 'flex-row',
      top: 'flex-col',
    },
    /**
     * Figma's framed frames against its docked ones. `true` is `spacing/2`
     * around and between; `false` puts the nav at x=0 with the page hard
     * against it — the second pair of frames on the page.
     */
    frame: {
      true: 'gap-2 p-2',
      false: '',
    },
  },
  defaultVariants: {
    mode: 'floating',
    navigation: 'side',
    frame: true,
  },
})

/**
 * Figma's "Page": the column beside the rail that holds a `TopBar` and the
 * content. In `floating` it paints nothing — the TopBar's own `border-b` is
 * the only chrome, and the blocks sit straight on the canvas (Example 1,
 * `40005257:45477`). In `contained` it is the surface: `Surface/Background
 * Primary` inside `Surface/Border` at `rounded-lg` (Example 2, `40005257:47450`).
 */
export const appShellPage = tv({
  // `min-w-0 min-h-0`: a flex child will not shrink below its content without
  // them, and a wide chart or a long page would push the frame off-screen
  // instead of scrolling inside `Content`.
  base: 'flex min-h-0 min-w-0 flex-1 flex-col',
  variants: {
    mode: {
      floating: '',
      contained: [
        'rounded-lg border border-surface-border bg-surface-background-primary',
        // The scrolling `<main>` inside has square corners; without this its
        // content would poke through the rounded ones. `overflow-clip` rather
        // than `overflow-hidden` so it never becomes a scroll container itself.
        // No clip margin is needed here, unlike SideNav's group panel: the
        // TopBar is `p-3` and Content is `p-4`, so every focus ring inside has
        // at least 12px of room before it reaches this edge.
        'overflow-clip',
      ],
    },
  },
  defaultVariants: { mode: 'floating' },
})

/**
 * Figma's "Content Slot", rendered as `<main>`. It is the one scrolling
 * region of the shell, and it is `gap-4` (`spacing/4`) because that is what
 * both examples stack their title and grid with.
 */
export const appShellContent = tv({
  base: 'flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto',
  variants: {
    mode: {
      // Example 1 is `px-0 py-4`: the blocks line up with the TopBar's edges.
      // The `px-1 -mx-1` pair is SideNav's clip trick — `overflow-y-auto`
      // establishes a clip box, the focus ring paints 4px outside a block, and
      // a block flush with the edge would lose the outer half of its ring. The
      // padding pushes the clip box out by exactly that and the margin takes
      // the space back, so the layout does not move.
      floating: '-mx-1 px-1 py-4',
      // Example 2 is `spacing/4` all round: the content sits inside the
      // bordered surface rather than on the canvas.
      contained: 'p-4',
    },
  },
  defaultVariants: { mode: 'floating' },
})

type AppShellVariants = VariantProps<typeof appShell>
export type AppShellMode = NonNullable<AppShellVariants['mode']>
export type AppShellNavigation = NonNullable<AppShellVariants['navigation']>
