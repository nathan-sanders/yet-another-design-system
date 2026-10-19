import type { MentionQuery } from '../../data/mentions'
import { useShell } from '../../shell/ShellContext'

/**
 * Opening the mentions behind a number. `toggle` opens the shell's mentions
 * panel on a query, or closes it when that query is already open, as a top
 * post's card does with post detail; `isOpen` marks the thing that opened it.
 */
export function useMentions() {
  const shell = useShell()
  const openKey = shell.panel?.type === 'mentions' ? shell.panel.query.key : undefined
  return {
    isOpen: (key: string) => openKey === key,
    toggle: (query: MentionQuery) =>
      shell.setPanel(openKey === query.key ? null : { type: 'mentions', query }),
  }
}
