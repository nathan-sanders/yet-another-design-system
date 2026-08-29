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
const PREFIX = String.raw`(?:bg|text|border|ring|fill|stroke|shadow|inset-shadow|outline|decoration|divide|accent|caret|from|via|to)`
/** The semantic groups — the tiers a component is allowed to paint with. */
const GROUP = '(?:surface|content|action|input|focus|feedback|decorative|data-viz)'

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
