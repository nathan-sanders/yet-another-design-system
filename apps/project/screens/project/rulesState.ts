import { createContext, useContext } from 'react'

import type { Rule, RuleSuggestion } from '../../data/rules'

export interface RulesState {
  rules: Rule[]
  suggestions: RuleSuggestion[]
  setEnabled: (id: string, enabled: boolean) => void
  /** Turns a suggestion into a rule, at the end of the list. */
  addSuggestion: (id: string) => void
}

export const RulesContext = createContext<RulesState | null>(null)

export function useRules(): RulesState {
  const state = useContext(RulesContext)
  if (!state) throw new Error('useRules needs the RulesProvider around it')
  return state
}
