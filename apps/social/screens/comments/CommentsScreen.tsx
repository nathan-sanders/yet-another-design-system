import { useSearchParams } from 'react-router'
import { Ellipsis, ListFilter } from 'lucide-react'

import { AppShell } from '../../../../src/components/AppShell'
import { Button } from '../../../../src/components/Button'
import { Heading, Text } from '../../../../src/components/Text'
import { TopBar } from '../../../../src/components/TopBar'
import { usePhone } from '../../../../src/lib/viewport'
import type { Post } from '../../data/types'
import { useShell } from '../../shell/ShellContext'
import { DETAIL_TABS, type DetailTab } from '../calendar/postDetailState'
import { publishedPosts, type PostSort } from './model'
import { PostColumn } from './PostColumn'
import { PostList } from './PostList'

const SORTS: PostSort[] = ['published', 'comments', 'unread']

/**
 * Engage › Comments by post. No Figma frame: All messages' layout
 * (`40005911:33580`) with Veggie Vault's published posts in the list and the
 * calendar's published-post detail beside it — Comments first, each comment a
 * ticket. Everything worth linking to is in the URL —
 * `?post=p-10&sort=unread&dir=asc&tab=measure`.
 *
 * Like the inbox, the first post opens by itself on a desktop, and on a phone
 * the list and the post are two screens.
 */
export function CommentsScreen() {
  const [params, setParams] = useSearchParams()
  const shell = useShell()
  const phone = usePhone()

  const sortParam = params.get('sort') as PostSort | null
  const sort: PostSort = sortParam && SORTS.includes(sortParam) ? sortParam : 'published'
  const descending = params.get('dir') !== 'asc'
  const tabParam = params.get('tab') as DetailTab | null
  const tab: DetailTab = tabParam && DETAIL_TABS.includes(tabParam) ? tabParam : 'comments'
  const list = publishedPosts(sort, descending)

  const chosen = list.find((p) => p.id === params.get('post'))
  const open = chosen ?? (phone ? undefined : list[0])

  const update = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params)
    for (const [key, value] of Object.entries(changes)) {
      if (value === null) next.delete(key)
      else next.set(key, value)
    }
    setParams(next)
  }

  return (
    <>
      <TopBar
        start={
          <Heading level={1} size="base" weight="semibold" className="shrink-0">
            Comments by post
          </Heading>
        }
        end={
          <div className="flex items-center gap-2">
            {/* Icon-only below the width the list folds at, as on All messages. */}
            <Button
              appearance="ghost"
              startIcon={ListFilter}
              aria-label="Filter"
              className="@min-[860px]/page:hidden"
              onClick={() => shell.notBuilt('Filtering')}
            />
            <Button
              appearance="ghost"
              startIcon={ListFilter}
              className="hidden @min-[860px]/page:inline-flex"
              onClick={() => shell.notBuilt('Filtering')}
            >
              Filter
            </Button>
            <Button
              appearance="ghost"
              startIcon={Ellipsis}
              aria-label="More"
              onClick={() => shell.notBuilt('More actions')}
            />
          </div>
        }
      />
      <AppShell.Content className="flex-row gap-0 overflow-hidden p-0">
        <PostList
          posts={list}
          openId={open?.id}
          sort={sort}
          descending={descending}
          onSortChange={(next) => update({ sort: next === 'published' ? null : next })}
          onDirectionChange={(next) => update({ dir: next ? null : 'asc' })}
          onOpen={(post: Post) => update({ post: post.id })}
          className={chosen ? 'max-md:hidden' : undefined}
        />
        {open ? (
          <div className={chosen ? 'flex min-w-0 flex-1' : 'flex min-w-0 flex-1 max-md:hidden'}>
            <PostColumn
              key={open.id}
              post={open}
              tab={tab}
              onTabChange={(next) => update({ tab: next === 'comments' ? null : next })}
              onBack={() => update({ post: null })}
            />
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center p-4 max-md:hidden">
            <Text color="subtle">Nothing has been published yet.</Text>
          </div>
        )}
      </AppShell.Content>
    </>
  )
}
