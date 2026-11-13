/**
 * The width a horizontal, separated Stepper collapses at. Its own module so
 * `Stepper.tsx` exports only components, which is what fast refresh needs.
 */

/**
 * Astryx's `minimumStepWidth`. Below it a horizontal, separated stepper drops
 * its labels for a segmented track and puts the current step under it — Figma's
 * `Layout=Compact`.
 */
export const MIN_STEP_WIDTH = 112

/**
 * The width a stepper of `n` steps collapses below: `n × 112` plus the 4px
 * gaps, which is `116n − 4`.
 *
 * **Why it is a table of literal classes.** The decision is a container query
 * on the stepper's own width, so it needs no ResizeObserver and holds before
 * hydration. But the threshold depends on the step count, and Tailwind finds
 * classes by scanning source text, so `` `@max-[${w}px]/stepper:…` `` would
 * never be generated. Each count is spelled out instead. The query sets two
 * custom properties and every element that swaps reads them through `var()`,
 * so one class per count does the whole switch rather than one per element.
 * Astryx's guidance is 3–7 steps; the table covers 2–10.
 */
export const COMPACT_BELOW: Record<number, string> = {
  2: '@max-[228px]/stepper:[--stepper-full:none] @max-[228px]/stepper:[--stepper-compact:flex]',
  3: '@max-[344px]/stepper:[--stepper-full:none] @max-[344px]/stepper:[--stepper-compact:flex]',
  4: '@max-[460px]/stepper:[--stepper-full:none] @max-[460px]/stepper:[--stepper-compact:flex]',
  5: '@max-[576px]/stepper:[--stepper-full:none] @max-[576px]/stepper:[--stepper-compact:flex]',
  6: '@max-[692px]/stepper:[--stepper-full:none] @max-[692px]/stepper:[--stepper-compact:flex]',
  7: '@max-[808px]/stepper:[--stepper-full:none] @max-[808px]/stepper:[--stepper-compact:flex]',
  8: '@max-[924px]/stepper:[--stepper-full:none] @max-[924px]/stepper:[--stepper-compact:flex]',
  9: '@max-[1040px]/stepper:[--stepper-full:none] @max-[1040px]/stepper:[--stepper-compact:flex]',
  10: '@max-[1156px]/stepper:[--stepper-full:none] @max-[1156px]/stepper:[--stepper-compact:flex]',
}

/** Exported with the table for `compact.test.ts`, which holds one to the other. */
export const compactThreshold = (count: number) => count * MIN_STEP_WIDTH + (count - 1) * 4
