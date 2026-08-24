/**
 * The key table behind `Kbd`, and the parser that turns a shortcut string into
 * the keys it draws.
 *
 * This lives beside `Kbd.tsx` rather than inside it because that file exports a
 * component: a module that exports components *and* constants breaks Fast
 * Refresh, which is the same reason Token, Input, Avatar, Toast and Menu each
 * keep a `styles.ts`.
 *
 * Modelled on Meta's Astryx `Kbd`, which takes one `keys` string and splits it
 * on `+`. The table below is a deliberate **superset** of theirs: Astryx maps
 * `mod ctrl alt shift enter backspace escape tab up down left right` and lets
 * everything else fall through its uppercasing branch, so `space` and `delete`
 * render there as the shouted `SPACE` and `DELETE`. Both are common enough in
 * real shortcuts to deserve a glyph and a spoken name, and `home`, `end` and the
 * page keys cost nothing while the table is open.
 */

/** One key, as it is drawn and as it is spoken. */
export interface KbdKey {
  /** The glyph rendered inside the key. */
  glyph: string
  /** How the key is named in the shortcut's accessible label. */
  label: string
}

/**
 * Aliases are included where a caller would plausibly reach for them —
 * `cmd`/`command`/`meta` for ⌘, `option`/`opt` for ⌥, `return` for ↵, `esc`
 * for Escape. `mod` is the one token *not* in here: it resolves per platform,
 * so `parseKeys` handles it.
 */
export const KEY_MAP: Record<string, KbdKey> = {
  cmd: { glyph: '⌘', label: 'Command' },
  command: { glyph: '⌘', label: 'Command' },
  meta: { glyph: '⌘', label: 'Command' },
  ctrl: { glyph: '⌃', label: 'Control' },
  control: { glyph: '⌃', label: 'Control' },
  alt: { glyph: '⌥', label: 'Alt' },
  option: { glyph: '⌥', label: 'Alt' },
  opt: { glyph: '⌥', label: 'Alt' },
  shift: { glyph: '⇧', label: 'Shift' },
  enter: { glyph: '↵', label: 'Enter' },
  return: { glyph: '↵', label: 'Enter' },
  backspace: { glyph: '⌫', label: 'Backspace' },
  delete: { glyph: '⌦', label: 'Delete' },
  del: { glyph: '⌦', label: 'Delete' },
  escape: { glyph: 'Esc', label: 'Escape' },
  esc: { glyph: 'Esc', label: 'Escape' },
  tab: { glyph: '⇥', label: 'Tab' },
  space: { glyph: 'Space', label: 'Space' },
  up: { glyph: '↑', label: 'Up arrow' },
  down: { glyph: '↓', label: 'Down arrow' },
  left: { glyph: '←', label: 'Left arrow' },
  right: { glyph: '→', label: 'Right arrow' },
  home: { glyph: 'Home', label: 'Home' },
  end: { glyph: 'End', label: 'End' },
  pageup: { glyph: 'PgUp', label: 'Page up' },
  pagedown: { glyph: 'PgDn', label: 'Page down' },
}

/** What `mod` becomes, per platform. */
const MOD: Record<'apple' | 'other', KbdKey> = {
  apple: { glyph: '⌘', label: 'Command' },
  other: { glyph: '⌃', label: 'Control' },
}

/**
 * Splits a shortcut string into the keys to draw.
 *
 * `parseKeys('mod+shift+p', true)` → `⌘ ⇧ P`, spoken "Command + Shift + P".
 *
 * A token the table does not know renders as typed, uppercased when it is a
 * single character — so `k` draws `K`, and `F5` is left alone rather than being
 * shouted at. Empty segments are dropped, which keeps a trailing `+` or a stray
 * double `++` from drawing a blank key.
 */
export function parseKeys(keys: string, isApple: boolean): KbdKey[] {
  return keys
    .split('+')
    .map((token) => token.trim())
    .filter(Boolean)
    .map((token) => {
      const lookup = token.toLowerCase()
      if (lookup === 'mod') return MOD[isApple ? 'apple' : 'other']
      const mapped = KEY_MAP[lookup]
      if (mapped) return mapped
      const glyph = token.length === 1 ? token.toUpperCase() : token
      return { glyph, label: glyph }
    })
}
