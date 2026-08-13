import type { Meta, StoryObj } from '@storybook/react-vite'

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
          <th />
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
          <th />
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

/** The Start Icon / End Icon slots from the Figma component. */
export const WithIcons: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="flex flex-wrap items-center gap-4">
      {sizes.map((size) => (
        <Button key={`start-${size}`} {...args} size={size} startIcon={<PlusIcon />}>
          Create
        </Button>
      ))}
      {sizes.map((size) => (
        <Button key={`end-${size}`} {...args} size={size} appearance="secondary" endIcon={<ArrowIcon />}>
          Continue
        </Button>
      ))}
    </div>
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

function PlusIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
      <path d="M8 3.5v9M3.5 8h9" />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3.5 8h9M9 4.5 12.5 8 9 11.5" />
    </svg>
  )
}
