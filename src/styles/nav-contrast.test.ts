import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

/**
 * Every navigation theme has to be readable, and there are thirty-seven of them.
 *
 * The tier used to be seven modes hand-checked once, in #117 — forty-six
 * combinations swept by eye, recorded in `Nav/CLAUDE.md`. It is now twenty-eight
 * modes derived in `generate.py` from Blue's steps, which means a single edit to
 * Blue moves every one of them at once. A sweep cannot keep up with that, and
 * nothing else in the suite would notice: axe runs on the stories, but only at
 * the default nav theme, so thirty-six of the thirty-seven are never rendered.
 *
 * So the rule the generator writes down is checked here instead. Same shape as
 * `tokens.test.ts` — read the generated file, hold it to something, fail loudly.
 *
 * The pairs are the ones the components actually paint, not every combination
 * the tier could express, and each carries the threshold that thing owes:
 *
 * - `content-primary` is a `NavItem`'s label at 14/24 (`styles.ts`), so 4.5:1.
 *   The row under it is `background` at rest, `item-background-hover` on hover,
 *   and `item-background-selected` when it is the current page.
 * - `content-subtle` is two different things. On the bar itself it is a `SideNav`
 *   group header at 12/20 — text, and 12px is not large text, so 4.5:1. On a
 *   hovered row it is only ever the expand chevron (`NavItem.tsx`) or
 *   `MobileNav`'s switcher glyph, which are graphics: 3:1 under WCAG 1.4.11. A
 *   group header never sits on a hovered row, so that pair is never text.
 *
 * Two things are deliberately not checked: the `item-border-*` strokes, which are
 * decoration a background has already separated, and the `nav-content-subtle/40`
 * rule in `SideNav`, which is `aria-hidden` and owes nothing.
 */

const THEME = readFileSync(join(import.meta.dirname, 'theme.css'), 'utf8')

/** Foreground token, the background it is painted on, and what that pair owes. */
const PAIRS: { foreground: string; background: string; minimum: number }[] = [
  { foreground: 'content-primary', background: 'background', minimum: 4.5 },
  { foreground: 'content-primary', background: 'item-background-hover', minimum: 4.5 },
  { foreground: 'content-primary', background: 'item-background-selected', minimum: 4.5 },
  { foreground: 'content-subtle', background: 'background', minimum: 4.5 },
  { foreground: 'content-subtle', background: 'item-background-hover', minimum: 3 },
]

/**
 * The one pair that fails, and it comes from Figma rather than from here.
 *
 * `Pink` was added to the `Navigation Theme` collection on 2026-09-02 following
 * Blue's recipe, and `Pink/600` on `Pink/50` is 4.16:1 — Blue passes the same
 * shape at 4.82:1 only because blue is unusually dark at 600. The fix is a step
 * in Figma, not an override here: `tokens/navigation.json` is the export, and
 * code that quietly disagreed with it would be the drift this tier exists to
 * avoid. **Delete this entry once Figma moves Pink's Nav Content/Subtle to 700.**
 *
 * It is listed rather than tolerated by a lowered threshold, so it stays one
 * named, dated fact instead of a weaker rule for all thirty-seven modes.
 */
const KNOWN: string[] = ['pink: content-subtle on background']

/** `--color-blue-50: oklch(97% 0.014 254.604)` → the literal, by name. */
const primitives = new Map(
  [...THEME.matchAll(/^\s*--color-([a-z0-9-]+):\s*(oklch\([^)]*\));/gm)]
    .map(([, name, value]) => [name, value] as const),
)

/**
 * Every mode block, as `{ background: 'blue-900', … }`.
 *
 * Only the values that name a primitive are collected. `neutral` and
 * `neutral-inverse` resolve through `--neutral-*`, which is whichever of nine
 * ramps `data-neutral` currently says, and `canvas` resolves through the
 * semantic layer, which moves with `.dark`. Neither has one fixed pair to
 * measure, so both fall out of the map below rather than being special-cased —
 * and the count assertion is what stops that silently swallowing a real mode.
 */
const modes = new Map(
  [...THEME.matchAll(/:root\[data-nav-theme="([a-z-]+)"\]\s*\{([^}]*)\}/g)].map(
    ([, mode, body]) => [
      mode,
      Object.fromEntries(
        [...body.matchAll(/--nav-([a-z0-9-]+):\s*var\(--color-([a-z0-9-]+)\)/g)]
          .map(([, token, primitive]) => [token, primitive]),
      ) as Record<string, string>,
    ],
  ),
)

/** OKLCH → linear sRGB, via OKLab. The inverse of what generate.py emits. */
function linearRgb(oklch: string): [number, number, number] {
  const [lRaw, c, hDeg] = oklch
    .slice('oklch('.length, -1)
    .split(/\s+/)
    .map((part) => Number.parseFloat(part))
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
function luminance(primitive: string): number {
  const oklch = primitives.get(primitive)
  if (!oklch) throw new Error(`--color-${primitive} is not in theme.css`)
  const [r, g, b] = linearRgb(oklch).map((channel) => Math.min(Math.max(channel, 0), 1))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

describe('navigation theme contrast', () => {
  it('every mode built on a primitive ramp is measurable', () => {
    // Thirty-seven modes: the two neutral ones and canvas resolve through
    // another tier, so thirty-four are left. If this number drops, a ramp
    // stopped naming a primitive and quietly left the sweep below.
    const measurable = [...modes.values()].filter(
      (tokens) => Object.keys(tokens).length === 7,
    )
    expect(modes.size).toBe(37)
    expect(measurable).toHaveLength(34)
  })

  it('every pair a nav paints clears its threshold', () => {
    const failures: string[] = []

    for (const [mode, tokens] of modes) {
      if (Object.keys(tokens).length !== 7) continue
      for (const { foreground, background, minimum } of PAIRS) {
        const ratio = contrast(tokens[foreground], tokens[background])
        if (ratio >= minimum) continue
        if (KNOWN.includes(`${mode}: ${foreground} on ${background}`)) continue
        failures.push(
          `  ${mode}: ${foreground} (${tokens[foreground]}) on ` +
            `${background} (${tokens[background]}) is ${ratio.toFixed(2)}:1, ` +
            `needs ${minimum}:1`,
        )
      }
    }

    expect(
      failures,
      'Below threshold — for a derived ramp, adjust NAV_RECIPE_OVERRIDES in ' +
        `generate.py and re-run it:\n${failures.join('\n')}`,
    ).toEqual([])
  })

  it('the known Figma failure is still there, and is still only one', () => {
    // A guard on the allowlist itself: once Figma bumps Pink, this fails and
    // tells you to delete the entry, rather than letting it sit forever.
    const stale = KNOWN.filter((entry) => {
      const [mode, pair] = entry.split(': ')
      const [foreground, background] = pair.split(' on ')
      const tokens = modes.get(mode)
      if (!tokens) return true
      const owed = PAIRS.find(
        (p) => p.foreground === foreground && p.background === background,
      )!.minimum
      return contrast(tokens[foreground], tokens[background]) >= owed
    })

    expect(stale, 'now passing — delete it from KNOWN').toEqual([])
  })
})
