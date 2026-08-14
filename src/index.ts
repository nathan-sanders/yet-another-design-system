// Public surface of the library. Each component folder exports through here.
export { Avatar, AvatarGroup } from './components/Avatar'
export type {
  AvatarProps,
  AvatarSize,
  AvatarStatus,
  AvatarGroupProps,
  AvatarGroupOverflowProps,
} from './components/Avatar'

export { Badge } from './components/Badge'
export type { BadgeProps } from './components/Badge'

export { Breadcrumbs } from './components/Breadcrumbs'
export type {
  BreadcrumbsProps,
  BreadcrumbsItemProps,
  BreadcrumbSeparator,
} from './components/Breadcrumbs'

export { Button } from './components/Button'
export type { ButtonProps } from './components/Button'

export { Divider } from './components/Divider'
export type { DividerProps } from './components/Divider'

export { Icon } from './components/Icon'
export type { IconProps } from './components/Icon'

export { cn } from './lib/cn'

// Icons themselves are not re-exported: import them straight from lucide-react
// (`import { Plus } from 'lucide-react'`) so bundlers can tree-shake to just the
// glyphs you use. Re-exporting the whole set here would defeat that.
export type { LucideIcon } from 'lucide-react'
