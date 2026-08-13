import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Joins class names and lets a later class win over an earlier one in the same
 * group — so `cn('px-3', 'px-4')` yields `px-4` rather than both. This is what
 * makes a component's `className` prop able to override its own defaults.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
