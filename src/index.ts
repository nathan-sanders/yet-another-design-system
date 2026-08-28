// Public surface of the library. Each component folder exports through here.
export { Accordion } from './components/Accordion'
export type {
  AccordionProps,
  AccordionItemProps,
  AccordionTriggerProps,
  AccordionPanelProps,
  AccordionHeadingLevel,
} from './components/Accordion'

export { Autocomplete } from './components/Autocomplete'
export type {
  AutocompleteProps,
  AutocompleteItemProps,
  AutocompleteGroupProps,
  AutocompleteItemData,
  AutocompleteItemGroup,
  AutocompleteItemAvatar,
  AutocompleteSize,
  AutocompleteAppearance,
} from './components/Autocomplete'

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

export { BentoGrid } from './components/BentoGrid'
export type {
  BentoGridProps,
  BentoGridCellProps,
  BentoGridColumns,
  BentoGridGap,
  BentoCellColSpan,
  BentoCellRowSpan,
} from './components/BentoGrid'

export { Breadcrumbs } from './components/Breadcrumbs'
export type {
  BreadcrumbsProps,
  BreadcrumbsItemProps,
  BreadcrumbSeparator,
} from './components/Breadcrumbs'

export { Button } from './components/Button'
export type { ButtonProps } from './components/Button'

export { Card, ClickableCard } from './components/Card'
export type {
  CardProps,
  ClickableCardProps,
  CardEmphasis,
  ClickableCardEmphasis,
  CardPadding,
} from './components/Card'

export {
  ChartContainer,
  ChartLegend,
  ChartTooltip,
  ChartSwatch,
  categorical,
  categoricalScale,
  categoricalCount,
  monoScales,
  benchmark,
  benchmarkAlt,
  placeholder,
  sentiment,
  accessibilityBorder,
  markerShape,
  markerForIndex,
  chartMarkers,
  chartGridProps,
  xAxisProps,
  yAxisProps,
  formatCompactNumber,
  formatFullNumber,
  formatDateTick,
  inferXPreset,
  CHART_BREAKPOINT,
} from './components/Chart'
export type {
  ChartContainerProps,
  ChartLegendProps,
  ChartLegendType,
  ChartTooltipProps,
  ChartSwatchProps,
  ChartSwatchShape,
  ChartSeries,
  ChartMarker,
  ChartMonoScale,
  ChartXPreset,
} from './components/Chart'

export { Checkbox } from './components/Checkbox'
export type { CheckboxProps, CheckboxGroupProps } from './components/Checkbox'

export { Combobox } from './components/Combobox'
export type {
  ComboboxProps,
  ComboboxItemProps,
  ComboboxGroupProps,
  ComboboxItemData,
  ComboboxItemGroup,
  ComboboxValue,
  ComboboxSize,
  ComboboxIndicator,
} from './components/Combobox'

export { ContentBlock } from './components/ContentBlock'
export type {
  ContentBlockProps,
  ContentBlockHeaderProps,
  ContentBlockContentProps,
  ContentBlockEmphasis,
  ContentBlockHeadingLevel,
} from './components/ContentBlock'

export { ContextMenu } from './components/ContextMenu'
export type {
  ContextMenuProps,
  ContextMenuPopupProps,
  ContextMenuTriggerProps,
} from './components/ContextMenu'

export { Divider } from './components/Divider'
export type { DividerProps } from './components/Divider'

export { Field } from './components/Field'
export type { FieldProps } from './components/Field'

export { Icon } from './components/Icon'
export type { IconProps } from './components/Icon'

export { Kbd } from './components/Kbd'
export type { KbdProps } from './components/Kbd'

export { Input, InputGroup } from './components/Input'
export type {
  InputProps,
  InputGroupProps,
  InputGroupInputProps,
  InputGroupAddonProps,
  InputGroupTextProps,
  InputSize,
  InputAppearance,
  InputGroupAddonAlign,
} from './components/Input'

export { Link } from './components/Link'
export type { LinkProps, LinkSize } from './components/Link'

export { LineSeries } from './components/LineSeries'
export type { LineSeriesProps, LineSeriesSeries, LineInterpolation } from './components/LineSeries'

export { Menu } from './components/Menu'
export type {
  MenuProps,
  MenuPopupProps,
  MenuGroupProps,
  MenuItemProps,
  MenuSubmenuProps,
  MenuCheckboxItemProps,
  MenuRadioItemProps,
} from './components/Menu'

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

export { Select } from './components/Select'
export type { SelectProps, SelectItemProps, SelectGroupProps, SelectSize } from './components/Select'

export { Slider } from './components/Slider'
export type { SliderProps, SliderMark } from './components/Slider'

export { Switch } from './components/Switch'
export type { SwitchProps } from './components/Switch'

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

export { Token } from './components/Token'
export type { TokenProps, TokenSize, TokenRadius } from './components/Token'

export { Tooltip } from './components/Tooltip'
export type { TooltipProps, TooltipPopupProps } from './components/Tooltip'

export { cn } from './lib/cn'

// Icons themselves are not re-exported: import them straight from lucide-react
// (`import { Plus } from 'lucide-react'`) so bundlers can tree-shake to just the
// glyphs you use. Re-exporting the whole set here would defeat that.
export type { LucideIcon } from 'lucide-react'
