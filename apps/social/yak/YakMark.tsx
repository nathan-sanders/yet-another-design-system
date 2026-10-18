import { Mark } from '../../../src/components/Chat/story-mark'
import { cn } from '../../../src/lib/cn'

/**
 * Yak's scribble as an icon: the nav item, the full view's title, the
 * floating bar. Decorative — every place it sits already says "Yak" in text or
 * in a label — so it is hidden from the accessibility tree; `Mark` on its own
 * is `role="img"` named "Yet", which would rename the nav item "Yet Yak".
 *
 * Drawn at the Icon component's stroke: 1.5px at any size, held by
 * `non-scaling-stroke`, so at 16px it weighs what the lucide glyphs beside it
 * do instead of thinning to 1px (FINDINGS 58).
 */
export function YakMark({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn('inline-flex shrink-0', className)}>
      <Mark className="size-full [stroke-width:var(--icon-stroke-weight)] [&_*]:[vector-effect:non-scaling-stroke]" />
    </span>
  )
}
