import type { ComponentPropsWithRef, MouseEventHandler, ReactElement } from 'react'
import { Avatar as AvatarPrimitive } from '@base-ui/react/avatar'
import { User } from 'lucide-react'

import { cn } from '../../lib/cn'
import { Icon } from '../Icon'
import { useAvatarGroup } from './context'
import {
  avatar,
  avatarSurface,
  statusBar,
  statusDot,
  nearestAvatarSize,
  FALLBACK_GLYPH_SIZE,
  STATUS_LABEL,
  DEFAULT_AVATAR_SURFACE,
  type AvatarSize,
  type AvatarStatus,
  type AvatarSurface,
} from './styles'

interface AvatarBaseProps
  extends Omit<ComponentPropsWithRef<'span'>, 'children' | 'color' | 'onClick'> {
  /**
   * Box size. Maps to the Figma `Size` property. An AvatarGroup sets this for
   * its children.
   *
   * A **number of pixels** is accepted as an escape hatch, for a component that
   * has to draw an avatar at a size the scale does not have — Token's leading
   * avatar is 16px at its default size and 12px at small, neither of which is a
   * variant here or in the Figma Avatar set. The box takes the number; the type
   * scale, the fallback glyph, the status dot and the group ring snap to the
   * nearest named step, because those are tokenized and there is nothing
   * continuous to interpolate. Reach for a name unless something else owns the
   * box.
   */
  size?: AvatarSize | number
  /** Photo URL. Present and loading cleanly, this is Figma's `Content=Image`. */
  src?: string
  /** Alt text for the photo. Falls back to `name`. */
  alt?: string
  /** Who the avatar is. Supplies the initials and the accessible name. */
  name?: string
  /** Overrides the initials derived from `name` — for when the two letters need to differ. */
  initials?: string
  /** Number of hidden avatars, rendered as `+N`. Figma's `Content=Overflow`. */
  count?: number
  /** Corner dot. Maps to the Figma Avatar Status `Status` property. */
  status?: AvatarStatus
  /** What the dot is called out loud. Defaults to Online / Offline / Unavailable. */
  statusLabel?: string
  /**
   * Which surface the avatar is drawn on. An AvatarGroup sets this for its
   * children.
   *
   * Both rings here are a band of the background showing through — the group
   * ring between overlapping circles, and the status dot's ring against the
   * photo — and CSS cannot ask what is painted behind an element, so it has to
   * be told. Leave it alone on the page; set it to `card-primary` inside a Card
   * or a ContentBlock, which is where an avatar most often ends up.
   *
   * Only matters when there is a ring to color: an avatar with no `status`,
   * outside a group, draws none.
   */
  surface?: AvatarSurface
  /**
   * How long to wait before showing the fallback, in milliseconds. Passed to
   * Base UI. A small delay stops a fast photo from flashing initials first.
   */
  fallbackDelay?: number
}

interface AvatarLinkProps {
  /** Renders the avatar as an `<a>`. */
  href: string
  target?: string
  rel?: string
  onClick?: MouseEventHandler<HTMLElement>
}

interface AvatarButtonProps {
  /** Renders the avatar as a `<button type="button">`. */
  onClick: MouseEventHandler<HTMLElement>
  href?: never
  target?: never
  rel?: never
}

/**
 * An interactive avatar has no visible text of its own, so it needs a name from
 * somewhere. Requiring `name` or `alt` in the type means an unlabeled link or
 * button will not compile — the same guard Button puts on its icon-only form.
 */
type AvatarAccessibleName = { name: string; alt?: string } | { alt: string; name?: string }

export type AvatarProps = AvatarBaseProps &
  (
    | { href?: never; onClick?: never; target?: never; rel?: never }
    | ((AvatarLinkProps | AvatarButtonProps) & AvatarAccessibleName)
  )

/**
 * First and last initial, uppercased: "Nathan Sanders" → NS, "Ada" → A,
 * "Ada B. Lovelace" → AL. Returns undefined for a name with no letters in it,
 * so the person glyph takes over rather than an empty circle showing.
 */
function deriveInitials(name: string): string | undefined {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return undefined

  const first = words[0]!.charAt(0)
  const last = words.length > 1 ? words[words.length - 1]!.charAt(0) : ''
  const initials = `${first}${last}`.toUpperCase()

  return initials.trim() === '' ? undefined : initials
}

function StatusDot({
  status,
  size,
  surface,
}: {
  status: AvatarStatus
  size: AvatarSize
  surface: AvatarSurface
}) {
  return (
    // The dot is decorative here: its label is folded into the avatar's own
    // accessible name, which is how it reaches a screen reader without the
    // avatar announcing itself twice.
    <span className={statusDot({ status, size, surface })} aria-hidden="true" data-status={status}>
      {status === 'unavailable' && <span className={statusBar({ size, surface })} />}
    </span>
  )
}

StatusDot.displayName = 'Avatar.StatusDot'

/**
 * Avatar — a person or team, shown as a photo, their initials, or a count.
 *
 * Mirrors the Figma component set "Avatar" (node 40004102:5483) and the
 * "Avatar Status" set (node 40004102:5619). Figma's `Content` property —
 * Image | Initials | Overflow — is not a prop: the content follows from what you
 * pass, the same way Button derives its icon-only shape from the absence of a
 * label. `src` gives you the photo, `name` gives you initials, `count` gives you
 * the `+N` circle, and with none of them you get a person glyph.
 *
 * Behavior comes from **Base UI's `Avatar`** (Root / Image / Fallback), which
 * tracks the image's loading state and swaps in the fallback when it errors —
 * with an optional delay so a fast-loading photo never flashes initials first.
 * All the styling is ours, and it lives in `styles.ts` because the group's
 * overflow circle draws the same shape.
 *
 * **The trap worth knowing** is that Figma draws every ring here as an *outside*
 * stroke, so none of them may take up layout — see the note on `avatar` in
 * `styles.ts`. The status glyphs are shapes rather than icons (a filled circle,
 * a stroked circle, and a circle with a rectangle knocked out of it), so they
 * are drawn with tokens instead of committed as image assets.
 *
 * **Two things go past Figma.** Figma gives Avatar no Focus state, but `href` /
 * `onClick` make one interactive, so it takes the same focus ring as the rest of
 * the library. The person glyph for "no photo, no name" has no Figma variant
 * either; it is borrowed from the end of Astryx's fallback chain, because an
 * avatar with missing data otherwise renders as an empty circle and reads as a
 * bug. Both are gaps in the file rather than inventions, the way Badge's four
 * missing hues and Divider's `emphasis` were.
 */
export function Avatar({
  size,
  src,
  alt,
  name,
  initials,
  count,
  status,
  statusLabel,
  surface,
  fallbackDelay,
  href,
  target,
  rel,
  onClick,
  className,
  style,
  ...props
}: AvatarProps) {
  // A group sets the size for everything inside it, but an explicit size on the
  // avatar still wins — the group is a default, not a lock.
  const group = useAvatarGroup()
  const requestedSize = size ?? group?.size ?? 'base'
  const inGroup = group?.inGroup ?? false
  const resolvedSurface = surface ?? group?.surface ?? DEFAULT_AVATAR_SURFACE

  // A custom size draws its own box and borrows the rest of the scale from the
  // step it sits closest to — see `nearestAvatarSize`. Inline width/height beats
  // the `size-*` class on specificity, so no custom property is needed to get
  // past it.
  const customSize = typeof requestedSize === 'number' ? requestedSize : undefined
  const resolvedSize = customSize === undefined ? (requestedSize as AvatarSize) : nearestAvatarSize(customSize)

  const interactive = Boolean(href) || Boolean(onClick)

  // "Nathan Sanders, Online". Astryx composes the status into the name like
  // this so the dot does not need a label of its own.
  //
  // A count with no name of its own still gets one: "+3" is real information,
  // and an aria-hidden overflow circle tells a screen reader nothing about the
  // people it stands for.
  const spokenName = alt ?? name ?? (count != null ? `${count} more` : undefined)
  const spokenStatus = status ? (statusLabel ?? STATUS_LABEL[status]) : undefined
  const accessibleName = [spokenName, spokenStatus].filter(Boolean).join(', ') || undefined

  const classes = cn(
    avatar({ size: resolvedSize, interactive, inGroup, surface: resolvedSurface }),
    className,
  )

  // Figma's three Content values, in the order they take precedence.
  const derivedInitials = initials ?? (name ? deriveInitials(name) : undefined)
  const fallbackContent =
    count != null ? (
      `+${count}`
    ) : derivedInitials ? (
      derivedInitials
    ) : (
      <Icon icon={User} className={FALLBACK_GLYPH_SIZE[resolvedSize]} />
    )

  let render: ReactElement | undefined
  if (href) {
    render = <a href={href} target={target} rel={rel} />
  } else if (onClick) {
    render = <button type="button" />
  }

  return (
    <AvatarPrimitive.Root
      className={classes}
      style={customSize === undefined ? style : { width: customSize, height: customSize, ...style }}
      render={render}
      onClick={onClick}
      // A link or a button already has a role; only the static form needs one.
      role={!interactive && accessibleName ? 'img' : undefined}
      aria-label={accessibleName}
      // Nothing to announce and nothing to click: the avatar is decoration
      // sitting beside text that already says who this is.
      aria-hidden={!interactive && !accessibleName ? true : undefined}
      {...props}
    >
      {src && (
        // rounded-full sits on the image rather than as overflow-hidden on the
        // root, exactly as Figma has it — clipping the root would cut the status
        // dot off where it hangs outside the circle.
        <AvatarPrimitive.Image
          src={src}
          alt={alt ?? name ?? ''}
          className="size-full rounded-full object-cover"
        />
      )}

      <AvatarPrimitive.Fallback delay={fallbackDelay} className={avatarSurface()}>
        {fallbackContent}
      </AvatarPrimitive.Fallback>

      {status && <StatusDot status={status} size={resolvedSize} surface={resolvedSurface} />}
    </AvatarPrimitive.Root>
  )
}

Avatar.displayName = 'Avatar'
