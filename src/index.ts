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

export { Banner } from './components/Banner'
export type { BannerProps, BannerType } from './components/Banner'

export { Breadcrumbs } from './components/Breadcrumbs'
export type {
  BreadcrumbsProps,
  BreadcrumbsItemProps,
  BreadcrumbSeparator,
} from './components/Breadcrumbs'

export { Button } from './components/Button'
export type { ButtonProps } from './components/Button'

export { Checkbox } from './components/Checkbox'
export type { CheckboxProps } from './components/Checkbox'

export { Divider } from './components/Divider'
export type { DividerProps } from './components/Divider'

export { Icon } from './components/Icon'
export type { IconProps } from './components/Icon'

export { Radio } from './components/Radio'
export type { RadioProps, RadioGroupProps } from './components/Radio'

export { SegmentedControl } from './components/SegmentedControl'
export type {
  SegmentedControlProps,
  SegmentedControlItemProps,
  SegmentedControlAppearance,
  SegmentedControlSize,
  SegmentedControlLayout,
} from './components/SegmentedControl'

export { Tabs } from './components/Tabs'
export type {
  TabsProps,
  TabsListProps,
  TabsTabProps,
  TabsPanelProps,
  TabsSize,
  TabsLayout,
} from './components/Tabs'

export { Toast, ToastViewport, useToast } from './components/Toast'
export type {
  ToastProps,
  ToastViewportProps,
  ToastAddOptions,
  ToastActionOptions,
  ToastManagerValue,
  ToastType,
  ToastPosition,
} from './components/Toast'

export { Tooltip } from './components/Tooltip'
export type { TooltipProps, TooltipPopupProps } from './components/Tooltip'

export { cn } from './lib/cn'

// Icons themselves are not re-exported: import them straight from lucide-react
// (`import { Plus } from 'lucide-react'`) so bundlers can tree-shake to just the
// glyphs you use. Re-exporting the whole set here would defeat that.
export type { LucideIcon } from 'lucide-react'
