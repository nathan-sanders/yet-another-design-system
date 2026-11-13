import type { ReactNode } from 'react'
import { Ellipsis } from 'lucide-react'

import { Button } from '../../../src/components/Button'
import { ContentBlock } from '../../../src/components/ContentBlock'
import { Menu } from '../../../src/components/Menu'
import { cn } from '../../../src/lib/cn'

/**
 * A Content Block with the file's header and, when it has one, its ⋯ menu:
 * the default Ghost icon-only Button in `Actions Items`. Home's blocks and a
 * project's Overview both draw it. `contentClassName` takes the file's own
 * gap where it is not the default 8.
 */
export function MenuBlock({
  title,
  menu,
  flush = false,
  contentClassName,
  className,
  children,
}: {
  title: string
  menu?: { label: string; onClick: () => void }[]
  /** Content runs to the block's edges, for Home's week strip. */
  flush?: boolean
  contentClassName?: string
  className?: string
  children: ReactNode
}) {
  return (
    <ContentBlock headingLevel={2} className={cn('h-auto shrink-0', className)}>
      <ContentBlock.Header
        actions={
          menu ? (
            <Menu>
              <Menu.Trigger
                render={
                  <Button appearance="ghost" startIcon={Ellipsis} aria-label={`${title} options`} />
                }
              />
              <Menu.Popup aria-label={`${title} options`}>
                <Menu.Group>
                  {menu.map((item) => (
                    <Menu.Item key={item.label} onClick={item.onClick}>
                      {item.label}
                    </Menu.Item>
                  ))}
                </Menu.Group>
              </Menu.Popup>
            </Menu>
          ) : undefined
        }
      >
        {title}
      </ContentBlock.Header>
      <ContentBlock.Content className={cn(flush && 'p-0', contentClassName)}>
        {children}
      </ContentBlock.Content>
    </ContentBlock>
  )
}
