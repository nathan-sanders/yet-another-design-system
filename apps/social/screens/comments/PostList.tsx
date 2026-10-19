import { ArrowDownWideNarrow, ArrowUpNarrowWide } from 'lucide-react'

import { Button } from '../../../../src/components/Button'
import { Divider } from '../../../../src/components/Divider'
import { Select } from '../../../../src/components/Select'
import { cn } from '../../../../src/lib/cn'
import { PublishedPostCard, PublishedPostThumb } from '../../components/PublishedPostCard'
import type { Post } from '../../data/types'
import { useShell } from '../../shell/ShellContext'
import type { PostSort } from './model'

const SORTS: { value: PostSort; label: string }[] = [
  { value: 'published', label: 'Last published' },
  { value: 'comments', label: 'Most comments' },
  { value: 'unread', label: 'Most unread' },
]

/**
 * The list column, `MessageList`'s shape with posts in it: a toolbar — sort,
 * direction, Bulk edit — over the posts, a `Divider` under each, 380 wide. It
 * folds to a 72px rail when the page is narrower than 860, by the same
 * container query and for the same reason (see `inbox/MessageList.tsx`).
 */
export function PostList({
  posts,
  openId,
  sort,
  descending,
  onSortChange,
  onDirectionChange,
  onOpen,
  className,
}: {
  posts: Post[]
  openId?: string
  sort: PostSort
  descending: boolean
  onSortChange: (sort: PostSort) => void
  onDirectionChange: (descending: boolean) => void
  onOpen: (post: Post) => void
  className?: string
}) {
  const shell = useShell()

  return (
    <>
      <nav
        aria-label="Posts"
        className={cn(
          'hidden w-18 shrink-0 flex-col overflow-y-auto border-r border-surface-border',
          'md:@max-[860px]/page:flex',
          className,
        )}
      >
        <ul className="flex flex-col gap-1 p-1">
          {posts.map((post) => (
            <li key={post.id}>
              <PublishedPostThumb post={post} selected={post.id === openId} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      </nav>
      <nav
        aria-label="Posts"
        className={cn(
          'flex w-95 shrink-0 flex-col border-r border-surface-border max-md:w-full max-md:border-r-0',
          'md:@max-[860px]/page:hidden',
          className,
        )}
      >
        <div className="flex h-14 shrink-0 items-center gap-2 px-3 py-2">
          <Select
            size="small"
            hug
            aria-label="Sort posts"
            value={sort}
            onValueChange={(value) => onSortChange(value as PostSort)}
            items={SORTS}
          >
            {SORTS.map((s) => (
              <Select.Item key={s.value} value={s.value}>
                {s.label}
              </Select.Item>
            ))}
          </Select>
          <Button
            appearance="ghost"
            startIcon={descending ? ArrowDownWideNarrow : ArrowUpNarrowWide}
            aria-label="Reverse the order"
            aria-pressed={!descending}
            onClick={() => onDirectionChange(!descending)}
          />
          <div className="flex-1" />
          <Button appearance="ghost" size="small" onClick={() => shell.notBuilt('Bulk edit')}>
            Bulk edit
          </Button>
        </div>
        <ul className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-2 pb-2">
          {posts.map((post, index) => (
            <li key={post.id} className="flex flex-col gap-1">
              <PublishedPostCard post={post} selected={post.id === openId} onOpen={onOpen} />
              {index < posts.length - 1 ? <Divider /> : null}
            </li>
          ))}
        </ul>
      </nav>
    </>
  )
}
