import { me } from '../data/people'

/** "Good morning, Nathan", by the clock. Yak's start screen and Home both open on it. */
export function greeting(): string {
  const hour = new Date().getHours()
  const part = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening'
  return `Good ${part}, ${me.name.split(' ')[0]}`
}
