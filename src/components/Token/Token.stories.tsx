import type { Meta, StoryObj } from '@storybook/react-vite'
import { Circle, CircleDot, Smile, Tag, User } from 'lucide-react'
import { expect, within } from 'storybook/test'

import { Badge } from '../Badge'
import { Icon } from '../Icon'
import { Token } from './Token'
import { Text } from '../Text'

const sizes = ['default', 'small'] as const
const radii = ['md', 'sm'] as const

const meta = {
  title: 'Components/Token',
  component: Token,
  argTypes: {
    size: { control: 'inline-radio', options: sizes },
    radius: { control: 'inline-radio', options: radii },
    children: { control: 'text' },
    disabled: { control: 'boolean' },
  },
  args: {
    children: 'Label',
    size: 'default',
    radius: 'md',
    disabled: false,
  },
} satisfies Meta<typeof Token>

export default meta
type Story = StoryObj<typeof meta>

/**
 * One token with controls — use the Theme switch in the toolbar for dark mode.
 *
 * There is no `usage` control because there is no `usage` prop: pass an
 * `onRemove` in the story below and the token becomes Figma's `Interactive`.
 */
export const Playground: Story = {}

/**
 * The whole Figma component set (node 40004003:3431), laid out the way the frame
 * is: `Usage` down, `Size` across.
 *
 * **Hover and focus are live, not drawn.** Figma models them as a `State`
 * property; here they are what the browser does, so point at the interactive row
 * and tab into it. The hover state is the *only* difference Figma draws between
 * Default and Hover — `Elevation/Drop Shadow/Low` appears and nothing else
 * changes.
 *
 * View Only has no Hover or Focus variant, which is not an omission: there is
 * nothing in it to hover or focus.
 */
export const AllVariants: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <table className="border-separate border-spacing-x-8 border-spacing-y-4">
      <thead>
        <tr>
          <th>
            <span className="sr-only">Usage</span>
          </th>
          {sizes.map((size) => (
            <th key={size} className="text-left text-sm font-normal text-content-subtle capitalize">
              {size}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="text-sm text-content-subtle">View only</td>
          {sizes.map((size) => (
            <td key={size}>
              <Token {...args} size={size} />
            </td>
          ))}
        </tr>
        <tr>
          <td className="text-sm text-content-subtle">View only, disabled</td>
          {sizes.map((size) => (
            <td key={size}>
              <Token {...args} size={size} disabled />
            </td>
          ))}
        </tr>
        <tr>
          <td className="text-sm text-content-subtle">Interactive</td>
          {sizes.map((size) => (
            <td key={size}>
              <Token {...args} size={size} onRemove={() => {}} />
            </td>
          ))}
        </tr>
        <tr>
          <td className="text-sm text-content-subtle">Interactive, disabled</td>
          {sizes.map((size) => (
            <td key={size}>
              <Token {...args} size={size} onRemove={() => {}} disabled />
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  ),
}

/**
 * The leading and trailing slots, at both sizes.
 *
 * `startIcon` is Figma's Icon slot, 14px at both sizes. `avatar` is its Avatar
 * slot — put a `Token.Avatar` in it and the size comes from the token, 16px here
 * and 12px at small. `endSlot` is Figma's "End Slot Items", which is where
 * Astryx's trailing count Badge goes.
 *
 * The last row is the one that matters to a Combobox: a long label truncates
 * rather than widening the token, so a field full of tokens never grows sideways
 * because somebody picked something with a long name.
 *
 * **The end slot is the one thing that can break the height**, because it is
 * whatever the caller puts there. A small token has 18px of content box, and a
 * Badge is 20px tall by its own Figma spec — so a Badge in a small token makes it
 * 22, not 20. That is why the Badge row below is at the default size only, and
 * why the small token gets an icon instead. It is also what Figma draws: the
 * small variant's "End Slot Items" slot holds a 14px icon.
 */
export const Slots: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="flex flex-col gap-6">
      {sizes.map((size) => (
        <div key={size} className="flex flex-col gap-3">
          <Text size="sm" color="subtle" className="capitalize">{size}</Text>
          <div className="flex flex-wrap items-center gap-3">
            <Token {...args} size={size} startIcon={Tag}>
              Design
            </Token>
            <Token {...args} size={size} startIcon={User} onRemove={() => {}}>
              Sarah Chen
            </Token>
            <Token {...args} size={size} avatar={<Token.Avatar name="Sarah Chen" />}>
              Sarah Chen
            </Token>
            <Token
              {...args}
              size={size}
              avatar={<Token.Avatar name="Alex Rivera" />}
              onRemove={() => {}}
            >
              Alex Rivera
            </Token>
            {size === 'default' ? (
              <Token {...args} size={size} endSlot={<Badge color="blue">12</Badge>}>
                Inbox
              </Token>
            ) : (
              <Token {...args} size={size} endSlot={<Icon icon={Circle} size="small" />}>
                Inbox
              </Token>
            )}
            <Token {...args} size={size} startIcon={Tag} onRemove={() => {}}>
              Reviews
            </Token>
          </div>
          <div className="w-40">
            <Token {...args} size={size} startIcon={Tag} onRemove={() => {}}>
              A label far too long to fit
            </Token>
          </div>
        </div>
      ))}
    </div>
  ),
}

/**
 * A token that does something when you click it — a filter to toggle, a detail
 * to open — and the same thing as a link.
 *
 * **The whole pill is the target, but the token is not a `<button>`.** It is a
 * `<span>` with an invisible button stretched across it, because a removable
 * token would otherwise nest one button inside another. The last two here have
 * both, which is the case that needs it: tab through them and you get two stops,
 * the ring around the token for the click target and the wash on the `x`
 * for the remove.
 */
export const Clickable: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      <Token {...args} onClick={() => {}}>
        Bug
      </Token>
      <Token {...args} startIcon={Tag} onClick={() => {}}>
        Feature
      </Token>
      <Token {...args} href="https://example.com" target="_blank" rel="noreferrer">
        Documentation
      </Token>
      <Token {...args} onClick={() => {}} onRemove={() => {}}>
        Enhancement
      </Token>
      <Token
        {...args}
        avatar={<Token.Avatar name="Jordan Lee" />}
        onClick={() => {}}
        onRemove={() => {}}
      >
        Jordan Lee
      </Token>
    </div>
  ),
}

/**
 * The two corner radii, and why there are two.
 *
 * `md` (8px) is a token standing on its own, and the radius every card and field
 * in the library uses. `sm` (6px) is a token **nested inside a field** — what a
 * `Combobox` passes for its chips — because two curves of the same radius on
 * different centers never read as parallel. Subtracting the gap between them is
 * the usual rule of thumb, and 8 − 3 lands almost exactly on the 6 the scale
 * already has.
 *
 * The boxes here are the field: `rounded-md` with the tokenizer's own 3px of
 * padding, so the difference is the one you would actually see. It is easiest to
 * spot at the corner nearest the box.
 *
 * A prop rather than something derived, because a token cannot see what it is
 * sitting in — and **Figma still draws 8px inside the Combobox**, so this is a
 * case of code going first, like Divider's `emphasis`.
 */
export const Radius: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="flex flex-col gap-6">
      {(
        [
          { radius: 'md', label: 'md — 8px, standing on its own' },
          { radius: 'sm', label: 'sm — 6px, nested in a field' },
        ] as const
      ).map(({ radius, label }) => (
        <div key={radius} className="flex flex-col gap-2">
          <Text render={<span />} size="sm" color="subtle">{label}</Text>
          <div className="flex w-80 flex-wrap items-center gap-1 rounded-md border border-input-border bg-input-background p-[3px]">
            <Token {...args} radius={radius} onRemove={() => {}}>
              Ada Lovelace
            </Token>
            <Token {...args} radius={radius} onRemove={() => {}}>
              Grace Hopper
            </Token>
          </div>
        </div>
      ))}
    </div>
  ),
}

/**
 * `labelHidden`: only the icon or avatar shows, with the token's usual 8px
 * either side, and the label is still the token's name, `sr-only`. For a dense row
 * where the glyph already says the value, like the status, assignee and
 * sentiment on a message-list card. The plain token beside them is the one whose
 * value has no glyph to stand in for it.

 */
export const LabelHidden: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-4">
      {sizes.map((size) => (
        <div key={size} data-size={size} className="flex flex-wrap items-center gap-1">
          <Token size={size} startIcon={Tag}>
            #4821
          </Token>
          <Token size={size} labelHidden startIcon={CircleDot}>
            Status: In progress
          </Token>
          <Token size={size} labelHidden avatar={<Token.Avatar name="Sarah Chen" />}>
            Assigned to Sarah Chen
          </Token>
          <Token size={size} labelHidden startIcon={Smile} onClick={() => {}}>
            Sentiment: Positive
          </Token>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    for (const [size, px] of [
      ['default', 24],
      ['small', 20],
    ] as const) {
      const row = canvasElement.querySelector<HTMLElement>(`[data-size="${size}"]`)!
      const [, ...hidden] = Array.from(row.children) as HTMLElement[]
      for (const pill of hidden) {
        // 8px from the border to the glyph on both sides, at the usual height.
        const box = pill.getBoundingClientRect()
        // The first child in the flow: a clickable token leads with its overlay.
        const glyph = (Array.from(pill.children) as HTMLElement[])
          .find((c) => getComputedStyle(c).position !== 'absolute')!
          .getBoundingClientRect()
        await expect([glyph.left - box.left - 1, box.right - glyph.right - 1]).toEqual([8, 8])
        await expect(box.height).toBe(px)
      }
      // The label is gone from sight, not from the name.
      await expect(within(row).getByText('Status: In progress')).toHaveClass('sr-only')
      await expect(
        within(row).getByRole('button', { name: 'Sentiment: Positive' }),
      ).toBeInTheDocument()
    }
  },
}

/**
 * Tokens standing in for a real screen, at the default size — the two groupings
 * Astryx documents: a row of active filters, and a list of chosen recipients.
 *
 * Both are the shape a Combobox will produce for a multi-select. The tokens wrap
 * onto a second line rather than pushing the row wider, which is exactly the one
 * kind of growth a field is allowed.
 */
export const InContext: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex max-w-96 flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Text size="sm" color="subtle">Active filters</Text>
        <div className="flex flex-wrap gap-2">
          <Token onRemove={() => {}}>Status: Open</Token>
          <Token onRemove={() => {}}>Priority: High</Token>
          <Token onRemove={() => {}}>Team: Design</Token>
          <Token onRemove={() => {}}>Updated: This week</Token>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Text size="sm" color="subtle">Selected recipients</Text>
        <div className="flex flex-wrap gap-2">
          <Token avatar={<Token.Avatar name="Sarah Chen" />} onRemove={() => {}}>
            Sarah Chen
          </Token>
          <Token avatar={<Token.Avatar name="Alex Rivera" />} onRemove={() => {}}>
            Alex Rivera
          </Token>
          <Token avatar={<Token.Avatar name="Jordan Lee" />} onRemove={() => {}}>
            Jordan Lee
          </Token>
        </div>
      </div>
    </div>
  ),
}
