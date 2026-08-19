import { createContext, useContext } from 'react'

import type { TokenRadius, TokenSize } from './styles'

/**
 * What a Token tells the parts inside it.
 *
 * The size is for `Token.Avatar`, so that a call site writes
 * `<Token.Avatar name="Sarah Chen" />` and gets 16px or 12px automatically
 * instead of repeating a number the token already knows — the same reasoning as
 * AvatarGroup handing its size to the avatars inside it.
 *
 * The radius is for `Token.Remove`, which reaches over the pill's border to take
 * its full height: its outer corners land exactly on the token's, so a mismatch
 * shows as a sliver of hover wash outside the curve. Context rather than a prop
 * because `Token.Remove` is not always rendered by `Token` — a Combobox chip
 * hands it to `Combobox.ChipRemove` — and it still must not have to be told
 * twice what the token it sits in already knows.
 *
 * Deliberately not exported from the package.
 */
export interface TokenContextValue {
  size: TokenSize
  radius: TokenRadius
}

export const TokenContext = createContext<TokenContextValue | null>(null)

export function useToken(): TokenContextValue | null {
  return useContext(TokenContext)
}
