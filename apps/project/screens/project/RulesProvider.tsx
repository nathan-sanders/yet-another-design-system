import { useCallback, useMemo, useState, type ReactNode } from 'react'

import { rules as initialRules, suggestions as initialSuggestions } from '../../data/rules'
import { RulesContext } from './rulesState'

/**
 * Every project's rules, held above the router like the tasks, so a rule
 * switched off or a suggestion added is still that way after a visit to
 * another tab.
 */
export function RulesProvider({ children }: { children: ReactNode }) {
  const [rules, setRules] = useState(initialRules)
  const [suggestions, setSuggestions] = useState(initialSuggestions)

  const setEnabled = useCallback(
    (id: string, enabled: boolean) =>
      setRules((current) => current.map((rule) => (rule.id === id ? { ...rule, enabled } : rule))),
    [],
  )
  const addSuggestion = useCallback(
    (id: string) => {
      const suggestion = suggestions.find((s) => s.rule.id === id)
      if (!suggestion) return
      setRules((current) => [...current, suggestion.rule])
      setSuggestions((current) => current.filter((s) => s.rule.id !== id))
    },
    [suggestions],
  )

  const value = useMemo(
    () => ({ rules, suggestions, setEnabled, addSuggestion }),
    [rules, suggestions, setEnabled, addSuggestion],
  )
  return <RulesContext.Provider value={value}>{children}</RulesContext.Provider>
}
