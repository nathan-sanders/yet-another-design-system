import { AtSign, Crop, Hash, Image, LayoutTemplate, Pencil, Plug, Smile } from 'lucide-react'

import { Button } from '../../../../src/components/Button'
import { ContentBlock } from '../../../../src/components/ContentBlock'
import { SegmentedControl } from '../../../../src/components/SegmentedControl'
import { TextArea } from '../../../../src/components/TextArea'
import { Text } from '../../../../src/components/Text'
import { MediaTiles } from '../../components/MediaTiles'
import { POST_TYPES } from '../../data/postTypes'
import { NETWORK_NAMES, type Network, type PostFormat } from '../../data/types'
import { useShell } from '../../shell/ShellContext'

/** What each network lets a caption run to. */
const LIMITS: Partial<Record<Network, number>> = {
  instagram: 2200,
  threads: 500,
  x: 280,
  facebook: 63206,
}

/**
 * The format strip, then the `Caption · Instagram` block (`40006009:29479`).
 * The strip is the open network's own post types (`POST_TYPES`). All channels
 * has no type to pick, so there it shows the first channel's strip disabled:
 * the control stays where it will be, and says the type is set per network.
 * Templates keeps its place at the end of the row. Then the block:
 * the caption itself with the network's counter, the media strip, and the
 * row of ghost actions under it at the default size — emoji, hashtag, Alt
 * text, Tag people, Edit, Asset library, Integrations. Only the first two
 * blocks do anything yet; the actions say so.
 */
export function CaptionBlock({
  network,
  typesOf,
  format,
  onFormatChange,
  caption,
  onCaptionChange,
  media,
  onMediaChange,
  error,
}: {
  /** The network whose caption this is, or none for the shared one. */
  network: Network | null
  /**
   * Whose post types the strip lists: the open network, or on All channels
   * the first channel's, greyed out. None when no channel is picked.
   */
  typesOf: Network | null
  /** The type `typesOf` goes out as. */
  format: PostFormat | null
  onFormatChange: (format: PostFormat) => void
  caption: string
  onCaptionChange: (caption: string) => void
  media: string[]
  onMediaChange: (media: string[]) => void
  error?: string
}) {
  const shell = useShell()
  const title = network ? `Caption · ${NETWORK_NAMES[network]}` : 'Caption'
  const limit = network ? LIMITS[network] : undefined
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-end gap-2">
        {typesOf ? (
          // X's seven types are wider than a phone's column: the strip scrolls
          // sideways in its own box, padded by the focus ring's 4px so the
          // ring is not cut off, and Templates wraps under it.
          <div className="-my-1 mr-auto -ml-1 max-w-[calc(100%+0.5rem)] min-w-0 overflow-x-auto p-1">
            <SegmentedControl
              aria-label={
                network
                  ? `${NETWORK_NAMES[network]} post type`
                  : "Post type, set on each network's tab"
              }
              value={format ?? undefined}
              onValueChange={(value) => onFormatChange(value as PostFormat)}
              disabled={!network}
            >
              {POST_TYPES[typesOf].map((option) => (
                <SegmentedControl.Item key={option.value} value={option.value}>
                  {option.label}
                </SegmentedControl.Item>
              ))}
            </SegmentedControl>
          </div>
        ) : null}
        <Button
          appearance="secondary"
          startIcon={LayoutTemplate}
          onClick={() => shell.notBuilt('Templates')}
        >
          Templates
        </Button>
      </div>
      <ContentBlock>
        <ContentBlock.Header>{title}</ContentBlock.Header>
        <ContentBlock.Content className="flex flex-col gap-3">
          {/* The block's header is the label; a Field would say it twice. */}
          <TextArea
            aria-label={title}
            rows={4}
            value={caption}
            onValueChange={(value) => onCaptionChange(value)}
            maxLength={limit}
            invalid={error !== undefined}
            placeholder={
              network
                ? `Write the ${NETWORK_NAMES[network]} version…`
                : 'Write a caption for every channel…'
            }
          />
          {error ? (
            <Text size="sm" color="danger" role="alert">
              {error}
            </Text>
          ) : null}
          <MediaTiles media={media} onChange={onMediaChange} />
          <div className="flex flex-wrap items-center gap-1">
            <Button
              appearance="ghost"
              startIcon={Smile}
              aria-label="Emoji"
              onClick={() => shell.notBuilt('Emoji')}
            />
            <Button
              appearance="ghost"
              startIcon={Hash}
              aria-label="Hashtags"
              onClick={() => shell.notBuilt('Hashtags')}
            />
            <Button
              appearance="ghost"
              startIcon={Pencil}
              onClick={() => shell.notBuilt('Alt text')}
            >
              Alt text
            </Button>
            <Button
              appearance="ghost"
              startIcon={AtSign}
              onClick={() => shell.notBuilt('Tagging people')}
            >
              Tag people
            </Button>
            <Button
              appearance="ghost"
              startIcon={Crop}
              onClick={() => shell.notBuilt('Editing a photo')}
            >
              Edit
            </Button>
            <Button
              appearance="ghost"
              startIcon={Image}
              onClick={() => shell.notBuilt('The Asset library')}
            >
              Asset library
            </Button>
            <Button
              appearance="ghost"
              startIcon={Plug}
              onClick={() => shell.notBuilt('Integrations')}
            >
              Integrations
            </Button>
          </div>
        </ContentBlock.Content>
      </ContentBlock>
    </div>
  )
}
