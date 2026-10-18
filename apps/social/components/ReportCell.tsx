import { ChartNoAxesColumnIncreasing, LayoutDashboard, Radar, type LucideIcon } from 'lucide-react'

import { Badge, type BadgeProps } from '../../../src/components/Badge'
import { focusRing } from '../../../src/lib/focus'
import { cn } from '../../../src/lib/cn'
import type { Report, ReportKind } from '../data/types'

const KIND: Record<ReportKind, { icon: LucideIcon; color: BadgeProps['color']; label: string }> = {
  topic: { icon: Radar, color: 'pink', label: 'Topic monitor' },
  custom: { icon: LayoutDashboard, color: 'blue', label: 'Custom report' },
  builtin: { icon: ChartNoAxesColumnIncreasing, color: 'green', label: 'Built-in report' },
}

/**
 * A report's row label on Measure › Reports: its kind as a colored glyph, and
 * its name. Figma's `_Measure Report Cell` (`40005882:26324`).
 *
 * The name is a link, not a row click: a table row is not a control, and a
 * link opens in a new tab and reads as one. It is a plain anchor in the
 * cell's own text color rather than `Link`, which is the blue, underlined
 * link for prose — the file draws a name here, not a link in a sentence
 * (FINDINGS 38). The badge carries the kind as words only a screen reader
 * hears, so the glyph is not the only cue.
 */
export function ReportCell({ report, href }: { report: Report; href: string }) {
  const kind = KIND[report.kind]
  return (
    <span className="flex min-w-0 items-center gap-2">
      <Badge color={kind.color} startIcon={kind.icon}>
        <span className="sr-only">{kind.label}</span>
      </Badge>
      <a href={href} className={cn('truncate rounded-xs hover:underline', focusRing)}>
        {report.name}
      </a>
    </span>
  )
}
