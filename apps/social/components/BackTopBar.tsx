import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { ArrowLeft } from 'lucide-react'

import { Avatar } from '../../../src/components/Avatar'
import { Button } from '../../../src/components/Button'
import { TopBar } from '../../../src/components/TopBar'
import { me } from '../data/people'

export interface BackTopBarProps {
  start: ReactNode
  end?: ReactNode
  /** Where Back goes: a path, not history, so it works on a link opened cold. */
  backTo: string
  backLabel: string
}

/**
 * A Top Bar for a page inside a list: Back, then whatever the page puts at its
 * start. A report's board and widget, and a campaign's page. One child in
 * `start`, because TopBar stretches each (FINDINGS 6).
 *
 * Back is a `Button` that navigates — Button has no `href`, on purpose
 * (FINDINGS 7) — because the file draws an icon-only button here and a `Link`
 * cannot be one.
 */
export function BackTopBar({ start, end, backTo, backLabel }: BackTopBarProps) {
  const navigate = useNavigate()
  return (
    <TopBar
      start={
        <div className="flex min-w-0 items-center gap-2">
          <Button
            appearance="ghost"
            startIcon={ArrowLeft}
            aria-label={backLabel}
            className="shrink-0"
            onClick={() => navigate(backTo)}
          />
          <div className="min-w-0">{start}</div>
        </div>
      }
      end={end}
    />
  )
}

/** Your own face, Figma's `Currently Viewing` (`40005911:33672`), the footprint of an icon-only Button. */
export function Viewing() {
  return (
    <span className="flex h-8 shrink-0 items-center px-3">
      <Avatar name={me.name} src={me.avatar} size="x-small" alt={`${me.name} is viewing`} />
    </span>
  )
}
