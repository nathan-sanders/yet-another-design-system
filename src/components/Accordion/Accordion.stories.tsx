import type { Meta, StoryObj } from '@storybook/react-vite'
import { CreditCard, RotateCcw, Truck } from 'lucide-react'

import { Accordion } from './Accordion'
import { Badge } from '../Badge'
import { Link } from '../Link'

const meta = {
  title: 'Components/Accordion',
  component: Accordion,
  argTypes: {
    container: { control: 'boolean' },
    multiple: { control: 'boolean' },
    disabled: { control: 'boolean' },
    headingLevel: { control: 'inline-radio', options: [2, 3, 4, 5, 6] },
    children: { control: false },
  },
  args: {
    container: true,
    headingLevel: 3,
    children: (
      <>
        <Accordion.Item value="shipping">
          <Accordion.Trigger>When will my order arrive?</Accordion.Trigger>
          <Accordion.Panel>
            Standard delivery takes two to three working days. You will get a tracking link the
            moment the parcel leaves the warehouse.
          </Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item value="returns">
          <Accordion.Trigger>How do returns work?</Accordion.Trigger>
          <Accordion.Panel>
            Send anything back within 30 days and we will refund it in full. The return label is in
            the box.
          </Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item value="payment">
          <Accordion.Trigger>Which cards do you take?</Accordion.Trigger>
          <Accordion.Panel>
            Visa, Mastercard and American Express, plus Apple Pay and Google Pay at checkout.
          </Accordion.Panel>
        </Accordion.Item>
      </>
    ),
  },
  // Figma draws the accordion 400px wide. Everything is fluid, so the frame is
  // the story's job rather than the component's.
  //
  // `text-base` is here rather than on each panel for the same reason: the
  // component sets no typography on its panel (see its CLAUDE.md — what goes in
  // a panel is the caller's content), so without this the stories render panel
  // text at the browser's 16px next to a 14/24 trigger, which is a story
  // artefact rather than the design. Triggers set their own `text-base`, so
  // nothing inherits past them.
  decorators: [
    (Story) => (
      <div className="w-100 text-base text-content-primary">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Accordion>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Uncontrolled, with controls — use the Theme switch in the toolbar for dark
 * mode. Open a section and watch the panel and the chevron move together: both
 * run 175ms on `ease-standard`, which is the duration Astryx gives its own
 * collapsible chevron.
 *
 * Tab through it and focus lands on each trigger in turn. The arrow keys do
 * nothing on purpose — see the header of `Accordion.tsx`.
 */
export const Playground: Story = {}

/**
 * `container` is the card Figma draws: a 1px border at `surface-border` and a
 * 12px radius. Turn it off and the border and radius go, leaving the dividers
 * between items — for an accordion that already sits inside something.
 *
 * Watch the top corners as you hover the first row. The trigger's hover fill is
 * `rounded-md` (8px) inside 4px of header padding, which is exactly the card's
 * 12px less that padding, so the fill follows the card's curve instead of
 * cutting across it. That is what those three numbers in Figma are for.
 */
export const Container: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <span className="text-sm text-content-subtle">container (default)</span>
        <Accordion {...args} />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm text-content-subtle">container={'{false}'}</span>
        <Accordion {...args} container={false} />
      </div>
    </div>
  ),
}

/**
 * Hover and focus are real browser states, not props — hover a row for the
 * `surface-card-subtle` fill, and press Tab for the library's shared ring.
 *
 * A disabled item sits at 40% opacity and cannot be opened, but it is still a
 * tab stop and is still announced, so nobody arrives at a gap in the list with
 * no explanation. `disabled` on the accordion itself does the same to every
 * item at once.
 */
export const States: Story = {
  parameters: { controls: { disable: true } },
  render: ({ children: _children, ...args }) => (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <span className="text-sm text-content-subtle">One item disabled</span>
        <Accordion {...args}>
          <Accordion.Item value="shipping">
            <Accordion.Trigger>When will my order arrive?</Accordion.Trigger>
            <Accordion.Panel>Two to three working days.</Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item value="returns" disabled>
            <Accordion.Trigger>How do returns work?</Accordion.Trigger>
            <Accordion.Panel>Send anything back within 30 days.</Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item value="payment">
            <Accordion.Trigger>Which cards do you take?</Accordion.Trigger>
            <Accordion.Panel>Visa, Mastercard and American Express.</Accordion.Panel>
          </Accordion.Item>
        </Accordion>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm text-content-subtle">The whole accordion disabled</span>
        <Accordion {...args} disabled>
          <Accordion.Item value="shipping">
            <Accordion.Trigger>When will my order arrive?</Accordion.Trigger>
            <Accordion.Panel>Two to three working days.</Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item value="returns">
            <Accordion.Trigger>How do returns work?</Accordion.Trigger>
            <Accordion.Panel>Send anything back within 30 days.</Accordion.Panel>
          </Accordion.Item>
        </Accordion>
      </div>
    </div>
  ),
}

/**
 * Figma's `icon` toggle, off by default. Pass a Lucide icon component and the
 * trigger renders it through `Icon`, so the 16px glyph size and the 1.5px
 * stroke come from the design system rather than the call site.
 *
 * The chevron stays where it is: the leading icon labels the section, the
 * trailing one says whether it is open, and they are not interchangeable.
 */
export const WithIcons: Story = {
  parameters: { controls: { disable: true } },
  render: ({ children: _children, ...args }) => (
    <Accordion {...args}>
      <Accordion.Item value="shipping">
        <Accordion.Trigger startIcon={Truck}>Delivery</Accordion.Trigger>
        <Accordion.Panel>Two to three working days, tracked from the warehouse.</Accordion.Panel>
      </Accordion.Item>
      <Accordion.Item value="returns">
        <Accordion.Trigger startIcon={RotateCcw}>Returns</Accordion.Trigger>
        <Accordion.Panel>Thirty days, refunded in full, label in the box.</Accordion.Panel>
      </Accordion.Item>
      <Accordion.Item value="payment">
        <Accordion.Trigger startIcon={CreditCard}>Payment</Accordion.Trigger>
        <Accordion.Panel>Visa, Mastercard, Amex, Apple Pay and Google Pay.</Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  ),
}

/**
 * By default opening one section closes the last — the single-open behaviour
 * Astryx recommends for an FAQ or a settings page, where the reader is looking
 * for one answer.
 *
 * `multiple` lets any number stand open at once. Reach for it when the point is
 * to compare sections rather than to read one: a feature list, a set of pricing
 * tiers, a diff.
 */
export const Multiple: Story = {
  args: { multiple: true, defaultValue: ['shipping', 'returns'] },
  parameters: { controls: { disable: true } },
}

/**
 * `defaultValue` opens a section on first render. Astryx starts its
 * collapsibles open for exactly this reason: if the content is what somebody
 * came for, do not make them click to see it.
 *
 * This story earns its place twice over. The story suite's axe run happens on
 * first render, and a closed accordion has no panel in the DOM at all — so
 * without one that starts open, the accessibility check would pass by looking
 * at nothing. That is Menu's lesson, applied on purpose.
 *
 * The link in the open panel is the other thing to look at: its focus ring
 * paints past the panel's padding and is not clipped, even though the panel is
 * the one element here that sets `overflow: hidden`.
 */
export const DefaultOpen: Story = {
  args: { defaultValue: ['returns'] },
  parameters: { controls: { disable: true } },
  render: ({ children: _children, ...args }) => (
    <Accordion {...args}>
      <Accordion.Item value="shipping">
        <Accordion.Trigger>When will my order arrive?</Accordion.Trigger>
        <Accordion.Panel>Two to three working days.</Accordion.Panel>
      </Accordion.Item>
      <Accordion.Item value="returns">
        <Accordion.Trigger>How do returns work?</Accordion.Trigger>
        <Accordion.Panel>
          Send anything back within 30 days and we will refund it in full.
          <Link href="#returns">Read the returns policy</Link>
        </Accordion.Panel>
      </Accordion.Item>
      <Accordion.Item value="payment">
        <Accordion.Trigger>Which cards do you take?</Accordion.Trigger>
        <Accordion.Panel>Visa, Mastercard and American Express.</Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  ),
}

/**
 * `hiddenUntilFound` keeps every panel in the DOM and hides it with
 * `hidden="until-found"`, so the browser's own find-in-page can reach the text
 * inside a closed section and open it on a match.
 *
 * Try it: press Cmd-F, search for *warehouse* — a word that only appears in the
 * first panel — and the section opens itself around the highlight. Off by
 * default, because it costs rendering every panel whether or not anyone looks
 * at them, and it is worth it on a long reference page rather than on three
 * questions.
 */
export const FindInPage: Story = {
  args: { hiddenUntilFound: true },
  parameters: { controls: { disable: true } },
}

/**
 * A help page: the accordion at its default size, doing the job it exists for.
 * The trailing Badge in a trigger is ordinary content — the label is a slot, so
 * anything that fits on the row goes in it.
 *
 * `headingLevel={3}` is the default and is right here, because the page's own
 * "Frequently asked" is an `h2`. Set it to match wherever the accordion lands;
 * a level that skips one is an axe failure, not a matter of taste.
 */
export const InContext: Story = {
  parameters: { controls: { disable: true } },
  render: ({ children: _children, ...args }) => (
    <div className="flex flex-col gap-4">
      <h2 className="font-sans text-lg font-semibold text-content-emphasized">
        Frequently asked
      </h2>
      <Accordion {...args} defaultValue={['shipping']}>
        <Accordion.Item value="shipping">
          <Accordion.Trigger startIcon={Truck}>
            <span className="flex items-center gap-2">
              Delivery <Badge color="green">Free</Badge>
            </span>
          </Accordion.Trigger>
          <Accordion.Panel>
            Standard delivery takes two to three working days and costs nothing. You will get a
            tracking link the moment the parcel leaves the warehouse.
          </Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item value="returns">
          <Accordion.Trigger startIcon={RotateCcw}>Returns</Accordion.Trigger>
          <Accordion.Panel>
            Send anything back within 30 days and we will refund it in full. The return label is in
            the box, and you can drop the parcel at any post office.
          </Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item value="payment">
          <Accordion.Trigger startIcon={CreditCard}>Payment</Accordion.Trigger>
          <Accordion.Panel>
            Visa, Mastercard and American Express, plus Apple Pay and Google Pay at checkout.
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </div>
  ),
}
