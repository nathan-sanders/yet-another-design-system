import type { ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { ChevronDown, Search } from 'lucide-react'

import { Kbd } from './Kbd'
import { parseKeys } from './keys'
import { Button } from '../Button'
import { Menu } from '../Menu'
import { Tooltip } from '../Tooltip'

/**
 * A card, for the stories that want to show a Kbd sitting on one. The fill is
 * translucent, so it reads on the bare canvas too — the scale stories are left
 * out there on purpose, as the check that it does.
 */
function Card({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-surface-border bg-surface-background-primary p-4">
      {children}
    </div>
  )
}

/** The tokens the key table knows, in the order they are worth reading. */
const tokens = [
  'mod',
  'ctrl',
  'alt',
  'shift',
  'enter',
  'backspace',
  'delete',
  'escape',
  'tab',
  'space',
  'up',
  'down',
  'left',
  'right',
  'home',
  'end',
  'pageup',
  'pagedown',
] as const

const meta = {
  title: 'Components/Kbd',
  component: Kbd,
  argTypes: {
    keys: { control: 'text' },
    label: { control: 'text' },
  },
  args: {
    keys: 'mod+k',
  },
} satisfies Meta<typeof Kbd>

export default meta
type Story = StoryObj<typeof meta>

/**
 * One shortcut with controls. Type any `+`-separated string into `keys` — a
 * token the table does not know is drawn as typed, so `mod+F5` works.
 */
export const Playground: Story = {}

/**
 * Every token the parser knows, with the glyph it draws and the name a screen
 * reader speaks. `mod` is the one to reach for in real code: it draws ⌘ on
 * Apple platforms and ⌃ everywhere else, so one call site is right on both.
 * The rest of the table is a superset of Astryx's — `space` and `delete` fall
 * through their parser and arrive shouted as `SPACE` and `DELETE`.
 */
export const Keys: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <table className="border-separate border-spacing-x-6 border-spacing-y-3">
      <thead>
        <tr>
          <th className="text-left text-sm font-normal text-content-subtle">Token</th>
          <th className="text-left text-sm font-normal text-content-subtle">Key</th>
          <th className="text-left text-sm font-normal text-content-subtle">Announced as</th>
        </tr>
      </thead>
      <tbody>
        {tokens.map((token) => (
          <tr key={token}>
            <td className="font-mono text-sm text-content-subtle">{token}</td>
            <td>
              <Kbd keys={token} />
            </td>
            <td className="text-sm text-content-subtle">
              {parseKeys(token, true)
                .map((k) => k.label)
                .join(' + ')}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  ),
}

/**
 * Modifiers combine by joining tokens with `+`. Each keystroke gets its own
 * key, 4px apart — Figma's `Kbd Group` — and the whole group is announced as a
 * single label, "Command + Shift + P", rather than three separate glyphs.
 */
export const Combinations: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <Kbd keys="mod+k" />
      <Kbd keys="mod+shift+p" />
      <Kbd keys="shift+enter" />
      <Kbd keys="ctrl+alt+delete" />
      <Kbd keys="alt+tab" />
      <Kbd keys="mod+shift+z" />
    </div>
  ),
}

/**
 * The three places a shortcut actually shows up: inline in a sentence, inside a
 * tooltip on the control it belongs to, and in a menu row's `endSlot` — Figma's
 * `End Slot`, which the file draws holding exactly this.
 *
 * The menu is last because its popup is portalled and drops downward; putting
 * it above the others would land it on top of them.
 */
export const InContext: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex max-w-md flex-col gap-6">
      <Card>
        <p className="text-base text-content-primary">
          Press <Kbd keys="mod+k" /> to open the command palette, or <Kbd keys="escape" /> to close
          it. Navigate with <Kbd keys="up" /> and <Kbd keys="down" />, then press{' '}
          <Kbd keys="enter" /> to select.
        </p>
      </Card>

      <Card>
        <Tooltip
          label={
            <span className="flex items-center gap-2">
              Search <Kbd keys="mod+k" />
            </span>
          }
        >
          <Button startIcon={Search} aria-label="Search" />
        </Tooltip>
      </Card>

      <Menu.Root open>
        {/* self-start: Menu.Root renders no element, so the Button is the
            column's flex item and would otherwise stretch to its width. */}
        <Menu.Trigger
          render={
            <Button className="self-start" endIcon={ChevronDown}>
              Edit
            </Button>
          }
        />
        <Menu.Popup className="min-w-56">
          <Menu.Group>
            <Menu.Item endSlot={<Kbd keys="mod+x" />}>Cut</Menu.Item>
            <Menu.Item endSlot={<Kbd keys="mod+c" />}>Copy</Menu.Item>
            <Menu.Item endSlot={<Kbd keys="mod+v" />}>Paste</Menu.Item>
            <Menu.Item endSlot={<Kbd keys="mod+z" />}>Undo</Menu.Item>
            <Menu.Item endSlot={<Kbd keys="mod+shift+z" />}>Redo</Menu.Item>
          </Menu.Group>
        </Menu.Popup>
      </Menu.Root>
    </div>
  ),
}
