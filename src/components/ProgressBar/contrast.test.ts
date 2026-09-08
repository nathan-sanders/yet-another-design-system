import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

/**
 * A progress bar is read by seeing where the fill stops, so the boundary between
 * the fill and the bare track is "visual information required to identify … the
 * state of a user interface component" under WCAG 1.4.11 — 3:1, in both themes.
 *
 * Nothing else in the suite can catch this. axe measures text against its
 * background and does not attempt non-text contrast, and a story renders a
 * failing pair just as happily as a passing one: the bar looks fine, it is only
 * *low contrast*, which is exactly the class of bug that reaches production.
 *
 * Same shape as `src/styles/nav-contrast.test.ts` — read the generated file,
 * resolve the OKLCH literals, hold each pair to what it owes.
 *
 * **`ProgressBar` is the first component to paint `Feedback/…/Highlight` as a
 * large fill.** Everywhere else it is a 1px invalid border against a page
 * background (`Radio`, `Checkbox`, `Input`), which is a different pairing. So
 * these two failures are new information about the ramp rather than a
 * regression, and they are carried here as named exceptions in the shape
 * `nav-contrast.test.ts` used for `Pink`: recorded with their real numbers,
 * pointing at the fix, and expected to be deleted rather than lived with.
 *
 * **The fix is in Figma, not here.** Both come from a `Highlight` that is the
 * same step in both themes while the track is not: `Decorative/Yellow/Highlight`
 * is Yellow/600 against a Stone/200 track in light, and
 * `Decorative/Red/Highlight` is Red/600 against a Stone/700 track in dark.
 * Measured alternatives that clear 3:1 in both themes are Yellow/700 light with
 * Yellow/500 dark (3.92 / 5.37) and Red/600 light with Red/400 dark
 * (3.79 / 3.55) — i.e. make those two variables theme-aware at source. That
 * moves `Badge` and the `Feedback` family with them, which is why it is a
 * decision for the file rather than an override in this component.
 *
 * Lowering the threshold is not the alternative: it would weaken all ten pairs
 * to excuse two.
 */

const THEME = readFileSync(join(import.meta.dirname, '../../styles/theme.css'), 'utf8')

/** `--color-blue-50: oklch(97% 0.014 254.604)` → the literal, by name. */
const primitives = new Map(
  [...THEME.matchAll(/^\s*--color-([a-z0-9-]+):\s*(oklch\([^)]*\));/gm)].map(
    ([, name, value]) => [name, value] as const,
  ),
)

/**
 * OKLCH → linear sRGB, via OKLab. The inverse of what `generate.py` emits, and
 * the same function `nav-contrast.test.ts` uses.
 *
 * The matrix already lands in *linear* sRGB, so there is no gamma decode to do
 * afterwards — running one anyway inflates every ratio and would quietly turn
 * this test into a rubber stamp. `oklch(100% 0 none)` is real (white and black
 * carry no hue), and `none` has to become 0 rather than NaN.
 */
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

type Themed = { light: string; dark: string }

/**
 * The semantic tokens the component paints, resolved to primitives by reading
 * `theme.css` rather than by copying `tokens/semantic.json` — so a token that
 * moves at source moves here too.
 *
 * `--surface-border: var(--neutral-200)` in `:root` and `var(--neutral-700)` in
 * `.dark`, and the neutral tier is nine ramps deep. `Stone` is the default, and
 * it is the one the stories render, so it is the one measured. The other eight
 * are the same eleven steps of a different hue at near-identical lightness —
 * which is the property that makes the tier swappable at all.
 */
function resolve(token: string): Themed {
  const block = (selector: RegExp): string => {
    const match = THEME.match(selector)
    if (!match) throw new Error(`no block matched ${selector}`)
    return match[1]
  }

  /**
   * Follow the aliases down to a primitive. A semantic can point at another
   * semantic (`--feedback-warning-highlight: var(--decorative-yellow-highlight)`),
   * at the neutral tier (`var(--neutral-200)`), or straight at a ramp
   * (`var(--color-yellow-600)`), so all three cases have to be walked.
   */
  const toPrimitive = (body: string, name: string): string => {
    if (name.startsWith('color-')) return name.slice('color-'.length)
    // The tier, not a ramp — `--neutral-200` is whichever of nine `data-neutral`
    // currently says. Stone is the default and the one the stories render.
    if (name.startsWith('neutral-')) return `stone-${name.slice('neutral-'.length)}`

    const match = body.match(new RegExp(`--${name}:\\s*var\\(--([a-z0-9-]+)\\);`))
    if (!match) throw new Error(`--${name} does not name a variable in that block`)
    return toPrimitive(body, match[1])
  }

  const lightBlock = block(/:root\s*\{\s*\n(\s*--surface-canvas:[\s\S]*?)\n\}/)
  const darkBlock = block(/\.dark\s*\{\s*\n(\s*--surface-canvas:[\s\S]*?)\n\}/)

  return { light: toPrimitive(lightBlock, token), dark: toPrimitive(darkBlock, token) }
}

/** The trough every fill is drawn on. */
const TRACK = 'surface-border'

/** Each `type`, and the token its fill binds. */
const FILLS: { type: string; token: string }[] = [
  { type: 'default', token: 'input-selected' },
  { type: 'success', token: 'feedback-success-highlight' },
  { type: 'warning', token: 'feedback-warning-highlight' },
  { type: 'danger', token: 'feedback-danger-highlight' },
]

/**
 * The two pairs that do not clear 3:1 today, with the ratio each currently
 * measures. Written as an exact number rather than a "below threshold" flag so
 * that a change at source — in either direction — shows up as a failure here
 * and has to be looked at.
 */
const KNOWN_SHORTFALLS: Record<string, number> = {
  'warning light': 2.33,
  'danger dark': 2.16,
}

describe('ProgressBar fill contrast', () => {
  it('the mark tick clears 3:1 on the surfaces it overhangs onto', () => {
    // The tick is drawn behind the track and only its 2px overhang is visible,
    // so what it owes contrast against is the page, not the fill. That is the
    // whole reason it is not drawn on top of the bar as Astryx draws it — see
    // the `markTick` recipe.
    const tick = resolve('content-primary')
    for (const surface of ['surface-canvas', 'surface-background-primary']) {
      const against = resolve(surface)
      expect(contrast(tick.light, against.light)).toBeGreaterThanOrEqual(3)
      expect(contrast(tick.dark, against.dark)).toBeGreaterThanOrEqual(3)
    }
  })

  it('every fill clears 3:1 against the track, or is a recorded exception', () => {
    const track = resolve(TRACK)
    const failures: string[] = []

    for (const { type, token } of FILLS) {
      const fill = resolve(token)

      for (const theme of ['light', 'dark'] as const) {
        const ratio = contrast(fill[theme], track[theme])
        const known = KNOWN_SHORTFALLS[`${type} ${theme}`]

        if (known != null) {
          // A recorded shortfall is held to its measured value. If it improves,
          // delete the entry; if it worsens, something moved at source.
          expect(
            ratio,
            `${type} in ${theme} is a recorded shortfall — see the note at the ` +
              'top of this file. Its measured ratio changed, so either the fix ' +
              'landed in Figma (delete the entry) or a token moved unexpectedly.',
          ).toBeCloseTo(known, 1)
          continue
        }

        if (ratio >= 3) continue
        failures.push(
          `  ${type} in ${theme}: ${token} (${fill[theme]}) on ` +
            `${TRACK} (${track[theme]}) is ${ratio.toFixed(2)}:1, needs 3:1`,
        )
      }
    }

    expect(
      failures,
      'A fill this close to its track cannot be read as a value. Fix the token ' +
        `in Figma rather than lowering the bar here:\n${failures.join('\n')}`,
    ).toEqual([])
  })
})
