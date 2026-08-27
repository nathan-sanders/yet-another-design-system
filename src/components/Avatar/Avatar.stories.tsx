import type { Meta, StoryObj } from '@storybook/react-vite'

import { Avatar } from './Avatar'
import samplePhoto from './sample-photo.png'

const sizes = ['x-small', 'small', 'base', 'large', 'x-large'] as const
const statuses = ['online', 'offline', 'unavailable'] as const

const meta = {
  title: 'Components/Avatar',
  component: Avatar,
  argTypes: {
    size: { control: 'inline-radio', options: sizes },
    status: { control: 'inline-radio', options: [undefined, ...statuses] },
    src: { control: 'text' },
    name: { control: 'text' },
    count: { control: 'number' },
  },
  args: {
    size: 'base',
    src: samplePhoto,
    name: 'Nathan Sanders',
    status: 'online',
  },
} satisfies Meta<typeof Avatar>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Every prop with controls — use the Theme switch in the toolbar for dark mode.
 *
 * Clear `src` to fall through to initials, clear `name` as well for the person
 * glyph, and set `count` to get the `+N` circle.
 */
export const Playground: Story = {}

/**
 * The whole Figma component set (node 40004102:5483), laid out the way the Figma
 * frame is: Content down, Size across.
 *
 * Figma calls the three rows `Content`, but there is no `content` prop — what
 * you see follows from what you pass. `src` is a photo, `name` is initials, and
 * `count` is the overflow circle, in that order of precedence. That is the same
 * move Button makes when it derives its icon-only shape from having no label:
 * two sources of truth cannot disagree if there is only one.
 *
 * The sizes are 20 · 24 · 36 · 40 · 128, and the initials scale with them —
 * 10px, 10px, 12px, 14px, 48px.
 */
export const Variants: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <table className="border-separate border-spacing-x-6 border-spacing-y-4">
      <thead>
        <tr>
          <th>
            <span className="sr-only">Content</span>
          </th>
          {sizes.map((size) => (
            <th key={size} className="text-left text-sm font-normal text-content-subtle">
              {size}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="text-sm text-content-subtle whitespace-nowrap">image</td>
          {sizes.map((size) => (
            <td key={size} className="align-bottom">
              <Avatar size={size} src={samplePhoto} name="Nathan Sanders" status="online" />
            </td>
          ))}
        </tr>
        <tr>
          <td className="text-sm text-content-subtle whitespace-nowrap">initials</td>
          {sizes.map((size) => (
            <td key={size} className="align-bottom">
              <Avatar size={size} name="Nathan Sanders" status="online" />
            </td>
          ))}
        </tr>
        <tr>
          <td className="text-sm text-content-subtle whitespace-nowrap">overflow</td>
          {sizes.map((size) => (
            <td key={size} className="align-bottom">
              <Avatar size={size} count={1} />
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  ),
}

/**
 * The Avatar Status set (node 40004102:5619). Three statuses, each with a shape
 * of its own rather than only a colour — a filled disc, a ring, and a disc with
 * a bar through it — so the three are still distinguishable to anyone who cannot
 * separate green from red.
 *
 * Figma gives the dot its own Size property (S 8 · M 12 · L 20), but the avatar
 * picks for you: the small dot on the two small avatars, the medium one on base
 * and large, the large one on x-large. There is no second size knob to get wrong.
 *
 * The dot is `aria-hidden`; its label is folded into the avatar's own accessible
 * name instead, so this row reads as "Nathan Sanders, Online" rather than
 * announcing the person and the dot separately.
 */
export const Status: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <table className="border-separate border-spacing-x-6 border-spacing-y-4">
      <thead>
        <tr>
          <th>
            <span className="sr-only">Status</span>
          </th>
          {sizes.map((size) => (
            <th key={size} className="text-left text-sm font-normal text-content-subtle">
              {size}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {statuses.map((status) => (
          <tr key={status}>
            <td className="text-sm text-content-subtle whitespace-nowrap">{status}</td>
            {sizes.map((size) => (
              <td key={size} className="align-bottom">
                <Avatar size={size} src={samplePhoto} name="Nathan Sanders" status={status} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  ),
}

/**
 * What shows when the photo does not.
 *
 * Base UI tracks the image's loading state and swaps in the fallback when it
 * errors, so a broken URL lands on initials without the component having to
 * watch for it. `fallbackDelay` holds the fallback back by a few hundred
 * milliseconds, which stops a photo that loads quickly from flashing initials
 * first — worth setting on a list, where every row would blink at once.
 *
 * The last one is the extension: Figma has no "no data" variant, so an avatar
 * with neither a photo nor a name would be an empty stone circle, which reads as
 * a rendering bug. The person glyph is borrowed from the end of Astryx's
 * fallback chain — a gap in the file rather than an invention, the way Badge's
 * four missing hues were.
 */
export const Fallbacks: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-wrap items-end gap-8">
      {[
        { label: 'Photo loads', props: { src: samplePhoto, name: 'Nathan Sanders' } },
        { label: 'Photo 404s', props: { src: '/nope.png', name: 'Nathan Sanders' } },
        { label: 'Name only', props: { name: 'Nathan Sanders' } },
        { label: 'One-word name', props: { name: 'Ada' } },
        { label: 'Initials overridden', props: { name: 'Nathan Sanders', initials: 'YADS' } },
        { label: 'Nothing at all', props: {} },
      ].map(({ label, props }) => (
        <div key={label} className="flex flex-col items-center gap-3">
          <Avatar size="large" {...props} />
          <span className="text-sm text-content-subtle">{label}</span>
        </div>
      ))}
    </div>
  ),
}

/**
 * Figma gives Avatar no Focus state, so this goes past the file: `href` renders
 * an `<a>`, `onClick` renders a `<button type="button">`, and both take the same
 * shared focus ring the rest of the library uses. Tab through them to see it.
 * Without either prop the avatar stays a static `<span>`, as Badge does.
 *
 * The ring is `box-shadow` rather than `outline`, because `outline` is already
 * carrying the canvas ring in a group — and a `border` would have shrunk the
 * photo rather than sitting outside it.
 *
 * An interactive avatar has no visible text, so `name` or `alt` is **required**
 * by the type. An unlabelled link or button will not compile.
 */
export const Interactive: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-wrap items-center gap-8">
      <div className="flex flex-col items-center gap-3">
        <Avatar size="large" src={samplePhoto} name="Nathan Sanders" href="#profile" />
        <span className="text-sm text-content-subtle">Link (href)</span>
      </div>
      <div className="flex flex-col items-center gap-3">
        <Avatar
          size="large"
          name="Ada Lovelace"
          status="online"
          onClick={() => alert('Opened Ada’s profile')}
        />
        <span className="text-sm text-content-subtle">Button (onClick)</span>
      </div>
      <div className="flex flex-col items-center gap-3">
        <Avatar size="large" src={samplePhoto} name="Nathan Sanders" />
        <span className="text-sm text-content-subtle">Static (neither)</span>
      </div>
    </div>
  ),
}

/**
 * Where avatars actually go — a row of comments. The avatar identifies the
 * person; the name beside it does the talking, which is why an avatar that sits
 * next to a name it repeats is `aria-hidden` unless you give it one of its own.
 */
export const InContext: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex max-w-md flex-col gap-4 rounded-lg border border-surface-border bg-surface-background-primary p-4 shadow-low">
      {[
        { name: 'Nathan Sanders', role: 'Design systems', src: samplePhoto, status: 'online' },
        { name: 'Ada Lovelace', role: 'Engineering', status: 'unavailable' },
        { name: 'Grace Hopper', role: 'Engineering', status: 'offline' },
      ].map(({ name, role, src, status }) => (
        <div key={name} className="flex items-center gap-3">
          <Avatar src={src} name={name} status={status as (typeof statuses)[number]} />
          <div className="flex flex-col">
            <span className="text-base text-content-primary">{name}</span>
            <span className="text-sm text-content-subtle">{role}</span>
          </div>
        </div>
      ))}
    </div>
  ),
}
