import type { ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Search } from 'lucide-react'

import { Kbd } from './Kbd'
import { parseKeys } from './keys'
import { Button } from '../Button'
import { Tooltip } from '../Tooltip'

/**
 * Every story sits on a card, and that is not decoration.
 * `Surface/Card Subtle` — the key's own fill — is the same value as
 * `Surface/Canvas` in both light and dark, so a Kbd on the bare Storybook
 * background would be held only by its shadow. The token is telling the truth
 * about where the component belongs.
 */
function Card({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-surface-border bg-surface-card-primary p-4">
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
export const Playground: Story = {
  render: (args) => (
    <Card>
      <Kbd {...args} />
    </Card>
  ),
}

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
    <Card>
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
    </Card>
  ),
}

/**
 * Modifiers combine by joining tokens with `+`. Each keystroke gets its own
 * key, 4px apart, and the whole group is announced as a single label —
 * "Command + Shift + P" — rather than three separate glyphs.
 */
export const Combinations: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Card>
      <div className="flex flex-wrap items-center gap-4">
        <Kbd keys="mod+k" />
        <Kbd keys="mod+shift+p" />
        <Kbd keys="shift+enter" />
        <Kbd keys="ctrl+alt+delete" />
        <Kbd keys="alt+tab" />
        <Kbd keys="mod+shift+z" />
      </div>
    </Card>
  ),
}

/**
 * The three places a shortcut actually shows up: inline in a sentence, paired
 * with the action it triggers, and inside a tooltip on the control it belongs
 * to. All three are card surfaces, which is the point — and the Tooltip popup
 * is already one, so a Kbd needs nothing extra to sit in it.
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
        <div className="flex flex-col">
          {[
            ['Cut', 'mod+x'],
            ['Copy', 'mod+c'],
            ['Paste', 'mod+v'],
            ['Undo', 'mod+z'],
            ['Redo', 'mod+shift+z'],
          ].map(([action, keys]) => (
            <div
              key={action}
              className="flex items-center justify-between gap-6 px-2 py-1.5 text-base text-content-primary"
            >
              <span>{action}</span>
              <Kbd keys={keys} />
            </div>
          ))}
        </div>
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
    </div>
  ),
}
