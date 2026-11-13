import { useState, type FormEvent, type RefObject } from 'react'
import { AudioLines, PanelRight, Plus } from 'lucide-react'

import { Button } from '../../../src/components/Button'
import { InputGroup } from '../../../src/components/Input'
import { useShell } from '../shell/ShellContext'
import { useYakChat } from '../yak/chat'
import { useMarkActive } from '../yak/useMarkActive'
import { YakMark } from '../yak/YakMark'

/**
 * `Floating Yak`, as Yet Social draws it and every Yet Project frame repeats
 * it: Yak's way in from any page, a 700 pill over the bottom of the page
 * column. A question opens Yak's panel on a fresh chat; the panel button
 * opens it as it was, asking whatever is typed there. Attach and voice are
 * not built and say so.
 *
 * The pill is the InputGroup's own box at the file's 58, `rounded-full`
 * because InputGroup has no radius of its own to offer (Yet Social's
 * FINDINGS 59).
 */
export function FloatingYak({
  placeholder,
  inputRef,
}: {
  placeholder: string
  /** The shell's, so `/` can put the caret here. */
  inputRef: RefObject<HTMLInputElement | null>
}) {
  const shell = useShell()
  const chat = useYakChat()
  const [text, setText] = useState('')
  const mark = useMarkActive()

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const prompt = text.trim()
    if (!prompt) return
    chat.start(prompt)
    setText('')
    shell.openYak()
  }

  const openPanel = () => {
    const prompt = text.trim()
    if (prompt) chat.ask(prompt)
    shell.openYak()
  }

  return (
    <form
      aria-label="Ask Yak"
      onSubmit={submit}
      {...mark.handlers}
      className="absolute inset-x-4 bottom-4 z-20 mx-auto max-w-175 max-md:hidden"
    >
      <InputGroup size="large" ring="input" className="min-h-14.5 rounded-full p-2 shadow-medium">
        <InputGroup.Addon align="inline-start">
          <YakMark className="size-6 text-content-emphasized" animate={mark.active} />
        </InputGroup.Addon>
        <InputGroup.Input
          ref={inputRef}
          aria-label="Ask Yak"
          placeholder={placeholder}
          value={text}
          onValueChange={setText}
        />
        <InputGroup.Addon align="inline-end">
          <Button
            appearance="ghost"
            startIcon={Plus}
            aria-label="Attach"
            onClick={() => shell.notBuilt('Attaching')}
          />
          <Button
            appearance="ghost"
            startIcon={AudioLines}
            aria-label="Voice input"
            onClick={() => shell.notBuilt('Voice input')}
          />
          <Button
            appearance="ghost"
            startIcon={PanelRight}
            aria-label="Open Yak in the panel"
            onClick={openPanel}
          />
        </InputGroup.Addon>
      </InputGroup>
    </form>
  )
}
