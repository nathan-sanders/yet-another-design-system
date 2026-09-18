import { useState, type CSSProperties } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'

import { Card } from '../Card'
import { ResizeHandle } from './ResizeHandle'

// ---------------------------------------------------------------------------
// Fixture: two panels beside each other with the handle *as* the 16px gap, and
// one panel above a handle that sets its height. The same tree in every story
// so the `Keyboard` twin tests exactly what `Vertical` and `Horizontal` show.

const MIN_WIDTH = 160
const MAX_WIDTH = 480
const MIN_HEIGHT = 96
const MAX_HEIGHT = 320

const px = (value: number) => `${value} pixels`

function Panels({ show }: { show: 'vertical' | 'horizontal' | 'both' }) {
  const [width, setWidth] = useState(240)
  const [height, setHeight] = useState(160)
  // Counted so the test can see the drag's start and end without a real drag.
  const [drags, setDrags] = useState(0)
  const [resizing, setResizing] = useState(false)

  return (
    <div
      className="flex flex-col gap-8"
      data-drags={drags}
      data-resizing={resizing || undefined}
      style={{ '--panel-width': `${width}px`, '--panel-height': `${height}px` } as CSSProperties}
    >
      {show !== 'horizontal' ? (
        <div className="flex h-64">
          {/*
            The width is a custom property read back by a utility, not an
            inline `width`: a runtime value inline would defeat any responsive
            override, and there is one variable to change rather than a style.
          */}
          <Card className="w-(--panel-width) shrink-0">
            <p className="text-content-emphasized font-semibold">Sidebar</p>
            <p className="text-content-subtle">{width}px wide</p>
          </Card>
          <ResizeHandle
            label="Resize Sidebar"
            orientation="vertical"
            value={width}
            min={MIN_WIDTH}
            max={MAX_WIDTH}
            step={8}
            largeStep={40}
            valueText={px}
            onResize={setWidth}
            onResizeStart={() => {
              setResizing(true)
              setDrags((n) => n + 1)
            }}
            onResizeEnd={() => setResizing(false)}
          />
          <Card className="min-w-0 flex-1">
            <p className="text-content-emphasized font-semibold">Content</p>
            <p className="text-content-subtle">Takes what the sidebar leaves.</p>
          </Card>
        </div>
      ) : null}
      {show !== 'vertical' ? (
        <div className="flex flex-col">
          <Card className="h-(--panel-height)">
            <p className="text-content-emphasized font-semibold">Preview</p>
            <p className="text-content-subtle">{height}px tall</p>
          </Card>
          <ResizeHandle
            label="Resize Preview height"
            orientation="horizontal"
            value={height}
            min={MIN_HEIGHT}
            max={MAX_HEIGHT}
            step={8}
            largeStep={40}
            valueText={px}
            onResize={setHeight}
          />
          <Card>
            <p className="text-content-emphasized font-semibold">Details</p>
            <p className="text-content-subtle">Moves down as the preview grows.</p>
          </Card>
        </div>
      ) : null}
    </div>
  )
}

/**
 * The strip you drag to change a size. It sits *in* the gap between two
 * things, at the gap's own width — 16px here, 8px beside an app's rail — and
 * is a focusable `separator`: the arrow keys step it, Shift steps further, Home
 * and End go to the ends, and a screen reader hears the value.
 *
 * It reports a value in whatever unit the caller works in. Here that is
 * pixels; in the composable dashboard the same component reports column spans.
 */
const meta = {
  title: 'Components/Resize',
  component: ResizeHandle,
  parameters: { layout: 'padded', controls: { disable: true } },
  // Every story renders its own tree, with the handle's props coming from the
  // panel state beside it; these satisfy the type and are never read.
  args: {
    label: 'Resize',
    orientation: 'vertical',
    value: 0,
    min: 0,
    max: 0,
    onResize: () => {},
  },
} satisfies Meta<typeof ResizeHandle>

export default meta
type Story = StoryObj<typeof meta>

/**
 * A vertical handle between two panels: it is the 16px gap, and dragging it
 * sets the width of the panel to its left. Hover anywhere along the strip and
 * the pill comes to the pointer.
 */
export const Vertical: Story = {
  render: () => <Panels show="vertical" />,
}

/** A horizontal handle under a panel, setting its height. */
export const Horizontal: Story = {
  render: () => <Panels show="horizontal" />,
}

/**
 * The same two trees, driven. The keyboard path is the one that regresses
 * unnoticed — a drag has no keyboard equivalent unless somebody writes one —
 * so it is the one tested, plus the pill's pointer-follow and the drag's start
 * and end.
 */
export const Keyboard: Story = {
  render: () => <Panels show="both" />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const sidebar = () => canvas.getByText('Sidebar').closest('div')!
    const preview = () => canvas.getByText('Preview').closest('div')!

    await step('the handle is a separator that says its value', async () => {
      const handle = canvas.getByRole('separator', { name: 'Resize Sidebar' })
      await expect(handle).toHaveAttribute('aria-orientation', 'vertical')
      await expect(handle).toHaveAttribute('aria-valuenow', '240')
      await expect(handle).toHaveAttribute('aria-valuemin', String(MIN_WIDTH))
      await expect(handle).toHaveAttribute('aria-valuemax', String(MAX_WIDTH))
      await expect(handle).toHaveAttribute('aria-valuetext', '240 pixels')
      // It is the gap: 16 wide, flush with both panels.
      const rect = handle.getBoundingClientRect()
      await expect(rect.width).toBe(16)
      await expect(rect.left).toBe(sidebar().getBoundingClientRect().right)
      await expect(getComputedStyle(handle).cursor).toBe('col-resize')
    })

    await step('the arrows step the width, and it reaches the layout', async () => {
      const handle = canvas.getByRole('separator', { name: 'Resize Sidebar' })
      handle.focus()
      await userEvent.keyboard('{ArrowRight}')
      await expect(handle).toHaveAttribute('aria-valuenow', '248')
      await expect(sidebar().getBoundingClientRect().width).toBe(248)
      await userEvent.keyboard('{Shift>}{ArrowLeft}{/Shift}')
      await expect(handle).toHaveAttribute('aria-valuenow', '208')
      await userEvent.keyboard('{End}')
      await expect(handle).toHaveAttribute('aria-valuenow', String(MAX_WIDTH))
      await expect(sidebar().getBoundingClientRect().width).toBe(MAX_WIDTH)
      await userEvent.keyboard('{ArrowRight}')
      await expect(handle).toHaveAttribute('aria-valuenow', String(MAX_WIDTH))
      await userEvent.keyboard('{Home}')
      await expect(handle).toHaveAttribute('aria-valuenow', String(MIN_WIDTH))
      await expect(sidebar().getBoundingClientRect().width).toBe(MIN_WIDTH)
    })

    await step('the horizontal handle steps a height with the vertical arrows', async () => {
      const handle = canvas.getByRole('separator', { name: 'Resize Preview height' })
      await expect(handle).toHaveAttribute('aria-orientation', 'horizontal')
      await expect(handle.getBoundingClientRect().height).toBe(16)
      await expect(getComputedStyle(handle).cursor).toBe('row-resize')
      handle.focus()
      await userEvent.keyboard('{ArrowDown}')
      await expect(handle).toHaveAttribute('aria-valuenow', '168')
      await expect(preview().getBoundingClientRect().height).toBe(168)
      await userEvent.keyboard('{Home}')
      await expect(preview().getBoundingClientRect().height).toBe(MIN_HEIGHT)
    })

    await step('the pill follows the pointer along the strip, and returns to the middle', async () => {
      const handle = canvas.getByRole('separator', { name: 'Resize Sidebar' })
      const pill = handle.firstElementChild as HTMLElement
      const rect = handle.getBoundingClientRect()
      await userEvent.pointer({ target: handle, coords: { clientX: rect.left + 8, clientY: rect.top + 100 } })
      await expect(handle.style.getPropertyValue('--pill-offset')).toBe('100px')
      await waitFor(() => expect(getComputedStyle(pill).top).toBe('100px'))
      await userEvent.unhover(handle)
      await expect(handle.style.getPropertyValue('--pill-offset')).toBe('')
      await waitFor(() => expect(getComputedStyle(pill).top).toBe(`${Math.round(rect.height / 2)}px`))
    })

    await step('a pointer drag is bracketed by start and end', async () => {
      const root = canvasElement.querySelector<HTMLElement>('[data-drags]')!
      const handle = canvas.getByRole('separator', { name: 'Resize Sidebar' })
      const rect = handle.getBoundingClientRect()
      // One instance for the press and the release: a bare `userEvent.pointer`
      // is a fresh instance each call, and a release with nothing pressed
      // dispatches no `pointerup` at all.
      const user = userEvent.setup()
      await expect(root.dataset.drags).toBe('0')
      await user.pointer({
        keys: '[MouseLeft>]',
        target: handle,
        coords: { clientX: rect.left + 8, clientY: rect.top + 50 },
      })
      await waitFor(() => expect(root.dataset.drags).toBe('1'))
      await expect(root.dataset.resizing).toBe('true')
      await user.pointer({ keys: '[/MouseLeft]', target: handle })
      await waitFor(() => expect(root.dataset.resizing).toBeUndefined())
      // A keystroke is not a drag: the count does not move.
      handle.focus()
      await userEvent.keyboard('{ArrowRight}')
      await expect(root.dataset.drags).toBe('1')
    })
  },
}
