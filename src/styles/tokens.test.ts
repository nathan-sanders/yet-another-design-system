import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

/**
 * Every semantic-token utility a component writes must name a token that
 * exists.
 *
 * Tailwind builds utilities from the tokens it finds in `@theme`, so a class
 * naming a token that isn't there generates **nothing at all** — no warning, no
 * error, just an element with no background. Nothing else in the suite catches
 * it: `tsc` sees a string, the stories still render, and axe is happy because
 * transparent-on-canvas passes contrast. That is exactly how renaming
 * `decorative-stone` to `decorative-neutral` shipped with Avatar's initials
 * fallback and Toast's default variant silently unpainted.
 *
 * Same reasoning as the guard in generate.py, one layer up: there it is a CSS
 * custom property the browser would drop, here it is a utility Tailwind never
 * builds. Both fail loudly instead.
 */

const ROOT = join(import.meta.dirname, '..')

/** Utility prefixes that resolve against a color token. */
const PREFIX = String.raw`(?:bg|text|border|ring|inset-ring|fill|stroke|shadow|inset-shadow|outline|decoration|divide|accent|caret|from|via|to)`
/**
 * The semantic groups — the tiers a component is allowed to paint with.
 *
 * `nav` is the navigation theme tier, which is switched by `data-nav-theme`
 * rather than by `.dark`. It is checked here like every other group: the
 * failure mode is identical, and a `bg-nav-background` written before
 * generate.py had a tier to emit is exactly the bug this test exists for.
 */
const GROUP = '(?:surface|content|action|input|focus|feedback|decorative|data-viz|nav)'

const CLASS_RE = new RegExp(
  String.raw`(?<![-\w])(?:[a-z-]+:)*${PREFIX}-(${GROUP}-[a-z0-9-]+)`, 'g',
)

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name)
    if (e.isDirectory()) return sourceFiles(p)
    return /\.(tsx?|css)$/.test(e.name) && e.name !== 'theme.css' ? [p] : []
  })
}

describe('semantic token utilities', () => {
  it('every token a component paints with exists in theme.css', () => {
    const theme = readFileSync(join(ROOT, 'styles/theme.css'), 'utf8')
    const defined = new Set(
      [...theme.matchAll(/^\s*--color-([a-z0-9-]+):/gm)].map((m) => m[1]),
    )

    const missing: string[] = []
    for (const file of sourceFiles(ROOT)) {
      const src = readFileSync(file, 'utf8')
      for (const m of src.matchAll(CLASS_RE)) {
        if (!defined.has(m[1])) {
          missing.push(`${file.slice(ROOT.length + 1)} → ${m[0]}`)
        }
      }
    }

    expect(missing, `these utilities name a token that does not exist, so Tailwind
generates nothing for them and the element paints as if unstyled:\n  ${missing.join('\n  ')}\n`)
      .toEqual([])
  })
})

/**
 * The same guard for corner radius. `rounded-input` names a role from section
 * 2c, `rounded-md` a step of the scale; both have to exist, or Tailwind builds
 * nothing and the element renders square.
 */
const ROUNDED_RE = /(?<![-\w])rounded(?:-(?:tl|tr|br|bl|ss|se|es|ee|t|r|b|l|s|e))?-([a-z0-9]+(?:-[a-z0-9]+)*)/g

describe('radius utilities', () => {
  const theme = readFileSync(join(ROOT, 'styles/theme.css'), 'utf8')

  it('every radius a component rounds with exists in theme.css', () => {
    const defined = new Set([...theme.matchAll(/^\s*--radius-([a-z0-9-]+):/gm)].map((m) => m[1]))
    const missing: string[] = []
    for (const file of sourceFiles(ROOT)) {
      for (const m of readFileSync(file, 'utf8').matchAll(ROUNDED_RE)) {
        if (!defined.has(m[1])) missing.push(`${file.slice(ROOT.length + 1)} → ${m[0]}`)
      }
    }
    expect(missing, `these name a radius that does not exist:\n  ${missing.join('\n  ')}\n`).toEqual([])
  })

  it("cn's merge list is exactly the generated roles", async () => {
    const { RADIUS_ROLES } = await import('../lib/cn')
    const generated = [...theme.matchAll(/^\s*--radius-([a-z0-9-]+): var\(--shape-\1\);/gm)].map((m) => m[1])
    expect(RADIUS_ROLES).toEqual(generated)
  })

  it('a role and a step are one merge group, in cn and in tv', async () => {
    const { cn } = await import('../lib/cn')
    const { tv } = await import('tailwind-variants')
    expect(cn('rounded-container-outer', 'rounded-none')).toBe('rounded-none')
    expect(cn('rounded-l-button rounded-r-none', 'rounded-l-none')).toBe('rounded-r-none rounded-l-none')
    const recipe = tv({ base: 'rounded-input', variants: { flush: { true: 'rounded-none' } } })
    expect(recipe({ flush: true })).toBe('rounded-none')
  })
})
