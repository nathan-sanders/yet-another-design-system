import type { Meta, StoryObj } from '@storybook/react-vite'
import { ArrowRight, Plus } from 'lucide-react'

import { Button } from './Button'

const appearances = ['primary', 'secondary', 'destructive', 'ghost', 'overlay', 'link'] as const
const sizes = ['small', 'default', 'large'] as const

const meta = {
  title: 'Components/Button',
  component: Button,
  argTypes: {
    appearance: { control: 'select', options: appearances },
    size: { control: 'select', options: sizes },
    disabled: { control: 'boolean' },
    children: { control: 'text' },
  },
  args: {
    children: 'Button',
    appearance: 'primary',
    size: 'default',
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

/** Single button with controls — use the Theme switch in the toolbar for dark mode. */
export const Playground: Story = {}

/** Every appearance at every size — the full Figma variant grid. */
export const AllVariants: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <table className="border-separate border-spacing-x-6 border-spacing-y-3">
      <thead>
        <tr>
          <th><span className="sr-only">Appearance</span></th>
          {sizes.map((size) => (
            <th key={size} className="text-left text-sm font-normal text-content-subtle capitalize">
              {size}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {appearances.map((appearance) => (
          <tr key={appearance}>
            <td className="text-sm text-content-subtle capitalize">{appearance}</td>
            {sizes.map((size) => (
              <td key={size}>
                <Button {...args} appearance={appearance} size={size} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  ),
}

/**
 * Default and disabled side by side. Hover and focus are real browser states —
 * hover with the mouse, and press Tab to see the two-ring focus treatment.
 */
export const States: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <table className="border-separate border-spacing-x-6 border-spacing-y-3">
      <thead>
        <tr>
          <th><span className="sr-only">Appearance</span></th>
          <th className="text-left text-sm font-normal text-content-subtle">Default</th>
          <th className="text-left text-sm font-normal text-content-subtle">Disabled</th>
        </tr>
      </thead>
      <tbody>
        {appearances.map((appearance) => (
          <tr key={appearance}>
            <td className="text-sm text-content-subtle capitalize">{appearance}</td>
            <td>
              <Button {...args} appearance={appearance} />
            </td>
            <td>
              <Button {...args} appearance={appearance} disabled />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  ),
}

/**
 * The Start Icon / End Icon slots from the Figma component. Pass a Lucide icon
 * component — the Button renders it through <Icon>, so the glyph size and
 * stroke weight come from the design system rather than the call site.
 */
export const WithIcons: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="flex flex-wrap items-center gap-4">
      {sizes.map((size) => (
        <Button key={`start-${size}`} {...args} size={size} startIcon={Plus}>
          Create
        </Button>
      ))}
      {sizes.map((size) => (
        <Button key={`end-${size}`} {...args} size={size} appearance="secondary" endIcon={ArrowRight}>
          Continue
        </Button>
      ))}
    </div>
  ),
}

/**
 * Icon-only: a start icon and no label. It keeps the same height *and the same
 * left/right padding* as the labelled version, so the width simply follows the
 * icon — 42x32 at default size, matching Figma. It is not squared off.
 *
 * There is no visible text, so `aria-label` is what names the button for screen
 * readers — it is required by the types, and a missing one will not compile.
 */
export const IconOnly: Story = {
  parameters: { controls: { disable: true } },
  render: ({ children: _label, ...args }) => (
    <table className="border-separate border-spacing-x-6 border-spacing-y-3">
      <thead>
        <tr>
          <th><span className="sr-only">Appearance</span></th>
          {sizes.map((size) => (
            <th key={size} className="text-left text-sm font-normal text-content-subtle capitalize">
              {size}
            </th>
          ))}
          <th className="text-left text-sm font-normal text-content-subtle">Disabled</th>
          <th className="text-left text-sm font-normal text-content-subtle">With label</th>
        </tr>
      </thead>
      <tbody>
        {appearances.map((appearance) => (
          <tr key={appearance}>
            <td className="text-sm text-content-subtle capitalize">{appearance}</td>
            {sizes.map((size) => (
              <td key={size}>
                <Button {...args} appearance={appearance} size={size} startIcon={Plus} aria-label="Create" />
              </td>
            ))}
            <td>
              <Button {...args} appearance={appearance} startIcon={Plus} aria-label="Create" disabled />
            </td>
            <td>
              <Button {...args} appearance={appearance} startIcon={Plus}>
                Create
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  ),
}

/**
 * Overlay is designed to sit on top of imagery or a dark scrim, so it is shown
 * here against a filled surface rather than the page background.
 */
export const OverlayOnScrim: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="flex items-center gap-4 rounded-lg bg-content-emphasized p-8">
      {sizes.map((size) => (
        <Button key={size} {...args} appearance="overlay" size={size} />
      ))}
    </div>
  ),
}

