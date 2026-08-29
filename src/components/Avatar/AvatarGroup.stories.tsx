import type { Meta, StoryObj } from '@storybook/react-vite'

import { cn } from '../../lib/cn'
import { Avatar } from './Avatar'
import { AvatarGroup } from './AvatarGroup'
import samplePhoto from './sample-photo.png'

const sizes = ['x-small', 'small', 'base', 'large', 'x-large'] as const
const surfaces = ['canvas', 'card-primary', 'card-subtle', 'card-emphasized'] as const

/** The fill each `surface` value names, so a story can sit a group on its own surface. */
const SURFACE_CLASS: Record<(typeof surfaces)[number], string> = {
  canvas: 'bg-surface-canvas',
  'card-primary': 'bg-surface-background-primary',
  'card-subtle': 'bg-surface-background-subtle',
  'card-emphasized': 'bg-surface-background-emphasized',
}

/** `card-emphasized` is the dark one, so its label has to flip. */
const SURFACE_LABEL_CLASS: Record<(typeof surfaces)[number], string> = {
  canvas: 'text-content-subtle',
  'card-primary': 'text-content-subtle',
  'card-subtle': 'text-content-subtle',
  'card-emphasized': 'text-content-inverse',
}

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
    surface: { control: 'inline-radio', options: surfaces },
  },
  args: {
    size: 'base',
    surface: 'canvas',
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
 * The Figma component (node 40004297:11406): four avatars and a `+1`.
 *
 * `size` is set once on the group and reaches every child through context, so
 * change it here and the whole row moves together. A child that sets its own
 * `size` still wins.
 */
export const Playground: Story = {}

/**
 * The group at every size, off Figma's Size axis (`40004297:11406`).
 *
 * **The ring and the overlap are two different numbers**, and this story is
 * where that is visible:
 *
 * | size | avatar | ring | overlap | width |
 * |---|---|---|---|---|
 * | x-small | 20 | 2 | 4 | 84 |
 * | small | 24 | 4 | 4 | 104 |
 * | base | 36 | 4 | 4 | 164 |
 * | large | 40 | 4 | 4 | 184 |
 * | x-large | 128 | 8 | 24 | 544 |
 *
 * The **ring** is the band of background you see between two photos. The
 * **overlap** is how far the next circle sits into the previous one. They are
 * equal at three of five sizes, which is a coincidence rather than a rule —
 * look at `x-large`, which stacks 24px into a 128px circle because 4px would
 * not read as a stack, and at `x-small`, which keeps the 4px overlap but rings
 * at 2px because 4px would eat a 20px photo.
 *
 * The ring is an `outline`, not a `border`, because Figma draws it as an
 * outside stroke: it must not shrink the photo or take up room in the row. That
 * is why a row of five `base` avatars measures 164px rather than 180px. The
 * width to check is `5 × size − 4 × overlap`.
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
 *
 * **Note `surface="card-primary"`.** The card is white and the page is not, so
 * without it the rings would be painted in the canvas color and read as grey
 * halos rather than as the gap they are. This story had exactly that bug until
 * the prop existed. Compare with `Surfaces` below.
 */
export const InContext: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex max-w-md flex-col gap-4 rounded-lg border border-surface-border bg-surface-background-primary p-4 shadow-low">
      <div className="flex items-baseline justify-between">
        <span className="text-base font-semibold text-content-primary">Design systems</span>
        <span className="text-sm text-content-subtle">{team.length} people</span>
      </div>

      <AvatarGroup surface="card-primary">
        {team.slice(0, 4).map((person) => (
          <Avatar key={person.id} src={person.src} name={person.name} />
        ))}
        <AvatarGroup.Overflow count={team.length - 4} />
      </AvatarGroup>
    </div>
  ),
}

/**
 * The four surfaces, each group sitting on the one it names.
 *
 * The ring between overlapping avatars is not a color — it is a band of
 * whatever is behind the group, showing through. CSS has no way to ask what
 * that is, so `surface` tells it, and every row here is correct because the
 * prop and the background agree.
 *
 * **The bottom row is the same group with the prop left at its default**, on a
 * card. That is what the mismatch looks like: a grey outline drawn around each
 * circle instead of a gap between them. Worth seeing once, because it is subtle
 * enough in light mode to survive review — flip the toolbar to dark, where
 * `surface-canvas` and `surface-background-primary` are two different near-blacks,
 * and it is unmistakable.
 */
export const Surfaces: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-4">
      {surfaces.map((surface) => (
        <div
          key={surface}
          className={cn(
            'flex items-center justify-between gap-4 rounded-lg p-4',
            SURFACE_CLASS[surface],
          )}
        >
          <span className={cn('font-mono text-sm', SURFACE_LABEL_CLASS[surface])}>
            surface="{surface}"
          </span>
          <AvatarGroup surface={surface}>
            {team.slice(0, 4).map((person) => (
              <Avatar key={person.id} src={person.src} name={person.name} />
            ))}
            <AvatarGroup.Overflow count={team.length - 4} />
          </AvatarGroup>
        </div>
      ))}

      <div className="flex items-center justify-between gap-4 rounded-lg border border-feedback-danger-highlight bg-surface-background-primary p-4">
        <span className="font-mono text-sm text-content-subtle">
          the default, on a card — wrong
        </span>
        <AvatarGroup>
          {team.slice(0, 4).map((person) => (
            <Avatar key={person.id} src={person.src} name={person.name} />
          ))}
          <AvatarGroup.Overflow count={team.length - 4} />
        </AvatarGroup>
      </div>
    </div>
  ),
}
