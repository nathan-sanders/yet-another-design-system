import { useState, type FormEvent } from 'react'
import { Search } from 'lucide-react'

import { Button } from '../../../src/components/Button'
import { ContentBlock } from '../../../src/components/ContentBlock'
import { Icon } from '../../../src/components/Icon'
import { InputGroup } from '../../../src/components/Input'
import { Token } from '../../../src/components/Token'
import { useYakSearch } from '../yak/useYakSearch'

/**
 * A page's search block — Discover's Ask bar (`40005911:35236`) and Creators'
 * `Creator Search` (`40005911:35755`) are the same drawing: a field with a
 * Search button inside it and a row of starters, in a subtle block. Whatever is
 * searched opens Yak's full view, which answers with results, so the bar is a
 * way into the assistant rather than a second search engine.
 */
export function YakSearchBar({
  label,
  placeholder,
  suggestions,
  suggestionsLabel,
  size,
}: {
  /** The field's accessible name. */
  label: string
  placeholder: string
  suggestions: string[]
  suggestionsLabel: string
  /** Discover's is `large`; Creators' is the default. */
  size?: 'large'
}) {
  const search = useYakSearch()
  const [text, setText] = useState('')

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const query = text.trim()
    if (!query) return
    search(query)
    setText('')
  }

  return (
    <ContentBlock emphasis="subtle" className="h-auto shrink-0">
      <ContentBlock.Content className="items-center py-6">
        <div className="flex w-full max-w-240 flex-col gap-2">
          <form role="search" aria-label={label} onSubmit={submit}>
            <InputGroup size={size} ring="input">
              <InputGroup.Addon align="inline-start">
                <Icon icon={Search} aria-hidden />
              </InputGroup.Addon>
              <InputGroup.Input
                aria-label={label}
                placeholder={placeholder}
                value={text}
                onValueChange={setText}
              />
              <InputGroup.Addon align="inline-end">
                <Button type="submit" appearance="primary" size="small">
                  Search
                </Button>
              </InputGroup.Addon>
            </InputGroup>
          </form>
          <ul aria-label={suggestionsLabel} className="flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <li key={suggestion}>
                <Token onClick={() => search(suggestion)}>{suggestion}</Token>
              </li>
            ))}
          </ul>
        </div>
      </ContentBlock.Content>
    </ContentBlock>
  )
}
