import type { NoteColor } from '../data/types'

/**
 * What a campaign draws its color with: the swatch in the Campaign column
 * (fill plus a 1px INSIDE stroke in the hue's highlight, so an `inset-ring`)
 * and the timeline bar (fill and text). Written out in full because Tailwind
 * only generates class names it can read in the source; kept out of the
 * component files so they export only components, which fast refresh needs.
 */
export const CAMPAIGN_COLOR_CLASSES: Record<NoteColor, { swatch: string; bar: string }> = {
  neutral: {
    swatch: 'bg-decorative-neutral-background inset-ring-decorative-neutral-highlight',
    bar: 'bg-decorative-neutral-background text-decorative-neutral-foreground',
  },
  green: {
    swatch: 'bg-decorative-green-background inset-ring-decorative-green-highlight',
    bar: 'bg-decorative-green-background text-decorative-green-foreground',
  },
  blue: {
    swatch: 'bg-decorative-blue-background inset-ring-decorative-blue-highlight',
    bar: 'bg-decorative-blue-background text-decorative-blue-foreground',
  },
  purple: {
    swatch: 'bg-decorative-purple-background inset-ring-decorative-purple-highlight',
    bar: 'bg-decorative-purple-background text-decorative-purple-foreground',
  },
  yellow: {
    swatch: 'bg-decorative-yellow-background inset-ring-decorative-yellow-highlight',
    bar: 'bg-decorative-yellow-background text-decorative-yellow-foreground',
  },
  orange: {
    swatch: 'bg-decorative-orange-background inset-ring-decorative-orange-highlight',
    bar: 'bg-decorative-orange-background text-decorative-orange-foreground',
  },
  red: {
    swatch: 'bg-decorative-red-background inset-ring-decorative-red-highlight',
    bar: 'bg-decorative-red-background text-decorative-red-foreground',
  },
  pink: {
    swatch: 'bg-decorative-pink-background inset-ring-decorative-pink-highlight',
    bar: 'bg-decorative-pink-background text-decorative-pink-foreground',
  },
  fuchsia: {
    swatch: 'bg-decorative-fuchsia-background inset-ring-decorative-fuchsia-highlight',
    bar: 'bg-decorative-fuchsia-background text-decorative-fuchsia-foreground',
  },
  cyan: {
    swatch: 'bg-decorative-cyan-background inset-ring-decorative-cyan-highlight',
    bar: 'bg-decorative-cyan-background text-decorative-cyan-foreground',
  },
}
