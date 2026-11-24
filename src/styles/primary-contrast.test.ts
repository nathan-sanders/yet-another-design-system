import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

/**
 * Every primary theme has to be readable, and there are thirty-six of them.
 *
 * Same shape as `nav-contrast.test.ts`: axe only ever renders the default mode,
 * so the other thirty-five are measured off the generated stylesheet instead.
 *
 * Three things are held, in both themes:
 *
 * - **The label on its fill, at rest and hovered, owes 4.5:1.** It is a Button's
 *   14px label and the check in a ticked box.
 * - **A default mode's fill owes 3:1 against what it sits on** — the canvas, a
 *   card, and the track a Slider or ProgressBar fills. `Input/Selected` is the
 *   same value, and where a fill stops is the control's state (WCAG 1.4.11).
 * - **An inverse mode's fill owes that 3:1 on an emphasized surface**, and on
 *   nothing else. Neutral Inverse in light *is* the canvas color, so holding it
 *   to the canvas would be asking it to be a default.
 *
 * Step 600 is why there are two recipes. White on it clears 4.5:1 on eight ramps
 * and fails on nine, and Figma's own Green was one of the nine (3.22:1) until it
 * moved to 700 at source. **A Figma mode that fails belongs fixed in Figma**; a
 * derived one belongs in the other family of `PRIMARY_RECIPES` in generate.py.
 */

const THEME = readFileSync(join(import.meta.dirname, 'theme.css'), 'utf8')

const FILLS = ['background', 'background-hover']
const THEMES = ['light', 'dark'] as const
type Theme = (typeof THEMES)[number]

/** Where a default mode is drawn, and where an inverse one is. */
const ON_ORDINARY = ['surface-canvas', 'surface-background-primary', 'surface-border']
const ON_EMPHASIZED = ['surface-background-emphasized']

/** `--color-blue-50: oklch(97% 0.014 254.604)` → the literal, by name. */
const primitives = new Map(
  [...THEME.matchAll(/^\s*--color-([a-z0-9-]+):\s*(oklch\([^)]*\));/gm)].map(
    ([, name, value]) => [name, value] as const,
  ),
)

const declarations = (body: string) =>
  new Map(
    [...body.matchAll(/--([a-z0-9-]+):\s*var\(--([a-z0-9-]+)\);/g)].map(
      ([, name, target]) => [name, target] as const,
    ),
  )

/** Every mode block, as `{ 'primary-background-light' → 'color-red-600', … }`. */
const modes = new Map(
  [...THEME.matchAll(/^\[data-primary-theme="([a-z-]+)"\]\s*\{([^}]*)\}/gm)].map(
    ([, mode, body]) => [mode, declarations(body)] as const,
  ),
)

const surfaces: Record<Theme, Map<string, string>> = {
  light: declarations(/:root\s*\{\s*\n(\s*--surface-canvas:[\s\S]*?)\n\}/.exec(THEME)?.[1] ?? ''),
  dark: declarations(/\.dark\s*\{\s*\n(\s*--surface-canvas:[\s\S]*?)\n\}/.exec(THEME)?.[1] ?? ''),
}

/**
 * The primitive an alias lands on. `--neutral-800` is whichever of nine ramps
 * `data-neutral` says; Stone is the default and the one measured.
 */
function primitive(target: string | undefined): string {
  if (!target) throw new Error('an alias did not resolve')
  if (target.startsWith('color-')) return target.slice('color-'.length)
  if (target.startsWith('neutral-')) return `stone-${target.slice('neutral-'.length)}`
  throw new Error(`--${target} is neither a primitive nor a neutral step`)
}

/** OKLCH → linear sRGB, via OKLab. The inverse of what generate.py emits. */
function linearRgb(oklch: string): [number, number, number] {
  const [lRaw, c, hDeg] = oklch
    .slice('oklch('.length, -1)
    .split(/\s+/)
    .map((part) => (part === 'none' ? 0 : Number.parseFloat(part)))
  const l = oklch.includes('%') ? lRaw / 100 : lRaw
  const h = (hDeg * Math.PI) / 180
  const a = c * Math.cos(h)
  const b = c * Math.sin(h)

  const lms = [
    (l + 0.3963377774 * a + 0.2158037573 * b) ** 3,
    (l - 0.1055613458 * a - 0.0638541728 * b) ** 3,
    (l - 0.0894841775 * a - 1.291485548 * b) ** 3,
  ]
  return [
    4.0767416621 * lms[0] - 3.3077115913 * lms[1] + 0.2309699292 * lms[2],
    -1.2684380046 * lms[0] + 2.6097574011 * lms[1] - 0.3413193965 * lms[2],
    -0.0041960863 * lms[0] - 0.7034186147 * lms[1] + 1.707614701 * lms[2],
  ]
}

/** WCAG 2.1 relative luminance. */
function luminance(name: string): number {
  const oklch = primitives.get(name)
  if (!oklch) throw new Error(`--color-${name} is not in theme.css`)
  const [r, g, b] = linearRgb(oklch).map((channel) => Math.min(Math.max(channel, 0), 1))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

describe('primary theme contrast', () => {
  it('every color ramp has a default and an inverse', () => {
    // Every ramp in the palette that is not one of the nine neutrals — those are
    // the neutral pair, through --neutral-*.
    const neutrals = new Set(
      [...THEME.matchAll(/:root\[data-neutral="([a-z]+)"\]/g)].map(([, name]) => name),
    )
    const ramps = new Set([...primitives.keys()].map((n) => /^([a-z]+)-\d+$/.exec(n)?.[1]))
    const families = ['neutral', ...[...ramps].filter((r) => r && !neutrals.has(r))]

    expect([...modes.keys()].sort()).toEqual(
      families.flatMap((family) => [family, `${family}-inverse`]).sort(),
    )
    expect(modes.size).toBe(36)
    for (const tokens of modes.values()) expect(tokens.size).toBe(10)
  })

  it('every label clears 4.5:1 on its fill, at rest and hovered', () => {
    const failures: string[] = []
    for (const [mode, tokens] of modes) {
      for (const theme of THEMES) {
        const foreground = primitive(tokens.get(`primary-foreground-${theme}`))
        for (const fill of FILLS) {
          const background = primitive(tokens.get(`primary-${fill}-${theme}`))
          const ratio = contrast(foreground, background)
          if (ratio >= 4.5) continue
          failures.push(
            `  ${mode} in ${theme}: ${foreground} on ${fill} (${background}) is ` +
              `${ratio.toFixed(2)}:1, needs 4.5:1`,
          )
        }
      }
    }
    expect(failures, failures.join('\n')).toEqual([])
  })

  it('every fill clears 3:1 on the surface it is for', () => {
    const failures: string[] = []
    for (const [mode, tokens] of modes) {
      const grounds = mode.endsWith('-inverse') ? ON_EMPHASIZED : ON_ORDINARY
      for (const theme of THEMES) {
        const fill = primitive(tokens.get(`primary-background-${theme}`))
        for (const ground of grounds) {
          const surface = primitive(surfaces[theme].get(ground))
          const ratio = contrast(fill, surface)
          if (ratio >= 3) continue
          failures.push(
            `  ${mode} in ${theme}: ${fill} on ${ground} (${surface}) is ` +
              `${ratio.toFixed(2)}:1, needs 3:1`,
          )
        }
      }
    }
    expect(failures, failures.join('\n')).toEqual([])
  })
})
