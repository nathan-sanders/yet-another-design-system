import { monthDay, sameDay } from '../data/dates'
import type { CalendarNote, NoteColor } from '../data/types'
import { dayDate } from '../screens/calendar/model'

// What `CalendarNote` draws each color with, and the helpers the note and the
// note dialog share. Kept out of the component file so it exports only
// components, which is what fast refresh needs.

/**
 * Per color: the fill and text, the 1px edge hover and focus draw in the hue's
 * highlight, and the fold's flap. Written out in full because Tailwind only
 * generates class names it can read in the source.
 *
 * Figma's edge is an INSIDE stroke, so it is an `inset-ring` here — a border
 * would make the 24px pill 26 on hover.
 */
export const NOTE_COLOR_CLASSES: Record<NoteColor, { text: string; fill: string; flap: string }> = {
  neutral: {
    text: 'text-decorative-neutral-foreground',
    fill: 'bg-decorative-neutral-background inset-ring-decorative-neutral-highlight',
    flap: 'bg-decorative-neutral-foreground/30',
  },
  green: {
    text: 'text-decorative-green-foreground',
    fill: 'bg-decorative-green-background inset-ring-decorative-green-highlight',
    flap: 'bg-decorative-green-foreground/30',
  },
  blue: {
    text: 'text-decorative-blue-foreground',
    fill: 'bg-decorative-blue-background inset-ring-decorative-blue-highlight',
    flap: 'bg-decorative-blue-foreground/30',
  },
  purple: {
    text: 'text-decorative-purple-foreground',
    fill: 'bg-decorative-purple-background inset-ring-decorative-purple-highlight',
    flap: 'bg-decorative-purple-foreground/30',
  },
  yellow: {
    text: 'text-decorative-yellow-foreground',
    fill: 'bg-decorative-yellow-background inset-ring-decorative-yellow-highlight',
    flap: 'bg-decorative-yellow-foreground/30',
  },
  orange: {
    text: 'text-decorative-orange-foreground',
    fill: 'bg-decorative-orange-background inset-ring-decorative-orange-highlight',
    flap: 'bg-decorative-orange-foreground/30',
  },
  red: {
    text: 'text-decorative-red-foreground',
    fill: 'bg-decorative-red-background inset-ring-decorative-red-highlight',
    flap: 'bg-decorative-red-foreground/30',
  },
  pink: {
    text: 'text-decorative-pink-foreground',
    fill: 'bg-decorative-pink-background inset-ring-decorative-pink-highlight',
    flap: 'bg-decorative-pink-foreground/30',
  },
  fuchsia: {
    text: 'text-decorative-fuchsia-foreground',
    fill: 'bg-decorative-fuchsia-background inset-ring-decorative-fuchsia-highlight',
    flap: 'bg-decorative-fuchsia-foreground/30',
  },
  cyan: {
    text: 'text-decorative-cyan-foreground',
    fill: 'bg-decorative-cyan-background inset-ring-decorative-cyan-highlight',
    flap: 'bg-decorative-cyan-foreground/30',
  },
}

/** The swatch for a color, for the color picker: the note's own fill and edge. */
export function noteSwatch(color: NoteColor): string {
  return NOTE_COLOR_CLASSES[color].fill
}

/** The colors in Figma's order, with the names the file gives them. */
export const NOTE_COLORS: { value: NoteColor; label: string }[] = [
  { value: 'neutral', label: 'Neutral' },
  { value: 'green', label: 'Green' },
  { value: 'blue', label: 'Blue' },
  { value: 'purple', label: 'Purple' },
  { value: 'yellow', label: 'Yellow' },
  { value: 'orange', label: 'Orange' },
  { value: 'red', label: 'Red' },
  { value: 'pink', label: 'Pink' },
  { value: 'fuchsia', label: 'Magenta' },
  { value: 'cyan', label: 'Aqua' },
]

/** `Jun 3` or `Jun 3 – Jun 16`. */
export function noteRangeLabel(note: CalendarNote): string {
  const start = dayDate(note.start)
  const end = dayDate(note.end)
  return sameDay(start, end)
    ? monthDay.format(start)
    : `${monthDay.format(start)} – ${monthDay.format(end)}`
}
