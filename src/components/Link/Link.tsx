import type { ComponentPropsWithRef, ReactNode, Ref } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { useRender } from '@base-ui/react/use-render'
import { tv, type VariantProps } from 'tailwind-variants'

import { cn } from '../../lib/cn'
import { focusRing } from '../../lib/focus'
import { Icon, type IconProps } from '../Icon'

/**
 * Link — a styled anchor for inline and standalone text navigation.
 *
 * Mirrors the Figma component set "Link" (node 40004146:6709): `State` default |
 * hover | focus | disabled × `External Link` true | false, documented at node
 * 40004155:13015.
 *
 * This is the component Button has owed the library since its `link` appearance
 * was deleted. That entry's reasoning is still the spec for this one: a link
 * navigates and belongs in an `<a>`, so it keeps middle-click, ⌘-click and "open
 * in new tab" and announces as "link"; and it has to be able to sit inside a
 * sentence, which a fixed-height `inline-flex` button never could. The
 * `action-link-*` tokens were held in the theme for this and now have a
 * consumer.
 *
 * **It is `inline`, not `inline-flex`, and that is the whole point.** Figma
 * draws the label and the external-link arrow in an auto-layout row with a 2px
 * gap, because a canvas has no other way to put two things beside each other.
 * Porting that as `inline-flex gap-0.5` would reintroduce the exact defect that
 * disqualified the Button appearance: an inline-flex box cannot break across
 * lines, so a link in the middle of a paragraph would refuse to wrap and push
 * the line past its container. The anchor stays `inline` and the 2px becomes
 * `ms-0.5` on the arrow. Same class of translation as Tooltip's `nowrap` text
 * layer.
 *
 * **Type is inherited, not imposed.** With no `size`, the recipe emits no
 * `text-*` class at all, so a link takes the font-size *and* line-height of the
 * sentence around it — which is what makes it correct in body copy at any of the
 * thirteen steps of the scale. Passing `size` pins it to one, and that is what a
 * standalone link does: Figma draws this component at `text-base`, so a footer
 * or nav link wants `size="base"`. Astryx spells the same idea as a `size` prop
 * plus an `isStandalone` boolean; one prop covers both.
 *
 * Font *weight* inherits for the same reason and is deliberately not set, even
 * though Figma binds `font-weight/normal`: the canvas component is standalone in
 * body copy where 400 is what it would inherit anyway, and a link inside a bold
 * heading that silently dropped to 400 would be a bug. `font-sans` *is* set, as
 * every component sets it — the family is a library-wide constant, not
 * typographic context.
 *
 * **The underline is on an inner span, not on the anchor.** Figma underlines the
 * label and not the arrow. A `text-decoration` on the anchor cannot be turned off
 * for a descendant — it propagates, and the line is painted straight across an
 * inline-block child's box — so the only way to end the rule where the label ends
 * is to start it there. It is underlined in every state, including hover: Figma's
 * hover changes colour and nothing else. (Astryx defaults to underline-on-hover
 * behind a `hasUnderline` prop; this follows the file.)
 *
 * Breadcrumbs also renders `<a>` and deliberately looks nothing like this — it is
 * `content-subtle` with `hover:underline`, because a trail is navigation chrome
 * sitting above the page rather than a link inside body copy. Its own doc block
 * says so. This is the component that uses the blue.
 *
 * Figma models hover, focus and disabled as a `State` property. In code hover and
 * focus are real CSS states, so there is no `state` prop.
 *
 * Left out: `visited` (no token in the theme, no state in the file); Astryx's
 * `hasUnderline`, `isStandalone` and `tooltip` — the last because Avatar already
 * settled that question, and a link that needs a tooltip is wrapped in one:
 * `<Tooltip label="…"><Link href="…">Settings</Link></Tooltip>` works unchanged,
 * since Tooltip hands `children` to Base UI's `render` and this spreads its props
 * and takes a ref. And Astryx's `label`: `aria-label` arrives through the spread,
 * and on a text link you should not use it — it replaces the visible text for a
 * screen reader, which is the one thing a link's own words are already good at.
 */
const link = tv({
  base: [
    'cursor-pointer rounded-md font-sans',
    'text-action-link-foreground hover:text-action-link-foreground-hover',
    // Motion tier, as everything built since Switch: 130ms on the standard curve.
    'transition-colors duration-fast-min ease-standard',
    // Focus is the library's shared ring — see src/lib/focus.ts. It is pure
    // box-shadow, so a focused link is exactly the size of an unfocused one and
    // the sentence it sits in does not reflow. The ring follows border-radius,
    // which is why the `rounded-md` above is not decorative: Figma binds
    // border-radius/rounded-md on the focus state for the same reason.
    ...focusRing,
  ],

  variants: {
    /**
     * The type scale, all thirteen steps. Undefined on purpose by default — see
     * the note above; no class here means the link inherits its size.
     */
    size: {
      xs: 'text-xs',
      sm: 'text-sm',
      base: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl',
      '2xl': 'text-2xl',
      '3xl': 'text-3xl',
      '4xl': 'text-4xl',
      '5xl': 'text-5xl',
      '6xl': 'text-6xl',
      '7xl': 'text-7xl',
      '8xl': 'text-8xl',
      '9xl': 'text-9xl',
    },

    // Figma's Disabled state is a flat 40% opacity (opacity/opacity-40) with the
    // colour left alone.
    disabled: {
      true: 'cursor-default opacity-40',
    },
  },
})

type LinkVariants = VariantProps<typeof link>

export type LinkSize = NonNullable<LinkVariants['size']>

/**
 * Which Icon size the external-link arrow uses at each type step. An explicit
 * map, as Button's `ICON_SIZE` is, because the two scales are independent: Icon
 * is 12/16/20/24 and the type scale has thirteen steps. Figma draws a 12px arrow
 * against `text-base`, which is where the first row comes from.
 *
 * It stops growing at `x-large`. A link at `text-9xl` with a 24px arrow is a
 * strange thing to build, and the alternative — an off-scale icon size — would be
 * a second untokenised value in a library that is trying to keep Avatar's
 * `tracking-[-0.02em]` as its only one.
 */
const ARROW_SIZE: Record<LinkSize, IconProps['size']> = {
  xs: 'small', // 12px
  sm: 'small',
  base: 'small',
  lg: 'base', // 16px
  xl: 'base',
  '2xl': 'large', // 20px
  '3xl': 'large',
  '4xl': 'x-large', // 24px
  '5xl': 'x-large',
  '6xl': 'x-large',
  '7xl': 'x-large',
  '8xl': 'x-large',
  '9xl': 'x-large',
}

/** What an inherited-size link gets: Figma's 12px, its size against `text-base`. */
const DEFAULT_ARROW_SIZE: IconProps['size'] = 'small'

/** `rel` tokens that must be present on anything opening in a new tab. */
const EXTERNAL_REL = ['noopener', 'noreferrer']

export interface LinkProps extends Omit<ComponentPropsWithRef<'a'>, 'color'> {
  /**
   * The link text. Describe the destination — "Read the documentation", not
   * "click here".
   */
  children: ReactNode
  /** Where the link goes. */
  href?: string
  /**
   * Step of the type scale to pin the link to. Maps to Figma's `text-base`, which
   * is `size="base"`. Omit it inside body copy and the link inherits the
   * surrounding font-size and line-height.
   */
  size?: LinkSize
  /**
   * Opens the link in a new tab. Maps to the Figma `External Link` property:
   * adds the arrow glyph, and with it `target="_blank"`, `noopener noreferrer`
   * merged into any `rel` you pass, and hidden text announcing the new tab.
   */
  external?: boolean
  /**
   * The hidden text an `external` link announces. Override it to localise, or to
   * say something more specific.
   */
  newTabLabel?: string
  /**
   * Renders the link at 40% opacity, as a `<span>` with no `href`, so it is out
   * of the tab order and does not navigate.
   */
  disabled?: boolean
  /**
   * Replaces the `<a>` with your own element — a router link, usually:
   * `render={<NextLink href="/about" />}`. Base UI's `render` contract, the same
   * one `Tooltip.Trigger` and `Menu.Trigger` already take.
   */
  render?: useRender.RenderProp
}

export function Link({
  children,
  href,
  size,
  external,
  newTabLabel = '(opens in new tab)',
  disabled,
  render,
  className,
  target,
  rel,
  ref,
  ...props
}: LinkProps) {
  const arrowSize = size ? ARROW_SIZE[size] : DEFAULT_ARROW_SIZE

  // Merged rather than replaced, and de-duplicated, so a caller passing
  // rel="me" on an external link keeps it and still gets the safe tokens.
  const resolvedRel = external
    ? [...new Set([...(rel?.split(/\s+/).filter(Boolean) ?? []), ...EXTERNAL_REL])].join(' ')
    : rel

  const content = (
    <>
      {/*
        The underline lives here rather than on the anchor so that it stops where
        the label stops — see the note above. `decoration-from-font` and the two
        arbitrary properties are Figma's text style: the rule sits where Inter
        says it should, at the thickness Inter says, and does not break around
        descenders.
      */}
      <span className="underline decoration-from-font [text-decoration-skip-ink:none] [text-underline-position:from-font]">
        {children}
      </span>
      {external && (
        <>
          {/*
            `align-middle` centres the arrow on the text's x-height rather than on
            the line box. Figma centres it on the line box, which measures 1.18px
            higher at text-base — the difference is deliberate. Line-box centring
            is what auto-layout does, and it only agrees with the text while the
            line-height does; inside a paragraph with looser leading the arrow
            would drift up and away from the words. Centring on the type keeps it
            glued to them at every step of the scale.
          */}
          <Icon icon={ArrowUpRight} size={arrowSize} className="ms-0.5 align-middle" />
          <span className="sr-only">{newTabLabel}</span>
        </>
      )}
    </>
  )

  return useRender({
    render,
    ref: ref as Ref<HTMLElement>,
    // A disabled link is not a link. <a> has no disabled attribute, and
    // pointer-events-none alone would leave it in the tab order, so this is
    // Breadcrumbs' answer: a <span>, which cannot be tabbed to or followed.
    defaultTagName: disabled ? 'span' : 'a',
    props: {
      ...props,
      className: cn(link({ size, disabled }), className),
      href: disabled ? undefined : href,
      target: external ? '_blank' : target,
      rel: resolvedRel,
      // Not decoration. opacity-40 takes blue-700 below 4.5:1, and the story
      // suite runs axe as an error. WCAG 1.4.3 exempts inactive components and
      // axe implements that by walking up from the text looking for a disabled
      // control or aria-disabled — the same reason Slider sets it on its root.
      'aria-disabled': disabled ? true : undefined,
      children: content,
    },
  })
}

Link.displayName = 'Link'
