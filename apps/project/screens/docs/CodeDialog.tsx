import { useState, type FormEvent } from 'react'

import { Button } from '../../../../src/components/Button'
import { Dialog } from '../../../../src/components/Dialog'
import { Field } from '../../../../src/components/Field'
import { Input } from '../../../../src/components/Input'
import { Select } from '../../../../src/components/Select'
import { TextArea } from '../../../../src/components/TextArea'

export interface CodeFields {
  title?: string
  language: string
  code: string
}

/** What the language picker offers: the highlighter's languages a project writes in. */
const LANGUAGES = [
  { value: 'bash', label: 'Bash' },
  { value: 'json', label: 'JSON' },
  { value: 'ts', label: 'TypeScript' },
  { value: 'tsx', label: 'TSX' },
  { value: 'js', label: 'JavaScript' },
  { value: 'css', label: 'CSS' },
  { value: 'html', label: 'HTML' },
  { value: 'yaml', label: 'YAML' },
  { value: 'sql', label: 'SQL' },
  { value: 'python', label: 'Python' },
  { value: 'plaintext', label: 'Plain text' },
]

/**
 * The slash menu's Code block, and its Edit. `Docs - Code block from slash
 * menu` (`40006589:61927`) draws the row and the finished blocks, not what
 * comes between, so this is the least that makes one: a file name for the
 * header, a language for the colors, and the code. A doc's lines are typed
 * in place; a block of code is written here and read in the doc, because the
 * library's CodeBlock is read-only.
 */
export function CodeDialog({
  seed,
  onClose,
  onSave,
}: {
  /** What to start from; the dialog is open while there is one. An empty code is a new block. */
  seed?: CodeFields
  onClose: () => void
  onSave: (fields: CodeFields) => void
}) {
  // Kept after the dialog closes, so it keeps its title while it fades.
  const [shown, setShown] = useState(seed)
  if (seed !== undefined && seed !== shown) setShown(seed)
  return (
    <Dialog
      open={seed !== undefined}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
    >
      <Dialog.Popup>
        {shown !== undefined ? (
          <CodeForm key={JSON.stringify(shown)} seed={shown} onClose={onClose} onSave={onSave} />
        ) : null}
      </Dialog.Popup>
    </Dialog>
  )
}

function CodeForm({
  seed,
  onClose,
  onSave,
}: {
  seed: CodeFields
  onClose: () => void
  onSave: (fields: CodeFields) => void
}) {
  const [title, setTitle] = useState(seed.title ?? '')
  const [language, setLanguage] = useState(seed.language)
  const [code, setCode] = useState(seed.code)
  const [submitted, setSubmitted] = useState(false)
  const codeMissing = !code.trim()
  const editing = seed.code !== ''

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setSubmitted(true)
    if (codeMissing) return
    onSave({ title: title.trim() || undefined, language, code: code.replace(/\s+$/, '') })
  }

  return (
    <form onSubmit={submit} noValidate className="contents">
      <div className="flex items-center justify-between gap-2">
        <Dialog.Title>{editing ? 'Edit code block' : 'Code block'}</Dialog.Title>
        <Dialog.Close />
      </div>
      <Dialog.Body className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="File name" description="Optional. Shown in the block’s header.">
            <Input
              value={title}
              placeholder="checkout.config.ts"
              onChange={(event) => setTitle(event.target.value)}
            />
          </Field>
          <Field label="Language" nativeLabel={false}>
            <Select
              value={language}
              onValueChange={(v) => setLanguage(String(v))}
              items={LANGUAGES}
            >
              {LANGUAGES.map((item) => (
                <Select.Item key={item.value} value={item.value}>
                  {item.label}
                </Select.Item>
              ))}
            </Select>
          </Field>
        </div>
        <Field
          label="Code"
          invalid={submitted && codeMissing}
          error={submitted && codeMissing ? 'Write or paste some code.' : undefined}
        >
          <TextArea
            value={code}
            rows={8}
            spellCheck={false}
            className="font-mono"
            onValueChange={(value) => setCode(value)}
          />
        </Field>
      </Dialog.Body>
      <div className="flex justify-end gap-2 pt-4">
        <Button appearance="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button appearance="primary" type="submit">
          {editing ? 'Save' : 'Add code block'}
        </Button>
      </div>
    </form>
  )
}
