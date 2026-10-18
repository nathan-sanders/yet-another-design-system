import nathan from '../assets/nathan.png'
import type { Person } from './types'

export const people: Person[] = [
  { id: 'nathan', name: 'Nathan Sanders', avatar: nathan, status: 'online' },
  { id: 'katie', name: 'Katie Powell', status: 'online' },
  { id: 'dana', name: 'Dana Okafor', status: 'offline' },
]

export const me = people[0]!

export function personFor(id: string): Person {
  return people.find((p) => p.id === id)!
}
