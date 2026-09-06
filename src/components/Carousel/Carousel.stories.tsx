import { useRef, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'

import { Carousel, type CarouselHandle } from './Carousel'
import { AspectRatio } from '../AspectRatio'
import { Button } from '../Button'
import { Card } from '../Card'

const gaps = [0, 1, 2, 3, 4] as const

/**
 * A stand-in slide, at Figma's own 4:5. Numbered, because the whole point of
 * every story below is which one you are looking at — an unlabelled gallery of
 * pretty rectangles cannot show that the carousel moved.
 *
 * `background-primary` and not `background-subtle`, which was the first thing
 * tried and paints nothing: `--surface-background-subtle` and `--surface-canvas`
 * resolve to the same value, so a subtle box on the Storybook canvas is an
 * invisible box. Measured, after a screenshot came back with four dots and no
 * slides.
 */
function Slide({ n }: { n: number }) {
  return (
    <AspectRatio
      ratio="4/5"
      fit="center"
      className="rounded-lg border border-surface-border bg-surface-background-primary"
    >
      <span className="text-xl font-semibold text-content-subtle">{n}</span>
    </AspectRatio>
  )
}

const slides = [1, 2, 3, 4].map((n) => <Slide key={n} n={n} />)

const meta = {
  title: 'Components/Carousel',
  component: Carousel,
  argTypes: {
    gap: { control: 'inline-radio', options: gaps },
    hasPagination: { control: 'boolean' },
    hasSnap: { control: 'boolean' },
    hasLoop: { control: 'boolean' },
  },
  args: {
    'aria-label': 'Sample slides',
    hasPagination: true,
    hasSnap: true,
    hasLoop: false,
    gap: 2,
    children: slides,
  },
} satisfies Meta<typeof Carousel>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Every prop with controls, in a 400px column — Figma's own width for the
 * component, and narrow enough that one slide fills the view exactly as the
 * canvas draws it.
 *
 * Four ways to move, all of them working at once: click an arrow, click a dot,
 * swipe the track with a trackpad, or focus the track and press the arrow keys.
 * The last one is the browser's, not this component's — the scroll container is
 * a tab stop and native keyboard panning does the rest.
 *
 * Turn `hasSnap` off and the track becomes a free strip you can leave halfway
 * between two slides. The dots still follow, because they report the slide that
 * is most visible rather than the one last asked for.
 */
export const Playground: Story = {
  render: (args) => (
    <div className="w-100">
      <Carousel {...args} />
    </div>
  ),
}

/**
 * `hasPagination` is Figma's one property, and it is the whole visible difference
 * between the two variants of the component set. Without it the carousel is a
 * bare track: still snapping, still pannable by trackpad and keyboard, just with
 * nothing drawn to say so.
 *
 * Reach for that only when something else on the page is doing the pointing — a
 * thumbnail strip driving it through `handleRef`, say. On its own it is a
 * gallery with no affordance, which is the shape of carousel people complain
 * about.
 */
export const AllVariants: Story = {
  parameters: { controls: { disable: true } },
  render: ({ children: _children, ...args }) => (
    <div className="flex flex-wrap gap-10">
      <div className="flex w-80 flex-col gap-2">
        <span className="text-sm text-content-subtle">hasPagination (default)</span>
        <Carousel {...args} aria-label="With pagination">
          {slides}
        </Carousel>
      </div>
      <div className="flex w-80 flex-col gap-2">
        <span className="text-sm text-content-subtle">hasPagination={'{false}'}</span>
        <Carousel {...args} aria-label="Without pagination" hasPagination={false}>
          {slides}
        </Carousel>
      </div>
    </div>
  ),
}

/**
 * The dot's four states, which are the Figma set `Carousel Pagination Button`
 * (`State` × `Selected`). Hover the second dot to see the mark take
 * Surface/Background Subtle and a low drop shadow; tab into the carousel and
 * keep going to ring each dot in turn.
 *
 * There is no hover state for the selected dot, and that is Figma's decision
 * rather than an omission — a mark already painted in the emphasized token has
 * nowhere to go, and moving it would take the current slide off its own colour.
 *
 * The arrows are the library's ghost Button, icon-only, so their disabled state
 * is Button's flat 40%: previous is disabled on the first slide and next on the
 * last.
 */
export const States: Story = {
  parameters: { controls: { disable: true } },
  render: ({ children: _children, ...args }) => (
    <div className="flex flex-wrap gap-10">
      <div className="flex w-80 flex-col gap-2">
        <span className="text-sm text-content-subtle">First slide — previous disabled</span>
        <Carousel {...args} aria-label="At the start">
          {slides}
        </Carousel>
      </div>
      <div className="flex w-80 flex-col gap-2">
        <span className="text-sm text-content-subtle">Single slide — both disabled</span>
        <Carousel {...args} aria-label="One slide only">
          <Slide n={1} />
        </Carousel>
      </div>
    </div>
  ),
}

/**
 * `hasLoop` wraps: next at the last slide goes back to the first, previous at the
 * first goes to the last, and neither arrow ever disables. Astryx's prop, and
 * their guidance is the right guidance — reach for it on a small, cyclable set
 * like a photo gallery, where coming back round feels natural, and leave it off
 * for anything with a beginning and an end.
 *
 * The wrap is a scroll, not a jump, so going from slide 4 to slide 1 travels back
 * across the whole track. That is honest about where you have landed, which
 * matters more here than the shorter animation would.
 */
export const Looping: Story = {
  parameters: { controls: { disable: true } },
  render: ({ children: _children, ...args }) => (
    <div className="w-100">
      <Carousel {...args} aria-label="Looping slides" hasLoop>
        {slides}
      </Carousel>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // Both arrows are live from the first slide — that is the whole of hasLoop
    // at the ends, and it is the one assertion a screenshot cannot make.
    await expect(canvas.getByRole('button', { name: 'Previous slide' })).toBeEnabled()
    await expect(canvas.getByRole('button', { name: 'Next slide' })).toBeEnabled()

    await userEvent.click(canvas.getByRole('button', { name: 'Previous slide' }))
    // Smooth scrolling is asynchronous and the IntersectionObserver reports a
    // frame after it settles, so every assertion about the current slide waits.
    await waitFor(() =>
      expect(canvas.getByRole('button', { name: 'Slide 4' })).toHaveAttribute(
        'aria-current',
        'true',
      ),
    )
  },
}

/**
 * A slide is as wide as the carousel by default, which is Figma's one-per-view
 * gallery. Give the children a width of their own and the same component becomes
 * Astryx's continuous strip: several items visible, snapping each to the start
 * edge as you pan.
 *
 * The dots follow the item that is *most* visible, so a strip showing two and a
 * half cards marks the leftmost full one. Nothing about the component changes
 * between the two shapes — only what you put in it.
 */
export const MultipleVisible: Story = {
  parameters: { controls: { disable: true } },
  render: ({ children: _children, ...args }) => (
    <div className="w-100">
      <Carousel {...args} aria-label="Feature cards" gap={3}>
        {['Design system', 'Documentation', 'Sandbox', 'Library', 'Contributing'].map(
          (title) => (
            <Card key={title} className="w-50">
              <span className="text-base font-semibold text-content-emphasized">{title}</span>
            </Card>
          ),
        )}
      </Carousel>
    </div>
  ),
}

/**
 * Driving the carousel from outside it, through Astryx's `handleRef`. The
 * thumbnail strip below the track calls `scrollTo(index)`; the carousel's own
 * dots are still there and still correct, because both are reading the same
 * observed position rather than a state one of them owns.
 *
 * Extracted into its own component because `useRef` and `useState` cannot live
 * in a story's `render` arrow — the rules-of-hooks lint reads a lowercase
 * function as "not a component".
 */
function Gallery() {
  const handle = useRef<CarouselHandle>(null)
  const [count] = useState(4)

  return (
    <div className="flex w-100 flex-col gap-4">
      <Carousel aria-label="Product photos" handleRef={handle}>
        {slides}
      </Carousel>
      <div className="flex gap-2">
        {Array.from({ length: count }, (_, index) => (
          <Button
            key={index}
            appearance="secondary"
            size="small"
            onClick={() => handle.current?.scrollTo(index)}
          >
            {`Go to ${index + 1}`}
          </Button>
        ))}
      </div>
    </div>
  )
}

/**
 * A product gallery: one photo at a time, dots and arrows below, and a row of
 * jump buttons wired to the imperative handle.
 *
 * `aria-label` names what is inside rather than the component — "Product photos",
 * not "Carousel" — which is what a screen reader announces along with the role
 * description. It is required by the types for exactly that reason.
 */
export const InContext: Story = {
  parameters: { controls: { disable: true } },
  render: () => <Gallery />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Slide 1 to begin with, and no way back from it.
    await waitFor(() =>
      expect(canvas.getByRole('button', { name: 'Slide 1' })).toHaveAttribute(
        'aria-current',
        'true',
      ),
    )
    await expect(canvas.getByRole('button', { name: 'Previous slide' })).toBeDisabled()

    // The arrow advances the marked dot.
    await userEvent.click(canvas.getByRole('button', { name: 'Next slide' }))
    await waitFor(() =>
      expect(canvas.getByRole('button', { name: 'Slide 2' })).toHaveAttribute(
        'aria-current',
        'true',
      ),
    )
    await expect(canvas.getByRole('button', { name: 'Previous slide' })).toBeEnabled()

    // So does a dot, from anywhere to anywhere.
    await userEvent.click(canvas.getByRole('button', { name: 'Slide 4' }))
    await waitFor(() =>
      expect(canvas.getByRole('button', { name: 'Slide 4' })).toHaveAttribute(
        'aria-current',
        'true',
      ),
    )
    // And the far end disables the other arrow.
    await waitFor(() =>
      expect(canvas.getByRole('button', { name: 'Next slide' })).toBeDisabled(),
    )

    // The handle reaches the same track the dots do.
    await userEvent.click(canvas.getByRole('button', { name: 'Go to 1' }))
    await waitFor(() =>
      expect(canvas.getByRole('button', { name: 'Slide 1' })).toHaveAttribute(
        'aria-current',
        'true',
      ),
    )
  },
}
