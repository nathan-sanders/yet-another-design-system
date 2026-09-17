import { createContext } from 'react'

import type { ChatDirection } from './styles'

/**
 * Which side the enclosing `ChatMessage` sits on, so its bubbles and metadata
 * row put the tail and the alignment on the right side without being told
 * one by one. A bubble outside any message reads the default, `received`.
 */
export const ChatMessageContext = createContext<ChatDirection>('received')
