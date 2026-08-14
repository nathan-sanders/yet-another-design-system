import type { Meta, StoryObj } from '@storybook/react-vite'

import { Avatar } from './Avatar'
import { AvatarGroup } from './AvatarGroup'
import samplePhoto from './sample-photo.png'

const sizes = ['x-small', 'small', 'base', 'large', 'x-large'] as const

const team = [
  { id: 'ns', name: 'Nathan Sanders', src: samplePhoto },
  { id: 'al', name: 'Ada Lovelace' },
  { id: 'gh', name: 'Grace Hopper' },
  { id: 'ke', name: 'Katherine Johnson' },
  { id: 'mh', name: 'Margaret Hamilton' },
]

const meta = {
  title: 'Components/AvatarGroup',
  component: AvatarGroup,
  argTypes: {
    size: { control: 'inline-radio', options: sizes },
  },
  args: {
    size: 'base',
    // `children` is required on the group, so it has to be in the default args
    // even though every story below renders its own.
    children: (
      <>
        {team.slice(0, 4).map((person) => (
          <Avatar key={person.id} src={person.src} name={person.name} />
        ))}
        <AvatarGroup.Overflow count={team.length - 4} />
      </>
    ),
  },
} satisfies Meta<typeof AvatarGroup>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The Figma component (node 40004113:14594): four avatars and a `+1`.
 *
 * `size` is set once on the group and reaches every child through context, so
 * change it here and the whole row moves together. A child that sets its own
 * `size` still wins.
 */
export const Playground: Story = {}

/**
 * The group at every size.
 *
 * **The overlap is the ring width.** Figma's group is five 36px avatars at 164px
 * total — `5 × 36 − 4 × 4` — so each circle sits 4px into the one before it,
 * exactly as wide as the canvas ring it carries. The two cancel out and leave a
 * clean band of canvas between neighbours.
 *
 * That ring is an `outline`, not a `border`, because Figma draws it as an
 * outside stroke: it must not shrink the photo or take up room in the row. It is
 * also why the row measures 164px rather than 180px, and why the group's total
 * width is the number worth checking when this component changes.
 *
 * Figma specifies the group only at `base`, where the ring is 4px. The two small
 * sizes step down to 2px here, which is how Figma scales the status dot's ring
 * over the same range — a 4px ring on a 20px avatar leaves very little avatar.
 */
export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-8">
      {sizes.map((size) => (
        <div key={size} className="flex flex-col gap-3">
          <span className="text-sm text-content-subtle">{size}</span>
          <AvatarGroup size={size}>
            {team.slice(0, 4).map((person) => (
              <Avatar key={person.id} src={person.src} name={person.name} />
            ))}
            <AvatarGroup.Overflow count={team.length - 4} />
          </AvatarGroup>
        </div>
      ))}
    </div>
  ),
}

/**
 * The group does **not** count for you — you slice the list and pass the
 * overflow yourself, as Astryx's AvatarGroup does. That keeps "how many fit" a
 * layout decision at the call site rather than a rule baked into the component.
 *
 * `AvatarGroup.Overflow` takes a `count`, or children when the number needs
 * capping (`99+`). Give it an `onClick` and it becomes a focusable `<button>`
 * for opening the full list; without one it is a static circle labelled
 * "N more".
 */
export const Overflow: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <span className="text-sm text-content-subtle">No overflow — everyone fits</span>
        <AvatarGroup>
          {team.map((person) => (
            <Avatar key={person.id} src={person.src} name={person.name} />
          ))}
        </AvatarGroup>
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-sm text-content-subtle">Two shown, three hidden</span>
        <AvatarGroup>
          {team.slice(0, 2).map((person) => (
            <Avatar key={person.id} src={person.src} name={person.name} />
          ))}
          <AvatarGroup.Overflow count={team.length - 2} />
        </AvatarGroup>
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-sm text-content-subtle">Capped count</span>
        <AvatarGroup>
          {team.slice(0, 3).map((person) => (
            <Avatar key={person.id} src={person.src} name={person.name} />
          ))}
          <AvatarGroup.Overflow count={128} label="128 more">
            99+
          </AvatarGroup.Overflow>
        </AvatarGroup>
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-sm text-content-subtle">Clickable overflow — tab to it</span>
        <AvatarGroup>
          {team.slice(0, 4).map((person) => (
            <Avatar key={person.id} src={person.src} name={person.name} />
          ))}
          <AvatarGroup.Overflow count={1} onClick={() => alert('Show all 5 people')} />
        </AvatarGroup>
      </div>
    </div>
  ),
}

/**
 * Where a group actually goes: on a row that stands for a set of people, with a
 * count beside it doing the counting in words.
 *
 * Status dots are left off inside a group on purpose — at this overlap a dot
 * lands underneath the next circle, and availability is a per-person fact that a
 * stacked row is the wrong place to read.
 */
export const InContext: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex max-w-md flex-col gap-4 rounded-lg border border-surface-border bg-surface-card-primary p-4 shadow-low">
      <div className="flex items-baseline justify-between">
        <span className="text-base font-semibold text-content-primary">Design systems</span>
        <span className="text-sm text-content-subtle">{team.length} people</span>
      </div>

      <AvatarGroup size="small">
        {team.slice(0, 4).map((person) => (
          <Avatar key={person.id} src={person.src} name={person.name} />
        ))}
        <AvatarGroup.Overflow count={team.length - 4} />
      </AvatarGroup>
    </div>
  ),
}
