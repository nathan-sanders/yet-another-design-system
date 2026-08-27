import type { ComponentPropsWithRef } from 'react'
import { tv } from 'tailwind-variants'

import { cn } from '../../lib/cn'
import { useIsApplePlatform } from '../../lib/platform'
import { parseKeys } from './keys'

/**
 * Kbd — a keyboard shortcut, drawn as one small key per keystroke.
 *
 * The look comes from the Figma component "Kbd" (Yet Another Design System,
 * node 40004073:20923): a 20px key on `Surface/Background Subtle`, `Content/Primary`
 * text at `text-sm/normal`, `rounded-xs`, 4px of horizontal padding and the
 * `Extra Low` drop shadow. **The API comes from Meta's Astryx `Kbd`**, which
 * takes a single `keys` string and splits it on `+`.
 *
 * Two things about that look are worth saying out loud, because both read as
 * mistakes until you know why:
 *
 * **It is sans, not mono.** `--font-mono` exists in this theme and Slider uses
 * it, but a shortcut is not code — Figma and Astryx both draw these in the body
 * face, and a mono ⌘ is a worse ⌘.
 *
 * **The fill is translucent, on its own token.** The key was first drawn on
 * `Surface/Background Subtle`, which is byte-identical to `Surface/Canvas` *and* to
 * the menu row's `data-highlighted` background — both measured. So an opaque key
 * vanished on the page canvas, and vanished again the moment you hovered the
 * menu row it was sitting in, surviving only on its drop shadow.
 * `Surface/Overlay Subtle` is 10% of the neutral over whatever is behind it, so
 * it reads on the canvas, on a card and on a highlighted row without knowing
 * which one it is on. Astryx reaches for a translucent fill for the same reason.
 *
 * Do not reach for a border instead — besides not being drawn, a CSS border adds
 * height a Figma stroke does not, which is the trap Token already walked into.
 *
 * Not interactive: no hover, no focus, no transition, and so no `focusRing`.
 */
const group = tv({
  base: [
    // gap-1 = 4px (spacing/1), the same token as the key's own padding.
    'inline-flex items-center gap-1',
    // Left at the default `vertical-align: baseline` so a shortcut sits on the
    // line of the sentence around it rather than pushing it around.
    'font-sans',
  ],
})

const key = tv({
  base: [
    'inline-flex shrink-0 items-center justify-center',
    // min-w-5 / min-h-5 = 20px (width/w-5), px-1 = 4px (spacing/1).
    //
    // There is no height in Figma, and there does not need to be: 20px is
    // exactly the text-sm line-height, so a key with a glyph in it gets there
    // on its own. min-h-5 holds it anyway, the way Badge does, for the day
    // something lands in one that has no line box of its own.
    'min-h-5 min-w-5 px-1',
    'rounded-xs',
    // Surface/Overlay Subtle — a translucent neutral, 10% over whatever is
    // behind it. See the docblock for why the key is not the opaque fill it
    // was first drawn with.
    'bg-surface-overlay-subtle text-content-primary',
    // 0px 1px 2px var(--surface-drop-shadow) — Figma's Elevation/Drop Shadow/Extra Low.
    'shadow-extra-low',
    // font-sans is repeated here rather than inherited from the group, and it
    // has to be: Tailwind's Preflight styles `code, kbd, samp, pre` with
    // --font-mono, and that rule beats anything inherited. Without it a key
    // renders in Geist Mono while the group around it is in Inter — measured,
    // not guessed.
    'font-sans text-sm font-normal whitespace-nowrap',
  ],
})

export interface KbdProps extends Omit<ComponentPropsWithRef<'kbd'>, 'children'> {
  /**
   * The shortcut, as a `+`-separated string: `"mod+k"`, `"ctrl+alt+delete"`,
   * `"shift+enter"`. Known tokens are `mod ctrl alt shift enter backspace
   * delete escape tab space up down left right home end pageup pagedown`, plus
   * the aliases in `keys.ts`. Anything else is drawn as typed.
   *
   * **Prefer `mod`** over `cmd` or `ctrl`: it draws ⌘ on Apple platforms and ⌃
   * everywhere else, so one call site is right on both.
   */
  keys: string
  /**
   * Overrides the spoken name of the shortcut. The generated one joins the key
   * names with `+` — `"mod+shift+p"` becomes "Command + Shift + P" — which is
   * right almost always; reach for this when the shortcut has a name of its own
   * that a reader would recognise faster than its keys.
   */
  label?: string
}

export function Kbd({ keys, label, className, ...props }: KbdProps) {
  const isApple = useIsApplePlatform()
  const parsed = parseKeys(keys, isApple)

  return (
    // The wrapper is what carries the accessible name, and `role="img"` is what
    // makes that name get read: <kbd> has no implicit ARIA role, so an
    // aria-label sitting on a bare one is not reliably announced. Astryx reaches
    // for the same trick. Each key is then hidden, because a screen reader
    // spelling ⌘ out as "place of interest sign" helps nobody.
    //
    // Nesting <kbd> inside <kbd> is not a hack around that — it is the HTML
    // spec's own idiom for a key combination, so the markup stays honest.
    <kbd
      role="img"
      aria-label={label ?? parsed.map((k) => k.label).join(' + ')}
      className={cn(group(), className)}
      {...props}
    >
      {parsed.map((k, index) => (
        // Index is the key because a shortcut is a fixed sequence that never
        // reorders, and the same glyph can legitimately appear twice.
        <kbd key={index} aria-hidden className={key()}>
          {k.glyph}
        </kbd>
      ))}
    </kbd>
  )
}

Kbd.displayName = 'Kbd'
