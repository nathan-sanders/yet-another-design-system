import { useEffect } from 'react'
import type { Preview } from '@storybook/react-vite'

// Fonts + the generated token layer, same as the app entry.
import '@fontsource/inter/400.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource-variable/geist-mono'
import '../src/styles/theme.css'

/** The nine neutral ramps, stone first — the same list and order as generate.py. */
const NEUTRALS = ['stone', 'taupe', 'mauve', 'mist', 'olive',
                  'slate', 'gray', 'zinc', 'neutral']

/** The seven navigation themes, Figma's order — the same list as generate.py. */
const NAV_THEMES = ['neutral-inverse', 'neutral', 'blue-inverse', 'blue',
                    'purple-inverse', 'purple', 'canvas']

const titleCase = (v: string) =>
  v.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ')

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
    neutral: {
      description: 'Which primitive ramp the semantic neutrals resolve to',
      toolbar: {
        title: 'Neutral',
        icon: 'paintbrush',
        items: NEUTRALS.map((value) => ({ value, title: titleCase(value) })),
        dynamicTitle: true,
      },
    },
    navTheme: {
      description: 'Which theme the navigation components draw (SideNav, TopNav)',
      toolbar: {
        title: 'Nav',
        icon: 'sidebar',
        items: NAV_THEMES.map((value) => ({ value, title: titleCase(value) })),
        dynamicTitle: true,
      },
    },
  },

  initialGlobals: {
    theme: 'light',
    neutral: 'stone',
    navTheme: 'neutral-inverse',
  },

  decorators: [
    // All three switches are attributes on <html>, exactly as they are in a real
    // app — so stories exercise the same mechanism the library ships with. They
    // are orthogonal: the ramp is theme-independent, and the semantic layer
    // picks which of its steps each theme uses.
    //
    // The nav theme is the odd one out, and the toolbar is how you see it. Six
    // of its seven modes are absolute, so switching Theme to Dark moves the
    // page around a nav that does not move with it. Only Transparent follows
    // the theme — and the neutral modes still follow the ramp, because they
    // alias the same --neutral-* tier the semantic layer does.
    (Story, context) => {
      const dark = context.globals.theme === 'dark'
      const neutral = context.globals.neutral as string
      const navTheme = context.globals.navTheme as string
      useEffect(() => {
        document.documentElement.classList.toggle('dark', dark)
      }, [dark])
      useEffect(() => {
        document.documentElement.dataset.neutral = neutral
      }, [neutral])
      useEffect(() => {
        document.documentElement.dataset.navTheme = navTheme
      }, [navTheme])
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
    options: {
      // Sidebar order. Storybook otherwise sorts by the order stories load,
      // which is alphabetical by path — that would file the token layer under
      // C, between Components and Data Viz. Foundations comes first because it
      // is what every component is built out of: read it and the rest of the
      // library stops looking like a pile of colors.
      //
      // Introduction sits above even that: it is the one page that says what the
      // library is before any page explains how a part of it works.
      //
      // Within Foundations the order is the tiers themselves, palette outward,
      // rather than alphabetical.
      storySort: {
        order: [
          'Introduction',
          'Foundations',
          ['Overview', 'Color', 'Semantic Color', 'Typography', 'Space', 'Shape', 'Elevation', 'Motion'],
          'Components',
          'Data Viz',
        ],
      },
    },
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
      //
      // 'error' because every story is a test, and an accessible component
      // library is the point. A violation here should break the build the same
      // way a type error does — a story that reports a problem nobody is forced
      // to look at is how the whole suite sat broken without anyone noticing.
      test: 'error',
    },
  },
}

export default preview
