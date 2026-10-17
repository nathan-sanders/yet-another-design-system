import nathan from '../assets/nathan.png'
import type { Person } from './types'

export const people: Person[] = [
  { id: 'nathan', name: 'Nathan Sanders', avatar: nathan },
  { id: 'katie', name: 'Katie Powell' },
  { id: 'dana', name: 'Dana Okafor' },
]

export const me = people[0]!

export function personFor(id: string): Person {
  return people.find((p) => p.id === id)!
}
