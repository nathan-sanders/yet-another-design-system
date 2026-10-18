/**
 * The apps the showcase lists. One entry per folder under `apps/`; the order
 * here is the order on the page.
 */
export interface ShowcaseApp {
  /** Folder name, which is also the path the app is served from. */
  slug: string
  name: string
  /** One line: what the product is. */
  pitch: string
  /** What is built so far, so a visitor knows what to click. */
  built: string[]
  /** The library components this app leans on hardest. */
  components: string[]
  /** The Figma page the screens come from. */
  figma: string
  /** A screenshot in `showcase/`, or none until one is taken. */
  image?: string
}

export const apps: ShowcaseApp[] = [
  {
    slug: 'social',
    name: 'Yet Social',
    pitch:
      'A social media management tool: schedule posts, run campaigns, answer customers and report on all of it, with Yak, an assistant, beside every screen.',
    built: [
      'Calendar: week, day and month',
      'Post detail',
      'Inbox: all messages, my inbox, public thread and contact detail',
      'Reports: the list, a board you rearrange and resize, widget detail and its Edit panel',
      'Discover: trends, creators, visual trends, sentiment and top posts, with an Ask bar into Yak',
      'Yak assistant and history',
    ],
    components: [
      'AppShell',
      'SideNav',
      'MobileNav',
      'TopBar',
      'Panel',
      'ChatComposer',
      'InputGroup',
      'ClickableCard',
      'SegmentedControl',
      'Token',
      'Avatar',
      'DragAndDrop',
      'LineSeries',
      'Table',
      'Gauge',
    ],
    figma:
      'https://www.figma.com/design/8bRBn0lf6TfPyFWR2XttDP/Yet-Another-Design-System?node-id=40005911-31806',
    image: 'social.png',
  },
]
