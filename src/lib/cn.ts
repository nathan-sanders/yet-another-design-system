import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'
import { defaultConfig } from 'tailwind-variants'

/**
 * The radius roles from Figma's Border Radius collection — section 2c of
 * `theme.css`. tailwind-merge only knows Tailwind's own scale, so without this
 * `rounded-input` and a caller's `rounded-none` are two unrelated classes, both
 * survive, and which one paints is down to stylesheet order. `tokens.test.ts`
 * holds this list to the generated file.
 */
export const RADIUS_ROLES = [
  'button',
  'input',
  'input-inner',
  'input-checkbox',
  'container-outer',
  'container-inner',
  'bubble',
  'bubble-tip',
]

const mergeConfig = { extend: { theme: { radius: RADIUS_ROLES } } }

const twMerge = extendTailwindMerge(mergeConfig)

// tailwind-variants carries its own merger, configured from this shared
// object. Mutated in place rather than replaced: every `tv()` already holds a
// reference to it, and it is read at merge time, not when the recipe is made.
Object.assign(defaultConfig.twMergeConfig ?? (defaultConfig.twMergeConfig = {}), mergeConfig)

/**
 * Joins class names and lets a later class win over an earlier one in the same
 * group — so `cn('px-3', 'px-4')` yields `px-4` rather than both. This is what
 * makes a component's `className` prop able to override its own defaults.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
