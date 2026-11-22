import type { EmailCadence } from './reportsState'

/** Email this report's Send on options: each weekday, morning or afternoon. */
const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
export const SEND_ON = WEEKDAYS.flatMap((d, i) => [
  { value: `${d}-8`, label: `${d[0].toUpperCase()}${d.slice(1)}, 8:00 am`, weekday: i + 1 },
  { value: `${d}-16`, label: `${d[0].toUpperCase()}${d.slice(1)}, 4:00 pm`, weekday: i + 1 },
])

/** How often, as the SegmentedControl and the button say it. */
export const CADENCE: Record<EmailCadence, string> = {
  weekly: 'Weekly',
  biweekly: 'Every 2 weeks',
  monthly: 'Monthly',
}
