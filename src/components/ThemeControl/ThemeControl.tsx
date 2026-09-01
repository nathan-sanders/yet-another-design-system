import { useCallback, useState } from 'react'
import type { ComponentPropsWithRef } from 'react'
import { Moon, Sun } from 'lucide-react'

import { Button } from '../Button'

/**
 * ThemeControl — the button that switches between the light and dark themes.
 *
 * Mirrors the Figma component set "Theme Control" (`40004486:27878`), whose one
 * axis is `Theme` = Light | Dark. It is a ghost, icon-only `Button` at the
 * default size, which is all Figma draws: 32px tall, `rounded-md`, no label.
 *
 *     const [theme, setTheme] = useState<Theme>('light')
 *     <ThemeControl theme={theme} onThemeChange={setTheme} />
 *
 * **The variant names the theme you are in, and the icon shows the one you
 * would get.** `Theme=Light` draws a moon. That reads backwards for about a
 * second and is right: the icon is the *destination*, the same way a play button
 * shows a triangle while paused. The accessible name says so out loud —
 * "Switch to dark theme" — so nobody has to infer it.
 *
 * **It does not touch the document, on purpose.** No `classList.toggle('dark')`
 * here, no `localStorage`, no `prefers-color-scheme` listener. A design system
 * component that reaches for `document.documentElement` owns something the
 * application already owns — the theme usually has to survive a reload, sync
 * with a user setting, or render on a server, and every one of those is the
 * app's decision. This reports the intent and stops. Wiring it up is three
 * lines, and they belong where the rest of the app's state lives:
 *
 *     <ThemeControl
 *       theme={theme}
 *       onThemeChange={(next) => {
 *         setTheme(next)
 *         document.documentElement.classList.toggle('dark', next === 'dark')
 *       }}
 *     />
 *
 * **Not a `Switch`, and not `aria-pressed`.** Both would say this is a control
 * with an on state, and it is not: neither theme is "on". It is a button that
 * performs an action whose name changes, which is what a screen reader will
 * read out either way and what Astryx does too.
 *
 * Left out: a `system` value. Three states need a `Select` or a
 * `SegmentedControl` rather than one button, Figma draws two variants, and
 * guessing the third would put a control in the library no design agreed to.
 */

export type Theme = 'light' | 'dark'

export interface ThemeControlProps
  extends Omit<ComponentPropsWithRef<'button'>, 'children' | 'onChange' | 'value' | 'type'> {
  /** The theme currently in effect. Controlled. */
  theme?: Theme
  /** The starting theme when `theme` is not controlled. */
  defaultTheme?: Theme
  /** Called with the theme being switched *to*. */
  onThemeChange?: (theme: Theme) => void
}

export function ThemeControl({
  theme: themeProp,
  defaultTheme = 'light',
  onThemeChange,
  onClick,
  ...props
}: ThemeControlProps) {
  const [uncontrolled, setUncontrolled] = useState<Theme>(defaultTheme)
  const theme = themeProp ?? uncontrolled
  const next: Theme = theme === 'light' ? 'dark' : 'light'

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(event)
      if (event.defaultPrevented) return
      if (themeProp === undefined) setUncontrolled(next)
      onThemeChange?.(next)
    },
    [next, onClick, onThemeChange, themeProp],
  )

  return (
    <Button
      appearance="ghost"
      // The icon is the destination, not the current state: a moon while you
      // are in the light theme. Figma swaps the same two glyphs.
      startIcon={theme === 'light' ? Moon : Sun}
      aria-label={`Switch to ${next} theme`}
      onClick={handleClick}
      {...props}
    />
  )
}

ThemeControl.displayName = 'ThemeControl'
