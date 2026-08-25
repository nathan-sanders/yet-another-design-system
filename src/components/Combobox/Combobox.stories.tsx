import type { Meta, StoryObj } from '@storybook/react-vite'
import { Globe, Lock, Users } from 'lucide-react'

import { Combobox } from './Combobox'
import { Field } from '../Field'

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

const countries = [
  { value: 'ar', label: 'Argentina' },
  { value: 'au', label: 'Australia' },
  { value: 'br', label: 'Brazil' },
  { value: 'ca', label: 'Canada' },
  { value: 'de', label: 'Germany' },
  { value: 'jp', label: 'Japan' },
  { value: 'ke', label: 'Kenya' },
  { value: 'mx', label: 'Mexico' },
  { value: 'nz', label: 'New Zealand' },
  { value: 'pt', label: 'Portugal' },
  { value: 'se', label: 'Sweden' },
  { value: 'za', label: 'South Africa' },
]

const people = [
  { value: 'ada', label: 'Ada Lovelace' },
  { value: 'alan', label: 'Alan Turing' },
  { value: 'grace', label: 'Grace Hopper' },
  { value: 'katherine', label: 'Katherine Johnson' },
  { value: 'radia', label: 'Radia Perlman' },
]

const visibility = [
  { value: 'only-me', label: 'Only me', description: 'Nobody else can open it' },
  { value: 'team', label: 'My team', description: 'Everyone in the workspace' },
  { value: 'anyone', label: 'Anyone with the link', description: 'Anyone who has the address' },
]

const meta = {
  title: 'Components/Combobox',
  component: Combobox,
  argTypes: {
    placeholder: { control: 'text' },
    searchPlaceholder: { control: 'text' },
    size: { control: 'select', options: sizes },
    indicator: { control: 'inline-radio', options: ['check', 'radio'] },
    multiple: { control: 'boolean' },
    invalid: { control: 'boolean' },
    disabled: { control: 'boolean' },
    items: { control: false },
    children: { control: false },
  },
  args: {
    items: countries,
    placeholder: 'Select country',
    searchPlaceholder: 'e.g. Japan',
    size: 'default',
    indicator: 'check',
    multiple: false,
    invalid: false,
    disabled: false,
  },
  decorators: [
    // A combobox needs room below it: the popup hangs under the field rather
    // than over it, and Base UI flips it above when there is no space — which
    // would hide the arrangement these stories exist to show.
    (Story) => (
      <div className="flex min-h-120 flex-col items-center p-16">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Combobox>

export default meta
type Story = StoryObj<typeof meta>

/**
 * One combobox with controls — use the Theme switch in the toolbar for dark
 * mode, and the `multiple` control to swap between the two shapes.
 *
 * Single select is a **trigger with the search inside the popup**: click it, and
 * the field you type in is the one in the panel's header. Turn `multiple` on and
 * the anatomy changes completely — the chevron goes, the panel loses its search
 * row, and the field itself becomes the input with the chosen values sitting in
 * front of the caret as Tokens.
 *
 * **`nativeLabel={false}` is only right for the single-select shape**, whose
 * control is a `<button>`. The tokenizer's control is a real `<input>`, so its
 * Field keeps the default and clicking the label lands the caret.
 */
export const Playground: Story = {
  render: (args) => (
    <Field
      label="Country"
      description="Only where we ship"
      nativeLabel={args.multiple !== true}
      className="w-80"
    >
      <Combobox {...args} />
    </Field>
  ),
}

/**
 * Every size against every state that is not a browser state, in both shapes.
 *
 * The field is **24 / 32 / 40** tall in either one — Button's scale, Input's and
 * Select's. The tokenizer holds that height with a token in it, which is the
 * whole reason Token has a 20px size: measured, the token is 20 / 24 / 24 inside
 * an inner box of 22 / 30 / 38. It may only grow when the tokens wrap, which is
 * `MultiSelectWrapping`.
 */
export const AllVariants: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="grid w-fit grid-cols-[auto_repeat(3,16rem)] items-start gap-x-6 gap-y-4">
      <span aria-hidden />
      {states.map((state) => (
        <span key={state.name} className="text-sm text-content-subtle">
          {state.name}
        </span>
      ))}

      {sizes.map((size) => (
        <div key={`single-${size}`} className="contents">
          <span className="pt-9 text-sm text-content-subtle capitalize">{size}</span>
          {states.map((state) => (
            <Field key={state.name} label="Single select" nativeLabel={false}>
              <Combobox {...args} size={size} {...state.props} />
            </Field>
          ))}
        </div>
      ))}

      {sizes.map((size) => (
        <div key={`multi-${size}`} className="contents">
          <span className="pt-9 text-sm text-content-subtle capitalize">{size}</span>
          {states.map((state) => (
            <Field key={state.name} label="Multi select">
              <Combobox
                {...args}
                multiple
                items={people}
                placeholder="Add people…"
                defaultValue={[people[0]]}
                size={size}
                {...state.props}
              />
            </Field>
          ))}
        </div>
      ))}
    </div>
  ),
}

/**
 * Held open, with a value already chosen.
 *
 * **This story exists for the accessibility suite.** A closed combobox keeps its
 * popup in the DOM but inside a `hidden` subtree, and axe walks straight past
 * anything hidden — so a run against the default state passes by checking
 * nothing inside it. Select's trap, and Toast's before it.
 *
 * It is also the only place the search field is visible: Figma draws it as the
 * Combobox Menu's 48px header, an Input Group with a magnifier in its start slot
 * and **no box of its own** — the header's variables bind no border and no fill.
 */
export const Open: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Field label="Country" nativeLabel={false} className="w-80">
      <Combobox open items={countries} defaultValue={countries[5]} placeholder="Select country" />
    </Field>
  ),
}

/**
 * Typing narrows the list — the thing that makes this a Combobox rather than a
 * Select.
 *
 * The filter is Base UI's, and it reads each item's `label`. It only ever sees
 * what was passed as `items`: rows written as JSX children are invisible to it,
 * which is why this component takes an array where `Select` takes children.
 */
export const Filtering: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Field label="Country" description="Type “an” to narrow it" nativeLabel={false} className="w-80">
      <Combobox open items={countries} defaultInputValue="an" placeholder="Select country" />
    </Field>
  ),
}

/**
 * When the filter matches nothing.
 *
 * **Figma draws no empty state**, and one is not optional: a list that silently
 * empties itself looks broken. Built from the same tokens as the rows and
 * recorded as a gap in the file, the way Select's scroll arrows and Divider's
 * `emphasis` were. Base UI puts it in a polite live region, so it is announced
 * as well as drawn.
 */
export const NoResults: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Field label="Country" nativeLabel={false} className="w-80">
      <Combobox
        open
        items={countries}
        defaultInputValue="Sealand"
        placeholder="Select country"
        emptyMessage="No countries match that."
      />
    </Field>
  ),
}

/**
 * Sections, with the rule between them.
 *
 * The divider is a sibling of the group rather than a child, so `first:hidden`
 * keeps it from doubling up with the line under the search field. Astryx's
 * guidance is to reach for sections once a list passes about eight options —
 * which for a combobox is also about where filtering starts earning its keep.
 */
export const Groups: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Field label="Destination" nativeLabel={false} className="w-80">
      <Combobox
        open
        placeholder="Select destination"
        items={[
          { value: 'Europe', items: countries.filter((c) => ['de', 'pt', 'se'].includes(c.value)) },
          { value: 'Americas', items: countries.filter((c) => ['ar', 'br', 'ca', 'mx'].includes(c.value)) },
          { value: 'Rest of world', items: countries.filter((c) => ['au', 'jp', 'ke', 'nz', 'za'].includes(c.value)) },
        ]}
      />
    </Field>
  ),
}

/**
 * Figma's third Combobox Menu Item `Type`. A single select, with a radio in
 * front of every row instead of a check behind the chosen one.
 *
 * It is a prop rather than a derivation because nothing in the values says which
 * one you want — unlike the multi-select square, which follows from `multiple`
 * and could not sensibly be argued with.
 */
export const RadioRows: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Field label="Visibility" nativeLabel={false} className="w-80">
      <Combobox
        open
        indicator="radio"
        items={visibility}
        defaultValue={visibility[1]}
        placeholder="Choose visibility"
      />
    </Field>
  ),
}

/**
 * Figma's `Sub Label` on the item. A row with a description grows from 32px to
 * 52px, as it does in Select and Menu.
 */
export const WithDescriptions: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Field label="Visibility" nativeLabel={false} className="w-96">
      <Combobox open items={visibility} defaultValue={visibility[1]} placeholder="Choose visibility">
        {(item) => (
          <Combobox.Item
            key={item.value}
            value={item}
            description={item.description}
            startIcon={item.value === 'only-me' ? Lock : item.value === 'team' ? Users : Globe}
          >
            {item.label}
          </Combobox.Item>
        )}
      </Combobox>
    </Field>
  ),
}

/**
 * The tokenizer — Figma's `Select Type=Multi Select`, and what Astryx calls a
 * Tokenizer.
 *
 * There is no trigger and no chevron here: the field **is** the input, and the
 * chosen values sit in front of the caret as `Token`s, each with the remove
 * button `Token` was built to hand over to Base UI. Type to filter, Enter to
 * add, Backspace on an empty caret to take the last one back, and the arrow keys
 * to walk the tokens themselves.
 *
 * The field does not get taller when you add one. That is what Token's 20 / 24
 * scale buys, measured against a field's inner 22 / 30 / 38.
 */
export const MultiSelect: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Field label="Reviewers" description="At least two, please" className="w-96">
      <Combobox
        multiple
        open
        items={people}
        defaultValue={[people[0], people[2]]}
        placeholder="Add reviewers…"
      />
    </Field>
  ),
}

/**
 * Enough tokens to wrap.
 *
 * This is the one case where the field is allowed to grow — Input's box is
 * `flex-wrap` with a `min-h`, so a second line of tokens makes it taller and a
 * single line never does.
 */
export const MultiSelectWrapping: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Field label="Reviewers" className="w-80">
      <Combobox multiple items={people} defaultValue={people} placeholder="Add reviewers…" />
    </Field>
  ),
}

/**
 * Without a Field around it. A control still needs a name, so it takes an
 * `aria-label` — the toolbar-filter shape, and the same rule Input and Select
 * follow. The name lands on the trigger, or on the caret when `multiple`.
 */
export const Standalone: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="w-64">
      <Combobox
        aria-label="Filter by country"
        items={countries}
        placeholder="All countries"
        searchPlaceholder="Find a country…"
      />
    </div>
  ),
}

/**
 * Both shapes in one form, at the default size — the ordinary case rather than a
 * styled one.
 */
export const InContext: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex w-96 flex-col gap-6 rounded-lg border border-surface-border bg-surface-primary p-6">
      <Field label="Country" description="Where the invoice is sent" nativeLabel={false}>
        <Combobox items={countries} placeholder="Select country" searchPlaceholder="e.g. Japan" />
      </Field>
      <Field label="Reviewers" error="At least one reviewer is required">
        <Combobox multiple items={people} placeholder="Add reviewers…" />
      </Field>
    </div>
  ),
}
