import { tv } from 'tailwind-variants'

/**
 * The parts `FileInput` draws for itself. The bordered box in `input` mode is
 * `Input`'s `box`, imported rather than copied — TextArea's and NumberInput's
 * arrangement — so hover, the invalid border, the disabled fade and the focus
 * ring are the same code as every other field. The dropzone is that same box
 * reshaped: dashed, stacked, and padded, with a drag state the box never needed.
 *
 * ## What fires the ring
 *
 * Both modes use the box's `ring="input"`, not `within`. The `<input>` is the
 * only thing that should ring the box, and in `input` mode the clear button is
 * a second focusable descendant, so `within` would ring the box for it too —
 * NumberInput's reason, met again.
 */

/**
 * The dropzone, layered over `box`. `flex-col` beats the box's `flex-wrap` row
 * and `border-dashed` is the one thing that says "you can drop here" before
 * anything is dragged.
 *
 * Astryx pads it 24 / 16, which is `spacing/6` and `spacing/4`. Figma's stroke
 * sits *inside* the frame, so TextArea's rule applies: the vertical padding is
 * the token minus the 1px border it shares, and the zone comes out at the
 * frame's outer height —
 *
 *     23 + 20 icon + 8 gap + 24 text line + 23 = 98 content + 2 border = 100
 *
 * `py-5.75` is a real quarter-step of the 4px scale, like TextArea's
 * `py-0.75`. `AllVariants` asserts the 100.
 */
export const dropzone = tv({
  base: [
    'flex-col flex-nowrap justify-center gap-2 border-dashed px-4 py-5.75 text-center',
    'cursor-pointer',
    // The drag state. A border that turns the selected color, and the ghost
    // wash under it — the same 10% `hover:` wash a ghost field uses, because
    // a file held over the zone is the strongest hover there is. The `hover:`
    // copy is spelled out for the reason `box` spells out its invalid one:
    // otherwise the winner is whichever Tailwind emits last.
    'data-dragging:border-input-selected data-dragging:hover:border-input-selected',
    'data-dragging:bg-action-ghost-background-hover',
  ],
})

/** The one line of text inside the `input`-mode box: a placeholder or the names. */
export const value = tv({
  base: 'min-w-0 flex-1 truncate text-base',
  variants: {
    // Italic placeholder — this system's mark for text the person did not
    // enter, exactly as on Input. Once there are names, they are content.
    empty: {
      true: 'text-content-subtle italic',
      false: 'text-content-primary',
    },
  },
})

/** The list of chosen files under a dropzone. */
export const fileList = tv({ base: 'flex flex-col gap-2' })

/**
 * One chosen file. A 32px row — the box height — on Card's primary surface, so
 * a file reads as a thing you have rather than a field you can type in.
 * `pr-1` puts the 24px remove Button 4px from the edge, centred in the 30px
 * the borders leave.
 */
export const fileRow = tv({
  base: [
    'flex min-h-8 items-center gap-2 rounded-md border pr-1 pl-3',
    'border-surface-border bg-surface-background-primary text-content-primary',
  ],
})

export const fileName = tv({ base: 'min-w-0 flex-1 truncate text-base' })

export const fileSize = tv({ base: 'shrink-0 text-sm whitespace-nowrap text-content-subtle' })
