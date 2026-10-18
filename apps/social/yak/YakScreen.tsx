import { useNavigate, useSearchParams } from 'react-router'
import { ArrowLeft, History, Minimize2, SquarePen, X } from 'lucide-react'

import { AppShell } from '../../../src/components/AppShell'
import { Button } from '../../../src/components/Button'
import { Heading } from '../../../src/components/Text'
import { TopBar } from '../../../src/components/TopBar'
import { useShell } from '../shell/ShellContext'
import { useYakChat } from './chat'
import { yakFrom } from './paths'
import { YakMark } from './YakMark'
import { Conversation, StartScreen, YakComposer } from './YakPanel'

/**
 * Yak Full View (`40005928:33777`): the panel's chat given the whole page. The
 * same conversation as the panel — the chat is the shell's — in Figma's 700
 * column, with the composer pinned under it, as ChatMessage's `InContext`
 * story lays a chat out. Back and Close return to the page it came from;
 * Collapse returns there with Yak in its panel.
 *
 * The start screen's brief is the workspace one: a full page is not beside
 * anything, which is what the file's "Across your workspace today" says.
 * Questions are still answered about the page it came from.
 *
 * History opens beside the page here rather than stacked, because there is no
 * panel to stack on; the shell renders it, since a `Panel` belongs after the
 * shell's `Page`, not inside it.
 */
export function YakScreen() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const shell = useShell()
  const chat = useYakChat()
  const historyOpen = shell.panel?.type === 'yak-history'
  const from = yakFrom(params)

  const leave = (withPanel: boolean) => {
    navigate(from)
    if (withPanel) shell.setPanel({ type: 'yak' })
  }

  return (
    <>
      <TopBar
        start={
          <div className="flex items-center gap-2">
            <Button
              appearance="ghost"
              startIcon={ArrowLeft}
              aria-label="Back"
              onClick={() => leave(false)}
            />
            <YakMark className="size-4 text-content-primary" />
            <Heading level={1} size="base" weight="semibold">
              Yak
            </Heading>
          </div>
        }
        end={
          <div className="flex items-center gap-2">
            <Button
              appearance="ghost"
              startIcon={History}
              aria-label="History"
              aria-pressed={historyOpen}
              onClick={() => shell.setPanel(historyOpen ? null : { type: 'yak-history' })}
            />
            <Button
              appearance="ghost"
              startIcon={SquarePen}
              aria-label="New chat"
              onClick={chat.clear}
            />
            <Button
              appearance="ghost"
              startIcon={Minimize2}
              aria-label="Collapse to panel"
              onClick={() => leave(true)}
            />
            <Button
              appearance="ghost"
              startIcon={X}
              aria-label="Close Yak"
              onClick={() => leave(false)}
            />
          </div>
        }
      />
      <AppShell.Content className="gap-0 overflow-hidden p-0">
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-4">
          <div className="mx-auto flex w-full max-w-175 flex-col gap-6 pb-4">
            {chat.turns.length === 0 ? (
              <StartScreen from="/yak" onAsk={(prompt) => chat.ask(prompt, from)} />
            ) : (
              <Conversation turns={chat.turns} />
            )}
          </div>
        </div>
        <div className="shrink-0 p-4">
          <div className="mx-auto w-full max-w-175">
            <YakComposer from={from} />
          </div>
        </div>
      </AppShell.Content>
    </>
  )
}
