import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'

import { ThemeControl, type Theme } from './ThemeControl'

/**
 * The button that switches between the light and dark themes.
 *
 * It reports the intent and stops — no `classList.toggle`, no `localStorage`.
 * The theme usually has to survive a reload and sync with a user setting, and
 * those are the application's decisions. See `Wired` for the three lines.
 */
const meta = {
  title: 'Components/ThemeControl',
  component: ThemeControl,
  argTypes: {
    theme: { control: 'inline-radio', options: ['light', 'dark'] },
  },
  args: {
    defaultTheme: 'light',
  },
} satisfies Meta<typeof ThemeControl>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Uncontrolled: it flips its own icon and tells you what it switched to. The
 * page does not change, because the component does not touch it.
 */
export const Playground: Story = {}

/**
 * Both variants side by side. The icon is the theme you would *get*, not the
 * one you are in — a moon while the page is light. The accessible name says so
 * rather than leaving it to be inferred: "Switch to dark theme".
 */
export const BothThemes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex items-center gap-6">
      <div className="flex items-center gap-2">
        <ThemeControl theme="light" />
        <code className="text-sm text-content-subtle">theme=&quot;light&quot;</code>
      </div>
      <div className="flex items-center gap-2">
        <ThemeControl theme="dark" />
        <code className="text-sm text-content-subtle">theme=&quot;dark&quot;</code>
      </div>
    </div>
  ),
}

/**
 * Controlled, and actually wired to the document — which is the whole of what
 * an application has to add.
 *
 * It fights Storybook's own **Theme** toolbar, because both are writing the
 * same class on the same element. That is not a bug in either one; it is what
 * two owners of one piece of state looks like, and the reason this component
 * does not claim to be one of them.
 */
export const Wired: Story = {
  parameters: { controls: { disable: true } },
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [theme, setTheme] = useState<Theme>('light')
    return (
      <div className="flex items-center gap-3">
        <ThemeControl
          theme={theme}
          onThemeChange={(next) => {
            setTheme(next)
            document.documentElement.classList.toggle('dark', next === 'dark')
          }}
        />
        <p className="text-base text-content-subtle">
          The page is {theme}. Press it and the canvas behind this story changes with it.
        </p>
      </div>
    )
  },
}
