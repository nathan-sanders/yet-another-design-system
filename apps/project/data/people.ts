import nathan from '../assets/nathan.png'
import dana from '../assets/people/dana.jpg'
import katie from '../assets/people/katie.jpg'
import marcus from '../assets/people/marcus.jpg'
import maya from '../assets/people/maya.jpg'
import priya from '../assets/people/priya.jpg'
import sofia from '../assets/people/sofia.jpg'
import theo from '../assets/people/theo.jpg'

/**
 * Veggie Vault's cross-functional team, as every Yet Project frame has it.
 * The faces are the file's own images: Dana, Sofia and Maya reuse photos Yet
 * Social already carries (under other names there), matched by Figma's image
 * hash, which is the file's SHA-1.
 */
export interface Person {
  id: string
  name: string
  /** What they own, for a line under the name. */
  role: string
  avatar: string
}

export const people: Person[] = [
  { id: 'nathan', name: 'Nathan Sanders', role: 'Founder', avatar: nathan },
  { id: 'dana', name: 'Dana Okafor', role: 'Operations', avatar: dana },
  { id: 'marcus', name: 'Marcus Bell', role: 'Construction', avatar: marcus },
  { id: 'sofia', name: 'Sofia Reyes', role: 'People', avatar: sofia },
  { id: 'priya', name: 'Priya Raman', role: 'Culinary', avatar: priya },
  { id: 'katie', name: 'Katie Powell', role: 'Marketing', avatar: katie },
  { id: 'maya', name: 'Maya Okafor', role: 'Brand', avatar: maya },
  { id: 'theo', name: 'Theo Lindqvist', role: 'Product', avatar: theo },
]

export const me = people[0]

export function personFor(id: string): Person {
  const person = people.find((p) => p.id === id)
  if (!person) throw new Error(`No person "${id}"`)
  return person
}
