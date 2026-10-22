import { useState, type FormEvent, type RefObject } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { AudioLines, PanelRight, Plus } from 'lucide-react'

import { Button } from '../../../src/components/Button'
import { InputGroup } from '../../../src/components/Input'
import { useShell } from '../shell/ShellContext'
import { useYakChat } from '../yak/chat'
import type { FloatingYakConfig } from '../yak/floating'
import { yakPath } from '../yak/paths'
import { useYakSearch } from '../yak/useYakSearch'
import { useMarkActive } from '../yak/useMarkActive'
import { YakMark } from '../yak/YakMark'

/**
 * Bottom clearance for a page's scroll region, so its last row can scroll out
 * from behind the bar: the bar's 58, its 16 off the bottom, and 16 of air.
 * Only from `md`, because the bar is hidden on a phone.
 */
export const floatingYakClearance = 'md:pb-24'

/**
 * `Floating Yak` (`40005929:39292`): Yak's way in from any page, floating over
 * the bottom of the page column. A search or a question opens Yak's full view,
 * which minimizes to the panel; the panel button opens the panel straight away,
 * taking anything already typed with it. On a page that is itself an editor
 * (`opens: 'panel'`) a question opens the panel too, as a fresh chat, so the
 * work stays in view beside the answer. The shell decides where it shows
 * (`yak/floating.ts`) and hides it while Yak is in its panel.
 *
 * The pill is the InputGroup's own box at Figma's 58 — 8 of padding and a
 * border round a 40 row, which `min-h-14.5` pins because the large box counts
 * its border inside its 40 — so the focus ring, the border and the hover all stay the
 * library's. InputGroup has no radius of its own to offer, so `rounded-full`
 * overrides `rounded-md` (FINDINGS 59).
 */
export function FloatingYak({
  placeholder,
  mode,
  opens = 'full',
  inputRef,
}: FloatingYakConfig & {
  /** The shell's, so `/` can put the caret here. */
  inputRef: RefObject<HTMLInputElement | null>
}) {
  const shell = useShell()
  const chat = useYakChat()
  const search = useYakSearch()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [text, setText] = useState('')
  const mark = useMarkActive()

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const prompt = text.trim()
    if (!prompt) return
    if (opens === 'panel') {
      if (mode === 'search') chat.search(prompt, pathname)
      else chat.start(prompt, pathname)
      setText('')
      shell.setPanel({ type: 'yak' })
    } else if (mode === 'search') {
      search(prompt)
    } else {
      chat.ask(prompt, pathname)
      shell.setPanel(null)
      navigate(yakPath(pathname))
    }
  }

  const openPanel = () => {
    const prompt = text.trim()
    if (prompt) chat.ask(prompt, pathname)
    shell.setPanel({ type: 'yak' })
  }

  return (
    <form
      role={mode === 'search' ? 'search' : undefined}
      aria-label="Ask Yak"
      onSubmit={submit}
      {...mark.handlers}
      // Figma's 700, centered, and 16 off each side once the column is narrower.
      className="absolute inset-x-4 bottom-4 z-20 mx-auto max-w-175 max-md:hidden"
    >
      <InputGroup size="large" ring="input" className="min-h-14.5 rounded-full p-2 shadow-medium">
        <InputGroup.Addon align="inline-start">
          <YakMark
            className="size-6 text-content-emphasized"
            animate={mark.active || chat.thinking}
          />
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
