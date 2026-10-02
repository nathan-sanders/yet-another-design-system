import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'

import { Field } from '../Field'
import { FileInput, type FileInputProps } from './FileInput'

/** A file of a given size, without reading anything from disk. */
function makeFile(name: string, bytes: number, type: string) {
  return new File([new Uint8Array(bytes)], name, { type, lastModified: 1 })
}

/**
 * Dispatch a real `DragEvent`. Testing Library's `fireEvent` cannot carry
 * files: it rebuilds the `DataTransfer` by copying the given one's *own*
 * properties, a real one has none (they live on the prototype), and the
 * handler receives an empty drag with no `Files` in its types.
 */
function drag(target: Element, type: 'dragenter' | 'drop', files: File[]) {
  const dataTransfer = new DataTransfer()
  for (const f of files) dataTransfer.items.add(f)
  target.dispatchEvent(new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer }))
}

const resume = makeFile('Ada Lovelace — Resume.pdf', 184_000, 'application/pdf')
const photos = [
  makeFile('Analytical engine.jpg', 2_400_000, 'image/jpeg'),
  makeFile('Notes on the engine.png', 860_000, 'image/png'),
]

/**
 * Holds the files for stories that start with some chosen. A file input's
 * value cannot be set from markup, so "filled" is always the controlled path.
 */
function WithFiles({ initial, ...props }: FileInputProps & { initial: File[] }) {
  const [files, setFiles] = useState(initial)
  return <FileInput {...props} value={files} onValueChange={setFiles} />
}

const modes = ['input', 'dropzone'] as const

/**
 * The states that are not browser states. Hover, focus and a file held over
 * the zone belong to the mouse, the Tab key and the desktop.
 */
const states = [
  { name: 'Empty', files: [] as File[], props: {} },
  { name: 'Chosen', files: [resume], props: {} },
  { name: 'Invalid', files: [] as File[], props: { invalid: true } },
  { name: 'Disabled', files: [] as File[], props: { disabled: true } },
] as const

const meta = {
  title: 'Components/FileInput',
  component: FileInput,
  argTypes: {
    mode: { control: 'inline-radio', options: modes },
    multiple: { control: 'boolean' },
    accept: { control: 'text' },
    maxSize: { control: 'number' },
    maxFiles: { control: 'number' },
    placeholder: { control: 'text' },
    invalid: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  args: {
    mode: 'input',
    multiple: false,
    invalid: false,
    disabled: false,
  },
} satisfies Meta<typeof FileInput>

export default meta
type Story = StoryObj<typeof meta>

/**
 * One field with controls — use the Theme switch in the toolbar for dark mode.
 * Click the field, or Tab to it and press Space, to open the picker.
 */
export const Playground: Story = {
  render: (args) => (
    <Field label="Attachment" description="Any file, up to 10 MB" className="w-80">
      <FileInput {...args} />
    </Field>
  ),
}

/**
 * Both modes against every state that is not a browser state. A grid rather
 * than a `<table>`, Input's trap: a full-width control in an auto-layout cell
 * collapses to its longest word.
 *
 * The play function measures the two resting heights — 32, Input's box, and
 * 100, the dropzone's padding arithmetic in `styles.ts`.
 */
export const AllVariants: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="grid w-fit grid-cols-[auto_repeat(4,18rem)] items-start gap-x-6 gap-y-6">
      <span aria-hidden />
      {states.map((state) => (
        <span key={state.name} className="text-sm text-content-subtle">
          {state.name}
        </span>
      ))}

      {modes.map((mode) => (
        <div key={mode} className="contents">
          <span className="pt-8 text-sm text-content-subtle capitalize">{mode}</span>
          {states.map((state) => (
            <Field
              key={state.name}
              label={`${mode} ${state.name}`}
              invalid={'invalid' in state.props}
              disabled={'disabled' in state.props}
            >
              <WithFiles {...args} mode={mode} initial={[...state.files]} />
            </Field>
          ))}
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // The native input is the control, so it carries the Field's label.
    const field = canvas.getByLabelText('input Empty')
    await expect(field).toHaveAttribute('type', 'file')
    await expect(field.parentElement!.getBoundingClientRect().height).toBe(32)

    const zone = canvas.getByLabelText('dropzone Empty').parentElement!
    await expect(zone.getBoundingClientRect().height).toBe(100)

    // Chosen shows the name in the box, and lists it under the zone.
    await expect(canvas.getAllByText(resume.name)).toHaveLength(2)
    await expect(canvas.getByLabelText('input Invalid')).toHaveAttribute('aria-invalid', 'true')
    await expect(canvas.getByLabelText('dropzone Disabled')).toBeDisabled()
  },
}

/**
 * The compact field. Choosing a file puts its name where the placeholder was,
 * and a clear button at the end — which hands focus back to the control, so a
 * keyboard user is not dropped onto `<body>`.
 */
export const Input: Story = {
  args: { accept: '.pdf,.docx', maxSize: 5_000_000 },
  render: (args) => (
    <Field label="Resume" description="PDF or Word document, up to 5 MB" className="w-80">
      <FileInput {...args} />
    </Field>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByLabelText('Resume')
    await userEvent.upload(input, resume)
    await expect(canvas.getByText(resume.name)).toBeVisible()
    // The native input really holds the file, so a <form> would submit it.
    await expect((input as HTMLInputElement).files?.[0]).toBe(resume)

    await userEvent.click(canvas.getByRole('button', { name: `Remove ${resume.name}` }))
    await expect(canvas.getByText('Choose file')).toBeVisible()
    await expect((input as HTMLInputElement).files).toHaveLength(0)
    await expect(input).toHaveFocus()
  },
}

/**
 * The dropzone, taking several images. Drag files from the desktop onto it, or
 * click it. Each chosen file gets a row with its size and its own remove button.
 *
 * The play function drops two files with a synthetic `DataTransfer`, removes
 * one, and checks the native input followed both changes.
 */
export const Dropzone: Story = {
  args: { mode: 'dropzone', multiple: true, accept: 'image/*', maxSize: 10_000_000 },
  render: (args) => (
    <Field label="Photos" description="JPG or PNG, up to 10 MB each" className="w-96">
      <FileInput {...args} />
    </Field>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByLabelText('Photos') as HTMLInputElement
    const zone = input.parentElement!

    // React flushes a drag event's state on its own schedule, so the checks
    // after each synthetic event wait for the render rather than racing it.
    drag(zone, 'dragenter', photos)
    await waitFor(() => expect(zone).toHaveAttribute('data-dragging'))
    drag(zone, 'drop', photos)
    await waitFor(() => expect(zone).not.toHaveAttribute('data-dragging'))

    const list = await canvas.findByRole('list', { name: 'Chosen files' })
    await expect(within(list).getAllByRole('listitem')).toHaveLength(2)
    await expect(within(list).getByText('2.4 MB')).toBeVisible()
    await expect(input.files).toHaveLength(2)

    await userEvent.click(canvas.getByRole('button', { name: `Remove ${photos[0].name}` }))
    await expect(within(list).getAllByRole('listitem')).toHaveLength(1)
    await expect(input.files?.[0]).toBe(photos[1])
    await expect(input).toHaveFocus()
  },
}

/**
 * What a rule turns away comes back through `onFileReject`, with a `message`
 * written for a person — and the Field shows it, as it shows every other
 * validation message in the library. Choosing again clears it.
 *
 * The play function drops a PDF and an oversized photo on an image field
 * limited to 1 MB: both are refused, nothing is kept, and the first reason
 * lands in the Field.
 */
export const Rejection: Story = {
  args: { mode: 'dropzone', multiple: true, accept: 'image/*', maxSize: 1_000_000, maxFiles: 3 },
  render: function Render(args) {
    const [error, setError] = useState<string>()
    return (
      <Field label="Avatar options" description="Up to three images, 1 MB each" error={error} className="w-96">
        <FileInput
          {...args}
          onValueChange={() => setError(undefined)}
          onFileReject={(rejections) => setError(rejections[0].message)}
        />
      </Field>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByLabelText('Avatar options') as HTMLInputElement
    const zone = input.parentElement!

    drag(zone, 'drop', [resume, photos[0]])

    await waitFor(() =>
      expect(canvas.getByText(`${resume.name} isn't an accepted file type.`)).toBeVisible(),
    )
    await expect(input).toHaveAttribute('aria-invalid', 'true')
    await expect(input.files).toHaveLength(0)
    await expect(canvas.queryByRole('list')).toBeNull()
  },
}

/**
 * Hover and focus are browser states. Hover the field, or press Tab to reach
 * it: the ring is on the box, painted outside it, because focus lands on the
 * hidden `<input>` inside — and only that input fires it, so tabbing on to the
 * clear button rings the button instead of both.
 */
export const States: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="flex w-80 flex-col gap-6">
      <Field label="Hover or focus me">
        <FileInput {...args} />
      </Field>
      <Field label="Chosen, then Tab again">
        <WithFiles {...args} initial={[resume]} />
      </Field>
      <Field label="Several chosen" description="Names are joined, and truncate">
        <WithFiles {...args} multiple initial={photos} />
      </Field>
      <Field label="Invalid" error="Attach your signed contract.">
        <FileInput {...args} />
      </Field>
      <Field label="Disabled" disabled>
        <FileInput {...args} />
      </Field>
    </div>
  ),
}
