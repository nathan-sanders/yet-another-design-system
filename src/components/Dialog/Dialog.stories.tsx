import { useRef, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { MoreHorizontal, Pencil, Trash } from 'lucide-react'

import { Button } from '../Button'
import { Divider } from '../Divider'
import { Field } from '../Field'
import { Input } from '../Input'
import { Menu } from '../Menu'
import { Dialog } from './Dialog'

const meta = {
  title: 'Components/Dialog',
  component: Dialog,
  // A compound component: everything interesting lives on `Dialog.Popup` and on
  // the Root's behavior props, not on anything Storybook's controls can drive.
  // Menu's and Popover's convention, for their reason.
  parameters: { controls: { disable: true } },
  decorators: [
    (Story) => (
      <div className="flex min-h-128 items-center justify-center p-16">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Dialog>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The ordinary shape: a header row, a body, and a row of actions. Click the
 * trigger to open it; Escape, a click on the scrim, or either button closes it,
 * and focus returns to the trigger on the way out.
 *
 * **This story is the one axe actually looks at, and it opens itself to make
 * that true.** A closed dialog has nothing in the DOM at all, so a suite run
 * against the default state would pass by looking at nothing — Menu's, Toast's
 * and Popover's lesson.
 *
 * **But unlike Popover, it cannot use `defaultOpen`.** A modal dialog marks
 * everything outside its portal inert, and on a Storybook docs page that is the
 * whole page — every other story on it included. So the opening is done in a
 * `play` function, which the a11y addon runs *after*: the isolated test render
 * gets a real open modal to check, and the docs page is left usable.
 * `ContextMenu.stories.tsx` is where that pattern already lives.
 */
export const Playground: Story = {
  render: () => (
    <Dialog>
      <Dialog.Trigger render={<Button appearance="secondary">Share file</Button>} />
      <Dialog.Popup>
        <div className="flex items-center justify-between gap-2">
          <Dialog.Title>Share this file</Dialog.Title>
          <Dialog.Close />
        </div>
        <Dialog.Description>
          Anyone with the link can view it. You can revoke access at any time.
        </Dialog.Description>
        <div className="flex justify-end gap-2">
          <Dialog.Close render={<Button appearance="secondary">Cancel</Button>} />
          <Dialog.Close render={<Button>Copy link</Button>} />
        </div>
      </Dialog.Popup>
    </Dialog>
  ),
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Share file' }))
    // The popup is portalled to <body>, so it is not inside the canvas element.
    const dialog = await within(document.body).findByRole('dialog')
    // `waitFor`, and not because the runner is flaky. `findByRole` resolves on
    // the frame the popup is inserted, which is the frame it still carries
    // `data-starting-style` — so its opacity is 0 and `toBeVisible` is right to
    // say so. Popover's equivalent stories never saw this because they used
    // `defaultOpen` and were already settled before the assertion ran.
    await waitFor(() => expect(dialog).toBeVisible())
    // Named by its Title, through the `aria-labelledby` Base UI wires up.
    await expect(dialog).toHaveAccessibleName('Share this file')
    // The difference from Popover, asserted rather than assumed: a modal dialog
    // puts you *inside* it, where a popover leaves focus on the trigger. Checked
    // here because a backgrounded browser tab reports this wrongly by hand —
    // `document.hasFocus()` is false, so the focus manager behaves differently.
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true))
    // And the rest of the page is inert while it is open, which is the whole
    // reason no story in this file uses `defaultOpen`: on a docs page that would
    // be every other story.
    // Base UI marks the portal's siblings in <body>, so the assertion walks up
    // from the story rather than naming a Storybook container — the mount point
    // differs between the docs iframe and this runner.
    const hidden = canvasElement.closest('[aria-hidden="true"]')
    await expect(hidden).not.toBeNull()
  },
}

/**
 * Figma's own drawing, at the width it draws: 600 wide, 12 of padding on top
 * against 16 at the bottom, a 12px stack gap, `rounded-lg`, a 1px
 * `Surface/Border` and the High elevation. The header is a 32-tall row holding
 * `text-base/semibold` beside a 42x32 ghost close button.
 *
 * The component has exactly two properties in the file — a TEXT `Title Text` and
 * a SLOT `Content` — so this is the whole of what the canvas can say. The
 * Backdrop under it, the Description, and `Dialog.Body` are all built ahead of
 * the file.
 */
export const Anatomy: Story = {
  render: () => (
    <Dialog>
      <Dialog.Trigger render={<Button appearance="secondary">Open the drawing</Button>} />
      <Dialog.Popup>
        <div className="flex items-center justify-between gap-2">
          <Dialog.Title>Dialog title</Dialog.Title>
          <Dialog.Close />
        </div>
        <div className="h-16 w-full rounded-md bg-surface-background-subtle" />
      </Dialog.Popup>
    </Dialog>
  ),
}

/**
 * **The story this component was owed for.** Astryx's terms-and-conditions case:
 * the content is longer than the viewport, so `Dialog.Body` scrolls while the
 * title and the close button stay where you left them.
 *
 * The mechanism is two classes and worth knowing: the popup is capped at
 * `max-h-full` inside a `p-4` viewport, and the Body is `min-h-0 flex-1
 * overflow-y-auto`. Drop the `min-h-0` and nothing scrolls at all — a flex
 * child's default `min-height: auto` refuses to shrink below its content, so the
 * popup would grow straight past its own cap.
 *
 * Popover solved this case with `overflow-y-auto` on the whole panel and its
 * record called that "a floor, not a home". This is the home.
 *
 * The Accept and Decline buttons being *inside* the popup is also what keeps
 * axe's `scrollable-region-focusable` happy: a scroll region you can only reach
 * by dragging is unreachable from a keyboard.
 */
export const Scrollable: Story = {
  render: () => (
    <Dialog>
      <Dialog.Trigger render={<Button appearance="secondary">Read the terms</Button>} />
      <Dialog.Popup>
        <div className="flex items-center justify-between gap-2">
          <Dialog.Title>Terms and conditions</Dialog.Title>
          <Dialog.Close />
        </div>
        <Divider />
        <Dialog.Body className="flex flex-col gap-3">
          {[
            'You agree to use the service only for lawful purposes and in compliance with the regulations that apply where you are.',
            'Your account credentials are yours to look after. Tell us straight away if you think somebody else has them.',
            'We may suspend an account that breaks these terms or that is used to mistreat other people using the service.',
            'Anything you upload stays yours. You give us a licence to host it and show it back to you inside the service.',
            'We may change these terms. Carrying on using the service after a change means you accept the new ones.',
            'The service is provided as it is. We are not liable for lost data or for time the service is unavailable.',
            'You can close your account whenever you like, and we will delete your data within thirty days of you doing so.',
            'Disputes are settled by binding arbitration, under whichever rules apply in your jurisdiction.',
            'You agree not to reverse-engineer, decompile or pull apart any part of the service.',
            'We collect anonymised usage data to make the service better. Personal data is handled as the privacy policy says.',
            'Third-party integrations are covered by their own terms. We are not responsible when one of them goes down.',
            'Keep your own backups. We give you tools to export your data but we cannot promise to recover it for you.',
            'Commercial use needs a Business plan. Free accounts are for personal and non-commercial projects.',
            'We may add features or retire them, with thirty days notice by email or in the app.',
            'Breaking these terms can end your account immediately, without notice and without a refund.',
          ].map((clause, i) => (
            <p key={clause}>
              <span className="font-semibold">{i + 1}.</span> {clause}
            </p>
          ))}
        </Dialog.Body>
        <Divider />
        <div className="flex justify-end gap-2">
          <Dialog.Close render={<Button appearance="secondary">Decline</Button>} />
          <Dialog.Close render={<Button>Accept</Button>} />
        </div>
      </Dialog.Popup>
    </Dialog>
  ),
}

/**
 * Astryx's `purpose="form"`, which is one Base UI prop rather than a variant:
 * **`disablePointerDismissal` on the Root.** A click on the scrim no longer
 * closes the dialog, so a half-typed form cannot be thrown away by a stray
 * click. Escape still works, and so does Cancel.
 *
 * That prop is not re-declared anywhere in this component — it arrives through
 * the Root pass-through, which is why there is no `purpose` prop to learn.
 */
export const Form: Story = {
  render: function FormStory() {
    const [name, setName] = useState('Nathan Sanders')

    return (
      <Dialog disablePointerDismissal>
        <Dialog.Trigger render={<Button appearance="secondary">Edit profile</Button>} />
        <Dialog.Popup>
          <div className="flex items-center justify-between gap-2">
            <Dialog.Title>Edit profile</Dialog.Title>
            <Dialog.Close />
          </div>
          <Dialog.Description>
            Clicking outside will not close this one, so nothing you type gets lost.
          </Dialog.Description>
          <Field label="Display name">
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </Field>
          <Field label="Bio" description="A sentence or two, shown on your profile.">
            <Input placeholder="Product designer" />
          </Field>
          <div className="flex justify-end gap-2">
            <Dialog.Close render={<Button appearance="secondary">Cancel</Button>} />
            <Dialog.Close render={<Button>Save</Button>} />
          </div>
        </Dialog.Popup>
      </Dialog>
    )
  },
}

/**
 * Astryx's `purpose="required"` — a dialog you have to answer. Neither Escape
 * nor the scrim closes it; only one of the two buttons does.
 *
 * This is the half of `purpose` that is **not** a Base UI prop, and writing it
 * out is the argument for not having invented one. `disablePointerDismissal`
 * handles the scrim; Escape is refused by cancelling the event in
 * `onOpenChange`, where `reason` says how the close was asked for. Two
 * mechanisms, and a caller who wants only one of them keeps that choice.
 */
export const Required: Story = {
  render: function RequiredStory() {
    const [open, setOpen] = useState(false)

    return (
      <Dialog
        open={open}
        onOpenChange={(nextOpen, eventDetails) => {
          if (!nextOpen && eventDetails.reason === 'escape-key') {
            eventDetails.cancel()
            return
          }
          setOpen(nextOpen)
        }}
        disablePointerDismissal
      >
        <Dialog.Trigger render={<Button appearance="secondary">Transfer ownership</Button>} />
        <Dialog.Popup width={480}>
          <Dialog.Title>Transfer project ownership</Dialog.Title>
          <Dialog.Description>
            You are about to hand &ldquo;Marketing Dashboard&rdquo; to Sarah Chen. Once she accepts,
            you lose admin access. Escape will not close this — pick one.
          </Dialog.Description>
          <div className="flex justify-end gap-2">
            <Dialog.Close render={<Button appearance="secondary">Cancel</Button>} />
            <Dialog.Close render={<Button>Transfer</Button>} />
          </div>
        </Dialog.Popup>
      </Dialog>
    )
  },
}

/**
 * `width` in pixels, defaulting to Figma's 600.
 *
 * It is the one axis the file can never carry: Figma's four property kinds are
 * VARIANT, BOOLEAN, TEXT and INSTANCE_SWAP, and none of them is a number — the
 * wall Card's `padding` hit. So the component in Figma keeps drawing 600 and
 * this stays a code-only prop. Astryx has the same prop and defaults it to 400.
 *
 * Whatever the number, the popup is `max-w-full` inside a viewport with 16 of
 * padding, so a 600-wide dialog on a 375-wide phone is 343 wide and still on
 * screen. Narrow the story frame and watch it clamp.
 */
export const Widths: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      {[400, 480, 600].map((width) => (
        <Dialog key={width}>
          <Dialog.Trigger render={<Button appearance="secondary">{width}px</Button>} />
          <Dialog.Popup width={width}>
            <div className="flex items-center justify-between gap-2">
              <Dialog.Title>{width} wide</Dialog.Title>
              <Dialog.Close />
            </div>
            <Dialog.Description>
              The dialog is fixed at this width until the viewport is narrower than it, and then it
              clamps to whatever is left after the gutters.
            </Dialog.Description>
          </Dialog.Popup>
        </Dialog>
      ))}
    </div>
  ),
}

/**
 * A real screen, at the default width and with default-size Buttons throughout.
 *
 * The Menu beside it is the point: a Menu is a list of actions you pick one of
 * and it closes, and picking one here opens the dialog that does the work. That
 * is the ordinary relationship between the two, and it is also why the dialog is
 * controlled rather than triggered — the thing that opens it is a menu item,
 * which is not its trigger.
 *
 * `finalFocus` is what makes that shape behave: with no `Dialog.Trigger` in the
 * DOM, Base UI has nowhere to put focus back, so it is pointed at the button the
 * menu came from.
 */
export const InContext: Story = {
  render: function InContextStory() {
    const [open, setOpen] = useState(false)
    const moreRef = useRef<HTMLButtonElement>(null)

    return (
      <div className="w-160 rounded-lg border border-surface-border bg-surface-background-primary p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 flex-col">
            <span className="font-semibold">Q3 engagement report</span>
            <span className="text-sm text-content-subtle">Edited 2 hours ago</span>
          </div>

          <Menu>
            <Menu.Trigger
              render={
                <Button ref={moreRef} appearance="ghost" startIcon={MoreHorizontal} aria-label="More" />
              }
            />
            <Menu.Popup align="end">
              <Menu.Item startIcon={Pencil}>Rename</Menu.Item>
              <Menu.Item startIcon={Trash} destructive onClick={() => setOpen(true)}>
                Delete
              </Menu.Item>
            </Menu.Popup>
          </Menu>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <Dialog.Popup width={480} finalFocus={moreRef}>
            <div className="flex items-center justify-between gap-2">
              <Dialog.Title>Delete this report?</Dialog.Title>
              <Dialog.Close />
            </div>
            <Dialog.Description>
              This permanently deletes &ldquo;Q3 engagement report&rdquo; and everything in it. It
              cannot be undone.
            </Dialog.Description>
            <div className="flex justify-end gap-2">
              <Dialog.Close render={<Button appearance="secondary">Cancel</Button>} />
              <Dialog.Close render={<Button appearance="destructive">Delete</Button>} />
            </div>
          </Dialog.Popup>
        </Dialog>
      </div>
    )
  },
}
