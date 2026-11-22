import { useEffect, useState } from 'react'

import type { Theme } from '../../src/components/ThemeControl'

/**
 * The document's light/dark switch, shared by every app.
 *
 * `ThemeControl` reports the intent and never touches the document, so the app
 * writes `.dark` itself — on `<html>`, where the semantic tokens look for it. It
 * starts from the system preference and remembers the choice per browser.
 *
 * An app can start from a theme of its own instead: Yet Project opens dark.
 * It then keeps its choice under its own key, because the apps share an
 * origin, and every visit saves the theme it shows — on the shared key one
 * app's default would become every app's.
 */
export function useDocumentTheme({
  initial,
  storageKey = 'yads-apps-theme',
}: { initial?: Theme; storageKey?: string } = {}): [Theme, (theme: Theme) => void] {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved === 'light' || saved === 'dark') return saved
    } catch {
      // Storage can be unavailable (private windows); the default stands in.
    }
    if (initial) return initial
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    try {
      localStorage.setItem(storageKey, theme)
    } catch {
      // Not remembered, still applied.
    }
  }, [theme, storageKey])

  return [theme, setTheme]
}
