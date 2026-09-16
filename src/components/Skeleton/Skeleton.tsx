import type { ComponentPropsWithRef } from 'react'
import { tv, type VariantProps } from 'tailwind-variants'

import { cn } from '../../lib/cn'

/**
 * Skeleton — a pulsing placeholder the shape of content that is still loading.
 *
 * Mirrors the Figma component set "Skeleton" (node 40005222:44292): its two
 * properties, `Appearance` (Default | Subtle) and `Inverse` (True | False), are
 * the two props here, and its four variants are the four combinations. Figma
 * draws each one as a `Content/Primary` fill (`Content/Inverse` when inverse)
 * with the *node's* opacity at 20 / 10% — 30 / 20% inverse — so the code paints
 * the same thing as a token with an opacity modifier: `bg-content-primary/20`.
 * Not `opacity-20` on the element, because the pulse animates `opacity` and the
 * two would fight.
 *
 * There is no Base UI primitive for a skeleton, so like Calendar this is a plain
 * element, and `aria-hidden` — a placeholder has nothing to say to a screen
 * reader. Announcing that something is loading is the *region's* job: put
 * `aria-busy` on the container and give it a visually hidden "Loading…" (see the
 * `InContext` story).
 *
 * Size and shape are the caller's, through `className`, as in shadcn:
 * `<Skeleton className="size-10 rounded-full" />` is an avatar, and the
 * `rounded-full` beats the recipe's `rounded-xs` because `cn` merges Tailwind
 * classes. Figma draws the component at 160×24 but has no size property, and
 * Astryx's `width` / `height` / `radius` props are left out for the same reason
 * Card's `padding` is not a Figma variant: a prop per dimension is a second
 * spelling of a utility class. Astryx's `index` stagger is left out too — the
 * pulse here is one shared breath, which reads as a single page loading rather
 * than a wave of separate ones.
 *
 * The pulse itself is the `skeleton-pulse` keyframe in `theme.css`: opacity 1 to
 * 0.5 and back, `duration-slow` (975ms) each way, so a full breath is 1950ms —
 * shadcn's 2s to within 2.5%, spelled as a token rather than a literal. Astryx's
 * stepped 0.4s flicker was the other candidate and was turned down for shadcn's
 * slower, smoother one. `motion-reduce:animate-none` is ProgressBar's idiom: the
 * global reduced-motion rule clamps every animation to 1ms and one iteration,
 * which would otherwise leave a placeholder frozen wherever that iteration ended.
 */
const skeleton = tv({
  base: 'animate-skeleton-pulse rounded-xs motion-reduce:animate-none',

  variants: {
    /**
     * The Figma `Appearance` property. `subtle` is half the ink of `default` —
     * for a placeholder that should sit further back, a table row's secondary
     * column, say, beside a `default` one for its primary.
     */
    appearance: {
      default: '',
      subtle: '',
    },
    /**
     * The Figma `Inverse` property: paint with `Content/Inverse` instead of
     * `Content/Primary`, for a skeleton on an emphasized surface. The inverse
     * pair sits 10 points higher because white on a dark fill needs more of
     * itself to read than dark on white does.
     */
    inverse: {
      true: '',
      false: '',
    },
  },

  compoundVariants: [
    { appearance: 'default', inverse: false, class: 'bg-content-primary/20' },
    { appearance: 'subtle', inverse: false, class: 'bg-content-primary/10' },
    { appearance: 'default', inverse: true, class: 'bg-content-inverse/30' },
    { appearance: 'subtle', inverse: true, class: 'bg-content-inverse/20' },
  ],

  defaultVariants: {
    appearance: 'default',
    inverse: false,
  },
})

type SkeletonVariants = VariantProps<typeof skeleton>

export type SkeletonAppearance = NonNullable<SkeletonVariants['appearance']>

export interface SkeletonProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
  /** Maps to the Figma `Appearance` property. `subtle` is half the ink. */
  appearance?: SkeletonAppearance
  /** Maps to the Figma `Inverse` property — for a skeleton on an emphasized surface. */
  inverse?: boolean
}

export function Skeleton({ appearance, inverse, className, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(skeleton({ appearance, inverse }), className)}
      {...props}
    />
  )
}

Skeleton.displayName = 'Skeleton'

/**
 * Skeleton.Text — a placeholder for one line of text, at one of the type scale's
 * sizes.
 *
 * Mirrors the Figma component set "Skeleton - Text" (node 40005222:44301): one
 * `Size` property, sm | base | lg | xl. Each variant is a box the height of that
 * size's **line-height** (20 / 24 / 28 / 32) with a `Skeleton` inside it the
 * height of the **font-size** (12 / 14 / 16 / 18) — which is why it exists as a
 * part rather than as a `className` on `Skeleton`. A bare `<Skeleton className="h-3.5" />`
 * is the right height for a line of `text-base` but the wrong height for the
 * *row* it stands in, and a stack of them lands 10px short of the paragraph it
 * is replacing. This one takes exactly the space the line will.
 *
 * `base` is the default because `text-base` is the body size (the file lists
 * `sm` first, and that order is the scale's, not a preference). The box and the
 * bar are both plain heights — `h-6` is `--text-base--line-height`, `h-3.5` is
 * `--text-base` — so a change to the type scale in Figma moves both.
 *
 * Only `Appearance=Default` is drawn in the file; `appearance` and `inverse` are
 * passed through anyway, because the four fills exist and a line on an
 * emphasized surface is not exotic.
 */
const skeletonText = tv({
  slots: {
    box: 'flex w-full flex-col justify-center',
    bar: 'w-full',
  },
  variants: {
    size: {
      sm: { box: 'h-5', bar: 'h-3' },
      base: { box: 'h-6', bar: 'h-3.5' },
      lg: { box: 'h-7', bar: 'h-4' },
      xl: { box: 'h-8', bar: 'h-4.5' },
    },
  },
  defaultVariants: {
    size: 'base',
  },
})

export type SkeletonTextSize = NonNullable<VariantProps<typeof skeletonText>['size']>

export interface SkeletonTextProps extends SkeletonProps {
  /** Maps to the Figma `Size` property: the text size this line stands in for. */
  size?: SkeletonTextSize
}

function SkeletonTextComponent({
  size,
  appearance,
  inverse,
  className,
  ...props
}: SkeletonTextProps) {
  const { box, bar } = skeletonText({ size })
  return (
    <div aria-hidden="true" className={cn(box(), className)} {...props}>
      <Skeleton appearance={appearance} inverse={inverse} className={bar()} />
    </div>
  )
}

SkeletonTextComponent.displayName = 'Skeleton.Text'

Skeleton.Text = SkeletonTextComponent
