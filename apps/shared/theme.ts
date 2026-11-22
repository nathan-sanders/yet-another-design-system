import { useEffect, useState } from 'react'

import type { Theme } from '../../src/components/ThemeControl'

/**
 * The document's light/dark switch, shared by every app.
 *
 * `ThemeControl` reports the intent and never touches the document, so the app
 * writes `.dark` itself — on `<html>`, where the semantic tokens look for it. It
 * starts dark, whatever the system prefers, and remembers a choice made with
 * the toggle per browser. Each page's `<html>` starts with `class="dark"` too,
 * so the first paint is dark rather than a flash of light before React runs.
 */
export function useDocumentTheme(): [Theme, (theme: Theme) => void] {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem('yads-apps-theme')
      if (saved === 'light' || saved === 'dark') return saved
    } catch {
      // Storage can be unavailable (private windows); the default stands in.
    }
    return 'dark'
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    try {
      localStorage.setItem('yads-apps-theme', theme)
    } catch {
      // Not remembered, still applied.
    }
  }, [theme])

  return [theme, setTheme]
}
