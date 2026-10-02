import {
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type DragEvent,
  type MouseEvent,
} from 'react'
import { Input as InputPrimitive } from '@base-ui/react/input'
import { File as FileIcon, Upload, X } from 'lucide-react'

import { cn } from '../../lib/cn'
import { Button } from '../Button'
import { Icon } from '../Icon'
import { box } from '../Input/styles'
import { formatFileSize, sameFiles, screen, type FileRejection } from './files'
import { dropzone, fileList, fileName, fileRow, fileSize, value as valueText } from './styles'

/**
 * FileInput — choose a file, by browsing or by dropping it.
 *
 * Mirrors the Figma component set "File Input" (page `↪ File Input`), and
 * Astryx's `FileInput`: two modes, a compact field and a dropzone.
 *
 *     <Field label="Resume" description="PDF or Word document, up to 5 MB">
 *       <FileInput accept=".pdf,.docx" maxSize={5_000_000} />
 *     </Field>
 *
 * **The control is a real `<input type="file">`, visually hidden.** Astryx
 * hides its input from assistive technology and lays a `<button>` over the
 * box; here the native input *is* the focusable control, kept in the
 * accessibility tree with `sr-only`. So a screen reader announces it as the
 * browser's own file button — name, "no file chosen", the chosen file — Space
 * and Enter open the picker natively, and a `<form>` submits the files with no
 * glue. Clicking anywhere on the box forwards to it.
 *
 * **Built on Base UI's `Input`, which is `Field.Control`** — TextArea's
 * arrangement, with `type="file"` where TextArea passes a `<textarea>`. It is
 * left uncontrolled (a file input's value cannot be set), and in exchange a
 * surrounding `Field` labels it, describes it and marks it invalid exactly as
 * it does an Input. Read in `node_modules`: Field.Control only forwards
 * `value` when one is passed, so a file input is safe under it.
 *
 * **The files are a `File[]`, always** — even with `multiple` off, where it
 * holds at most one. Astryx switches between `File` and `File[]` on
 * `isMultiple`; one shape means a caller never has to narrow.
 *
 * **Rejections are reported, not displayed.** `accept`, `maxSize` and
 * `maxFiles` filter what arrives, and anything turned away comes back through
 * `onFileReject` with a ready-made `message`. Showing it is `Field`'s job, the
 * way every other validation message in the library is:
 *
 *     const [error, setError] = useState<string>()
 *     <Field label="Photos" error={error}>
 *       <FileInput
 *         onValueChange={() => setError(undefined)}
 *         onFileReject={(r) => setError(r[0].message)}
 *       />
 *     </Field>
 *
 * **A new choice replaces the old one**, from the picker and from a drop
 * alike — the native semantics, and the only ones the picker can have. Each
 * file in a dropzone's list has its own remove button.
 *
 * **Not here, on purpose:** Astryx's `size` (it has none, and neither does the
 * file), `isLoading` / `changeAction` and `status` / `statusVariant` — the
 * upload belongs to the caller and the message to `Field`, as Input's record
 * says of the same props. `disabledMessage` is left out for Tooltip's reason
 * in Button's record. Folder upload (`webkitdirectory`) is Astryx's own "don't".
 */
export interface FileInputProps
  extends Omit<
    ComponentPropsWithRef<'input'>,
    // `type` is always "file". `value`/`defaultValue`/`onChange` are re-declared
    // as files. `size` and `children` mean nothing here, `className` is
    // re-declared to point at the outermost element.
    'type' | 'value' | 'defaultValue' | 'onChange' | 'size' | 'children' | 'className'
  > {
  /**
   * `input` is a compact 32px field, Input's box with an upload icon.
   * `dropzone` is a larger dashed area that also takes files dragged onto it,
   * with the chosen files listed underneath. Astryx's `mode`, same values.
   */
  mode?: FileInputMode
  /** The chosen files, when controlled. */
  value?: File[]
  /** Fires with the accepted files whenever the choice changes, including to none. */
  onValueChange?: (files: File[]) => void
  /**
   * Fires with whatever `accept`, `maxSize` or `maxFiles` turned away. Each
   * entry carries a `message` written for a person, ready for a Field's `error`.
   */
  onFileReject?: (rejections: FileRejection[]) => void
  /**
   * Accepted types in the native format — `"image/*"`, `".pdf,.docx"`. The
   * picker filters by it and a drop is checked against it.
   */
  accept?: string
  /** Largest accepted file, in bytes. Larger ones are rejected with reason `size`. */
  maxSize?: number
  /** With `multiple`, the most files kept. Extras are rejected with reason `count`. */
  maxFiles?: number
  /**
   * Text shown when nothing is chosen. Defaults to "Choose file" in `input`
   * mode and "Drag a file here or click to browse" in `dropzone` mode, plural
   * with `multiple`.
   */
  placeholder?: string
  /**
   * Maps to Figma's `State=Invalid`, for a FileInput standing on its own.
   * Inside a `Field`, set it there instead — the border follows.
   */
  invalid?: boolean
  /** Extra classes for the outermost element. */
  className?: string
}

export type FileInputMode = 'input' | 'dropzone'

export function FileInput({
  mode = 'input',
  value,
  onValueChange,
  onFileReject,
  accept,
  maxSize,
  maxFiles,
  multiple = false,
  placeholder,
  invalid = false,
  disabled,
  className,
  id,
  name,
  ref,
  ...props
}: FileInputProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  // Set while this component writes `input.files` and fires the change event
  // that lets Base UI's Field notice — so its own handler can skip the echo.
  const syncing = useRef(false)

  // The uncontrolled case is mirrored in state, TextArea's arrangement; the
  // controlled case reads `value` directly.
  const [innerFiles, setInnerFiles] = useState<File[]>([])
  const files = value ?? innerFiles

  const [dragging, setDragging] = useState(false)
  // dragenter and dragleave fire for every child the pointer crosses, so a
  // boolean flickers. Counting them is the standard answer.
  const dragDepth = useRef(0)

  /**
   * Make the native input hold exactly `next`, and tell everyone listening.
   * `DataTransfer` is the one way to build a `FileList`; the synthetic `change`
   * reaches Base UI's Field.Control (React treats `change` as a file input's
   * onChange), so its filled and dirty state follow a drop or a removal too.
   */
  function writeInput(next: File[]) {
    const input = inputRef.current
    if (!input) return
    if (sameFiles(Array.from(input.files ?? []), next)) return
    if (next.length === 0) {
      input.value = ''
    } else {
      const transfer = new DataTransfer()
      for (const file of next) transfer.items.add(file)
      input.files = transfer.files
    }
    syncing.current = true
    input.dispatchEvent(new Event('change', { bubbles: true }))
    syncing.current = false
  }

  function commit(candidates: File[]) {
    const { accepted, rejected } = screen(candidates, { accept, maxSize, maxFiles, multiple })
    writeInput(accepted)
    if (value === undefined) setInnerFiles(accepted)
    if (!sameFiles(accepted, files)) onValueChange?.(accepted)
    if (rejected.length > 0) onFileReject?.(rejected)
  }

  // A controlled `value` from outside has to reach the native input as well,
  // or a form would submit the files from before.
  useEffect(() => {
    if (value !== undefined) writeInput(value)
    // writeInput only reads the ref; the effect is about `value` alone.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  function remove(file: File) {
    commit(files.filter((f) => f !== file))
    // The button that was pressed is gone; focus goes back to the control,
    // Astryx's rule for its clear button.
    inputRef.current?.focus()
  }

  function openPicker(event: MouseEvent<HTMLDivElement>) {
    // The remove buttons sit inside the box and have their own job.
    if ((event.target as HTMLElement).closest('button')) return
    if (event.target === inputRef.current) return
    inputRef.current?.click()
  }

  const isDropzone = mode === 'dropzone'
  const plural = multiple ? 'files' : 'file'
  const prompt =
    placeholder ??
    (isDropzone
      ? `Drag ${multiple ? 'files' : 'a file'} here or click to browse`
      : `Choose ${plural}`)

  const dropHandlers = isDropzone && !disabled
    ? {
        onDragEnter(event: DragEvent) {
          if (!event.dataTransfer.types.includes('Files')) return
          event.preventDefault()
          dragDepth.current++
          setDragging(true)
        },
        onDragOver(event: DragEvent) {
          if (!event.dataTransfer.types.includes('Files')) return
          // Without this the browser opens the dropped file in the tab.
          event.preventDefault()
          event.dataTransfer.dropEffect = 'copy'
        },
        onDragLeave() {
          dragDepth.current = Math.max(0, dragDepth.current - 1)
          if (dragDepth.current === 0) setDragging(false)
        },
        onDrop(event: DragEvent) {
          event.preventDefault()
          dragDepth.current = 0
          setDragging(false)
          commit(Array.from(event.dataTransfer.files))
        },
      }
    : {}

  const control = (
    <InputPrimitive
      // Every attribute rides on the render element — Base UI's Input props are
      // typed for a text input. `id`, `name` and `disabled` go through the
      // primitive, which derives the label's `htmlFor`, the Form registration
      // and `data-disabled` from them (TextArea's split, for the same reason).
      render={
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          {...props}
          ref={(node) => {
            inputRef.current = node
            if (typeof ref === 'function') ref(node)
            else if (ref) ref.current = node
          }}
        />
      }
      id={id}
      name={name}
      disabled={disabled}
      // Only when set: a forwarded `undefined` would delete the aria-invalid
      // Base UI computes from a surrounding Field.
      {...(invalid ? { 'aria-invalid': true } : {})}
      className="sr-only"
      onChange={(event) => {
        if (syncing.current) return
        commit(Array.from(event.currentTarget.files ?? []))
      }}
    />
  )

  const names = files.map((file) => file.name).join(', ')

  if (!isDropzone) {
    return (
      <div
        className={cn(box({ ring: 'input', invalid }), 'relative cursor-pointer', className)}
        onClick={openPicker}
      >
        {control}
        <span className="flex shrink-0 self-stretch items-center pl-3 text-content-primary">
          <Icon icon={Upload} size="base" />
        </span>
        <span className={cn(valueText({ empty: files.length === 0 }), 'px-2')} title={names || undefined}>
          {names || prompt}
        </span>
        {files.length > 0 && (
          // 24px small Button in a 30px row: `pr-1` leaves 4px either side.
          // Small is measured here, not preferred — a 32px Button cannot fit.
          <span className="flex shrink-0 items-center pr-1">
            <Button
              appearance="ghost"
              size="small"
              startIcon={X}
              aria-label={multiple ? 'Clear files' : `Remove ${files[0].name}`}
              disabled={disabled}
              onClick={() => {
                commit([])
                inputRef.current?.focus()
              }}
            />
          </span>
        )}
      </div>
    )
  }

  return (
    <div className={cn('flex w-full flex-col gap-2', className)}>
      <div
        className={cn(box({ ring: 'input', invalid }), dropzone(), 'relative')}
        data-dragging={dragging || undefined}
        onClick={openPicker}
        {...dropHandlers}
      >
        {control}
        <Icon icon={Upload} size="large" className="text-content-subtle" />
        <span className="text-base text-content-primary">{prompt}</span>
      </div>
      {files.length > 0 && (
        <ul className={fileList()} aria-label={multiple ? 'Chosen files' : 'Chosen file'}>
          {files.map((file, i) => (
            <li key={`${file.name}-${file.lastModified}-${i}`} className={fileRow()}>
              <Icon icon={FileIcon} size="base" className="text-content-subtle" />
              <span className={fileName()} title={file.name}>
                {file.name}
              </span>
              <span className={fileSize()}>{formatFileSize(file.size)}</span>
              <Button
                appearance="ghost"
                size="small"
                startIcon={X}
                aria-label={`Remove ${file.name}`}
                disabled={disabled}
                onClick={() => remove(file)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

FileInput.displayName = 'FileInput'
