import { useState } from 'react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router'
import { Ellipsis, Link as LinkIcon, PencilRuler } from 'lucide-react'

import { AppShell } from '../../../../src/components/AppShell'
import { Breadcrumbs } from '../../../../src/components/Breadcrumbs'
import { Button } from '../../../../src/components/Button'
import { Icon } from '../../../../src/components/Icon'
import { Link } from '../../../../src/components/Link'
import { Menu } from '../../../../src/components/Menu'
import { Tabs } from '../../../../src/components/Tabs'
import { Heading, Text } from '../../../../src/components/Text'
import { cn } from '../../../../src/lib/cn'
import { BackTopBar, Viewing } from '../../components/BackTopBar'
import { CampaignHeader } from '../../components/CampaignHeader'
import { CAMPAIGN_COLOR_CLASSES } from '../../components/campaignColors'
import { floatingYakClearance } from '../../components/FloatingYak'
import { FIGMA_FILE } from '../../shell/routes'
import { useShell } from '../../shell/ShellContext'
import { CampaignIdeas } from './CampaignIdeas'
import { CampaignOverview } from './CampaignOverview'
import { CampaignPlan } from './CampaignPlan'
import { useCampaigns } from './campaignsState'
import { CancelCampaignDialog } from './CancelCampaignDialog'
import {
  CAMPAIGN_TABS,
  CAMPAIGNS_LIST,
  campaignFrom,
  campaignPath,
  campaignTab,
  type CampaignTab,
} from './paths'

/** The tabs still to come, and the frame each is drawn in. */
const DRAWN: Record<Exclude<CampaignTab, 'overview' | 'plan' | 'ideas'>, string> = {
  creators: '40006187-42949',
  assets: '40006187-43721',
  measure: '40006187-44493',
}

/**
 * A campaign's page (`40006129:38303` and its siblings): Back to the list it
 * came from, the campaign in the breadcrumbs, `_Campaign Header`, then six
 * tabs. The tab is in the URL (`?tab=plan`), and so is the list's own view
 * (`?from=`), so Back lands on the timeline it left.
 *
 * Every campaign gets the page, not only Summer Menu, the one the file draws.
 * The others have less written for them, and their blocks say so.
 *
 * ⋯ holds Cancel campaign…, the file's dialog (`40006180:41085`); a campaign
 * that has ended or been cancelled can't be.
 */
export function CampaignPage() {
  const { campaignId } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const shell = useShell()
  const { campaign: find } = useCampaigns()
  const [cancelling, setCancelling] = useState(false)

  const campaign = find(campaignId)
  if (!campaign) return <Navigate to={CAMPAIGNS_LIST} replace />

  const tab = campaignTab(params)
  const from = campaignFrom(params)
  const show = (next: CampaignTab) =>
    navigate(campaignPath(campaign.id, next, from), { replace: true })
  const ended = campaign.status === 'cancelled' || (campaign.end !== null && campaign.end < 0)

  return (
    <>
      <BackTopBar
        backTo={from}
        backLabel="Back to campaigns"
        start={
          <>
            <Heading level={1} className="sr-only">
              {campaign.name}
            </Heading>
            <Breadcrumbs>
              <Breadcrumbs.Item href={`#${from}`}>Campaigns</Breadcrumbs.Item>
              <Breadcrumbs.Item>
                {/* The file's 16px `circle` icon, filled and stroked in the campaign's
                    hue: the list's swatch at the icon's size. */}
                <span aria-hidden="true" className="flex size-4 items-center justify-center">
                  <span
                    className={cn(
                      'size-3.5 rounded-full inset-ring',
                      CAMPAIGN_COLOR_CLASSES[campaign.color].swatch,
                    )}
                  />
                </span>
                {campaign.name}
              </Breadcrumbs.Item>
            </Breadcrumbs>
          </>
        }
        end={
          <div className="flex items-center gap-2">
            <Button
              appearance="ghost"
              startIcon={LinkIcon}
              aria-label="Copy link"
              className="max-md:hidden"
              onClick={() => shell.notBuilt('Sharing')}
            />
            <Menu>
              <Menu.Trigger
                render={<Button appearance="ghost" startIcon={Ellipsis} aria-label="More" />}
              />
              <Menu.Popup aria-label="Campaign actions">
                <Menu.Group>
                  <Menu.Item destructive disabled={ended} onClick={() => setCancelling(true)}>
                    Cancel campaign…
                  </Menu.Item>
                </Menu.Group>
              </Menu.Popup>
            </Menu>
            <span className="max-md:hidden">
              <Viewing />
            </span>
          </div>
        }
      />
      <AppShell.Content className={cn('gap-3', floatingYakClearance)}>
        <CampaignHeader campaign={campaign} />
        <Tabs
          value={tab}
          onValueChange={(value) => show(value as CampaignTab)}
          layout="hug"
          className="flex flex-col gap-3"
        >
          {/* Six tabs are 99px wider than a phone, and Tabs has no overflow menu
              yet (FINDINGS 188), so below that the strip scrolls sideways. The
              bleed keeps the first and last tab's focus ring clear of the clip. */}
          <div className="-mx-4 overflow-x-auto px-4">
            <Tabs.List aria-label={`${campaign.name} sections`} className="min-w-max">
              {CAMPAIGN_TABS.map((t) => (
                <Tabs.Tab key={t.value} value={t.value}>
                  {t.label}
                </Tabs.Tab>
              ))}
            </Tabs.List>
          </div>
          <Tabs.Panel value="overview">
            <CampaignOverview campaign={campaign} onShowPlan={() => show('plan')} />
          </Tabs.Panel>
          <Tabs.Panel value="plan">
            <CampaignPlan campaign={campaign} />
          </Tabs.Panel>
          <Tabs.Panel value="ideas">
            <CampaignIdeas campaign={campaign} />
          </Tabs.Panel>
          {(Object.keys(DRAWN) as (keyof typeof DRAWN)[]).map((key) => (
            <Tabs.Panel key={key} value={key}>
              <TabNotBuilt
                label={CAMPAIGN_TABS.find((t) => t.value === key)!.label}
                figma={DRAWN[key]}
              />
            </Tabs.Panel>
          ))}
        </Tabs>
      </AppShell.Content>
      <CancelCampaignDialog campaign={campaign} open={cancelling} onOpenChange={setCancelling} />
    </>
  )
}

/** `NotBuilt`'s message, inside a tab: the tab is drawn and comes in a later slice. */
function TabNotBuilt({ label, figma }: { label: string; figma: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <span className="flex size-12 items-center justify-center rounded-lg bg-surface-background-subtle text-content-subtle">
        <Icon icon={PencilRuler} size="x-large" />
      </span>
      <Heading level={2} size="lg" weight="semibold">
        Designed, not built yet
      </Heading>
      <Text color="subtle" className="max-w-sm">
        The {label} tab is drawn in Figma and comes in a later slice of this app.
      </Text>
      <Link href={`${FIGMA_FILE}?node-id=${figma}`} external>
        See the design
      </Link>
    </div>
  )
}
