import { Image, X } from 'lucide-react'

import { Button } from '../../../src/components/Button'
import { Menu } from '../../../src/components/Menu'
import { Text } from '../../../src/components/Text'
import { cn } from '../../../src/lib/cn'
import { focusRing } from '../../../src/lib/focus'
import { libraryPhotos } from '../data/library'

/**
 * The media strip under a caption, and on an idea: each photo as a square
 * tile with a remove button over its corner, then a dashed Add tile that
 * offers the Asset library's photos (`40006009:29479`, the strip under
 * `Caption · Instagram`). Tiles are 88 in a panel's width and 112 in a
 * column's; the caller says which.
 */
export function MediaTiles({
  media,
  onChange,
  size = 'base',
  className,
}: {
  media: string[]
  onChange: (media: string[]) => void
  size?: 'small' | 'base'
  className?: string
}) {
  const tile = size === 'small' ? 'size-22' : 'size-28'
  const remaining = libraryPhotos.filter((photo) => !media.includes(photo.src))
  return (
    <ul role="list" aria-label="Media" className={cn('flex flex-wrap gap-2', className)}>
      {media.map((src, index) => (
        <li key={src} className="relative">
          <img
            src={src}
            alt={libraryPhotos.find((photo) => photo.src === src)?.alt ?? ''}
            className={cn(tile, 'rounded-lg object-cover')}
          />
          <Button
            appearance="overlay"
            size="small"
            startIcon={X}
            aria-label={`Remove photo ${index + 1}`}
            onClick={() => onChange(media.filter((each) => each !== src))}
            className="absolute top-1 right-1"
          />
        </li>
      ))}
      <li>
        <Menu>
          <Menu.Trigger
            render={
              <button
                type="button"
                aria-label="Add a photo"
                className={cn(
                  tile,
                  'flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-surface-border-emphasized text-content-subtle',
                  'hover:bg-action-ghost-background-hover',
                  focusRing,
                )}
              />
            }
          >
            <Image className="size-4" aria-hidden />
            <Text render={<span />} size="xs" weight="semibold" color="subtle">
              Add
            </Text>
          </Menu.Trigger>
          <Menu.Popup aria-label="Add a photo from the Asset library">
            <Menu.Group>
              {remaining.length ? (
                remaining.map((photo) => (
                  <Menu.Item
                    key={photo.src}
                    startIcon={Image}
                    onClick={() => onChange([...media, photo.src])}
                  >
                    {photo.alt}
                  </Menu.Item>
                ))
              ) : (
                <Menu.Item disabled>Every library photo is already in the post</Menu.Item>
              )}
            </Menu.Group>
          </Menu.Popup>
        </Menu>
      </li>
    </ul>
  )
}
