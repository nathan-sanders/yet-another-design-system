import type { Meta, StoryObj } from '@storybook/react-vite'

import { AspectRatio } from './AspectRatio'
import sampleImage from './sample-image.svg'

const ratios = ['1/1', '5/4', '4/5', '16/9', '9/16'] as const
const fits = ['cover', 'contain', 'center'] as const
const shapes = ['rectangle', 'ellipse'] as const

const meta = {
  title: 'Components/AspectRatio',
  component: AspectRatio,
  argTypes: {
    ratio: { control: 'inline-radio', options: ratios },
    fit: { control: 'inline-radio', options: [undefined, ...fits] },
    shape: { control: 'inline-radio', options: shapes },
  },
  args: {
    ratio: '16/9',
    fit: 'cover',
    shape: 'rectangle',
  },
} satisfies Meta<typeof AspectRatio>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Placeholder art, drawn 240×135 so it is landscape and smaller than the boxes it
 * goes in — which is what makes `cover`, `contain` and `center` three visibly
 * different things below rather than three nearly identical ones.
 */
function Sample({ alt = '' }: { alt?: string }) {
  return <img src={sampleImage} alt={alt} />
}

/**
 * Every prop with controls. The box is 320px wide here and takes its height from
 * the ratio — widen the canvas and the height follows.
 *
 * Clear `fit` to hand the sizing back to the child: the image then draws at its
 * natural size in the top-left corner, which is what a chart or a video player
 * that already knows how to fill its box would want.
 */
export const Playground: Story = {
  render: (args) => (
    <div className="w-80">
      <AspectRatio {...args} className="bg-surface-background-primary">
        <Sample />
      </AspectRatio>
    </div>
  ),
}

/**
 * The five named ratios — the Figma `Ratio` property, less its `Custom` variant.
 * Every box is the same 200px wide, so the height is the only thing changing, and
 * the crop tightens as the box narrows.
 *
 * The last one is `Custom`: any number is taken as width over height, here `2.35`
 * for anamorphic film. It reaches the box as a custom property that a utility
 * class reads back, rather than as an inline style, so a caller's
 * `className="md:aspect-square"` still wins over it at a breakpoint.
 */
export const Ratios: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-wrap items-start gap-6">
      {ratios.map((ratio) => (
        <div key={ratio} className="flex w-50 flex-col gap-2">
          <span className="text-sm text-content-subtle">ratio={ratio}</span>
          <AspectRatio ratio={ratio} fit="cover">
            <Sample />
          </AspectRatio>
        </div>
      ))}
      <div className="flex w-50 flex-col gap-2">
        <span className="text-sm text-content-subtle">ratio={'{2.35}'}</span>
        <AspectRatio ratio={2.35} fit="cover">
          <Sample />
        </AspectRatio>
      </div>
    </div>
  ),
}

/**
 * How the child is sized inside the box. The boxes are square and the image is
 * 240×135 landscape, which is the pairing that separates the three: `cover`
 * scales it up until it fills and crops the sides off, `contain` scales it up
 * until it fits and letterboxes the top and bottom, `center` leaves it alone at
 * 240×135 in the middle. Against a 16:9 box the first two would have drawn the
 * same picture.
 *
 * Left off, the child is rendered exactly as it was passed, with no wrapper and no
 * stretch — it sits at its natural size in the top-left and styles itself, which
 * is the shadcn behaviour the Figma set is documented against.
 */
export const Fit: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-wrap items-start gap-6">
      {fits.map((fit) => (
        <div key={fit} className="flex w-80 flex-col gap-2">
          <span className="text-sm text-content-subtle">fit={fit}</span>
          <AspectRatio ratio="1/1" fit={fit} className="bg-surface-background-primary">
            <Sample />
          </AspectRatio>
        </div>
      ))}
      <div className="flex w-80 flex-col gap-2">
        <span className="text-sm text-content-subtle">fit unset</span>
        <AspectRatio ratio="1/1" className="bg-surface-background-primary">
          <Sample />
        </AspectRatio>
      </div>
    </div>
  ),
}

/**
 * `rectangle` and `ellipse`, each at a square and a landscape ratio. The ellipse is
 * a percentage radius rather than a large pixel one, so it bends with the box: a
 * circle at `1/1`, a true oval at `16/9`. A pixel radius would have given the
 * second one a stadium — straight top and bottom, round ends — and the first one
 * would have looked identical either way, which is how this ships wrong.
 *
 * For a person, reach for `Avatar` instead; it owns the initials fallback, the
 * status dot and the group ring. This is for the other round things.
 */
export const Shape: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-wrap items-start gap-6">
      {shapes.map((shape) =>
        (['1/1', '16/9'] as const).map((ratio) => (
          <div key={`${shape}-${ratio}`} className="flex w-50 flex-col gap-2">
            <span className="text-sm text-content-subtle">
              shape={shape} ratio={ratio}
            </span>
            <AspectRatio ratio={ratio} shape={shape} fit="cover">
              <Sample />
            </AspectRatio>
          </div>
        )),
      )}
    </div>
  ),
}

/**
 * What it is for: a contact sheet whose cells line up because every one of them is
 * the same shape, whatever is behind it. The grid sets the width, the ratio sets
 * the height, and no cell carries a pixel size of its own — so the sheet reflows
 * to two columns on a phone without a single number changing.
 *
 * The last cell is the loading case. The box holds the space at the right shape
 * before there is anything to put in it, so the grid does not jump when the image
 * arrives.
 */
export const InContext: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="grid max-w-3xl grid-cols-2 gap-4 md:grid-cols-3">
      {['Frame 01', 'Frame 02', 'Frame 03', 'Frame 04', 'Frame 05'].map((label) => (
        <figure key={label} className="flex flex-col gap-2">
          <AspectRatio ratio="5/4" fit="cover" className="rounded-md">
            <Sample alt={`${label}, dusk over the ridge`} />
          </AspectRatio>
          <figcaption className="text-sm text-content-subtle">{label}</figcaption>
        </figure>
      ))}
      <div className="flex flex-col gap-2">
        <AspectRatio ratio="5/4" fit="cover" className="rounded-md">
          <div className="bg-surface-background-primary" />
        </AspectRatio>
        <span className="text-sm text-content-subtle">Loading</span>
      </div>
    </div>
  ),
}
