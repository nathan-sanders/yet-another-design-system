import type { Meta, StoryObj } from '@storybook/react-vite'
import { AlignCenter, AlignJustify, AlignLeft, AlignRight, Link, Trash2 } from 'lucide-react'

import { Avatar } from '../Avatar'
import { Badge } from '../Badge'
import { Button } from '../Button'
import { SegmentedControl } from '../SegmentedControl'
import { Tooltip } from './Tooltip'

const sides = ['top', 'right', 'bottom', 'left'] as const
const alignments = ['start', 'center', 'end'] as const

const meta = {
  title: 'Components/Tooltip',
  component: Tooltip,
  argTypes: {
    side: { control: 'inline-radio', options: sides },
    align: { control: 'inline-radio', options: alignments },
    sideOffset: { control: { type: 'range', min: 0, max: 24, step: 1 } },
    delay: { control: { type: 'range', min: 0, max: 1200, step: 50 } },
    disabled: { control: 'boolean' },
    label: { control: 'text' },
    children: { control: false },
  },
  args: {
    label: 'This is a tooltip',
    side: 'top',
    align: 'center',
    sideOffset: 4,
    // `children` is required, so it lives here rather than in each story. Stories
    // that build from the raw parts ignore it and render their own triggers.
    children: <Button appearance="secondary">Hover me</Button>,
  },
  // Every story needs room around the trigger, or a top-side popup gets clipped
  // by the story frame and the collision logic flips it somewhere unexpected.
  decorators: [
    (Story) => (
      <div className="flex min-h-64 items-center justify-center p-16">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Tooltip>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Hover or focus the button. Everything is on controls — including `delay`, which
 * is worth playing with: Base UI waits 600ms by default, long enough that a
 * tooltip never fires while you are just moving the cursor across the screen.
 *
 * The label here is the string from Figma, which renders the component at its
 * documented 127×32.
 */
export const Playground: Story = {}

/**
 * The four sides. `side` is a *preference*, not a guarantee — Base UI's positioner
 * flips the popup to the opposite side when the chosen one would push it out of
 * the viewport, so narrow the window and watch the top and bottom ones swap.
 *
 * All four are held open so the whole set is visible at once. Note that each one
 * grows out of the edge nearest its trigger: Base UI sets `--transform-origin` on
 * the popup and the recipe scales from there.
 */
export const Sides: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="grid grid-cols-3 grid-rows-3 place-items-center gap-4">
      {sides.map((side) => (
        <div
          key={side}
          className={
            side === 'top'
              ? 'col-start-2 row-start-1'
              : side === 'bottom'
                ? 'col-start-2 row-start-3'
                : side === 'left'
                  ? 'col-start-1 row-start-2'
                  : 'col-start-3 row-start-2'
          }
        >
          <Tooltip.Root open>
            <Tooltip.Trigger
              render={<Button appearance="secondary" className="capitalize">{side}</Button>}
            />
            <Tooltip.Portal>
              <Tooltip.Positioner side={side} sideOffset={4}>
                <Tooltip.Popup>On the {side}</Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        </div>
      ))}
    </div>
  ),
}

/**
 * Where the popup sits along its side. `center` is the default and almost always
 * right; `start` and `end` matter when the trigger is much wider than the label,
 * which is exactly when a centred tooltip stops pointing at anything in
 * particular.
 */
export const Alignment: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col items-center gap-16">
      {alignments.map((align) => (
        <Tooltip.Root key={align} open>
          <Tooltip.Trigger
            render={
              <Button appearance="secondary" className="w-80 capitalize">
                {align}
              </Button>
            }
          />
          <Tooltip.Portal>
            <Tooltip.Positioner side="bottom" align={align} sideOffset={4}>
              <Tooltip.Popup>Aligned to {align}</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>
      ))}
    </div>
  ),
}

/**
 * A label longer than 384px wraps rather than running off the screen.
 *
 * This is the one place the implementation departs from Figma. The Figma text
 * layer is `white-space: nowrap`, because it is auto-width on the canvas — but
 * the frame also carries `max-w-96` and `word-break: break-word`, and neither of
 * those means anything unless the text is allowed to wrap. Keeping the nowrap
 * would have made the other two dead properties.
 *
 * Long tooltips are still a smell: if the label needs two lines, the thing it
 * describes probably needs a visible label instead.
 */
export const LongLabel: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Tooltip.Root open>
      <Tooltip.Trigger render={<Button appearance="secondary">Long label</Button>} />
      <Tooltip.Portal>
        <Tooltip.Positioner side="bottom" sideOffset={4}>
          <Tooltip.Popup>
            Archived projects stay searchable and keep their history, but they no longer appear in
            the sidebar and stop sending notifications to the people watching them.
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  ),
}

/**
 * The trigger can be anything. `children` is handed to Base UI's `render`, so the
 * caller's own element becomes the trigger rather than being wrapped in a Base UI
 * `<button>` — which is what lets Button, Avatar and Badge all work unchanged.
 *
 * The icon-only Button is the important one, and the trap worth naming: a tooltip
 * lands on `aria-describedby`, not `aria-labelledby`. It *describes*; it is not a
 * name. The button still carries its own `aria-label`, which `ButtonProps`
 * requires at compile time — an unlabelled icon button does not build, tooltip or
 * no tooltip.
 *
 * The bare `<span>` shows the other edge: it is not focusable, so its tooltip is
 * reachable by mouse only. Prefer a real interactive element.
 */
export const Triggers: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex items-center gap-6">
      <Tooltip label="Delete project">
        <Button appearance="destructive" startIcon={Trash2} aria-label="Delete project" />
      </Tooltip>

      <Tooltip label="Ada Lovelace — Engineering">
        <Avatar name="Ada Lovelace" onClick={() => {}} />
      </Tooltip>

      <Tooltip label="Deployed 4 minutes ago">
        <Badge color="green">Live</Badge>
      </Tooltip>

      <Tooltip label="Mouse-only, because a span cannot take focus">
        <span className="text-base text-content-subtle underline decoration-dotted">
          plain text
        </span>
      </Tooltip>
    </div>
  ),
}

/**
 * `Tooltip.Provider` shares one delay across a group. The first tooltip waits the
 * full 600ms; while the group stays warm, its neighbours open instantly. Sweep
 * along this control and it reads as one surface rather than four separate waits.
 *
 * The instant ones also skip the transition — Base UI marks them `data-instant`,
 * and the recipe drops the duration to zero for that case. An animation that
 * plays again on every neighbour is what makes a hovered toolbar feel noisy.
 *
 * Icon-only segments are the case tooltips exist for. The tooltip *describes*;
 * `aria-label` still does the naming, which the types require — so each segment
 * carries both.
 */
export const SharedDelay: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Tooltip.Provider>
      <SegmentedControl aria-label="Text alignment" defaultValue="left">
        <Tooltip label="Align left">
          <SegmentedControl.Item value="left" startIcon={AlignLeft} aria-label="Align left" />
        </Tooltip>
        <Tooltip label="Align center">
          <SegmentedControl.Item value="center" startIcon={AlignCenter} aria-label="Align center" />
        </Tooltip>
        <Tooltip label="Align right">
          <SegmentedControl.Item value="right" startIcon={AlignRight} aria-label="Align right" />
        </Tooltip>
        <Tooltip label="Justify">
          <SegmentedControl.Item value="justify" startIcon={AlignJustify} aria-label="Justify" />
        </Tooltip>
      </SegmentedControl>
    </Tooltip.Provider>
  ),
}

/**
 * Where tooltips actually belong: naming an icon-only control, and adding the
 * detail that would not fit inline.
 *
 * The rule of thumb is that a tooltip must be worth missing. It is invisible
 * until hovered, absent on touch, and it appears too late to help someone who did
 * not already suspect there was something there — so nothing required to complete
 * a task should live in one. Names for icon buttons, exact timestamps behind a
 * relative one, the full text of something truncated: yes. Instructions: no.
 */
export const InContext: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Tooltip.Provider>
      <div className="flex w-96 flex-col gap-4 rounded-lg border border-surface-border bg-surface-card-primary p-4 shadow-low">
        <div className="flex items-center justify-between">
          <span className="text-base font-semibold text-content-primary">Pricing page</span>
          <Tooltip label="Deployed 4 minutes ago">
            <Badge color="green">Live</Badge>
          </Tooltip>
        </div>

        <p className="text-sm text-content-subtle">
          Last edited by Ada Lovelace on 12 August.
        </p>

        <div className="flex items-center gap-2">
          <Tooltip label="Ada Lovelace — Engineering">
            <Avatar name="Ada Lovelace" size="small" onClick={() => {}} />
          </Tooltip>
          <Tooltip label="Grace Hopper — Design">
            <Avatar name="Grace Hopper" size="small" onClick={() => {}} />
          </Tooltip>

          <div className="ml-auto flex items-center gap-1">
            <Tooltip label="Copy link">
              <Button appearance="ghost" startIcon={Link} aria-label="Copy link" />
            </Tooltip>
            <Tooltip label="Delete page">
              <Button appearance="ghost" startIcon={Trash2} aria-label="Delete page" />
            </Tooltip>
          </div>
        </div>
      </div>
    </Tooltip.Provider>
  ),
}
