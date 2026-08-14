import type { Meta, StoryObj } from '@storybook/react-vite'
import { AlertTriangle, ArrowRight, Bell, Check, Heart, Plus, Search, Settings, Star, Trash2 } from 'lucide-react'

import { Icon } from './Icon'

const sizes = ['small', 'base', 'large', 'x-large'] as const

const sizeLabels: Record<(typeof sizes)[number], string> = {
  small: 'Small · 12px',
  base: 'Base · 16px',
  large: 'Large · 20px',
  'x-large': 'X-Large · 24px',
}

const meta = {
  title: 'Components/Icon',
  component: Icon,
  argTypes: {
    size: { control: 'select', options: sizes },
    icon: { table: { disable: true } },
  },
  args: {
    icon: Star,
    size: 'base',
  },
} satisfies Meta<typeof Icon>

export default meta
type Story = StoryObj<typeof meta>

/** Single icon with controls — use the Theme switch in the toolbar for dark mode. */
export const Playground: Story = {}

/** The four sizes from the Figma `Size` property. */
export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="flex items-end gap-8">
      {sizes.map((size) => (
        <div key={size} className="flex flex-col items-center gap-2">
          <Icon {...args} size={size} />
          <span className="text-sm text-content-subtle">{sizeLabels[size]}</span>
        </div>
      ))}
    </div>
  ),
}

/**
 * Icons inherit `currentColor`, so they pick up whatever text colour surrounds
 * them. That is what lets the same component sit correctly inside a dark
 * Primary button and a light page.
 */
export const InheritsColour: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="flex flex-col gap-3">
      <p className="flex items-center gap-2 text-content-primary">
        <Icon {...args} icon={Check} /> text-content-primary
      </p>
      <p className="flex items-center gap-2 text-content-subtle">
        <Icon {...args} icon={Bell} /> text-content-subtle
      </p>
      <p className="flex items-center gap-2 text-content-danger">
        <Icon {...args} icon={AlertTriangle} /> text-content-danger
      </p>
      <p className="flex items-center gap-2 text-action-link-foreground">
        <Icon {...args} icon={ArrowRight} /> text-action-link-foreground
      </p>
    </div>
  ),
}

/** Any Lucide glyph works — import it from `lucide-react` and pass it through. */
export const Gallery: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="flex flex-wrap gap-6">
      {[Plus, Search, Settings, Trash2, Heart, Star, Bell, Check, ArrowRight, AlertTriangle].map((glyph, i) => (
        <Icon key={i} {...args} icon={glyph} size="large" />
      ))}
    </div>
  ),
}
