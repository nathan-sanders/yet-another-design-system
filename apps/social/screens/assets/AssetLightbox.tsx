import type { KeyboardEvent } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '../../../../src/components/Button'
import { Dialog } from '../../../../src/components/Dialog'
import { Text } from '../../../../src/components/Text'
import type { Asset } from '../../data/assets'

/**
 * The file at the size the screen allows, in its own aspect ratio: an image
 * contained, never cropped (a GIF animates, being an image); a video with its
 * controls, playing. Previous and Next, and the arrow keys, step through the
 * grid's files in the grid's order, and the details panel follows.
 *
 * Code-first: no frame draws it (FINDINGS 177). It is the library's Dialog at
 * the width a picture wants, with the stage on `surface-background-subtle` so
 * a photo's letterboxing reads as a frame rather than as the dialog.
 */
export function AssetLightbox({
  open,
  onOpenChange,
  asset,
  facts,
  order,
  onNavigate,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  asset: Asset
  /** "Image · 1600 × 2400 · 3.2 MB": the details panel's own line. */
  facts: string
  /** The grid's ids, in its order, for Previous and Next. */
  order: readonly string[]
  onNavigate: (id: string) => void
}) {
  const index = order.indexOf(asset.id)
  const previous = index > 0 ? order[index - 1] : undefined
  const next = index >= 0 && index < order.length - 1 ? order[index + 1] : undefined
  const video = asset.preview === 'video' ? asset.src : asset.videoSrc

  // Arrows step through the files, except where a control wants them: a
  // video's own scrubber, or a focused button that is not ours.
  const onKeyDown = (event: KeyboardEvent) => {
    if ((event.target as HTMLElement).closest('video')) return
    if (event.key === 'ArrowLeft' && previous) onNavigate(previous)
    else if (event.key === 'ArrowRight' && next) onNavigate(next)
    else return
    event.preventDefault()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Popup width={1040} onKeyDown={onKeyDown}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col">
            <Dialog.Title className="truncate">{asset.name}</Dialog.Title>
            <Dialog.Description>{facts}</Dialog.Description>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {order.length > 1 && index >= 0 ? (
              <>
                <Text render={<span />} size="sm" color="subtle" aria-live="polite">
                  {index + 1} of {order.length}
                </Text>
                <Button
                  appearance="ghost"
                  startIcon={ChevronLeft}
                  aria-label="Previous file"
                  disabled={!previous}
                  onClick={() => previous && onNavigate(previous)}
                />
                <Button
                  appearance="ghost"
                  startIcon={ChevronRight}
                  aria-label="Next file"
                  disabled={!next}
                  onClick={() => next && onNavigate(next)}
                />
              </>
            ) : null}
            <Dialog.Close />
          </div>
        </div>
        <Dialog.Body>
          <div className="flex h-[min(72dvh,760px)] items-center justify-center overflow-hidden rounded-md bg-surface-background-subtle">
            {video ? (
              <video
                // A new file is a new element, so it starts from its own beginning.
                key={asset.id}
                src={video}
                poster={asset.preview === 'video' ? undefined : asset.src}
                controls
                autoPlay
                playsInline
                aria-label={asset.name}
                className="size-full object-contain"
              />
            ) : (
              <img src={asset.src} alt={asset.alt} className="size-full object-contain" />
            )}
          </div>
        </Dialog.Body>
      </Dialog.Popup>
    </Dialog>
  )
}
