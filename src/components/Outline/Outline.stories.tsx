import { useRef, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'

import { Outline } from './Outline'
import type { OutlineItem } from './Outline'
import { useOutlineFromDOM } from './useOutlineFromDOM'

/**
 * Astryx's own example, and the fixture most stories start from: five
 * headings, one of them a subsection, so the indent has something to show.
 */
const docs: OutlineItem[] = [
  { id: 'overview', label: 'Overview', level: 2 },
  { id: 'installation', label: 'Installation', level: 2 },
  { id: 'theming', label: 'Theming', level: 2 },
  { id: 'tokens', label: 'Tokens', level: 3 },
  { id: 'accessibility', label: 'Accessibility', level: 2 },
]

const meta = {
  title: 'Components/Outline',
  component: Outline,
  argTypes: {
    size: { control: 'radio', options: ['default', 'small'] },
    items: { control: false },
    activeId: { control: false },
    scrollContainerRef: { control: false },
  },
  args: {
    items: docs,
    size: 'default',
    // The headings are not on this canvas, so the spy has nothing to read and
    // the mark stays where it is put.
    defaultActiveId: 'theming',
  },
} satisfies Meta<typeof Outline>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Astryx draws the outline 240 wide. It is fluid; the frame is the story's
 * job — and it goes on the stories rather than the meta, because a story's
 * decorators nest *inside* the meta's, so a meta frame would box in the
 * wide compositions too.
 */
const frame: NonNullable<Story['decorators']> = [
  (Story) => (
    <div className="w-60">
      <Story />
    </div>
  ),
]

const linkOf = (canvas: ReturnType<typeof within>, name: string) => canvas.getByRole('link', { name })

/** The indicator, which is `aria-hidden` and so reached by its class rather than a role. */
const indicatorOf = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLElement>('nav > span > span') as HTMLElement

/**
 * Uncontrolled, with controls — use the Theme switch in the toolbar for dark
 * mode. Click a heading to mark it; the indicator slides to it.
 */
export const Playground: Story = {
  decorators: frame,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('navigation', { name: 'Table of contents' })).toBeInTheDocument()
    // Five links, in a list, every one of them a real anchor to the heading.
    await expect(canvas.getAllByRole('link')).toHaveLength(5)
    await expect(canvas.getAllByRole('listitem')).toHaveLength(5)
    await expect(linkOf(canvas, 'Tokens')).toHaveAttribute('href', '#tokens')
    // "location", not "page": the link points within the page.
    await expect(linkOf(canvas, 'Theming')).toHaveAttribute('aria-current', 'location')
    await expect(linkOf(canvas, 'Overview')).not.toHaveAttribute('aria-current')

    // The indicator is the height of the active link and sits beside it.
    const theming = linkOf(canvas, 'Theming')
    const indicator = indicatorOf(canvasElement)
    await waitFor(() => {
      const rect = indicator.getBoundingClientRect()
      const target = theming.getBoundingClientRect()
      expect(Math.round(rect.height)).toBe(Math.round(target.height))
      expect(Math.round(rect.top)).toBe(Math.round(target.top))
    })
    // Tabs' pair: a 1px rule and a 2px indicator painting over it.
    await expect(getComputedStyle(indicator).width).toBe('2px')
    await expect(getComputedStyle(indicator.parentElement!).width).toBe('1px')

    // Click another heading: the mark and the indicator move to it.
    await userEvent.click(linkOf(canvas, 'Accessibility'))
    await waitFor(() => expect(linkOf(canvas, 'Accessibility')).toHaveAttribute('aria-current', 'location'))
    await expect(theming).not.toHaveAttribute('aria-current')
    await waitFor(() => {
      const rect = indicator.getBoundingClientRect()
      expect(Math.round(rect.top)).toBe(Math.round(linkOf(canvas, 'Accessibility').getBoundingClientRect().top))
    })
  },
}

/**
 * The two row heights are Tabs': `default` is 32px at `text-base`, `small` is
 * 24px at `text-sm`. Astryx's `density`, on the house scale.
 */
export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="flex gap-10">
      <Outline {...args} className="w-60" aria-label="Default size" />
      <Outline {...args} className="w-60" aria-label="Small size" size="small" />
    </div>
  ),
  decorators: [
    (Story) => (
      <div className="w-130">
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const [large, small] = canvas.getAllByRole('navigation')
    await expect(within(large).getByRole('link', { name: 'Overview' })).toHaveStyle({ height: '32px', fontSize: '14px' })
    await expect(within(small).getByRole('link', { name: 'Overview' })).toHaveStyle({ height: '24px', fontSize: '12px' })
    // The indicator follows the row height.
    await waitFor(() => expect(getComputedStyle(large.querySelector('nav > span > span')!).height).toBe('32px'))
    await waitFor(() => expect(getComputedStyle(small.querySelector('nav > span > span')!).height).toBe('24px'))
    // Tabs' 4px between the mark and what it marks.
    const track = large.querySelector('nav > span')!.getBoundingClientRect()
    const list = large.querySelector('ul')!.getBoundingClientRect()
    await expect(list.left - track.right).toBe(4)
  },
}

const nested: OutlineItem[] = [
  { id: 'introduction', label: 'Introduction', level: 1 },
  { id: 'concepts', label: 'Core concepts', level: 2 },
  { id: 'n-tokens', label: 'Tokens', level: 3 },
  { id: 'color', label: 'Color', level: 4 },
  { id: 'spacing', label: 'Spacing', level: 4 },
  { id: 'components', label: 'Components', level: 2 },
  { id: 'primitives', label: 'Primitives', level: 3 },
  { id: 'patterns', label: 'Patterns', level: 3 },
  { id: 'resources', label: 'Resources', level: 1 },
]

/**
 * Levels 1 and 2 sit on the base indent — an `<h1>` is the document's title,
 * not a section deeper than the sections under it — and every level after
 * steps in 16px. Four steps is where 240px runs out of room for a label.
 */
export const DeepNesting: Story = {
  decorators: frame,
  parameters: { controls: { disable: true } },
  args: { items: nested, defaultActiveId: 'color' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(linkOf(canvas, 'Introduction')).toHaveStyle({ paddingLeft: '12px' })
    await expect(linkOf(canvas, 'Core concepts')).toHaveStyle({ paddingLeft: '12px' })
    await expect(linkOf(canvas, 'Tokens')).toHaveStyle({ paddingLeft: '28px' })
    await expect(linkOf(canvas, 'Color')).toHaveStyle({ paddingLeft: '44px' })
    // The indicator does not indent: it marks the row, on the track.
    const indicator = indicatorOf(canvasElement)
    await waitFor(() =>
      expect(Math.round(indicator.getBoundingClientRect().top)).toBe(
        Math.round(linkOf(canvas, 'Color').getBoundingClientRect().top),
      ),
    )
    await expect(indicator.getBoundingClientRect().left).toBe(
      canvas.getByRole('navigation').getBoundingClientRect().left,
    )
  },
}

/**
 * The mark owned from outside. Providing `activeId` turns the built-in
 * scroll-spy off, so your own logic decides — the outline reports a click and
 * paints whatever it is handed back.
 */
export const Controlled: Story = {
  decorators: frame,
  parameters: { controls: { disable: true } },
  args: { onActiveChange: fn() },
  render: function ControlledStory(args) {
    const [active, setActive] = useState('installation')
    return (
      <div className="flex flex-col gap-4">
        <Outline
          {...args}
          activeId={active}
          onActiveChange={(id) => {
            setActive(id)
            args.onActiveChange?.(id)
          }}
        />
        <p className="text-sm text-content-subtle">
          Active section: <span className="text-content-primary">{active}</span>
        </p>
      </div>
    )
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await expect(linkOf(canvas, 'Installation')).toHaveAttribute('aria-current', 'location')
    await userEvent.click(linkOf(canvas, 'Accessibility'))
    await expect(args.onActiveChange).toHaveBeenCalledWith('accessibility')
    await waitFor(() => expect(linkOf(canvas, 'Accessibility')).toHaveAttribute('aria-current', 'location'))
    await expect(canvas.getByText('accessibility')).toBeInTheDocument()
    // The already-active link reports nothing: it did not change.
    await userEvent.click(linkOf(canvas, 'Accessibility'))
    await expect(args.onActiveChange).toHaveBeenCalledTimes(1)
  },
}

/**
 * A `<nav>` of anchors: every heading is its own Tab stop, and the ring sits
 * on the focused link alone. No arrow keys — Tab already walks a list of
 * links, and that is the rule that keeps Breadcrumbs and SideNav plain.
 */
export const Keyboard: Story = {
  decorators: frame,
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const links = canvas.getAllByRole('link')
    // None of them opts out of the tab order.
    for (const link of links) await expect(link).not.toHaveAttribute('tabindex')

    await userEvent.tab()
    await waitFor(() => expect(links[0]).toHaveFocus())
    // A real key press, not a scripted focus, is what makes :focus-visible match.
    await waitFor(() => expect(getComputedStyle(links[0]).boxShadow).not.toBe('none'))
    await expect(getComputedStyle(links[1]).boxShadow).toBe('none')

    await userEvent.tab()
    await waitFor(() => expect(links[1]).toHaveFocus())
    await expect(getComputedStyle(links[0]).boxShadow).toBe('none')

    // Enter follows the link: it becomes the active heading.
    await userEvent.keyboard('{Enter}')
    await waitFor(() => expect(links[1]).toHaveAttribute('aria-current', 'location'))
  },
}

const sections = [
  { id: 'summary', label: 'Summary' },
  { id: 'details', label: 'Details' },
  { id: 'results', label: 'Results' },
  { id: 'next-steps', label: 'Next steps' },
]

function Filler({ paragraphs = 3 }: { paragraphs?: number }) {
  return Array.from({ length: paragraphs }, (_, index) => (
    <p key={index} className="text-base text-content-primary">
      The outline reads the heading positions off the page as it scrolls, and marks the last one
      whose top edge has reached the activation line. Clicking a heading scrolls the container to
      it, and the mark waits for the scroll to settle before it follows the page again.
    </p>
  ))
}

/**
 * The scroll-spy, against content that scrolls in its own box rather than the
 * viewport — a split pane, a panel, a drawer. `scrollContainerRef` says which
 * box; without it the outline looks for the nearest scrollable ancestor of the
 * first heading, which here would find the same one.
 */
export const ScrollSpy: Story = {
  parameters: { controls: { disable: true } },
  args: { onActiveChange: fn(), onNavigateStart: fn(), onNavigateEnd: fn() },
  render: function ScrollSpyStory(args) {
    const container = useRef<HTMLDivElement>(null)
    return (
      <div className="flex gap-8">
        {/* A scrollable region needs a tab stop and a name, or axe fails it:
            a box you can only reach by dragging is unreachable from a keyboard. */}
        <div
          ref={container}
          data-testid="scroll-container"
          role="region"
          aria-label="Report"
          tabIndex={0}
          className="h-80 w-100 overflow-y-auto rounded-md border border-surface-border p-4"
        >
          <div className="flex flex-col gap-3">
            {sections.map((section) => (
              <section key={section.id} className="flex flex-col gap-3">
                <h2 id={section.id} className="text-lg font-semibold text-content-emphasized">
                  {section.label}
                </h2>
                <Filler />
              </section>
            ))}
          </div>
        </div>
        <Outline {...args} items={sections} scrollContainerRef={container} defaultActiveId={undefined} />
      </div>
    )
  },
  decorators: [
    (Story) => (
      <div className="w-170">
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const container = canvas.getByTestId('scroll-container')
    // At the top, the first heading is active before anything has scrolled.
    await waitFor(() => expect(linkOf(canvas, 'Summary')).toHaveAttribute('aria-current', 'location'))

    // Scroll the box so that "Results" has reached the top: it becomes active.
    const results = container.querySelector<HTMLElement>('#results')!
    container.scrollTop = results.offsetTop - container.offsetTop + 2
    await waitFor(() => expect(linkOf(canvas, 'Results')).toHaveAttribute('aria-current', 'location'))
    await expect(args.onActiveChange).toHaveBeenLastCalledWith('results')

    // At the end of the scroll the last heading is active, whether or not it
    // has reached the top: the last section is shorter than the box.
    container.scrollTop = container.scrollHeight
    await waitFor(() => expect(linkOf(canvas, 'Next steps')).toHaveAttribute('aria-current', 'location'))

    // Click a heading: the box scrolls to it, and the navigate callbacks
    // bracket the scroll.
    await userEvent.click(linkOf(canvas, 'Details'))
    await expect(args.onNavigateStart).toHaveBeenCalledWith('details')
    await waitFor(() => expect(linkOf(canvas, 'Details')).toHaveAttribute('aria-current', 'location'))
    await waitFor(() => expect(args.onNavigateEnd).toHaveBeenCalledWith('details'), { timeout: 3000 })
    const details = container.querySelector<HTMLElement>('#details')!
    await waitFor(() =>
      expect(Math.abs(details.getBoundingClientRect().top - container.getBoundingClientRect().top)).toBeLessThan(2),
    )
    // Exactly once per start.
    await expect(args.onNavigateEnd).toHaveBeenCalledTimes(1)
  },
}

/**
 * A documentation page: the article on the left, the outline beside it,
 * sticky, with its items read off the article's own headings by
 * `useOutlineFromDOM`. The page scrolls, so the spy follows the window.
 */
export const InContext: Story = {
  parameters: { controls: { disable: true } },
  render: function InContextStory() {
    const article = useRef<HTMLElement>(null)
    const items = useOutlineFromDOM(article)
    return (
      <div className="flex max-w-4xl items-start gap-12">
        <article ref={article} className="flex min-w-0 flex-1 flex-col gap-4">
          <h1 className="text-2xl font-semibold text-content-emphasized">Getting started</h1>
          <p className="text-base text-content-primary">
            The outline beside this article was not written by hand: its items are the article's
            own headings, read off the DOM, so the two cannot disagree.
          </p>
          <h2 id="install" className="mt-4 text-xl font-semibold text-content-emphasized">
            Installation
          </h2>
          <Filler paragraphs={2} />
          <h3 id="requirements" className="text-lg font-semibold text-content-emphasized">
            Requirements
          </h3>
          <Filler paragraphs={2} />
          <h2 id="configure" className="mt-4 text-xl font-semibold text-content-emphasized">
            Configuration
          </h2>
          <Filler paragraphs={3} />
          <h3 id="theme" className="text-lg font-semibold text-content-emphasized">
            Choosing a theme
          </h3>
          <Filler paragraphs={2} />
          <h3 id="neutral" className="text-lg font-semibold text-content-emphasized">
            Choosing a neutral
          </h3>
          <Filler paragraphs={2} />
          <h2 id="usage" className="mt-4 text-xl font-semibold text-content-emphasized">
            Usage
          </h2>
          <Filler paragraphs={4} />
        </article>
        <Outline items={items} className="sticky top-4 w-60 shrink-0" aria-label="On this page" />
      </div>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // Every h2 and h3 with an id, in order; the h1 is the title and left out.
    await waitFor(() => expect(canvas.getAllByRole('link')).toHaveLength(6))
    await expect(canvas.getAllByRole('link').map((link) => link.textContent)).toEqual([
      'Installation',
      'Requirements',
      'Configuration',
      'Choosing a theme',
      'Choosing a neutral',
      'Usage',
    ])
    await expect(linkOf(canvas, 'Requirements')).toHaveStyle({ paddingLeft: '28px' })
    await waitFor(() => expect(linkOf(canvas, 'Installation')).toHaveAttribute('aria-current', 'location'))
  },
}
