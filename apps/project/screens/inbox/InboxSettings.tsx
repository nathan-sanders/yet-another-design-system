import { Button } from '../../../../src/components/Button'
import { Dialog } from '../../../../src/components/Dialog'
import { Switch } from '../../../../src/components/Switch'
import { Heading, Text } from '../../../../src/components/Text'
import { NOTIFY_RULES, QUIET_RULES } from '../../data/inbox'
import { useInbox } from './inboxState'

/**
 * Inbox settings (`Inbox - Settings`, `40006316:53658`): Dialog's 600 wide,
 * "Tell me when" with an Inbox and an Email switch on each rule, then "Keep
 * it quiet" with Yak's bundling and quiet hours, and Done. The switches are
 * real and remembered for the session; nothing here sends email.
 *
 * Each switch is named by its rule and its column ("Someone mentions me,
 * Email"), because the column heads are only drawn once.
 */
export function InboxSettings({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { settings, setSetting } = useInbox()
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <Dialog.Popup>
        <div className="flex items-center justify-between gap-2">
          <Dialog.Title>Inbox settings</Dialog.Title>
          <Dialog.Close />
        </div>
        <Dialog.Body className="flex flex-col gap-6">
          <section aria-labelledby="tell-me-when" className="flex flex-col gap-2">
            <div className="flex items-center gap-4">
              <Heading id="tell-me-when" level={3} size="base" weight="semibold" className="flex-1">
                Tell me when
              </Heading>
              <Text render={<span />} size="sm" aria-hidden className="w-12 text-center">
                Inbox
              </Text>
              <Text render={<span />} size="sm" aria-hidden className="w-12 text-center">
                Email
              </Text>
            </div>
            <ul className="flex flex-col gap-2">
              {NOTIFY_RULES.map((rule) => (
                <li key={rule.id} className="flex min-h-6 items-center gap-4">
                  <Text render={<span />} className="min-w-0 flex-1">
                    {rule.label}
                  </Text>
                  {(['inbox', 'email'] as const).map((channel) => (
                    <span key={channel} className="flex w-12 justify-center">
                      <Switch
                        aria-label={`${rule.label}, ${channel === 'inbox' ? 'Inbox' : 'Email'}`}
                        checked={settings[`${rule.id}.${channel}`]}
                        onCheckedChange={(on) => setSetting(`${rule.id}.${channel}`, on)}
                      />
                    </span>
                  ))}
                </li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="keep-it-quiet" className="flex flex-col gap-2">
            <Heading id="keep-it-quiet" level={3} size="base" weight="semibold">
              Keep it quiet
            </Heading>
            <ul className="flex flex-col gap-2">
              {QUIET_RULES.map((rule) => (
                <li key={rule.id} className="flex items-center gap-4">
                  <span className="flex min-w-0 flex-1 flex-col">
                    <Text render={<span />}>{rule.label}</Text>
                    <Text render={<span />} size="sm" color="subtle">
                      {rule.detail}
                    </Text>
                  </span>
                  <Switch
                    aria-label={rule.label}
                    checked={settings[rule.id]}
                    onCheckedChange={(on) => setSetting(rule.id, on)}
                  />
                </li>
              ))}
            </ul>
          </section>
        </Dialog.Body>
        <div className="flex justify-end">
          <Button appearance="primary" onClick={onClose}>
            Done
          </Button>
        </div>
      </Dialog.Popup>
    </Dialog>
  )
}
