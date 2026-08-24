import type { ComponentPropsWithRef, ReactNode, Ref } from 'react'
import { useRender } from '@base-ui/react/use-render'

import { cn } from '../../lib/cn'
import { clickableCard, type CardPadding, type ClickableCardEmphasis } from './styles'

/**
 * ClickableCard — a card that is itself the hit target.
 *
 * Mirrors the Figma component set `Clickable Card` (`40004251:16237`), whose
 * axes are `Emphasis` default | ghost × `State` default | hover | focus |
 * disabled. Figma's kanban composition (`40004220:13045`) is a column of these
 * inside a `ContentBlock`.
 *
 * **A separate component from `Card`, because the file draws two sets and the
 * axes do not overlap.** `accent` and `floating` exist only on the static card;
 * `ghost` only on this one. A single component would have to accept `accent`
 * together with `ghost`, which no variant in the file draws and no caller wants.
 *
 * **The element follows what you pass** — the library's rule about deriving a
 * variant from a value that already says it. `href` makes an `<a>`, everything
 * else a `<button>`, and `render` replaces either with a router link. That is
 * `useRender` from `@base-ui/react/use-render`, the same contract `Link`,
 * `Tooltip.Trigger` and `Menu.Trigger` already expose, so the library still has
 * one polymorphism idiom and no `asChild`. Thirteenth Base UI component, and
 * the second that is a hook rather than a component.
 *
 * **Nested interactive elements work.** A Button or Link inside the card
 * handles its own click and stops it there — a product card that navigates with
 * an "Add to cart" button in it is fine, and the `NestedInteractive` story shows
 * it. What is *not* fine is nesting one hit target inside another: an `<a>`
 * inside a `<button>` is invalid HTML and axe will say so.
 */
export interface ClickableCardProps
  extends Omit<ComponentPropsWithRef<'button'>, 'type' | 'disabled'> {
  /** Whatever the card is about. Stacked, with 8px between children. */
  children: ReactNode
  /**
   * Which surface the card draws. `ghost` has no visible edge — the list row,
   * for a mail list or a nav. It disappears on a `surface-card-primary` parent
   * and is a white block on the canvas, so check what is behind it.
   */
  emphasis?: ClickableCardEmphasis
  /**
   * Inner padding. `default` is Figma's 12px. Use `none` for content that has to
   * reach the border.
   */
  padding?: CardPadding
  /** Makes the card an `<a>`. Without it, it is a `<button type="button">`. */
  href?: string
  /**
   * Renders the card at 40% opacity, out of the tab order, and inert.
   */
  disabled?: boolean
  /**
   * Marks this as the one currently being viewed — the open message in a mail
   * list, the active item in a nav. Sets `aria-current`.
   *
   * Deliberately **not** `aria-pressed`: this is a navigation state, not a
   * toggle. A card you switch on and off is a different component (Astryx calls
   * it `SelectableCard`), and nothing in the file asks for one yet.
   */
  selected?: boolean
  /**
   * Replaces the element with your own — a router link, usually:
   * `render={<NextLink href="/mail/1" />}`. Base UI's `render` contract.
   */
  render?: useRender.RenderProp
}

export function ClickableCard({
  children,
  emphasis = 'default',
  padding = 'default',
  href,
  disabled = false,
  selected = false,
  render,
  className,
  ref,
  ...props
}: ClickableCardProps) {
  const isLink = href !== undefined

  return useRender({
    render,
    ref: ref as Ref<HTMLElement>,
    /*
      A disabled link is not a link. `<a>` has no disabled attribute and
      `pointer-events-none` alone would leave it in the tab order, so a disabled
      link becomes a `<span>`, which cannot be tabbed to or followed. Link's
      answer, and Breadcrumbs' before it. A disabled button keeps its element and
      takes the native attribute.
    */
    defaultTagName: isLink ? (disabled ? 'span' : 'a') : 'button',
    props: {
      ...props,
      className: cn(clickableCard({ emphasis, padding, selected, disabled }), className),
      href: disabled ? undefined : href,
      // Not `submit`, which is what a bare <button> inside a form defaults to.
      type: isLink ? undefined : 'button',
      disabled: isLink ? undefined : disabled || undefined,
      /*
        On the <span> path there is no native attribute to carry it, and this is
        not decoration: `opacity-40` puts the text below 4.5:1, and axe only
        exempts an inactive component by walking up from the text looking for a
        disabled control or `aria-disabled`. Link's finding, Slider's before it.
      */
      'aria-disabled': isLink && disabled ? true : undefined,
      // `true` rather than `page`: the card is an item in a list, not the
      // navigation entry for the page you are on.
      'aria-current': selected ? true : undefined,
      children,
    },
  })
}

ClickableCard.displayName = 'ClickableCard'
