import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArtifactFamilyPanel } from '@/components/artifacts/ArtifactFamilyPanel'
import { OpenChatPanelButton } from '@/components/chat-panel/OpenChatPanelButton'
import { ApprovalResolutionActions } from '@/components/inbox/ApprovalResolutionActions'
import { MarkInboxItemReviewedButton } from '@/components/inbox/MarkInboxItemReviewedButton'
import { RecurringScheduleActions } from '@/components/schedules/RecurringScheduleActions'
import { listArtifactRegistryForWorkItem } from '@/lib/artifacts/service'
import {
  getApprovalById,
  getConversationById,
  getProjectById,
  getSpecById,
  getSpecCardLinkByWorkItemId,
  getWorkItemById,
  listInboxItems,
  listRuns,
  listSchedules,
} from '@/lib/product-state/repositories'
import { parseRecurringCronExpression } from '@/lib/schedules/recurring-cadence'
import {
  describeScheduleCadence,
  describeScheduleStatus,
  describeScheduleSyncState,
  formatScheduleTime,
} from '@/lib/schedules/presentation'

export const dynamic = 'force-dynamic'

export default async function WorkItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const workItem = getWorkItemById(id)

  if (!workItem) {
    notFound()
  }

  const runs = listRuns().filter((run) => run.workItemId === workItem.id)
  const project = workItem.projectId ? getProjectById(workItem.projectId) : null
  const sourceConversation = workItem.sourceConversationId
    ? getConversationById(workItem.sourceConversationId)
    : null
  const specLink = getSpecCardLinkByWorkItemId(workItem.id)
  const spec = specLink ? getSpecById(specLink.specId) : null
  const artifactRegistry = listArtifactRegistryForWorkItem(workItem.id)
  const linkedSchedules = listSchedules().filter((schedule) => schedule.sourceRef === workItem.id)
  const attentionItems = listInboxItems().filter(
    (item) => item.status === 'open' && item.detail.workItemId === workItem.id,
  )

  return (
    <div className="h-full overflow-y-auto" style={{ background: 'var(--bg)' }}>
      <div
        style={{
          maxWidth: 980,
          margin: '0 auto',
          padding: 'var(--space-8) var(--space-5) var(--space-12)',
        }}
      >
        <div style={{ display: 'grid', gap: 'var(--space-6)' }}>
          <div>
            <p
              style={{
                margin: 0,
                color: 'var(--text-tertiary)',
                fontSize: 'var(--text-caption1)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontWeight: 'var(--weight-semibold)',
              }}
            >
              Work Item
            </p>
            <h1
              style={{
                margin: 'var(--space-2) 0 0',
                fontSize: 'clamp(2rem, 4vw, 3.1rem)',
                lineHeight: 1,
                letterSpacing: '-0.04em',
              }}
            >
              {workItem.title}
            </h1>
            <p
              style={{
                margin: 'var(--space-3) 0 0',
                color: 'var(--text-secondary)',
                fontSize: 'var(--text-body)',
              }}
            >
              Scope: {workItem.scope} • Status: {workItem.status} • Priority:{' '}
              {workItem.priority ?? 'default'}
            </p>
            <div style={{ marginTop: 'var(--space-3)', display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              {project ? <Link href={`/projects/${project.id}`}>Open project: {project.title}</Link> : null}
              {spec ? <span>Plan: {spec.title}</span> : null}
              <OpenChatPanelButton
                label="Adjust in copilot"
                intent="edit_existing"
                context={{
                  entityType: 'work_item',
                  entityId: workItem.id,
                  projectId: workItem.projectId,
                  page: 'work-detail',
                  suggestedPrompt: `Help me adjust ${workItem.title} without making me reconfigure it manually.`,
                }}
                variant="outline"
              />
            </div>
            {workItem.status === 'archived' ? (
              <p style={{ margin: 'var(--space-2) 0 0', color: 'var(--system-orange)' }}>
                This standing work item has been archived, usually because its recurring schedule was deleted.
              </p>
            ) : null}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Attention on this work item</CardTitle>
              <CardDescription>
                Why this item is surfaced right now, and what action you can take next.
              </CardDescription>
            </CardHeader>
            <CardContent style={{ display: 'grid', gap: 'var(--space-4)' }}>
              {attentionItems.length === 0 ? (
                <p style={{ margin: 0, color: 'var(--text-tertiary)' }}>
                  Nothing on this work item currently needs operator review.
                </p>
              ) : (
                attentionItems.map((item) => {
                  const approvalId =
                    typeof item.detail.approvalId === 'string' ? item.detail.approvalId : null
                  const approval = approvalId ? getApprovalById(approvalId) : null

                  return (
                    <div
                      key={item.id}
                      style={{
                        border: '1px solid var(--separator)',
                        borderRadius: 'var(--radius-lg)',
                        padding: 'var(--space-4)',
                        background: 'var(--material-thin)',
                        display: 'grid',
                        gap: 'var(--space-3)',
                      }}
                    >
                      <div style={{ display: 'grid', gap: 'var(--space-1)' }}>
                        <strong>{item.title}</strong>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                          {describeInboxCategory(item.category)}
                        </span>
                        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                          {describeInboxGuidance(item)}
                        </p>
                      </div>

                      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                        {renderAttentionLinks(item)}
                      </div>

                      {item.category === 'approval_required' && approval ? (
                        <ApprovalResolutionActions approvalId={approval.id} />
                      ) : (
                        <MarkInboxItemReviewedButton
                          inboxItemId={item.id}
                          label={item.category === 'review_required' ? 'Mark review complete' : 'Mark reviewed'}
                        />
                      )}
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Conversation linkage</CardTitle>
              <CardDescription>
                Escalated conversation context remains attached to this tracked work item.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sourceConversation ? (
                <Link
                  href={`/chat/${sourceConversation.id}`}
                  style={{
                    border: '1px solid var(--separator)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-4)',
                    background: 'var(--material-thin)',
                    textDecoration: 'none',
                    color: 'inherit',
                    display: 'grid',
                    gap: 'var(--space-1)',
                  }}
                >
                  <strong>{sourceConversation.title ?? 'Untitled conversation'}</strong>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                    {sourceConversation.scope} • {sourceConversation.status}
                  </span>
                </Link>
              ) : (
                <p style={{ margin: 0, color: 'var(--text-tertiary)' }}>
                  No conversation is linked to this work item.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Linked schedules</CardTitle>
              <CardDescription>
                Recurring or one-shot schedule ownership stays visible on the work item that created it.
              </CardDescription>
            </CardHeader>
            <CardContent style={{ display: 'grid', gap: 'var(--space-4)' }}>
              {linkedSchedules.length === 0 ? (
                <p style={{ margin: 0, color: 'var(--text-tertiary)' }}>
                  No schedules are linked to this work item.
                </p>
              ) : (
                linkedSchedules.map((schedule) => {
                  const recurringCadence =
                    schedule.scheduleKind === 'cron'
                      ? parseRecurringCronExpression(schedule.scheduleExpr)
                      : null
                  const timezone =
                    typeof schedule.metadata?.timezone === 'string'
                      ? schedule.metadata.timezone
                      : 'America/Los_Angeles'

                  return (
                    <div
                      key={schedule.id}
                      style={{
                        border: '1px solid var(--separator)',
                        borderRadius: 'var(--radius-lg)',
                        padding: 'var(--space-4)',
                        background: 'var(--material-thin)',
                        display: 'grid',
                        gap: 'var(--space-3)',
                      }}
                    >
                      <div style={{ display: 'grid', gap: 'var(--space-1)' }}>
                        <strong>{schedule.label}</strong>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                          {describeScheduleCadence(schedule.scheduleKind, schedule.metadata)} •{' '}
                          {describeScheduleStatus(schedule.status)}
                          {schedule.nextRunAt ? ` • next run ${formatScheduleTime(schedule.nextRunAt)}` : ''}
                        </span>
                        <span style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
                          {schedule.externalJobId
                            ? `Synced to runtime job ${schedule.externalJobId}`
                            : describeScheduleSyncState(schedule.metadata, {
                                scheduleStatus: schedule.status,
                                hasExternalJobId: Boolean(schedule.externalJobId),
                              })}
                        </span>
                        <span style={{ fontSize: '0.9rem' }}>
                          <Link href={`/schedules/${schedule.id}`}>Open schedule detail</Link>
                        </span>
                      </div>

                      {recurringCadence ? (
                        <RecurringScheduleActions
                          scheduleId={schedule.id}
                          status={schedule.status}
                          cadenceKind={recurringCadence.cadenceKind}
                          initialTime={recurringCadence.time}
                          initialWeekday={recurringCadence.weekday}
                          initialTimezone={timezone}
                        />
                      ) : null}
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Related runs</CardTitle>
              <CardDescription>
                {runs.length} run{runs.length === 1 ? '' : 's'} linked to this work item
              </CardDescription>
            </CardHeader>
            <CardContent style={{ display: 'grid', gap: 'var(--space-3)' }}>
              {runs.length === 0 ? (
                <p style={{ margin: 0, color: 'var(--text-tertiary)' }}>
                  No runs have been linked yet.
                </p>
              ) : (
                runs.map((run) => (
                  <Link
                    key={run.id}
                    href={`/runs/${run.id}`}
                    style={{
                      border: '1px solid var(--separator)',
                      borderRadius: 'var(--radius-lg)',
                      padding: 'var(--space-4)',
                      background: 'var(--material-thin)',
                      textDecoration: 'none',
                      color: 'inherit',
                      display: 'grid',
                      gap: 'var(--space-1)',
                    }}
                  >
                    <strong>{run.agentId ?? 'Unknown agent'}</strong>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                      {run.status} • {run.triggerKind}
                      {run.model ? ` • ${run.model}` : ''}
                    </span>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Artifacts</CardTitle>
              <CardDescription>
                {artifactRegistry.length} artifact famil{artifactRegistry.length === 1 ? 'y' : 'ies'} linked
                to this work item
              </CardDescription>
            </CardHeader>
            <CardContent style={{ display: 'grid', gap: 'var(--space-3)' }}>
              {artifactRegistry.length === 0 ? (
                <p style={{ margin: 0, color: 'var(--text-tertiary)' }}>
                  No artifact families are linked to this work item yet.
                </p>
              ) : (
                artifactRegistry.map(({ family, versions }) => (
                  <ArtifactFamilyPanel
                    key={family.id}
                    family={family}
                    versions={versions}
                    showFamilyKey={false}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function describeInboxCategory(category: string) {
  switch (category) {
    case 'approval_required':
      return 'Approval required'
    case 'run_failure':
      return 'Run failed'
    case 'missed_schedule':
      return 'Schedule missed'
    case 'review_required':
      return 'Review required'
    default:
      return category.replaceAll('_', ' ')
  }
}

function describeInboxGuidance(item: ReturnType<typeof listInboxItems>[number]) {
  switch (item.category) {
    case 'approval_required':
      return 'A protected runtime action is waiting for your explicit decision before execution can continue.'
    case 'run_failure':
      return typeof item.detail.lastErrorText === 'string'
        ? item.detail.lastErrorText
        : 'The latest linked run failed and needs investigation.'
    case 'missed_schedule':
      return 'The linked schedule missed its expected run window. Review the schedule health and runtime sync before continuing.'
    case 'review_required':
      return 'The work completed its current pass and is waiting for you to review the output.'
    default:
      return 'This work item has an open attention item linked to it.'
  }
}

function renderAttentionLinks(item: ReturnType<typeof listInboxItems>[number]) {
  const links: React.ReactNode[] = []

  if (typeof item.detail.scheduleId === 'string') {
    links.push(
      <Link key="schedule" href={`/schedules/${item.detail.scheduleId}`}>
        Open schedule
      </Link>,
    )
  }

  if (typeof item.detail.runId === 'string') {
    links.push(
      <Link key="run" href={`/runs/${item.detail.runId}`}>
        Open run
      </Link>,
    )
  }

  links.push(
    <Link key="inbox" href="/inbox">
      Open Inbox
    </Link>,
  )

  return links
}
