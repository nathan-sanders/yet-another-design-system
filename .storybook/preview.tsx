import { useEffect } from 'react'
import type { Preview } from '@storybook/react-vite'

// Fonts + the generated token layer, same as the app entry.
import '@fontsource/inter/400.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource-variable/geist-mono'
import '../src/styles/theme.css'

const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Light or dark token theme',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: [
          { value: 'light', icon: 'sun', title: 'Light' },
          { value: 'dark', icon: 'moon', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
  },

  initialGlobals: {
    theme: 'light',
  },

  decorators: [
    // Dark mode is a class on <html>, exactly as it is in a real app — so
    // stories exercise the same mechanism the library ships with.
    (Story, context) => {
      const dark = context.globals.theme === 'dark'
      useEffect(() => {
        document.documentElement.classList.toggle('dark', dark)
      }, [dark])
      return (
        // min-h-dvh so the canvas background fills the frame rather than hugging
        // the story — otherwise a short story leaves the browser's own white
        // showing below it, which reads as a bug in dark mode.
        <div className="min-h-dvh bg-surface-canvas font-sans text-content-primary p-6">
          <Story />
        </div>
      )
    },
  ],

  parameters: {
    layout: 'fullscreen',
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo',
    },
  },
}

export default preview
