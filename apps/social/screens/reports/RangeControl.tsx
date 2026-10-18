import { CalendarDays } from 'lucide-react'

import { SegmentedControl } from '../../../../src/components/SegmentedControl'
import { RANGES, type ReportRange } from '../../data/reports'
import { useShell } from '../../shell/ShellContext'

/**
 * The board's date presets (`40005911:34608`): Custom, then Today through 12M.
 * Custom would open a date picker, which this mock does not have, so picking
 * it says so and leaves the range where it was.
 */
export function RangeControl({
  value,
  onChange,
}: {
  value: ReportRange
  onChange: (range: ReportRange) => void
}) {
  const shell = useShell()
  return (
    <SegmentedControl
      aria-label="Date range"
      value={value}
      onValueChange={(next) => {
        if (next === 'custom') shell.notBuilt('A custom date range')
        else onChange(next as ReportRange)
      }}
    >
      <SegmentedControl.Item value="custom" startIcon={CalendarDays}>
        Custom
      </SegmentedControl.Item>
      {RANGES.map((range) => (
        <SegmentedControl.Item key={range.value} value={range.value}>
          {range.label}
        </SegmentedControl.Item>
      ))}
    </SegmentedControl>
  )
}
