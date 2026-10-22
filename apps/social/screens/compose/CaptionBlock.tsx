import { AtSign, Crop, Hash, Image, LayoutTemplate, Pencil, Plug, Smile } from 'lucide-react'

import { Button } from '../../../../src/components/Button'
import { ContentBlock } from '../../../../src/components/ContentBlock'
import { SegmentedControl } from '../../../../src/components/SegmentedControl'
import { TextArea } from '../../../../src/components/TextArea'
import { Text } from '../../../../src/components/Text'
import { MediaTiles } from '../../components/MediaTiles'
import { NETWORK_NAMES, type Network, type PostFormat } from '../../data/types'
import { useShell } from '../../shell/ShellContext'

const FORMATS: { value: PostFormat; label: string }[] = [
  { value: 'post', label: 'Post' },
  { value: 'carousel', label: 'Carousel' },
  { value: 'reel', label: 'Reel' },
  { value: 'story', label: 'Story' },
]

/** What each network lets a caption run to. */
const LIMITS: Partial<Record<Network, number>> = {
  instagram: 2200,
  threads: 500,
  x: 280,
  facebook: 63206,
}

/**
 * The format strip, then the `Caption · Instagram` block (`40006009:29479`):
 * the caption itself with the network's counter, the media strip, and the
 * row of small ghost actions under it — emoji, hashtag, Alt text, Tag people,
 * Edit, Asset library, Integrations. Only the first two blocks do anything
 * yet; the actions say so.
 */
export function CaptionBlock({
  network,
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
  format: PostFormat
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
      <div className="flex items-center justify-between gap-2">
        <SegmentedControl
          aria-label="Format"
          value={format}
          onValueChange={(value) => onFormatChange(value as PostFormat)}
        >
          {FORMATS.map((option) => (
            <SegmentedControl.Item key={option.value} value={option.value}>
              {option.label}
            </SegmentedControl.Item>
          ))}
        </SegmentedControl>
        <Button
          appearance="ghost"
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
              size="small"
              startIcon={Smile}
              aria-label="Emoji"
              onClick={() => shell.notBuilt('Emoji')}
            />
            <Button
              appearance="ghost"
              size="small"
              startIcon={Hash}
              aria-label="Hashtags"
              onClick={() => shell.notBuilt('Hashtags')}
            />
            <Button
              appearance="ghost"
              size="small"
              startIcon={Pencil}
              onClick={() => shell.notBuilt('Alt text')}
            >
              Alt text
            </Button>
            <Button
              appearance="ghost"
              size="small"
              startIcon={AtSign}
              onClick={() => shell.notBuilt('Tagging people')}
            >
              Tag people
            </Button>
            <Button
              appearance="ghost"
              size="small"
              startIcon={Crop}
              onClick={() => shell.notBuilt('Editing a photo')}
            >
              Edit
            </Button>
            <Button
              appearance="ghost"
              size="small"
              startIcon={Image}
              onClick={() => shell.notBuilt('The Asset library')}
            >
              Asset library
            </Button>
            <Button
              appearance="ghost"
              size="small"
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
