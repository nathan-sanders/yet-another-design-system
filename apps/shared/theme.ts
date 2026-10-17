import { useEffect, useState } from 'react'

import type { Theme } from '../../src/components/ThemeControl'

/**
 * The document's light/dark switch, shared by every app.
 *
 * `ThemeControl` reports the intent and never touches the document, so the app
 * writes `.dark` itself — on `<html>`, where the semantic tokens look for it. It
 * starts from the system preference and remembers the choice per browser.
 */
export function useDocumentTheme(): [Theme, (theme: Theme) => void] {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem('yads-apps-theme')
      if (saved === 'light' || saved === 'dark') return saved
    } catch {
      // Storage can be unavailable (private windows); the system preference stands in.
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
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
