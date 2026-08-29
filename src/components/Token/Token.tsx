import { useId, type ComponentPropsWithRef, type MouseEventHandler, type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { X } from 'lucide-react'

import { cn } from '../../lib/cn'
import { Avatar, type AvatarProps } from '../Avatar'
import { Icon } from '../Icon'
import { TokenContext, useToken } from './context'
import {
  token,
  tokenLabel,
  tokenOverlay,
  tokenRemove,
  TOKEN_AVATAR_SIZE,
  type TokenRadius,
  type TokenSize,
} from './styles'

interface TokenBaseProps
  extends Omit<ComponentPropsWithRef<'span'>, 'children' | 'color' | 'onClick'> {
  /** The label. Truncates with an ellipsis rather than widening its container. */
  children?: ReactNode
  /** Token size. Maps to the Figma `Size` property: Default 24 · Small 20. */
  size?: TokenSize
  /**
   * Corner radius: `md` (8px) standing on its own, `sm` (6px) nested inside a
   * field. `Combobox` passes `sm` for its chips, because concentric corners of
   * the same radius do not read as parallel — see `styles.ts`. Nothing else
   * should need it.
   */
  radius?: TokenRadius
  /**
   * Lucide icon before the label — Figma's Icon slot. Pass the component itself:
   * `startIcon={Tag}`, not `<Tag />`. Rendered at 12px at both sizes, as Figma
   * has it.
   */
  startIcon?: LucideIcon
  /**
   * Figma's Avatar slot. Put a `<Token.Avatar>` in it, which takes its size from
   * the token: `avatar={<Token.Avatar name="Sarah Chen" />}`.
   */
  avatar?: ReactNode
  /** Figma's "End Slot Items" — a count Badge, a status dot, anything trailing. */
  endSlot?: ReactNode
  /**
   * Removes the token. Its presence is what renders the `x` button, and what
   * makes the token Figma's `Usage=Interactive` — there is no `usage` prop.
   */
  onRemove?: MouseEventHandler<HTMLButtonElement>
  /**
   * What the remove button is called out loud. Defaults to `Remove <label>` when
   * the label is a plain string, and to `Remove` when it is not — pass something
   * specific in that case, because "Remove" on its own tells a screen reader
   * nothing about which token it removes.
   */
  removeLabel?: string
  /**
   * Figma's `Usage=Interactive`, which is otherwise **derived** from having an
   * `onRemove`, an `onClick` or an `href` — and stays derived for every ordinary
   * caller. This is the escape hatch for a token whose interactive control is
   * not one of Token's own props: a `Combobox` chip drives its remove button
   * through `Combobox.ChipRemove`, handed in via `endSlot`, so the derivation
   * cannot see it. It can only turn the hover on; a token with a real handler is
   * interactive whatever this says.
   */
  interactive?: boolean
  /** Figma's `State=Disabled`. Fades the token and stops both inner buttons. */
  disabled?: boolean
  /** Extra classes for the outermost element — the pill. */
  className?: string
}

interface TokenLinkProps {
  /** Makes the whole token a link. */
  href: string
  target?: string
  rel?: string
  onClick?: MouseEventHandler<HTMLElement>
}

interface TokenButtonProps {
  /** Makes the whole token clickable — a filter you can toggle, a detail to open. */
  onClick: MouseEventHandler<HTMLElement>
  href?: never
  target?: never
  rel?: never
}

export type TokenProps = TokenBaseProps &
  (
    | { href?: never; onClick?: never; target?: never; rel?: never }
    | TokenLinkProps
    | TokenButtonProps
  )

/**
 * The `x` that removes a token.
 *
 * Exported as `Token.Remove` so that a Combobox can hand its own behaviour to
 * the same button — `<Combobox.ChipRemove render={<Token.Remove />} />` — rather
 * than the styling being locked inside Token's `onRemove`. Base UI ships
 * `Combobox.Chips` / `Chip` / `ChipRemove` and no chip of its own to look at,
 * which is why Token is the thing being drawn here and Base UI is the thing that
 * will drive it.
 */
function TokenRemove({ className, ...props }: ComponentPropsWithRef<'button'>) {
  // Read rather than passed: this is rendered by `Combobox.ChipRemove` as often
  // as by `Token` itself, and its corners have to sit on the pill's either way.
  const context = useToken()

  return (
    <button
      type="button"
      className={cn(tokenRemove({ radius: context?.radius ?? 'md' }), className)}
      {...props}
    >
      <Icon icon={X} size="small" />
    </button>
  )
}

TokenRemove.displayName = 'Token.Remove'

/**
 * An Avatar sized by the token it sits in — 16px at the default size, 12px at
 * small.
 *
 * Those two sizes exist nowhere else: Avatar's scale starts at 20, and the Figma
 * Avatar set has no 16 or 12 either — the avatars drawn inside a Token are
 * resized instances. So Avatar gained a numeric `size` escape hatch instead of
 * two variants nothing else would use, and this reads the number off context so
 * a call site never writes it.
 */
function TokenAvatar(props: Omit<AvatarProps, 'size'>) {
  const context = useToken()
  const size = TOKEN_AVATAR_SIZE[context?.size ?? 'default']

  return <Avatar size={size} {...(props as AvatarProps)} />
}

TokenAvatar.displayName = 'Token.Avatar'

/**
 * Token — one discrete piece of data as a small pill: a tag, an active filter, a
 * chosen recipient.
 *
 * Mirrors the Figma component set "Token" (Yet Another Design System, node
 * 40004003:3431): `Usage` (View Only | Interactive) × `State` × `Size`.
 *
 *     <Token onRemove={() => drop(id)}>Design</Token>
 *     <Token size="small" startIcon={Tag}>Featured</Token>
 *     <Token avatar={<Token.Avatar name="Sarah Chen" />}>Sarah Chen</Token>
 *
 * **Not a Badge.** The two draw a similar pill and the line between them is what
 * the thing *is*: a Badge is a status you read, in one of 18 Decorative hues,
 * with no states at all; a Token is a value someone chose, in the card color,
 * that they can usually take back. If it is colored and static it is a Badge.
 *
 * **Figma's `Usage` axis is not a prop.** A token is interactive because it has
 * an `onRemove`, an `onClick` or an `href` — the same derivation Avatar uses for
 * `Content` and Button for its icon-only form. `State` is not a prop either:
 * hover and focus are CSS states, and only `disabled` needs telling, because a
 * `<span>` has no attribute to read it off.
 *
 * **A clickable token is a span with an invisible button stretched across it**,
 * not a `<button>`, because a removable token would then nest one button in
 * another. Astryx hits the same wall and answers it the same way. The overlay
 * takes its accessible name from the label through `aria-labelledby`, so the
 * label stays a `ReactNode` rather than becoming a required string.
 *
 * **The one thing to hold on to when this changes: 20 and 24.** The heights are
 * what let a Combobox show tokens inside a field without the field growing —
 * the arithmetic is written out on `token` in `styles.ts`.
 */
export function Token({
  children,
  size = 'default',
  radius = 'md',
  startIcon,
  avatar,
  endSlot,
  onRemove,
  removeLabel,
  interactive: interactiveProp = false,
  disabled = false,
  href,
  target,
  rel,
  onClick,
  className,
  ...props
}: TokenProps) {
  const labelId = useId()
  const clickable = Boolean(href) || Boolean(onClick)
  const interactive = clickable || Boolean(onRemove) || interactiveProp

  // "Remove Design" rather than a bare "Remove", when the label is something we
  // can read. Astryx names its own remove button the same way.
  const spokenRemoveLabel =
    removeLabel ?? (typeof children === 'string' ? `Remove ${children}` : 'Remove')

  return (
    <TokenContext.Provider value={{ size, radius }}>
      <span className={cn(token({ size, radius, interactive, disabled }), className)} {...props}>
        {clickable &&
          (href ? (
            <a
              href={href}
              target={target}
              rel={rel}
              onClick={onClick}
              aria-labelledby={labelId}
              className={tokenOverlay({ radius })}
            />
          ) : (
            <button
              type="button"
              onClick={onClick}
              disabled={disabled}
              aria-labelledby={labelId}
              className={tokenOverlay({ radius })}
            />
          ))}

        {avatar}
        {startIcon && <Icon icon={startIcon} size="small" />}

        <span id={labelId} className={tokenLabel()}>
          {children}
        </span>

        {endSlot}

        {onRemove && (
          <TokenRemove onClick={onRemove} disabled={disabled} aria-label={spokenRemoveLabel} />
        )}
      </span>
    </TokenContext.Provider>
  )
}

Token.displayName = 'Token'
Token.Remove = TokenRemove
Token.Avatar = TokenAvatar
