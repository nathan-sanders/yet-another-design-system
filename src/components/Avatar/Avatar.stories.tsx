import type { Meta, StoryObj } from '@storybook/react-vite'
import { AtSign, Heart, MessageCircle } from 'lucide-react'
import { expect, within } from 'storybook/test'

import { Avatar } from './Avatar'
import samplePhoto from './sample-photo.png'
import { Icon } from '../Icon'
import { Text } from '../Text'

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
 * of its own rather than only a color — a filled disc, a ring, and a disc with
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
 * A mark on the corner: what a notification is about, or the network a
 * profile posts to. A 20px disc on Surface/Background Primary, hanging 6px
 * past the circle on both axes, as Yet Social's `_Notification Item` and
 * `_Composer Channel` draw it.
 *
 * Drawn only at **base**, so it is one size: the same disc on a large avatar
 * reads, and on the smaller two it would outweigh the face. It shares the
 * dot's corner, so an avatar takes a `status` or a `badge`, not both.
 *
 * The badge is decorative; `badgeLabel` joins the avatar's name the way a
 * status does, so the third one here is announced "Ada Lovelace, Liked".
 */
export const Badge: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex items-end gap-6">
      <Avatar name="Nathan Sanders" src={samplePhoto} badge={<Icon icon={AtSign} size="small" />} />
      <Avatar name="Maria Lopez" badge={<Icon icon={MessageCircle} size="small" />} />
      <Avatar name="Ada Lovelace" badge={<Icon icon={Heart} size="small" />} badgeLabel="Liked" />
      <Avatar size="large" name="Grace Hopper" badge={<Icon icon={AtSign} size="small" />} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const avatars = canvasElement.querySelectorAll<HTMLElement>('[role="img"]')
    for (const avatar of avatars) {
      const disc = avatar.querySelector<HTMLElement>('[data-badge]')!
      const box = avatar.getBoundingClientRect()
      const mark = disc.getBoundingClientRect()
      // 20px, 6px past the circle to the right and below, at every size drawn.
      await expect([mark.width, mark.height]).toEqual([20, 20])
      await expect(mark.right - box.right).toBe(6)
      await expect(mark.bottom - box.bottom).toBe(6)
      await expect(disc).toHaveAttribute('aria-hidden', 'true')
    }

    // The disc's fill is Surface/Background Primary, compared through the same
    // serializer rather than a parsed color.
    const probe = document.createElement('div')
    probe.style.background = 'var(--surface-background-primary)'
    canvasElement.append(probe)
    const fill = getComputedStyle(probe).backgroundColor
    probe.remove()
    await expect(getComputedStyle(avatars[0]!.querySelector('[data-badge]')!).backgroundColor).toBe(fill)

    await expect(within(canvasElement).getByRole('img', { name: 'Ada Lovelace, Liked' })).toBeInTheDocument()
  },
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
          <Text render={<span />} size="sm" color="subtle">{label}</Text>
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
 * by the type. An unlabeled link or button will not compile.
 */
export const Interactive: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-wrap items-center gap-8">
      <div className="flex flex-col items-center gap-3">
        <Avatar size="large" src={samplePhoto} name="Nathan Sanders" href="#profile" />
        <Text render={<span />} size="sm" color="subtle">Link (href)</Text>
      </div>
      <div className="flex flex-col items-center gap-3">
        <Avatar
          size="large"
          name="Ada Lovelace"
          status="online"
          onClick={() => alert('Opened Ada’s profile')}
        />
        <Text render={<span />} size="sm" color="subtle">Button (onClick)</Text>
      </div>
      <div className="flex flex-col items-center gap-3">
        <Avatar size="large" src={samplePhoto} name="Nathan Sanders" />
        <Text render={<span />} size="sm" color="subtle">Static (neither)</Text>
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
            <Text render={<span />}>{name}</Text>
            <Text render={<span />} size="sm" color="subtle">{role}</Text>
          </div>
        </div>
      ))}
    </div>
  ),
}
