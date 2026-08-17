import type { Meta, StoryObj } from '@storybook/react-vite'
import { Folder, House, Settings, User } from 'lucide-react'

import { Breadcrumbs } from './Breadcrumbs'

const separators = ['slash', 'chevron', 'arrow', 'dot'] as const

const meta = {
  title: 'Components/Breadcrumbs',
  component: Breadcrumbs,
  argTypes: {
    separator: { control: 'select', options: separators },
    children: { table: { disable: true } },
  },
  args: {
    separator: 'slash',
    children: (
      <>
        <Breadcrumbs.Item href="/">Home</Breadcrumbs.Item>
        <Breadcrumbs.Item href="/projects">Projects</Breadcrumbs.Item>
        <Breadcrumbs.Item>My Project</Breadcrumbs.Item>
      </>
    ),
  },
} satisfies Meta<typeof Breadcrumbs>

export default meta
type Story = StoryObj<typeof meta>

/**
 * A three-crumb trail with controls — use the Theme switch in the toolbar for
 * dark mode. The last crumb is the current page automatically: it renders as
 * plain text with `aria-current="page"` rather than a link.
 */
export const Playground: Story = {}

/**
 * The four styles from the Figma Separator set. Slash is the literal character
 * at text-base; chevron, arrow and dot are Lucide glyphs rendered through
 * <Icon> at 16px. All four sit in the same 16px box, so swapping one for
 * another never reflows the trail.
 */
export const Separators: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <table className="border-separate border-spacing-x-6 border-spacing-y-3">
      <thead>
        <tr>
          <th>
            <span className="sr-only">Separator</span>
          </th>
          <th className="text-left text-sm font-normal text-content-subtle">Trail</th>
        </tr>
      </thead>
      <tbody>
        {separators.map((separator) => (
          <tr key={separator}>
            <td className="text-sm text-content-subtle capitalize">{separator}</td>
            <td>
              {/* Each trail needs its own aria-label here. A page normally has
                  one, so the default name is fine — but several sharing the
                  name "Breadcrumb" are indistinguishable landmarks, which axe
                  flags as landmark-unique. This is the case the prop exists
                  for. */}
              <Breadcrumbs separator={separator} aria-label={`${separator} separator`}>
                <Breadcrumbs.Item href="/">Home</Breadcrumbs.Item>
                <Breadcrumbs.Item href="/docs">Docs</Breadcrumbs.Item>
                <Breadcrumbs.Item>API Reference</Breadcrumbs.Item>
              </Breadcrumbs>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  ),
}

/**
 * The Figma state table. Hover and focus are real CSS states rather than props,
 * so these are live: hover the first crumb to see the underline, and tab to it
 * to see the focus ring (a 2px gap and a 3px ring, rounded-md). It is drawn
 * with `box-shadow` outside the crumb, so nothing shifts when it appears.
 *
 * The current page has no states at all — Figma gives Type=Current Page only a
 * Default state, so it renders as static text.
 */
export const States: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <table className="border-separate border-spacing-x-6 border-spacing-y-3">
      <thead>
        <tr>
          <th>
            <span className="sr-only">State</span>
          </th>
          <th className="text-left text-sm font-normal text-content-subtle">Item</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="text-sm text-content-subtle">Link — default</td>
          <td>
            <Breadcrumbs aria-label="Link, default state">
              <Breadcrumbs.Item href="/">Label</Breadcrumbs.Item>
              <Breadcrumbs.Item href="/projects">Projects</Breadcrumbs.Item>
            </Breadcrumbs>
          </td>
        </tr>
        <tr>
          <td className="text-sm text-content-subtle">Link — hover / focus</td>
          <td>
            <Breadcrumbs aria-label="Link, hover and focus state">
              <Breadcrumbs.Item href="/">Hover or tab to me</Breadcrumbs.Item>
              <Breadcrumbs.Item href="/projects">Projects</Breadcrumbs.Item>
            </Breadcrumbs>
          </td>
        </tr>
        <tr>
          <td className="text-sm text-content-subtle">Link — disabled</td>
          <td>
            <Breadcrumbs aria-label="Link, disabled state">
              <Breadcrumbs.Item href="/" disabled>
                Label
              </Breadcrumbs.Item>
              <Breadcrumbs.Item href="/projects">Projects</Breadcrumbs.Item>
            </Breadcrumbs>
          </td>
        </tr>
        <tr>
          <td className="text-sm text-content-subtle">Current page</td>
          <td>
            <Breadcrumbs aria-label="Current page state">
              <Breadcrumbs.Item href="/">Home</Breadcrumbs.Item>
              <Breadcrumbs.Item>Label</Breadcrumbs.Item>
            </Breadcrumbs>
          </td>
        </tr>
      </tbody>
    </table>
  ),
}

/**
 * The Figma icon slot, available on both link and current-page crumbs. Pass a
 * Lucide icon component — Breadcrumbs renders it through <Icon> at 16px, so
 * glyph size and stroke weight come from the design system rather than the call
 * site. A house icon on the root crumb is the usual case.
 */
export const WithIcons: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-4">
      <Breadcrumbs aria-label="Settings trail">
        <Breadcrumbs.Item href="/" startIcon={House}>
          Home
        </Breadcrumbs.Item>
        <Breadcrumbs.Item href="/settings" startIcon={Settings}>
          Settings
        </Breadcrumbs.Item>
        <Breadcrumbs.Item startIcon={User}>Profile</Breadcrumbs.Item>
      </Breadcrumbs>
      <Breadcrumbs separator="chevron" aria-label="Files trail">
        <Breadcrumbs.Item href="/" startIcon={House}>
          Home
        </Breadcrumbs.Item>
        <Breadcrumbs.Item href="/files" startIcon={Folder}>
          Files
        </Breadcrumbs.Item>
        <Breadcrumbs.Item>Report.pdf</Breadcrumbs.Item>
      </Breadcrumbs>
    </div>
  ),
}

/**
 * Five levels — deep enough for e-commerce or a file browser, and the point at
 * which a trail stops helping. Past this, simplify the hierarchy rather than
 * lengthening the breadcrumb.
 */
export const DeepPath: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Breadcrumbs>
      <Breadcrumbs.Item href="/">Home</Breadcrumbs.Item>
      <Breadcrumbs.Item href="/products">Products</Breadcrumbs.Item>
      <Breadcrumbs.Item href="/products/electronics">Electronics</Breadcrumbs.Item>
      <Breadcrumbs.Item href="/products/electronics/phones">Phones</Breadcrumbs.Item>
      <Breadcrumbs.Item>iPhone 15 Pro</Breadcrumbs.Item>
    </Breadcrumbs>
  ),
}

/**
 * Where a breadcrumb belongs: above the page heading, so the reader sees where
 * they are before they read the content. It supplements the main navigation
 * rather than replacing it, and is left off top-level pages that have no parent.
 */
export const InContext: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex max-w-md flex-col gap-3">
      <Breadcrumbs separator="chevron">
        <Breadcrumbs.Item href="/" startIcon={House}>
          Home
        </Breadcrumbs.Item>
        <Breadcrumbs.Item href="/projects">Projects</Breadcrumbs.Item>
        <Breadcrumbs.Item>Quarterly report</Breadcrumbs.Item>
      </Breadcrumbs>
      <h1 className="text-2xl font-semibold text-content-primary">Quarterly report</h1>
      <p className="text-base text-content-primary">
        The trail sits directly above the heading it describes. Its links stay neutral rather than
        blue, so they read as chrome and never compete with the page content.
      </p>
    </div>
  ),
}
