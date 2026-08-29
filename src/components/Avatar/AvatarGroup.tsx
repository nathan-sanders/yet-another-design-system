import { useMemo } from 'react'
import type { ComponentPropsWithRef, MouseEventHandler, ReactNode } from 'react'

import { cn } from '../../lib/cn'
import { AvatarGroupContext, useAvatarGroup } from './context'
import {
  avatar,
  avatarGroup,
  avatarSurface,
  DEFAULT_AVATAR_SURFACE,
  type AvatarSize,
  type AvatarSurface,
} from './styles'

/**
 * AvatarGroup — overlapping avatars for a set of people.
 *
 * Mirrors the Figma component "Avatar Group" (node 40004297:11406): a row of
 * avatars, each ringed in the canvas color so the circles read apart where they
 * overlap, ending in a `+N` count.
 *
 * The API is composed rather than an `items` array, and the group does **not**
 * count for you — you slice the list and pass the overflow yourself, as Astryx's
 * AvatarGroup does:
 *
 *     <AvatarGroup size="base">
 *       {people.slice(0, 4).map((p) => (
 *         <Avatar key={p.id} src={p.photo} name={p.name} />
 *       ))}
 *       <AvatarGroup.Overflow count={people.length - 4} />
 *     </AvatarGroup>
 *
 * `size` is set once here and travels to every child through context, so a group
 * never has to repeat itself. A child that sets its own `size` still wins.
 *
 * **The overlap and the ring width are two different numbers**, set per size
 * off Figma's Size axis — see the table on `avatarGroup` in `styles.ts`. The
 * ring is the band of background you see between two photos; the overlap is how
 * far the next circle sits into the previous one. They coincide at `base` and
 * that is all it is, a coincidence. The ring is an `outline` rather than a
 * `border` because Figma draws it as an outside stroke: it must not shrink the
 * photo or take up room in the row.
 *
 * **Which background is a prop, not a guess.** That band only disappears if it
 * is painted in the color behind the group, and CSS has no way to ask what
 * that is — so `surface` says. It defaults to `canvas`, which is right on the
 * page and wrong the moment the group moves into a Card or a ContentBlock:
 * there it wants `surface="card-primary"`, or the rings read as gray halos.
 */
export interface AvatarGroupProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
  /** `Avatar` elements, optionally ending in one `AvatarGroup.Overflow`. */
  children: ReactNode
  /** Size applied to every avatar in the group. A child's own `size` overrides it. */
  size?: AvatarSize
  /**
   * Which surface the group is drawn on, so the ring between overlapping
   * avatars disappears into it. A child's own `surface` overrides it.
   */
  surface?: AvatarSurface
}

export interface AvatarGroupOverflowProps
  extends Omit<ComponentPropsWithRef<'span'>, 'children' | 'onClick'> {
  /** How many avatars are hidden. Rendered as `+N`. */
  count: number
  /** Replaces the default `+N` text — for a capped count like `99+`. */
  children?: ReactNode
  /** Makes the count a `<button>`, for opening the full list. */
  onClick?: MouseEventHandler<HTMLElement>
  /** Overrides the size inherited from the group. */
  size?: AvatarSize
  /** Overrides the surface inherited from the group. */
  surface?: AvatarSurface
  /** What the count is called out loud. Defaults to "N more". */
  label?: string
}

/**
 * The trailing `+N` circle — Figma's `Content=Overflow` variant of Avatar.
 *
 * It is its own component rather than a prop on the group because the group does
 * not do the counting, and because the count is sometimes clickable and
 * sometimes not.
 */
function AvatarGroupOverflow({
  count,
  children,
  onClick,
  size,
  surface,
  label,
  className,
  ...props
}: AvatarGroupOverflowProps) {
  const group = useAvatarGroup()
  const resolvedSize = size ?? group?.size ?? 'base'
  const resolvedSurface = surface ?? group?.surface ?? DEFAULT_AVATAR_SURFACE
  const interactive = Boolean(onClick)
  const accessibleName = label ?? `${count} more`

  // Sizing and the group ring come from the same variants the avatars use, so
  // the count can never drift out of step with the circles beside it.
  const classes = cn(
    avatar({ size: resolvedSize, interactive, inGroup: true, surface: resolvedSurface }),
    className,
  )
  const content = <span className={avatarSurface()}>{children ?? `+${count}`}</span>

  if (interactive) {
    return (
      <button type="button" onClick={onClick} className={classes} aria-label={accessibleName}>
        {content}
      </button>
    )
  }

  return (
    <span className={classes} role="img" aria-label={accessibleName} {...props}>
      {content}
    </span>
  )
}

AvatarGroupOverflow.displayName = 'AvatarGroup.Overflow'

export function AvatarGroup({
  children,
  size = 'base',
  surface = DEFAULT_AVATAR_SURFACE,
  className,
  ...props
}: AvatarGroupProps) {
  // A fresh object every render would re-render every avatar in the group for
  // nothing, and a group can be long.
  const context = useMemo(() => ({ size, inGroup: true, surface }), [size, surface])

  return (
    <AvatarGroupContext.Provider value={context}>
      <div className={cn(avatarGroup({ size }), className)} {...props}>
        {children}
      </div>
    </AvatarGroupContext.Provider>
  )
}

AvatarGroup.Overflow = AvatarGroupOverflow
AvatarGroup.displayName = 'AvatarGroup'
