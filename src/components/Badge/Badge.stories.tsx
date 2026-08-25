import type { Meta, StoryObj } from '@storybook/react-vite'
import { Check, Circle, X } from 'lucide-react'

import { Badge } from './Badge'

const colors = [
  'neutral',
  'red',
  'orange',
  'amber',
  'yellow',
  'lime',
  'green',
  'emerald',
  'teal',
  'cyan',
  'sky',
  'blue',
  'indigo',
  'violet',
  'purple',
  'fuchsia',
  'pink',
  'rose',
] as const

const meta = {
  title: 'Components/Badge',
  component: Badge,
  argTypes: {
    color: { control: 'select', options: colors },
    children: { control: 'text' },
  },
  args: {
    children: 'Badge',
    color: 'neutral',
  },
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

/** Single badge with controls — use the Theme switch in the toolbar for dark mode. */
export const Playground: Story = {}

/** All 18 Decorative hues — the neutral first, then the spectrum in ramp order. */
export const AllColors: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <table className="border-separate border-spacing-x-6 border-spacing-y-3">
      <thead>
        <tr>
          <th>
            <span className="sr-only">Color</span>
          </th>
          <th className="text-left text-sm font-normal text-content-subtle">Label</th>
          <th className="text-left text-sm font-normal text-content-subtle">Start icon</th>
          <th className="text-left text-sm font-normal text-content-subtle">End icon</th>
          <th className="text-left text-sm font-normal text-content-subtle">Icon only</th>
        </tr>
      </thead>
      <tbody>
        {colors.map((color) => (
          <tr key={color}>
            <td className="text-sm text-content-subtle capitalize">{color}</td>
            <td>
              <Badge {...args} color={color} />
            </td>
            <td>
              <Badge {...args} color={color} startIcon={Check} />
            </td>
            <td>
              <Badge {...args} color={color} endIcon={X} />
            </td>
            <td>
              <Badge color={color} startIcon={Circle} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  ),
}

/**
 * The Start Icon / End Icon slots from the Figma component. Pass a Lucide icon
 * component — Badge renders it through <Icon> at 12px, so glyph size and stroke
 * weight come from the design system rather than the call site.
 */
export const WithIcons: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="flex flex-wrap items-center gap-4">
      <Badge {...args} color="green" startIcon={Check}>
        Approved
      </Badge>
      <Badge {...args} color="red" startIcon={X}>
        Rejected
      </Badge>
      <Badge {...args} color="amber" endIcon={Circle}>
        Pending
      </Badge>
      <Badge color="blue" startIcon={Circle} />
    </div>
  ),
}

/**
 * Badge is static — no hover, focus or disabled state. It sits inline with text
 * and inside other surfaces, so this shows it on the canvas and on a card.
 */
export const InContext: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex max-w-md flex-col gap-4">
      <p className="text-base text-content-primary">
        A badge sits inline with body copy <Badge color="green">Live</Badge> without disturbing the
        line height, because its height is exactly the small line-height.
      </p>
      <div className="flex flex-col gap-3 rounded-lg border border-surface-border bg-surface-primary p-4">
        <div className="flex items-center gap-2">
          <span className="text-base text-content-primary">Deploy pipeline</span>
          <Badge color="green" startIcon={Check}>
            Passing
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-base text-content-primary">Nightly build</span>
          <Badge color="red" startIcon={X}>
            Failing
          </Badge>
        </div>
      </div>
    </div>
  ),
}
