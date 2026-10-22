import type { Meta, StoryObj } from '@storybook/react-vite'
import { Circle, Globe, Lock, Users } from 'lucide-react'
import { expect, userEvent, waitFor, within } from 'storybook/test'

import { Select } from './Select'
import { Field } from '../Field'
import { Text } from '../Text'

const sizes = ['small', 'default', 'large'] as const

/**
 * The three states that are not browser states. Hover and focus are real CSS,
 * so they belong to the mouse and the Tab key rather than to a column here.
 */
const states = [
  { name: 'Default', props: {} },
  { name: 'Invalid', props: { invalid: true } },
  { name: 'Disabled', props: { disabled: true } },
] as const

const apples = [
  { value: 'gala', label: 'Gala' },
  { value: 'fuji', label: 'Fuji' },
  { value: 'honeycrisp', label: 'Honeycrisp' },
  { value: 'granny-smith', label: 'Granny Smith' },
  { value: 'pink-lady', label: 'Pink Lady' },
] as const

const appleItems = apples.map(({ value, label }) => (
  <Select.Item key={value} value={value}>
    {label}
  </Select.Item>
))

const meta = {
  title: 'Components/Select',
  component: Select,
  argTypes: {
    placeholder: { control: 'text' },
    size: { control: 'select', options: sizes },
    hug: { control: 'boolean' },
    invalid: { control: 'boolean' },
    disabled: { control: 'boolean' },
    multiple: { control: 'boolean' },
    children: { control: false },
  },
  args: {
    placeholder: 'Select apple…',
    size: 'default',
    hug: false,
    invalid: false,
    disabled: false,
    multiple: false,
    children: appleItems,
  },
  decorators: [
    // A select needs room. It opens *over* its trigger rather than below it, so
    // without the height it would have nowhere to sit and Base UI would fall
    // back to the conventional dropdown — hiding the behavior this component
    // is built around. Menu's decorator, for a related reason.
    (Story) => (
      <div className="flex min-h-96 items-center justify-center p-16">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Select>

export default meta
type Story = StoryObj<typeof meta>

/**
 * One select with controls — use the Theme switch in the toolbar for dark mode.
 *
 * Open it with the mouse and the popup lands **on top of** the trigger, with the
 * selected row sitting exactly where the trigger's text was. Open it from the
 * keyboard and it drops below instead: Base UI only overlaps for pointer input,
 * and falls back whenever there is not enough room.
 *
 * Arrow keys move, Enter commits, Escape closes and returns focus. Typeahead
 * works on the closed trigger too — type "h" to jump to Honeycrisp.
 *
 * **`nativeLabel={false}` on the Field is not optional here.** The trigger is a
 * button, so a real `<label for>` would open the popup when you clicked the
 * label.
 */
export const Playground: Story = {
  render: (args) => (
    <Field label="Apple" description="Only the ones in season" nativeLabel={false} className="w-80">
      <Select {...args} />
    </Field>
  ),
}

/**
 * Every size against every state that is not a browser state.
 *
 * The trigger is **24 / 32 / 40** tall, which is Button's scale and Input's. A
 * CSS grid rather than a `<table>`: a full-width control inside an auto-layout
 * cell collapses to its longest word.
 */
export const AllVariants: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="grid w-fit grid-cols-[auto_repeat(3,16rem)] items-start gap-x-6 gap-y-4">
      <span aria-hidden />
      {states.map((state) => (
        <Text key={state.name} render={<span />} size="sm" color="subtle">
          {state.name}
        </Text>
      ))}
      {sizes.map((size) => (
        <div key={size} className="contents">
          <Text render={<span />} size="sm" color="subtle" className="pt-13 capitalize">{size}</Text>
          {states.map((state) => (
            <Field key={state.name} label="Label" description="Sub label" nativeLabel={false}>
              <Select {...args} size={size} {...state.props} />
            </Field>
          ))}
        </div>
      ))}
    </div>
  ),
}

/**
 * Figma's `Hug` property. False fills its container — the form case, and the
 * default. True shrink-wraps the value, which is what a filter beside a Button
 * wants.
 */
export const Hug: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex w-80 flex-col gap-6">
      <Field label="Fills its container" nativeLabel={false}>
        <Select placeholder="Select apple…">{appleItems}</Select>
      </Field>
      <Field label="Hugs its content" nativeLabel={false}>
        <Select hug placeholder="Select apple…">
          {appleItems}
        </Select>
      </Field>
    </div>
  ),
}

/**
 * Held open, with a value already chosen.
 *
 * **This story exists for the accessibility suite.** A closed select keeps its
 * popup in the DOM, but inside a `hidden` subtree — and axe walks straight past
 * anything hidden, so a run against the default state passes by checking nothing
 * inside it. Toast's lesson and Menu's, reached by a different route: there the
 * popup really is unmounted, here it is merely invisible, and the vacuous pass
 * looks identical either way. Note where the popup sits:
 * "Honeycrisp" is drawn directly over the trigger, which is the whole point of
 * the macOS positioning.
 */
export const Open: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Field label="Apple" nativeLabel={false} className="w-80">
      <Select open defaultValue="honeycrisp" placeholder="Select apple…">
        {appleItems}
      </Select>
    </Field>
  ),
}

/**
 * Sections, with the rule between them.
 *
 * The divider is a sibling of the group rather than a child, so `first:hidden`
 * keeps it from drawing above the first one. Astryx's guidance is to reach for
 * sections once a list passes about eight options.
 */
export const Groups: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Field label="Visibility" nativeLabel={false} className="w-80">
      <Select open defaultValue="team" placeholder="Choose visibility…">
        <Select.Group label="Private">
          <Select.Item value="only-me" startIcon={Lock}>
            Only me
          </Select.Item>
          <Select.Item value="team" startIcon={Users}>
            My team
          </Select.Item>
        </Select.Group>
        <Select.Group label="Public">
          <Select.Item value="anyone" startIcon={Globe}>
            Anyone with the link
          </Select.Item>
          <Select.Item value="indexed" startIcon={Globe} disabled>
            Listed publicly
          </Select.Item>
        </Select.Group>
      </Select>
    </Field>
  ),
}

/**
 * Figma's `Type=Multi Select`: a checkbox leads every row, and the trigger reads
 * **"Gala +2 more"** rather than a run of comma-separated labels.
 *
 * This is the one case that does not overlap its trigger. There is no single
 * selected row to line up when several are chosen, so it falls back to a
 * conventional dropdown — automatically, and without the caller asking.
 */
export const MultiSelect: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Field label="Apples" description="Pick as many as you like" nativeLabel={false} className="w-80">
      <Select multiple open defaultValue={['gala', 'fuji', 'pink-lady']} placeholder="Select apples…">
        {appleItems}
      </Select>
    </Field>
  ),
}

/**
 * Figma's `Sub Label` and `Icon` booleans on the item. A row with a description
 * grows from 32px to 52px.
 */
export const WithDescriptions: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Field label="Visibility" nativeLabel={false} className="w-96">
      <Select open defaultValue="team" placeholder="Choose visibility…">
        <Select.Item value="only-me" startIcon={Lock} description="Nobody else can open it">
          Only me
        </Select.Item>
        <Select.Item value="team" startIcon={Users} description="Everyone in the workspace">
          My team
        </Select.Item>
        <Select.Item value="anyone" startIcon={Globe} description="Anyone who has the address">
          Anyone with the link
        </Select.Item>
      </Select>
    </Field>
  ),
}

/**
 * A list longer than the room it has.
 *
 * The scroll arrows at the top and bottom are the one part of this component
 * **Figma does not draw** — they are the cost of overlapping the trigger, since a
 * long list has to scroll inside a popup that is already sitting on its own
 * anchor. Base UI unmounts them when the list fits, so there is nothing to hide
 * at rest.
 */
export const Scrolling: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Field label="Time zone" nativeLabel={false} className="w-80">
      <Select defaultValue="zone-12" placeholder="Select a time zone…">
        {Array.from({ length: 40 }, (_, index) => (
          <Select.Item key={index} value={`zone-${index}`} startIcon={Circle}>
            {`UTC${index - 12 >= 0 ? '+' : '−'}${Math.abs(index - 12)}:00`}
          </Select.Item>
        ))}
      </Select>
    </Field>
  ),
}

/**
 * Without a Field around it. A control still needs a name, so it takes an
 * `aria-label` — the toolbar-filter shape, and the same rule Input follows.
 */
export const Standalone: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Select hug aria-label="Sort by" defaultValue="newest">
      <Select.Item value="newest">Newest first</Select.Item>
      <Select.Item value="oldest">Oldest first</Select.Item>
      <Select.Item value="name">Name</Select.Item>
    </Select>
  ),
}

const visibility = [
  { value: 'only-me', label: 'Only me', icon: Lock },
  { value: 'team', label: 'My team', icon: Users },
  { value: 'anyone', label: 'Anyone with the link', icon: Globe },
] as const

/**
 * A row's `startIcon` follows it into the trigger once it is chosen.
 *
 * Base UI's own value renders the label alone, so without this the icon would
 * vanish the moment the row was picked. The trigger draws it at Figma's
 * `_Select Value` spacing — the 16px icon, then the label 8px after — at all
 * three sizes, and the icon stays outside the truncation so a long label clips
 * rather than squashing it.
 *
 * The play picks a row with the mouse and checks the trigger took that row's
 * icon and label with it.
 */
export const WithIcons: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex w-80 flex-col gap-4">
      {sizes.map((size) => (
        <Field key={size} label={`Visibility (${size})`} nativeLabel={false}>
          <Select size={size} defaultValue="team" placeholder="Choose visibility…">
            {visibility.map(({ value, label, icon }) => (
              <Select.Item key={value} value={value} startIcon={icon}>
                {label}
              </Select.Item>
            ))}
          </Select>
        </Field>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const triggers = canvas.getAllByRole('combobox')

    for (const trigger of triggers) {
      // 16px icon, 8px before the label.
      const svg = trigger.querySelector('svg')
      expect(svg).not.toBeNull()
      expect(svg!.getBoundingClientRect().width).toBe(16)
      expect(trigger).toHaveTextContent('My team')
    }

    await userEvent.click(triggers[1])
    const option = await waitFor(() => within(document.body).getByRole('option', { name: 'Anyone with the link' }))
    await userEvent.click(option)

    await waitFor(() => expect(triggers[1]).toHaveTextContent('Anyone with the link'))
    const icon = triggers[1].querySelector('svg')!
    const label = icon.nextElementSibling!
    expect(label.getBoundingClientRect().left - icon.getBoundingClientRect().right).toBe(8)
    expect(icon.classList.toString()).toContain('lucide-globe')
    // Let the popup finish closing before the story's axe run: mid-exit, its
    // focus guards and unnamed listbox are still in the page, and a loaded CI
    // runner caught it there.
    await waitFor(() => expect(within(document.body).queryByRole('listbox')).toBeNull())
  },
}

const swatches = [
  { value: 'neutral', label: 'Neutral', swatch: 'border-decorative-neutral-highlight bg-decorative-neutral-background' },
  { value: 'blue', label: 'Blue', swatch: 'border-decorative-blue-highlight bg-decorative-blue-background' },
  { value: 'green', label: 'Green', swatch: 'border-decorative-green-highlight bg-decorative-green-background' },
  { value: 'red', label: 'Red', swatch: 'border-decorative-red-highlight bg-decorative-red-background' },
] as const

/**
 * `startIcon` also takes an **element**, for what is not a Lucide glyph — here
 * a color swatch, in the 16px leading box. The chosen one shows in the trigger
 * exactly as it does in its row.
 *
 * Give every row one or none: a list where some rows carry an icon and others
 * do not reads as misaligned.
 */
export const Swatches: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Field label="Color" nativeLabel={false} className="w-80">
      <Select defaultValue="neutral" placeholder="Choose a color…">
        {swatches.map(({ value, label, swatch }) => (
          <Select.Item
            key={value}
            value={value}
            startIcon={<span data-swatch={value} className={`size-3.5 rounded-full border ${swatch}`} />}
          >
            {label}
          </Select.Item>
        ))}
      </Select>
    </Field>
  ),
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole('combobox')
    expect(trigger).toHaveTextContent('Neutral')
    expect(trigger.querySelector('[data-swatch="neutral"]')).not.toBeNull()
    // The swatch's box is hidden from assistive tech; the label carries the name.
    expect(trigger.querySelector('[data-swatch]')!.parentElement).toHaveAttribute('aria-hidden', 'true')
  },
}
