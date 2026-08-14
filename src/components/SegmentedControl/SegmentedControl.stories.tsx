import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { LayoutGrid, List, Table } from 'lucide-react'

import { SegmentedControl, type SegmentedControlAppearance } from './SegmentedControl'
import { Button } from '../Button'

const appearances = ['secondary', 'ghost'] as const
const sizes = ['small', 'default', 'large'] as const

const meta = {
  title: 'Components/SegmentedControl',
  component: SegmentedControl,
  argTypes: {
    appearance: { control: 'select', options: appearances },
    size: { control: 'select', options: sizes },
    layout: { control: 'inline-radio', options: ['hug', 'fill'] },
    disabled: { control: 'boolean' },
  },
  args: {
    appearance: 'secondary',
    size: 'default',
    layout: 'hug',
    defaultValue: 'grid',
    'aria-label': 'View mode',
    children: (
      <>
        <SegmentedControl.Item value="grid">Grid</SegmentedControl.Item>
        <SegmentedControl.Item value="list">List</SegmentedControl.Item>
        <SegmentedControl.Item value="table">Table</SegmentedControl.Item>
      </>
    ),
  },
} satisfies Meta<typeof SegmentedControl>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Uncontrolled, with controls — use the Theme switch in the toolbar for dark
 * mode. Click a segment, or focus one and press the arrow keys: selection
 * follows focus, which is how a radio group is meant to behave.
 */
export const Playground: Story = {}

/** Both appearances at every size — the full Figma variant grid. */
export const AllVariants: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <table className="border-separate border-spacing-x-6 border-spacing-y-3">
      <thead>
        <tr>
          <th>
            <span className="sr-only">Appearance</span>
          </th>
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
                <SegmentedControl
                  {...args}
                  appearance={appearance}
                  size={size}
                  aria-label={`View mode, ${appearance} ${size}`}
                />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  ),
}

/**
 * Disabling the whole group versus disabling one option. Hover and focus are
 * real browser states — hover an unselected segment, and press Tab to see the
 * two-ring focus treatment. Note that Tab lands on the *selected* segment only:
 * the group is one tab stop, and the arrow keys move within it.
 */
export const States: Story = {
  parameters: { controls: { disable: true } },
  render: ({ children: _children, ...args }) => (
    <table className="border-separate border-spacing-x-6 border-spacing-y-3">
      <thead>
        <tr>
          <th>
            <span className="sr-only">Appearance</span>
          </th>
          <th className="text-left text-sm font-normal text-content-subtle">Default</th>
          <th className="text-left text-sm font-normal text-content-subtle">One item disabled</th>
          <th className="text-left text-sm font-normal text-content-subtle">Group disabled</th>
        </tr>
      </thead>
      <tbody>
        {appearances.map((appearance) => (
          <tr key={appearance}>
            <td className="text-sm text-content-subtle capitalize">{appearance}</td>
            <td>
              <SegmentedControl {...args} appearance={appearance} aria-label={`${appearance} default`}>
                <SegmentedControl.Item value="grid">Grid</SegmentedControl.Item>
                <SegmentedControl.Item value="list">List</SegmentedControl.Item>
                <SegmentedControl.Item value="table">Table</SegmentedControl.Item>
              </SegmentedControl>
            </td>
            <td>
              <SegmentedControl {...args} appearance={appearance} aria-label={`${appearance} one disabled`}>
                <SegmentedControl.Item value="grid">Grid</SegmentedControl.Item>
                <SegmentedControl.Item value="list">List</SegmentedControl.Item>
                <SegmentedControl.Item value="table" disabled>
                  Table
                </SegmentedControl.Item>
              </SegmentedControl>
            </td>
            <td>
              <SegmentedControl
                {...args}
                appearance={appearance}
                disabled
                aria-label={`${appearance} group disabled`}
              >
                <SegmentedControl.Item value="grid">Grid</SegmentedControl.Item>
                <SegmentedControl.Item value="list">List</SegmentedControl.Item>
                <SegmentedControl.Item value="table">Table</SegmentedControl.Item>
              </SegmentedControl>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  ),
}

/**
 * The Figma `icon` slot. Pass a Lucide icon component — the segment renders it
 * through <Icon>, so the glyph size (12px at small, 16px otherwise) and stroke
 * weight come from the design system rather than the call site.
 */
export const WithIcons: Story = {
  parameters: { controls: { disable: true } },
  render: ({ children: _children, ...args }) => (
    <div className="flex flex-wrap items-center gap-4">
      {sizes.map((size) => (
        <SegmentedControl key={size} {...args} size={size} aria-label={`View mode, ${size}`}>
          <SegmentedControl.Item value="grid" startIcon={LayoutGrid}>
            Grid
          </SegmentedControl.Item>
          <SegmentedControl.Item value="list" startIcon={List}>
            List
          </SegmentedControl.Item>
          <SegmentedControl.Item value="table" startIcon={Table}>
            Table
          </SegmentedControl.Item>
        </SegmentedControl>
      ))}
    </div>
  ),
}

/**
 * Icon-only: an icon and no label. Each segment becomes a square at its size
 * (20 / 28 / 36), so the control keeps the same 24 / 32 / 40 outer height as
 * the labelled version.
 *
 * There is no visible text, so `aria-label` is what names each segment — it is
 * required by the types, and a missing one will not compile.
 */
export const IconOnly: Story = {
  parameters: { controls: { disable: true } },
  render: ({ children: _children, ...args }) => (
    <div className="flex flex-wrap items-center gap-4">
      {sizes.map((size) => (
        <SegmentedControl key={size} {...args} size={size} aria-label={`View mode, ${size}`}>
          <SegmentedControl.Item value="grid" startIcon={LayoutGrid} aria-label="Grid" />
          <SegmentedControl.Item value="list" startIcon={List} aria-label="List" />
          <SegmentedControl.Item value="table" startIcon={Table} aria-label="Table" />
        </SegmentedControl>
      ))}
    </div>
  ),
}

/**
 * `layout="fill"` stretches the segments to equal widths across the container,
 * for a fixed-width panel or sidebar where a hugging control would look adrift.
 * Both are shown in the same 320px column.
 */
export const FillLayout: Story = {
  parameters: { controls: { disable: true } },
  render: ({ children: _children, ...args }) => (
    <div className="flex w-80 flex-col gap-4">
      <SegmentedControl {...args} layout="fill" aria-label="Range, fill">
        <SegmentedControl.Item value="grid">Daily</SegmentedControl.Item>
        <SegmentedControl.Item value="list">Weekly</SegmentedControl.Item>
        <SegmentedControl.Item value="table">Monthly</SegmentedControl.Item>
      </SegmentedControl>
      <SegmentedControl {...args} layout="hug" aria-label="Range, hug">
        <SegmentedControl.Item value="grid">Daily</SegmentedControl.Item>
        <SegmentedControl.Item value="list">Weekly</SegmentedControl.Item>
        <SegmentedControl.Item value="table">Monthly</SegmentedControl.Item>
      </SegmentedControl>
    </div>
  ),
}

/**
 * A controlled toolbar row. Extracted into its own component because `useState`
 * cannot live in a story's `render` arrow — the rules-of-hooks lint reads a
 * lowercase function as "not a component".
 */
function ToolbarRows({ appearance }: { appearance: SegmentedControlAppearance }) {
  const [view, setView] = useState('grid')

  return (
    <div className="flex flex-col gap-4">
      {sizes.map((size) => (
        <div key={size} className="flex items-center gap-3">
          <SegmentedControl
            appearance={appearance}
            size={size}
            value={view}
            onValueChange={setView}
            aria-label={`View mode, ${size}`}
          >
            <SegmentedControl.Item value="grid" startIcon={LayoutGrid}>
              Grid
            </SegmentedControl.Item>
            <SegmentedControl.Item value="list" startIcon={List}>
              List
            </SegmentedControl.Item>
            <SegmentedControl.Item value="table" startIcon={Table}>
              Table
            </SegmentedControl.Item>
          </SegmentedControl>
          <Button appearance="secondary" size={size}>
            Filter
          </Button>
          <Button appearance="ghost" size={size}>
            Sort
          </Button>
          <span className="text-sm text-content-subtle">
            {size} — showing {view}
          </span>
        </div>
      ))}
    </div>
  )
}

/**
 * Controlled, and next to a Button of the matching size. The point of the size
 * scale is that the two heights agree — 24 / 32 / 40 — so a toolbar row lines
 * up without anyone nudging a margin.
 */
export const InContext: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => <ToolbarRows appearance={args.appearance ?? 'secondary'} />,
}
