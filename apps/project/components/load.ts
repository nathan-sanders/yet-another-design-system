/**
 * How booked a `_Workload Cell` (`40006261:1681`) is: its tint steps from
 * bare text to a neutral fill as the load rises, and only overload is
 * colored.
 */
export type Load = 'off' | 'light' | 'balanced' | 'full' | 'over'

/**
 * A share of capacity as the file colors it, on the Roadmap's Capacity rows
 * and Workload's By team view alike: under 85% light, to 100% balanced, to
 * 110% full, past that over.
 */
export function loadOfShare(percent: number): Load {
  if (percent > 110) return 'over'
  if (percent > 100) return 'full'
  if (percent >= 85) return 'balanced'
  return 'light'
}

/**
 * A day's hours, which the People view colors on its own scale (FINDINGS 70):
 * an 8-hour day is full, past it over, half a day or less light.
 */
export function loadOfDay(hours: number | null, dayCapacity = 8): Load {
  if (hours === null) return 'off'
  if (hours > dayCapacity) return 'over'
  if (hours === dayCapacity) return 'full'
  if (hours <= dayCapacity / 2) return 'light'
  return 'balanced'
}
