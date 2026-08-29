/**
 * The Foundations pages read the token layer itself.
 *
 * `theme.css` is generated from `tokens/*.json` by `generate.py`, so it is the
 * one artifact the playground, Storybook and every consumer share. Importing it
 * as text and parsing it here means these pages cannot drift: add a ramp, rename
 * a semantic token, retune the motion scale, and the documentation changes with
 * it on the next reload. A hand-maintained list of swatches would be a second
 * source of truth, and second sources of truth go stale silently.
 *
 * The parse is deliberately small — this file knows about custom properties and
 * braces, nothing else about CSS.
 */
import themeCss from '../styles/theme.css?raw'

export type Decl = { name: string; value: string }
export type Block = { selector: string; decls: Decl[] }

/** Declarations at the top level of a block body, in source order. */
function parseDecls(body: string): Decl[] {
  // Stop at the first nested `{` so a block containing rules (only the
  // reduced-motion @media does) never leaks its inner declarations upward.
  const flat = body.split('{')[0]
  return [...flat.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map((m) => ({
    name: m[1],
    value: m[2].trim(),
  }))
}

/**
 * Top-level `selector { … }` blocks. Brace-counted rather than regexed so a
 * nested rule closes the right block.
 */
function parseBlocks(css: string): Block[] {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, '')
  const blocks: Block[] = []
  let i = 0
  while (i < clean.length) {
    const open = clean.indexOf('{', i)
    if (open === -1) break
    // Statements before the block (@import, @custom-variant) end in `;` —
    // the selector is whatever follows the last one.
    const head = clean.slice(i, open)
    const selector = head.slice(head.lastIndexOf(';') + 1).trim()
    let depth = 1
    let j = open + 1
    while (j < clean.length && depth > 0) {
      if (clean[j] === '{') depth += 1
      else if (clean[j] === '}') depth -= 1
      j += 1
    }
    blocks.push({ selector, decls: parseDecls(clean.slice(open + 1, j - 1)) })
    i = j
  }
  return blocks
}

const BLOCKS = parseBlocks(themeCss)

function block(match: (b: Block) => boolean): Decl[] {
  return BLOCKS.find(match)?.decls ?? []
}

/** Everything static: primitives, type, radius, shadow, motion. */
const THEME = block((b) => b.selector === '@theme')

/** The theme-aware tiers. Light lives on the `:root` that defines the surfaces. */
const LIGHT = block((b) => b.selector === ':root' && b.decls.some((d) => d.name === '--surface-canvas'))
const DARK = block((b) => b.selector === '.dark')

/** Tokens Tailwind already generates utilities for; kept for reference only. */
const REFERENCE = block((b) => b.selector === ':root' && b.decls.some((d) => d.name === '--opacity-50'))

function pick(decls: Decl[], re: RegExp): Decl[] {
  return decls.filter((d) => re.test(d.name))
}

/** `--radius-md` -> `md`, given the prefix. */
function suffix(name: string, prefix: string): string {
  return name.slice(prefix.length + 3)
}

/* ------------------------------------------------------------------ color */

export type Ramp = { name: string; steps: { step: string; value: string }[] }

/**
 * The primitive ramps, in the order `generate.py` writes them: the chromatic
 * families first, then the nine neutrals. `white` and `black` have no steps and
 * are handled separately by the page that shows them.
 */
export const ramps: Ramp[] = (() => {
  const byName = new Map<string, Ramp>()
  for (const d of THEME) {
    const m = /^--color-([a-z]+)-(\d+)$/.exec(d.name)
    if (!m) continue
    const ramp = byName.get(m[1]) ?? { name: m[1], steps: [] }
    ramp.steps.push({ step: m[2], value: d.value })
    byName.set(m[1], ramp)
  }
  for (const ramp of byName.values()) {
    ramp.steps.sort((a, b) => Number(a.step) - Number(b.step))
  }
  return [...byName.values()]
})()

/** The nine ramps `data-neutral` can point the semantic layer at, in file order. */
export const swappableNeutrals: string[] = BLOCKS.flatMap((b) => {
  const m = /^:root\[data-neutral="([a-z]+)"\]$/.exec(b.selector)
  return m ? [m[1]] : []
})

/** The chromatic ramps — everything that is not a neutral the ramp tier can use. */
export const chromaticRamps = ramps.filter((r) => !swappableNeutrals.includes(r.name))
export const neutralRamps = ramps.filter((r) => swappableNeutrals.includes(r.name))

/** The eleven steps of the indirection tier, `--neutral-50` … `--neutral-950`. */
export const neutralSteps: string[] = block((b) => b.selector === ':root[data-neutral="stone"]')
  .map((d) => d.name.slice('--neutral-'.length))

/* ---------------------------------------------------------------- semantic */

export type SemanticToken = {
  /** Custom property name without the leading dashes, e.g. `surface-canvas`. */
  token: string
  /** The part after the group, e.g. `canvas`. */
  label: string
  /** Raw declared value in each theme, e.g. `var(--neutral-100)`. */
  light: string
  dark: string
}

export type SemanticGroup = { name: string; tokens: SemanticToken[] }

/**
 * Longest-first so `data-viz` wins over a hypothetical `data`. These are the
 * tiers a component is allowed to paint with — the same list the token test
 * guards.
 */
const GROUPS = [
  'surface',
  'content',
  'action',
  'input',
  'focus',
  'feedback',
  'decorative',
  'data-viz',
]

export const semanticGroups: SemanticGroup[] = (() => {
  const darkByName = new Map(DARK.map((d) => [d.name, d.value]))
  const groups = new Map<string, SemanticToken[]>(GROUPS.map((g) => [g, []]))
  for (const d of LIGHT) {
    const bare = d.name.slice(2)
    const group = GROUPS.find((g) => bare.startsWith(`${g}-`))
    if (!group) continue
    groups.get(group)!.push({
      token: bare,
      label: bare.slice(group.length + 1),
      light: d.value,
      dark: darkByName.get(d.name) ?? d.value,
    })
  }
  return GROUPS.map((name) => ({ name, tokens: groups.get(name)! }))
})()

export const semanticTokenCount = semanticGroups.reduce((n, g) => n + g.tokens.length, 0)

/**
 * A declared value rendered for a human: the `var(--x)` wrapper is noise, and a
 * `color-mix` is really "this token at this opacity".
 *
 * Returns the alias plus an optional percentage so a table can show the two in
 * different weights.
 */
export function readAlias(value: string): { alias: string; mix?: string } {
  const mix = /^color-mix\(in oklab,\s*var\(--([\w-]+)\)\s*([\d.]+%),\s*transparent\)$/.exec(value)
  if (mix) return { alias: strip(mix[1]), mix: mix[2] }
  const ref = /^var\(--([\w-]+)\)$/.exec(value)
  if (ref) return { alias: strip(ref[1]) }
  return { alias: value }
}

/** `color-stone-100` is the primitive `stone-100`; everything else stands alone. */
function strip(name: string): string {
  return name.startsWith('color-') ? name.slice('color-'.length) : name
}

/* -------------------------------------------------------------- dimensions */

export type TypeStep = { name: string; size: string; lineHeight: string }

export const typeScale: TypeStep[] = pick(THEME, /^--text-[\w]+$/).map((d) => ({
  name: suffix(d.name, 'text'),
  size: d.value,
  lineHeight: THEME.find((l) => l.name === `${d.name}--line-height`)?.value ?? '',
}))

export const fontFamilies: Decl[] = pick(THEME, /^--font-(sans|mono)$/)
export const fontWeights: Decl[] = pick(THEME, /^--font-weight-/)
export const radii: Decl[] = pick(THEME, /^--radius-/)
export const shadows: Decl[] = pick(THEME, /^--shadow-/)
export const insetShadows: Decl[] = pick(THEME, /^--inset-shadow-/)
export const blurs: Decl[] = pick(THEME, /^--blur-/)
export const spacingBase: string = THEME.find((d) => d.name === '--spacing')?.value ?? '0.25rem'
export const borderWidths: Decl[] = pick(REFERENCE, /^--border-width-/)
export const opacities: Decl[] = pick(REFERENCE, /^--opacity-/)

/* ------------------------------------------------------------------ motion */

export const durations: Decl[] = pick(THEME, /^--transition-duration-/).map((d) => ({
  name: suffix(d.name, 'transition-duration'),
  value: d.value,
}))

export const easings: Decl[] = pick(THEME, /^--ease-/).map((d) => ({
  name: suffix(d.name, 'ease'),
  value: d.value,
}))

/* ------------------------------------------------------------------- paint */

/** Every `--color-*` primitive, by custom-property name, with its literal OKLCH. */
const PRIMITIVE_BY_NAME = new Map(
  THEME.filter((d) => d.name.startsWith('--color-')).map((d) => [d.name, d.value]),
)

/**
 * Turn a declared value into something safe to paint with.
 *
 * **Tailwind drops `@theme` variables nothing uses.** `--color-orange-500` is in
 * `theme.css`, but no utility and no token references it, so it is not in the
 * stylesheet the browser gets — `var(--color-orange-500)` resolves to nothing
 * and the swatch comes out blank. Exactly the silent failure the token test
 * guards against one layer up, and it only bites code that reads a primitive as
 * a variable rather than through a `bg-*` class, which is to say: this page.
 *
 * So primitives are substituted for their literal OKLCH, taken from the same
 * file. The ramp and semantic tiers are left as `var()` on purpose — they live
 * in plain `:root` blocks that Tailwind never touches, and keeping them live is
 * what makes the Theme and Neutral switches move these pages.
 */
export function paint(value: string): string {
  return value.replace(/var\((--color-[\w-]+)\)/g, (whole, name: string) =>
    PRIMITIVE_BY_NAME.get(name) ?? whole,
  )
}

/* ----------------------------------------------------------------- resolve */

const LIGHT_BY_NAME = new Map(LIGHT.map((d) => [d.name, d.value]))
const DARK_BY_NAME = new Map(DARK.map((d) => [d.name, d.value]))

/**
 * Expand a declared value until it only references the ramp and primitive
 * tiers, which are theme-independent.
 *
 * This is what lets one page show the light *and* dark color of a token at the
 * same time. Most semantic tokens already point straight at `--neutral-800` or
 * `--color-red-700` and need no work — but a handful point at another semantic
 * token (`feedback-success-background` is `decorative-green-background`), and
 * those would otherwise follow whichever theme the reader is in, quietly
 * showing the same color in both columns.
 */
export function resolve(value: string, theme: 'light' | 'dark'): string {
  const map = theme === 'dark' ? DARK_BY_NAME : LIGHT_BY_NAME
  let out = value
  // Six is generous: the deepest real chain is semantic -> semantic -> ramp.
  for (let i = 0; i < 6; i += 1) {
    const next = out.replace(/var\((--[\w-]+)\)/g, (whole, name: string) =>
      map.has(name) ? map.get(name)! : whole,
    )
    if (next === out) break
    out = next
  }
  return paint(out)
}
