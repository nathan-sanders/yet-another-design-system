import { Fragment, useRef, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'

import { Toast } from './Toast'
import type { ToastPosition, ToastType } from './styles'
import { Button } from '../Button'
import { SegmentedControl } from '../SegmentedControl'

const types = ['default', 'success', 'danger'] as const
const positions = [
  'bottom-right',
  'bottom-center',
  'top-right',
  'top-center',
] as const satisfies readonly ToastPosition[]

const meta = {
  title: 'Components/Toast',
  component: Toast,
  argTypes: {
    type: { control: 'select', options: types },
    title: { control: 'text' },
    description: { control: 'text' },
  },
  args: {
    type: 'default',
    title: 'Toast title',
    description: 'Description',
  },
} satisfies Meta<typeof Toast>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The card on its own, with controls. This is the inline `<Toast>` — the Figma
 * component, drawn where it is written. For the real thing, see **Stacking**.
 */
export const Playground: Story = {
  render: (args) => (
    <div className="max-w-100">
      <Toast {...args} />
    </div>
  ),
}

/**
 * Figma's whole variant set: three types across the Description / Has Action /
 * Is Dismissable slots.
 *
 * **Default is the Decorative/Neutral ramp, not Banner's blue `feedback-info`.** A
 * toast that just confirms something happened is neutral; the file says so, and
 * Astryx agrees — it has only info and error. Success and danger are the same
 * `feedback-*` pairs Banner draws from, each background already carrying a
 * foreground tuned for contrast on it, which is why there is not one `dark:`
 * class in the component. Switch the Theme toolbar to check.
 */
export const AllTypes: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    // Banner's grid, for Banner's reason: a `w-full` component in an auto-layout
    // table cell collapses to the width of its longest word.
    <div className="grid w-fit grid-cols-[max-content_repeat(3,20rem)] items-center gap-x-6 gap-y-3">
      <span />
      <span className="text-sm text-content-subtle">Title only</span>
      <span className="text-sm text-content-subtle">With description</span>
      <span className="text-sm text-content-subtle">Action + dismiss</span>
      {types.map((type) => (
        <Fragment key={type}>
          <span className="text-sm text-content-subtle capitalize">{type}</span>
          <Toast type={type} title="Toast title" />
          <Toast {...args} type={type} />
          <Toast
            {...args}
            type={type}
            action={
              <Button appearance="overlay" size="small">
                Undo
              </Button>
            }
            onDismiss={() => {}}
          />
        </Fragment>
      ))}
    </div>
  ),
}

/**
 * **The headline behaviour.** Fire a few and the toasts collapse into one stack:
 * each card behind peeks out 12px and shrinks 5%, all of them clamped to the
 * frontmost card's height so the group reads as a single object. Hover it, or
 * tab into it, and the stack expands to every toast's real height and offset.
 *
 * Base UI publishes the geometry — `--toast-index`, `--toast-offset-y`,
 * `--toast-height` — and the whole animation is a CSS transition on the motion
 * tokens: `duration-medium-min` (310ms) for the move, `duration-fast` (175ms)
 * for the crossfade of the buried text. Fourth component on the motion tokens,
 * and more evidence for the rule in CLAUDE.md: check whether the headless
 * primitive already measures the thing before assuming JavaScript has to.
 *
 * Try it: hover the stack, drag a toast down or to the right to throw it away,
 * and press F6 to jump the keyboard to the notification region.
 */
function StackingDemo({ position = 'bottom-right' }: { position?: ToastPosition }) {
  const toast = Toast.useToast()
  const count = useRef(0)

  const messages: { type: ToastType; title: string; description: string }[] = [
    { type: 'default', title: 'Message sent', description: 'Sarah Chen will be notified.' },
    { type: 'success', title: 'Changes saved', description: 'Version 3.2.0 is live in production.' },
    { type: 'default', title: 'Report ready', description: 'Your export finished processing.' },
    { type: 'danger', title: 'Upload failed', description: 'The file was larger than 25 MB.' },
  ]

  function fire() {
    const message = messages[count.current % messages.length]
    count.current += 1
    toast.add(message)
  }

  return (
    <div className="flex flex-col items-start gap-4">
      <div className="flex gap-2">
        <Button onClick={fire}>Add a toast</Button>
        <Button appearance="secondary" onClick={() => toast.close()}>
          Clear all
        </Button>
      </div>
      <p className="max-w-2xl text-base text-content-subtle">
        Hover the stack to expand it. Drag a toast down or to the right to throw it away. Press F6
        to move the keyboard into the notification region — Base UI pauses every dismiss timer
        while the stack is hovered or focused, so nothing disappears while you are reading it.
      </p>
      <Toast.Viewport position={position} />
    </div>
  )
}

export const Stacking: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Toast.Provider>
      <StackingDemo />
    </Toast.Provider>
  ),
}

/**
 * `position` is the only knob on the viewport, and everything else follows from
 * it rather than being a second setting that can disagree: which corner the
 * stack is pinned to, whether toasts grow up or down, which way they enter and
 * leave, and which way you can throw one to dismiss it. A centred stack only
 * swipes on the axis it arrived on, because it has no side to be thrown to.
 *
 * Not a Figma property — the file draws a card, never a viewport.
 */
function PositionsDemo() {
  const [position, setPosition] = useState<ToastPosition>('bottom-right')

  return (
    // py-24 keeps the controls clear of the stack: a top-anchored viewport is
    // fixed 16px from the top of the window and will sit over whatever is there.
    <div className="flex flex-col items-start gap-4 py-24">
      <SegmentedControl
        aria-label="Toast position"
        value={position}
        onValueChange={(value) => setPosition(value as ToastPosition)}
      >
        {positions.map((value) => (
          <SegmentedControl.Item key={value} value={value}>
            {value}
          </SegmentedControl.Item>
        ))}
      </SegmentedControl>
      {/* Keyed so the viewport remounts and the stack starts empty on a change. */}
      <StackingDemo key={position} position={position} />
    </div>
  )
}

export const Positions: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Toast.Provider>
      <PositionsDemo />
    </Toast.Provider>
  ),
}

/**
 * **Danger persists; everything else auto-dismisses at 5 seconds.**
 *
 * That is Astryx's rule, applied in `useToast().add` rather than left to the
 * caller: a `danger` toast is given `timeout: 0` unless you say otherwise. A
 * failure that scrolls past unread is the one thing a notification system must
 * not do — and a toast that stays put is announced by the viewport's polite live
 * region and then simply waits, which is why it does not also need Base UI's
 * `priority: 'high'` (see the note on that in `useToast`).
 *
 * The default is a per-toast override, as the third button shows.
 */
function TimingDemo() {
  const toast = Toast.useToast()

  return (
    <div className="flex flex-col items-start gap-4">
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() =>
            toast.add({ type: 'success', title: 'Changes saved', description: 'Gone in 5s.' })
          }
        >
          Success (auto-dismisses)
        </Button>
        <Button
          appearance="destructive"
          onClick={() =>
            toast.add({
              type: 'danger',
              title: 'Payment failed',
              description: 'This one waits for you.',
              action: { label: 'Retry' },
            })
          }
        >
          Danger (persists)
        </Button>
        <Button
          appearance="secondary"
          onClick={() =>
            toast.add({
              type: 'danger',
              title: 'Minor problem',
              description: 'Overridden back to 5s.',
              timeout: 5000,
            })
          }
        >
          Danger with an explicit timeout
        </Button>
      </div>
      <Toast.Viewport />
    </div>
  )
}

export const Timing: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Toast.Provider>
      <TimingDemo />
    </Toast.Provider>
  ),
}

/**
 * Deduplication needs no API of its own. Adding a toast with an `id` that is
 * already on screen updates it in place and restarts its timer, which is what
 * Astryx spells `uniqueID` plus `collisionBehavior: 'overwrite'`.
 *
 * Click the upload button repeatedly: one toast counts up rather than four
 * stacking. This is the pattern for anything a user can trigger twice by
 * accident — a save button, a retry, a sync.
 */
function DeduplicationDemo() {
  const toast = Toast.useToast()
  const progress = useRef(0)

  function upload() {
    progress.current = Math.min(100, progress.current + 25)
    toast.add({
      id: 'upload',
      type: progress.current === 100 ? 'success' : 'default',
      title: progress.current === 100 ? 'Upload complete' : 'Uploading…',
      description: `${progress.current}% of report-q3.pdf`,
      timeout: 0,
    })
  }

  return (
    <div className="flex flex-col items-start gap-4">
      <div className="flex gap-2">
        <Button onClick={upload}>Upload 25% more</Button>
        <Button
          appearance="secondary"
          onClick={() => {
            progress.current = 0
            toast.close('upload')
          }}
        >
          Reset
        </Button>
      </div>
      <Toast.Viewport />
    </div>
  )
}

export const Deduplication: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Toast.Provider>
      <DeduplicationDemo />
    </Toast.Provider>
  ),
}

/**
 * `toast.promise` drives one toast through the three states of an async
 * operation — loading, then success or danger — reusing the same card rather
 * than replacing it. The `type` on each state is this library's, so the result
 * lands on the right pair.
 */
function PromiseDemo() {
  const toast = Toast.useToast()

  function run(shouldFail: boolean) {
    const work = new Promise((resolve, reject) =>
      setTimeout(() => (shouldFail ? reject(new Error('Connection lost')) : resolve('ok')), 2000),
    )
    // Swallowed so a rejected demo promise does not surface as an unhandled one.
    toast.promise(work, {
      loading: { title: 'Publishing…', description: 'This takes a moment.' },
      success: { type: 'success', title: 'Published', description: 'Your post is live.' },
      error: (error: Error) => ({
        type: 'danger',
        title: 'Could not publish',
        description: error.message,
      }),
    }).catch(() => {})
  }

  return (
    <div className="flex flex-col items-start gap-4">
      <div className="flex gap-2">
        <Button onClick={() => run(false)}>Publish (succeeds)</Button>
        <Button appearance="destructive" onClick={() => run(true)}>
          Publish (fails)
        </Button>
      </div>
      <Toast.Viewport />
    </div>
  )
}

export const Promise_: Story = {
  name: 'Promise',
  parameters: { controls: { disable: true } },
  render: () => (
    <Toast.Provider>
      <PromiseDemo />
    </Toast.Provider>
  ),
}

/**
 * What a toast is for, and what it is not — Astryx's guidance, kept here because
 * it is the part a component cannot enforce.
 *
 * **Do:** keep it to a few words that say what happened; put an Undo in the
 * action slot for anything reversible, so a mistake can be taken back without
 * navigating away; give repeated actions a stable `id` so they update one toast
 * instead of stacking four.
 *
 * **Don't:** use a toast for an error that blocks the user — that is `Banner`,
 * which stays put and can be acknowledged; put long or multi-line text in one,
 * because it leaves after five seconds and may not be finished; or show form
 * validation in one, because the user needs to see *which field* is wrong.
 */
function GuidanceDemo() {
  const toast = Toast.useToast()
  const [items, setItems] = useState(['Q3 report', 'Design review notes', 'Budget draft'])

  function remove(item: string) {
    setItems((current) => current.filter((entry) => entry !== item))
    toast.add({
      title: 'Item deleted',
      description: item,
      action: { label: 'Undo', onClick: () => setItems((current) => [...current, item]) },
    })
  }

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <div className="flex flex-col gap-2 rounded-lg border border-surface-border bg-surface-primary p-4">
        <p className="text-base font-semibold text-content-emphasized">Documents</p>
        {items.length === 0 && (
          <p className="text-base text-content-subtle">Everything here has been deleted.</p>
        )}
        {items.map((item) => (
          <div key={item} className="flex items-center justify-between gap-4">
            <span className="text-base text-content-primary">{item}</span>
            <Button appearance="secondary" size="small" onClick={() => remove(item)}>
              Delete
            </Button>
          </div>
        ))}
      </div>
      <Toast.Viewport />
    </div>
  )
}

export const UndoInContext: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Toast.Provider>
      <GuidanceDemo />
    </Toast.Provider>
  ),
}
