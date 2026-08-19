import { createContext, useContext } from 'react'

import type { TokenSize } from './styles'

/**
 * What a Token tells the parts inside it.
 *
 * Only the size travels down, and only `Token.Avatar` reads it — so that a call
 * site writes `<Token.Avatar name="Sarah Chen" />` and gets 16px or 12px
 * automatically, instead of repeating a number the token already knows. The same
 * reasoning as AvatarGroup handing its size to the avatars inside it.
 *
 * Deliberately not exported from the package.
 */
export interface TokenContextValue {
  size: TokenSize
}

export const TokenContext = createContext<TokenContextValue | null>(null)

export function useToken(): TokenContextValue | null {
  return useContext(TokenContext)
}
