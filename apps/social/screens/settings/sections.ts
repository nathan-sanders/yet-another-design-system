import { useCallback } from 'react'
import { useSearchParams } from 'react-router'
import {
  Bell,
  CreditCard,
  Globe,
  Plug,
  Scroll,
  SlidersHorizontal,
  Users,
  type LucideIcon,
} from 'lucide-react'

/**
 * Settings is a modal over whatever page you were on, the way the Claude
 * desktop app does it, and which section it shows lives in `?settings=` so
 * every section has a link. The changelog is the only one built; the rest
 * hold their place in the nav and say so.
 */
export type SettingsSectionId =
  'changelog' | 'general' | 'notifications' | 'channels' | 'team' | 'billing' | 'integrations'

export interface SettingsSection {
  id: SettingsSectionId
  label: string
  icon: LucideIcon
}

export const settingsGroups: { label: string; sections: SettingsSection[] }[] = [
  {
    label: 'What’s new',
    sections: [{ id: 'changelog', label: 'Changelog', icon: Scroll }],
  },
  {
    label: 'Preferences',
    sections: [
      { id: 'general', label: 'General', icon: SlidersHorizontal },
      { id: 'notifications', label: 'Notifications', icon: Bell },
    ],
  },
  {
    label: 'Workspace',
    sections: [
      { id: 'channels', label: 'Channels', icon: Globe },
      { id: 'team', label: 'Team', icon: Users },
      { id: 'billing', label: 'Billing', icon: CreditCard },
      { id: 'integrations', label: 'Integrations', icon: Plug },
    ],
  },
]

export const settingsSections = settingsGroups.flatMap((group) => group.sections)

/** Where Settings opens when nothing names a section: the one that is built. */
export const defaultSettingsSection: SettingsSectionId = 'changelog'

export const SETTINGS_PARAM = 'settings'

export function settingsSectionFrom(value: string | null): SettingsSection | undefined {
  if (value === null) return undefined
  return (
    settingsSections.find((section) => section.id === value) ??
    settingsSections.find((section) => section.id === defaultSettingsSection)
  )
}

/**
 * Opens Settings on a section, over the page you are on. Opening pushes a
 * history entry, so Back closes it; switching section and closing replace it.
 */
export function useSettingsParam() {
  const [params, setParams] = useSearchParams()
  const section = settingsSectionFrom(params.get(SETTINGS_PARAM))
  const write = useCallback(
    (id: SettingsSectionId | null, replace: boolean) =>
      setParams(
        (previous) => {
          const next = new URLSearchParams(previous)
          if (id) next.set(SETTINGS_PARAM, id)
          else next.delete(SETTINGS_PARAM)
          return next
        },
        { replace },
      ),
    [setParams],
  )
  const open = useCallback(
    (id: SettingsSectionId = defaultSettingsSection) => write(id, false),
    [write],
  )
  const show = useCallback((id: SettingsSectionId) => write(id, true), [write])
  const close = useCallback(() => write(null, true), [write])
  return { section, open, show, close }
}
