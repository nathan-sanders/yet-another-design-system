import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router'

import { useShell } from '../shell/ShellContext'
import { useYakChat } from './chat'
import { yakPath } from './paths'

/**
 * What a page's search bar does with its words: a new chat in Yak's full view,
 * answered with results. Plan › Creators and Measure › Discover both hand
 * their searches over this way, so results have the whole page to lay out in.
 */
export function useYakSearch(): (query: string) => void {
  const chat = useYakChat()
  const shell = useShell()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return useCallback(
    (query: string) => {
      chat.search(query, pathname)
      shell.setPanel(null)
      navigate(yakPath(pathname))
    },
    [chat, shell, navigate, pathname],
  )
}
