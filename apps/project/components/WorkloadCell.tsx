import { cn } from '../../../src/lib/cn'
import type { Load } from './load'

const LOAD: Record<Load, string> = {
  off: 'text-content-subtle',
  light: 'text-content-subtle',
  balanced: 'bg-surface-background-subtle text-content-primary',
  full: 'bg-decorative-neutral-background text-content-primary',
  over: 'bg-decorative-red-background text-decorative-red-foreground',
}

/**
 * `_Workload Cell` (`40006261:1681`): how booked someone is for a day, a week
 * or a month, as a mono number on a tinted box. Only overload is colored; the
 * rest step from bare text to a neutral fill as the load rises, so a full
 * grid reads at a glance without a legend.
 */
export function WorkloadCell({
  load,
  children,
  changed = false,
  className,
}: {
  load: Load
  children: string
  /** Changed by a pending rebalance: an emphasized 1px ring, as the preview draws it. */
  changed?: boolean
  className?: string
}) {
  return (
    <span
      className={cn(
        'flex items-center justify-center rounded-md font-mono text-sm',
        LOAD[load],
        changed && 'inset-ring inset-ring-surface-border-emphasized',
        className,
      )}
    >
      {children}
    </span>
  )
}
