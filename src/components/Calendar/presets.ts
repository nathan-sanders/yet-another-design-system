import { addDays, shiftMonths, startOfDay } from './month'
import type { DateRange } from './month'

/**
 * A shortcut in the presets rail: a label, and the range it stands for.
 *
 * `range` is a function rather than a value because "Last 7 days" means
 * something different tomorrow. Evaluated on click, so a picker left open
 * across midnight still resolves to the right week.
 */
export interface DatePreset {
  label: string
  range: () => DateRange
}

/**
 * The eight the file draws in `_Calendar Presets` (node 40004972:34989).
 *
 * Exported so a caller gets Figma's rail for free, and so anyone who needs a
 * ninth — fiscal quarters, a billing period — can build their own list instead
 * of forking the component. `DatePicker` falls back to these when `presets` is
 * left off in range mode.
 *
 * **The windows include today.** "Last 7 days" is today and the six before it,
 * seven days in total, rather than today plus a full seven. That is the
 * convention every analytics tool uses and the one a reader assumes; the
 * alternative is only defensible with the label spelled out differently.
 *
 * "All time" clears the range rather than reaching for a sentinel date. A
 * `[null, null]` says "no bound" honestly, where `new Date(0)` would put the
 * calendar on January 1970.
 */
export const DATE_RANGE_PRESETS: DatePreset[] = [
  { label: 'Today', range: () => [startOfDay(new Date()), startOfDay(new Date())] },
  {
    label: 'Yesterday',
    range: () => {
      const yesterday = addDays(new Date(), -1)
      return [yesterday, yesterday]
    },
  },
  { label: 'Last 7 days', range: () => [addDays(new Date(), -6), startOfDay(new Date())] },
  { label: 'Last 30 days', range: () => [addDays(new Date(), -29), startOfDay(new Date())] },
  { label: 'Last 3 months', range: () => [shiftMonths(new Date(), -3), startOfDay(new Date())] },
  { label: 'Last 6 months', range: () => [shiftMonths(new Date(), -6), startOfDay(new Date())] },
  { label: 'Last 12 months', range: () => [shiftMonths(new Date(), -12), startOfDay(new Date())] },
  { label: 'All time', range: () => [null, null] },
]
