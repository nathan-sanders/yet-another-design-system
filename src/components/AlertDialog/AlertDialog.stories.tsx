import { useRef } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'

import { Button } from '../Button'
import { AlertDialog } from './AlertDialog'

const meta = {
  title: 'Components/AlertDialog',
  component: AlertDialog,
  parameters: { controls: { disable: true } },
  decorators: [
    (Story) => (
      <div className="flex min-h-128 items-center justify-center p-16">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AlertDialog>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The WAI-ARIA Alert Dialog pattern, which is the whole component: a question as
 * the Title, the consequence as the Description, and two buttons. No `x`, and no
 * dismissing by clicking the scrim — Base UI's Root pins
 * `disablePointerDismissal` on whatever you pass.
 *
 * **`role="alertdialog"`, and nothing here sets it.** The only difference
 * between this Root and Dialog's is a string handed to the same hook:
 * `useRenderDialogRoot('alert-dialog', props)`. The parts under it are Dialog's,
 * because Base UI's `alert-dialog` subpath re-exports them as the same objects.
 *
 * **Cancel takes initial focus**, which is Astryx's rule and the reason
 * `initialFocus` is pointed at it: a Return key pressed on arrival should do the
 * harmless thing. Escape does the same, and Base UI leaves Escape working here
 * on purpose — the pattern says a way out must exist.
 */
export const Destructive: Story = {
  render: function DestructiveStory() {
    const cancelRef = useRef<HTMLButtonElement>(null)

    return (
      <AlertDialog>
        <AlertDialog.Trigger render={<Button appearance="destructive">Delete project</Button>} />
        <AlertDialog.Popup width={480} initialFocus={cancelRef}>
          <AlertDialog.Title>Delete project?</AlertDialog.Title>
          <AlertDialog.Description>
            This permanently deletes &ldquo;Marketing Dashboard&rdquo; and all of its data. It
            cannot be undone.
          </AlertDialog.Description>
          {/*
           * Astryx's responsive footer, and a call site rather than a `Footer`
           * part: below 640px the destructive action goes above Cancel and both
           * fill the width. `flex-col-reverse` puts Delete on top while leaving
           * Cancel first in the DOM, so the tab order still reaches the safe
           * option first.
           */}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialog.Close
              render={
                <Button ref={cancelRef} appearance="secondary">
                  Cancel
                </Button>
              }
            />
            <AlertDialog.Close
              render={<Button appearance="destructive">Delete project</Button>}
            />
          </div>
        </AlertDialog.Popup>
      </AlertDialog>
    )
  },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Delete project' }))
    const dialog = await within(document.body).findByRole('alertdialog')
    // Asserted through the enter transition — see Dialog's Playground story for
    // why `findByRole` alone lands a frame too early.
    await waitFor(() => expect(dialog).toBeVisible())
    await expect(dialog).toHaveAccessibleName('Delete project?')
    // The consequence is what `aria-describedby` points at — the half of the
    // pattern that is easy to leave out, because the dialog still "works".
    await expect(dialog).toHaveAccessibleDescription(/cannot be undone/)
    // Astryx's rule, asserted rather than assumed: the least destructive option
    // is the one a Return key on arrival would press.
    await expect(within(dialog).getByRole('button', { name: 'Cancel' })).toHaveFocus()
  },
}

/**
 * The label is the thing that has to say what will happen. Astryx puts it twice
 * in its own guidance — make the action label specific, and do not lean on color
 * alone to signal danger — and the two rules are really one: somebody who cannot
 * see the red still has to know what the button does.
 *
 * &ldquo;Revoke access&rdquo; rather than &ldquo;OK&rdquo;, and the description
 * says who loses what.
 */
export const SpecificLabels: Story = {
  render: () => (
    <AlertDialog>
      <AlertDialog.Trigger render={<Button appearance="secondary">Revoke access</Button>} />
      <AlertDialog.Popup width={480}>
        <AlertDialog.Title>Revoke access for Sarah Chen?</AlertDialog.Title>
        <AlertDialog.Description>
          She will immediately lose access to every shared resource in this workspace. You can
          invite her again later.
        </AlertDialog.Description>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <AlertDialog.Close render={<Button appearance="secondary">Keep access</Button>} />
          <AlertDialog.Close render={<Button appearance="destructive">Revoke access</Button>} />
        </div>
      </AlertDialog.Popup>
    </AlertDialog>
  ),
}
