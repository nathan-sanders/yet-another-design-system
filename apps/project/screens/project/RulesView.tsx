import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useSearchParams } from 'react-router'
import {
  FolderOpen,
  ListFilter,
  MessageCircle,
  Play,
  Plus,
  TriangleAlert,
  Zap,
  type LucideIcon,
} from 'lucide-react'

import { Avatar } from '../../../../src/components/Avatar'
import { Button } from '../../../../src/components/Button'
import { Icon } from '../../../../src/components/Icon'
import { Panel } from '../../../../src/components/Panel'
import { Switch } from '../../../../src/components/Switch'
import { Heading, Text } from '../../../../src/components/Text'
import { Toast } from '../../../../src/components/Toast'
import { cn } from '../../../../src/lib/cn'
import { focusRing } from '../../../../src/lib/focus'
import { MenuBlock } from '../../components/MenuBlock'
import { datedText } from '../../data/dates'
import { personFor } from '../../data/people'
import type { Rule, RuleStepKind } from '../../data/rules'
import type { Project } from '../../data/types'
import { useShell } from '../../shell/ShellContext'
import { NotBuiltMessage } from '../NotBuiltMessage'
import { projectPath } from './paths'
import { useRules } from './rulesState'

const RULE_PARAM = 'rule'

/** A step's eyebrow and glyph, as `_Rule Step` draws each kind. */
const STEP: Record<RuleStepKind, { eyebrow: string; icon: LucideIcon }> = {
  when: { eyebrow: 'When', icon: Zap },
  if: { eyebrow: 'Only if', icon: ListFilter },
  then: { eyebrow: 'Then', icon: MessageCircle },
  and: { eyebrow: 'And', icon: TriangleAlert },
}

/**
 * A project's Rules (`Project - Rules`, `40006284:21772`): the active rules,
 * each with its Switch and how often it ran, then what Yak suggests adding.
 * A rule opens its panel beside the page (`?rule=blocked`), with its steps
 * and its recent runs. Switching a rule off pauses it; Add turns a suggestion
 * into a rule. New rule and Add step are drawn (`Intake & automation · Deep
 * dive`, `40006300:27547`) and not built.
 */
export function RulesView({ project }: { project: Project }) {
  const shell = useShell()
  const toast = Toast.useToast()
  const { rules: allRules, suggestions: allSuggestions, setEnabled, addSuggestion } = useRules()
  const rules = allRules.filter((rule) => rule.projectId === project.id)
  const suggestions = allSuggestions.filter((s) => s.rule.projectId === project.id)

  const [params, setParams] = useSearchParams()
  const requested = params.get(RULE_PARAM)
  const openRule = rules.find((rule) => rule.id === requested)
  const setOpen = (id: string | null) =>
    setParams(
      (current) => {
        const copy = new URLSearchParams(current)
        if (id) copy.set(RULE_PARAM, id)
        else copy.delete(RULE_PARAM)
        return copy
      },
      { replace: true },
    )

  // The panel keeps showing the last rule while it slides closed.
  const [shownId, setShownId] = useState(openRule?.id)
  if (openRule && openRule.id !== shownId) setShownId(openRule.id)
  const shown = rules.find((rule) => rule.id === shownId)

  // One panel at a time: a rule opening closes Yak.
  const { yakOpen, closeYak } = shell
  const lastRuleId = useRef(openRule?.id)
  useEffect(() => {
    if (openRule && openRule.id !== lastRuleId.current && yakOpen) closeYak()
    lastRuleId.current = openRule?.id
  }, [openRule, yakOpen, closeYak])

  if (rules.length === 0) {
    return (
      <NotBuiltMessage
        icon={FolderOpen}
        title="No rules in this mock yet"
        body={`Only Austin store opening has rules so far; ${project.name}’s come in a later slice.`}
        link={{ href: `#${projectPath('austin', 'rules')}`, label: 'Open Austin store opening' }}
      />
    )
  }

  const active = rules.filter((rule) => rule.enabled).length

  return (
    <div className="flex flex-col gap-3">
      <MenuBlock
        title={`Active rules · ${active}`}
        contentClassName="gap-0"
        actions={
          <Button appearance="ghost" startIcon={Plus} onClick={() => shell.notBuilt('New rule')}>
            New rule
          </Button>
        }
      >
        <ul className="flex flex-col">
          {rules.map((rule) => (
            <RuleRow
              key={rule.id}
              rule={rule}
              open={rule.id === openRule?.id}
              onOpen={() => setOpen(rule.id)}
              onEnabledChange={(enabled) => setEnabled(rule.id, enabled)}
            />
          ))}
        </ul>
      </MenuBlock>

      {suggestions.length > 0 ? (
        <MenuBlock title="Suggested by Yak">
          <ul className="flex flex-col gap-2">
            {suggestions.map(({ rule, reason }) => (
              <li key={rule.id} className="flex items-center gap-3">
                <span className="flex min-w-0 flex-1 flex-col">
                  <Text render={<span />}>{rule.name}</Text>
                  <Text render={<span />} size="sm" color="subtle">
                    {reason}
                  </Text>
                </span>
                <Button
                  appearance="secondary"
                  size="small"
                  aria-label={`Add “${rule.name}”`}
                  onClick={() => {
                    addSuggestion(rule.id)
                    toast.add({ title: 'Rule added', description: rule.name })
                  }}
                >
                  Add
                </Button>
              </li>
            ))}
          </ul>
        </MenuBlock>
      ) : null}

      {shell.screenPanelHost
        ? createPortal(
            <RulePanel rule={shown} open={Boolean(openRule)} onClose={() => setOpen(null)} />,
            shell.screenPanelHost,
          )
        : null}
    </div>
  )
}

/**
 * A rule's row: its Switch, then its sentence and how often it ran, which
 * opens its panel. The open one sits on the subtle fill, as drawn.
 */
function RuleRow({
  rule,
  open,
  onOpen,
  onEnabledChange,
}: {
  rule: Rule
  open: boolean
  onOpen: () => void
  onEnabledChange: (enabled: boolean) => void
}) {
  return (
    <li
      className={cn(
        'flex items-center gap-3 rounded-md p-2',
        open ? 'bg-surface-background-subtle' : 'hover:bg-action-ghost-background-hover',
      )}
    >
      <Switch aria-label={rule.name} checked={rule.enabled} onCheckedChange={onEnabledChange} />
      <button
        type="button"
        aria-expanded={open}
        onClick={onOpen}
        className={cn('flex min-w-0 flex-1 flex-col rounded-sm text-left', focusRing)}
      >
        <span className="truncate text-content-primary">{rule.name}</span>
        <span className="text-sm text-content-subtle">
          {rule.enabled
            ? rule.runsThisWeek > 0
              ? `Ran ${rule.runsThisWeek} times this week`
              : 'Hasn’t run yet'
            : 'Paused'}
        </span>
      </button>
    </li>
  )
}

/**
 * A rule's panel: Zap and "Rule" in the header with Test, then the rule's
 * title and sentence, its steps as `_Rule Step`s, Add step, and its recent
 * runs as Activity rows. Test checks the rule against the plan and says so;
 * it changes nothing.
 */
function RulePanel({ rule, open, onClose }: { rule?: Rule; open: boolean; onClose: () => void }) {
  const shell = useShell()
  const toast = Toast.useToast()
  return (
    <Panel
      aria-label="Rule"
      open={open && rule !== undefined}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
      resizable
    >
      {rule ? (
        <>
          <Panel.Header
            icon={Zap}
            actions={
              <Button
                appearance="ghost"
                startIcon={Play}
                onClick={() =>
                  toast.add({
                    title: 'Test passed',
                    description: `${rule.title}: ${rule.steps.length} steps checked, nothing changed.`,
                  })
                }
              >
                Test
              </Button>
            }
          >
            Rule
          </Panel.Header>
          <Panel.Body className="flex flex-col gap-3">
            <Heading level={2} size="lg" weight="semibold">
              {rule.title}
            </Heading>
            <Text weight="semibold" color="emphasized">
              {rule.summary}
            </Text>
            <ol aria-label="Steps" className="flex flex-col gap-2">
              {rule.steps.map((step) => (
                <li key={step.kind + step.text} className="flex items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-surface-background-subtle text-content-primary">
                    <Icon icon={STEP[step.kind].icon} />
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <Text render={<span />} size="sm" color="subtle">
                      {STEP[step.kind].eyebrow}
                    </Text>
                    <Text render={<span />} weight="semibold">
                      {step.text}
                    </Text>
                  </span>
                </li>
              ))}
            </ol>
            <Button
              appearance="ghost"
              startIcon={Plus}
              className="self-start"
              onClick={() => shell.notBuilt('Adding a step')}
            >
              Add step
            </Button>
            <Heading level={3} size="base" weight="semibold">
              Recent runs
            </Heading>
            {rule.runs.length > 0 ? (
              <ol className="flex flex-col gap-2">
                {rule.runs.map((run) => {
                  const person = personFor(run.actorId)
                  return (
                    <li key={run.text} className="flex items-start gap-2">
                      <Avatar name={person.name} src={person.avatar} alt="" size="x-small" />
                      <Text size="sm" className="min-w-0 flex-1">
                        {run.text}
                      </Text>
                      <Text render={<span />} size="sm" color="subtle" className="shrink-0">
                        {datedText(run.age)}
                      </Text>
                    </li>
                  )
                })}
              </ol>
            ) : (
              <Text size="sm" color="subtle">
                It hasn’t run yet.
              </Text>
            )}
          </Panel.Body>
        </>
      ) : null}
    </Panel>
  )
}
