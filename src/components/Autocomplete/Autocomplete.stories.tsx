import type { Meta, StoryObj } from '@storybook/react-vite'
import { Clock, Hash, MapPin } from 'lucide-react'

import { Autocomplete } from './Autocomplete'
import samplePhoto from '../Avatar/sample-photo.png'
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

/**
 * Recent searches — the case CLAUDE.md's decision tree names for this component.
 * They are suggestions, not a set of permitted values.
 */
const recent = [
  { value: 'annual report', label: 'annual report' },
  { value: 'brand guidelines', label: 'brand guidelines' },
  { value: 'design tokens', label: 'design tokens' },
  { value: 'onboarding checklist', label: 'onboarding checklist' },
  { value: 'quarterly roadmap', label: 'quarterly roadmap' },
]

const cities = [
  { value: 'Amsterdam', label: 'Amsterdam', description: 'Netherlands' },
  { value: 'Auckland', label: 'Auckland', description: 'New Zealand' },
  { value: 'Bangalore', label: 'Bangalore', description: 'India' },
  { value: 'Barcelona', label: 'Barcelona', description: 'Spain' },
  { value: 'Lisbon', label: 'Lisbon', description: 'Portugal' },
  { value: 'Nairobi', label: 'Nairobi', description: 'Kenya' },
  { value: 'São Paulo', label: 'São Paulo', description: 'Brazil' },
  { value: 'Toronto', label: 'Toronto', description: 'Canada' },
]

const people = [
  {
    value: 'Ada Lovelace',
    label: 'Ada Lovelace',
    description: 'Analytical Engine',
    avatar: { src: samplePhoto, name: 'Ada Lovelace', status: 'online' as const },
  },
  {
    value: 'Alan Turing',
    label: 'Alan Turing',
    description: 'Computing Machinery',
    avatar: { name: 'Alan Turing' },
  },
  {
    value: 'Grace Hopper',
    label: 'Grace Hopper',
    description: 'COBOL',
    avatar: { name: 'Grace Hopper', status: 'offline' as const },
  },
  {
    value: 'Katherine Johnson',
    label: 'Katherine Johnson',
    description: 'Orbital mechanics',
    avatar: { name: 'Katherine Johnson' },
  },
]

const grouped = [
  { value: 'Recent', items: recent.slice(0, 3) },
  {
    value: 'Saved searches',
    items: [
      { value: 'is:open assignee:me', label: 'is:open assignee:me' },
      { value: 'label:blocked', label: 'label:blocked' },
    ],
  },
]

const meta = {
  title: 'Components/Autocomplete',
  component: Autocomplete,
  argTypes: {
    placeholder: { control: 'text' },
    size: { control: 'select', options: sizes },
    appearance: { control: 'inline-radio', options: ['default', 'ghost'] },
    mode: { control: 'select', options: ['list', 'both', 'inline', 'none'] },
    openOnInputClick: { control: 'boolean' },
    autoHighlight: { control: 'boolean' },
    invalid: { control: 'boolean' },
    disabled: { control: 'boolean' },
    items: { control: false },
    children: { control: false },
    startIcon: { control: false },
  },
  args: {
    items: recent,
    placeholder: 'Search anything…',
    size: 'default',
    appearance: 'default',
    mode: 'list',
    openOnInputClick: false,
    autoHighlight: false,
    invalid: false,
    disabled: false,
  },
  decorators: [
    // The popup hangs under the field rather than over it, and Base UI flips it
    // above when there is no room — which would hide the arrangement these
    // stories exist to show.
    (Story) => (
      <div className="flex min-h-120 flex-col items-center p-16">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Autocomplete>

export default meta
type Story = StoryObj<typeof meta>

/**
 * One autocomplete with controls — use the Theme switch in the toolbar for dark
 * mode.
 *
 * **Type something that is not on the list and the field keeps it.** That is the
 * whole difference between this and a `Combobox`, which looks identical and will
 * not let a value off its list stand. Nothing here is a commitment: the
 * suggestions are a shortcut for typing.
 *
 * `Field` keeps its default `nativeLabel` — unlike a single-select Combobox or a
 * Select, the control here is a real `<input>`, so clicking the label should
 * land the caret rather than open a popup.
 */
export const Playground: Story = {
  render: (args) => (
    <Field label="Search" description="Suggestions from your recent searches" className="w-80">
      <Autocomplete {...args} />
    </Field>
  ),
}

/**
 * Three sizes against the three states that are not browser states — Figma's
 * `Size` × `State`, minus Hover and Focus, which belong to the mouse and the Tab
 * key.
 *
 * The boxes are **24 / 32 / 40**, and they are `Input`'s: the field is an Input
 * Group with a magnifier in its start slot, which is exactly what the file
 * draws. The type stays at 14/24 for default and large and drops to 12/20 at
 * small, and the magnifier goes 16 → 12 with it.
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
        <div key={size} className="contents">
          <span className="pt-9 text-sm text-content-subtle capitalize">{size}</span>
          {states.map((state) => (
            <Field key={state.name} label="Search">
              <Autocomplete {...args} size={size} {...state.props} />
            </Field>
          ))}
        </div>
      ))}
    </div>
  ),
}

/**
 * **The reason this component exists.** The field is holding `sourdough
 * starter`, which is not in the list and never will be — and the list says so,
 * rather than the field refusing it.
 *
 * A `Combobox` in the same position would have thrown the text away the moment
 * focus left. Both controls filter as you type; only this one lets the answer be
 * something nobody thought of. `onValueChange` fires with the string on every
 * keystroke, and it is the string that a form submits.
 */
export const OffList: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Field
      label="Search"
      description="Nothing on the list matches, and the value stands anyway"
      className="w-80"
    >
      <Autocomplete open items={recent} defaultValue="sourdough starter" />
    </Field>
  ),
}

/**
 * Held open, so the menu can be seen.
 *
 * **This story exists for the accessibility suite.** A closed autocomplete keeps
 * its popup in the DOM but inside a `hidden` subtree, and axe walks straight
 * past anything hidden — so a run against the default state passes by checking
 * nothing inside it. Combobox's trap, and Select's before it.
 *
 * The panel has **no search header**, unlike the Combobox Menu: the field itself
 * is the input, so there is nothing to put in one.
 */
export const Open: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Field label="Search" className="w-80">
      <Autocomplete open items={recent} />
    </Field>
  ),
}

/**
 * Typing narrows the list. The filter is Base UI's and it reads each item's
 * `label`.
 *
 * It only ever sees what was passed as `items` — rows written as JSX children
 * are invisible to it, which is why this component takes an array where `Select`
 * takes children.
 */
export const Filtering: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Field label="City" description="Filtered to “an”" className="w-80">
      <Autocomplete open items={cities} defaultValue="an" placeholder="Where to?" />
    </Field>
  ),
}

/**
 * When the filter matches nothing.
 *
 * Figma draws no such state, so this is a gap in the file rather than a
 * translation of it — but a list that empties without saying so looks broken,
 * and here it is also the moment the component's whole point applies: what you
 * typed is still a perfectly good answer.
 */
export const NoResults: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Field label="City" className="w-80">
      <Autocomplete open items={cities} defaultValue="zzz" placeholder="Where to?" />
    </Field>
  ),
}

/**
 * Headed groups, each with the rule above it — Figma's Autocomplete Menu Group.
 *
 * The separator is a **sibling** of the group rather than a child, so
 * `first:hidden` can hide the one the file draws against the panel's own border.
 * Filtering applies per group, and a group whose rows all fall away disappears
 * with them.
 */
export const Groups: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Field label="Search" className="w-80">
      <Autocomplete open items={grouped} />
    </Field>
  ),
}

/**
 * Figma's `Sub label`, the second line of a row. 12/20 in `content/subtle` under
 * the 14/24 label, and the row grows to fit rather than the text shrinking.
 */
export const WithDescriptions: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Field label="City" className="w-80">
      <Autocomplete open items={cities} placeholder="Where to?" />
    </Field>
  ),
}

/**
 * Figma's `Type=Avatar` — a 20px Avatar in the leading slot.
 *
 * **It is not a prop.** A row draws it because its data has an `avatar`, the
 * same way Avatar picks its own content and Breadcrumbs finds its current page:
 * a prop that can contradict the data is a prop that will. The avatar is
 * deliberately narrower than a full `Avatar` — no `href`, no `onClick`, no
 * `size` — because the row is the hit target and the file draws one size.
 */
export const WithAvatars: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Field label="Assignee" className="w-80">
      <Autocomplete open items={people} placeholder="Search people…" />
    </Field>
  ),
}

/**
 * A Lucide glyph in the leading slot instead, for rows that are things rather
 * than people. `startIcon` takes the component, not an element.
 */
export const WithIcons: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Field label="Jump to" className="w-80">
      <Autocomplete open items={recent} placeholder="Search anything…">
        {(entry) => (
          <Autocomplete.Item key={entry.value} value={entry} startIcon={Clock}>
            {entry.label}
          </Autocomplete.Item>
        )}
      </Autocomplete>
    </Field>
  ),
}

/**
 * `appearance="ghost"` — no fill and no stroke until you go near it, for a global
 * search entry that should sit quieter than a form field. Shared with `Input`,
 * and not in Figma yet.
 *
 * A borderless field has a real problem under WCAG 1.4.11 — nothing identifies
 * it as a control at 3:1 — so it leans on the things beside it. **The magnifier
 * is what does that here**, which is why the search case is the safe one for
 * this appearance and a bare ghost field is not.
 */
export const Ghost: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="w-80 rounded-lg border border-surface-border bg-surface-card-primary p-2">
      <Autocomplete
        appearance="ghost"
        items={recent}
        placeholder="Search anything…"
        aria-label="Search"
      />
    </div>
  ),
}

/**
 * Figma's `Icon` boolean, turned off. `startIcon={null}` draws no start slot at
 * all — the placeholder then starts at the same 12px an `Input`'s text does.
 *
 * Worth avoiding with `appearance="ghost"`, where the magnifier is doing the
 * work of the missing border.
 */
export const NoIcon: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Field label="Tag" className="w-80">
      <Autocomplete open startIcon={null} items={recent} placeholder="Add a tag…" />
    </Field>
  ),
}

/**
 * Without a `Field`. The control has nothing to name it, so it takes an
 * `aria-label` — and the attribute is **spread only when it is set**, because an
 * explicit `undefined` would override the `aria-labelledby` Base UI computes
 * from a Field's context and silently strip the name off every one inside a
 * Field.
 */
export const Standalone: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="w-80">
      <Autocomplete items={recent} placeholder="Search anything…" aria-label="Search" />
    </div>
  ),
}

/**
 * Where it actually goes: the search box at the top of a page, remembering what
 * you looked for last time, beside a field whose value *does* have to come from
 * a list.
 *
 * The pair is the decision tree in one screen. Search takes anything; the city
 * has to be one we fly to. They look almost identical, and that is the point —
 * the difference is in what happens when you type something unexpected.
 */
export const InContext: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex w-96 flex-col gap-6 rounded-lg border border-surface-border bg-surface-card-primary p-6">
      <Field label="Search" description="We keep your last few searches">
        <Autocomplete items={recent} placeholder="Search anything…" />
      </Field>
      <Field label="Destination" description="Anywhere we fly, or somewhere we should">
        <Autocomplete items={cities} startIcon={MapPin} placeholder="Where to?" />
      </Field>
      <Field label="Tag" description="Reuse one, or make a new one">
        <Autocomplete items={grouped} startIcon={Hash} placeholder="Add a tag…" />
      </Field>
    </div>
  ),
}
