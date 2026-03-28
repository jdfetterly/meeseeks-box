import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArtifactFamilyPanel } from '@/components/artifacts/ArtifactFamilyPanel'
import { OpenChatPanelButton } from '@/components/chat-panel/OpenChatPanelButton'
import { RecurringScheduleActions } from '@/components/schedules/RecurringScheduleActions'
import { RegisterScheduleArtifactForm } from '@/components/schedules/RegisterScheduleArtifactForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { listArtifactRegistryForSchedule } from '@/lib/artifacts/service'
import {
  getProjectById,
  getScheduleById,
  getScheduleSummaryById,
  getWorkItemById,
} from '@/lib/product-state/repositories'
import { parseRecurringCronExpression } from '@/lib/schedules/recurring-cadence'
import {
  describeScheduleCadence,
  describeSchedulePurpose,
  describeScheduleStatus,
  describeScheduleSyncState,
  describeScheduleUsefulness,
  formatScheduleTime,
} from '@/lib/schedules/presentation'

export const dynamic = 'force-dynamic'

export default async function ScheduleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const schedule = getScheduleById(id)

  if (!schedule) {
    notFound()
  }

  const summary = getScheduleSummaryById(schedule.id)
  const linkedWorkItem = schedule.sourceRef ? getWorkItemById(schedule.sourceRef) : null
  const linkedProject = linkedWorkItem?.projectId ? getProjectById(linkedWorkItem.projectId) : null
  const artifactRegistry = listArtifactRegistryForSchedule(schedule.id)
  const recurringCadence = schedule.scheduleKind === 'cron' ? parseRecurringCronExpression(schedule.scheduleExpr) : null
  const timezone =
    typeof schedule.metadata?.timezone === 'string' ? schedule.metadata.timezone : 'America/Los_Angeles'
  const usefulness = describeScheduleUsefulness({
    missedRun: summary?.missedRun ?? schedule.missedRunFlag,
    consecutiveFailureCount: summary?.consecutiveFailureCount ?? schedule.consecutiveFailures,
    lastSuccessfulOutputAt: summary?.lastSuccessfulOutputAt ?? schedule.lastSuccessAt,
  })

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
              Schedule
            </p>
            <h1
              style={{
                margin: 'var(--space-2) 0 0',
                fontSize: 'clamp(2rem, 4vw, 3.1rem)',
                lineHeight: 1,
                letterSpacing: '-0.04em',
              }}
            >
              {schedule.label}
            </h1>
            <p
              style={{
                margin: 'var(--space-3) 0 0',
                color: 'var(--text-secondary)',
                fontSize: 'var(--text-body)',
              }}
            >
              {describeScheduleCadence(schedule.scheduleKind, schedule.metadata)} •{' '}
              {describeScheduleStatus(schedule.status)}
              {schedule.nextRunAt ? ` • next run ${formatScheduleTime(schedule.nextRunAt)}` : ''}
            </p>
            <p
              style={{
                margin: 'var(--space-2) 0 0',
                color: 'var(--text-tertiary)',
                fontSize: '0.95rem',
              }}
            >
              {describeSchedulePurpose({ metadata: summary?.metadata ?? schedule.metadata })} • usefulness:{' '}
              {usefulness}
            </p>
            <div style={{ marginTop: 'var(--space-3)' }}>
              <OpenChatPanelButton
                label="Adjust with agent"
                intent="edit_existing"
                context={{
                  entityType: 'schedule',
                  entityId: schedule.id,
                  projectId: linkedWorkItem?.projectId ?? null,
                  page: 'schedule-detail',
                  suggestedPrompt: `Update ${schedule.label} and keep the setup agent-led instead of form-led.`,
                }}
                variant="outline"
              />
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Outputs and usefulness</CardTitle>
              <CardDescription>
                Start with what this schedule is producing and whether the output is useful enough to keep.
              </CardDescription>
            </CardHeader>
            <CardContent style={{ display: 'grid', gap: 'var(--space-4)' }}>
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                Purpose: {describeSchedulePurpose({ metadata: summary?.metadata ?? schedule.metadata })}
              </p>
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                Usefulness: {usefulness}
              </p>
              {linkedProject ? (
                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                  Owning project: <Link href={`/projects/${linkedProject.id}`}>{linkedProject.title}</Link>
                </p>
              ) : null}
              {linkedWorkItem ? (
                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                  Linked work: <Link href={`/work/${linkedWorkItem.id}`}>{linkedWorkItem.title}</Link>
                </p>
              ) : null}
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                Next delivery: {schedule.nextRunAt ? formatScheduleTime(schedule.nextRunAt) : 'none scheduled'}
              </p>
              {summary ? (
                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                  Last useful output:{' '}
                  {summary.lastSuccessfulOutputAt
                    ? formatScheduleTime(summary.lastSuccessfulOutputAt)
                    : 'none reported yet'}
                </p>
              ) : null}
              <RegisterScheduleArtifactForm scheduleId={schedule.id} />
              {artifactRegistry.length === 0 ? (
                <p style={{ margin: 0, color: 'var(--text-tertiary)' }}>
                  No schedule-produced artifact families are registered yet.
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

          <Card>
            <CardHeader>
              <CardTitle>Diagnostics</CardTitle>
              <CardDescription>
                Runtime sync, failure count, and schedule health remain visible but secondary.
              </CardDescription>
            </CardHeader>
            <CardContent style={{ display: 'grid', gap: 'var(--space-2)' }}>
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                Schedule expression: {schedule.scheduleExpr ?? 'n/a'}
              </p>
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                Runtime sync:{' '}
                {schedule.externalJobId
                  ? `Synced to runtime job ${schedule.externalJobId}`
                  : describeScheduleSyncState(schedule.metadata, {
                      scheduleStatus: schedule.status,
                      hasExternalJobId: Boolean(schedule.externalJobId),
                    })}
              </p>
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                Last run: {schedule.lastRunAt ? formatScheduleTime(schedule.lastRunAt) : 'none yet'}
              </p>
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                Last success:{' '}
                {schedule.lastSuccessAt ? formatScheduleTime(schedule.lastSuccessAt) : 'none yet'}
              </p>
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                Consecutive failures: {schedule.consecutiveFailures}
              </p>
              {schedule.missedRunFlag ? (
                <p style={{ margin: 0, color: 'var(--system-orange)' }}>
                  This schedule is currently flagged as missed.
                </p>
              ) : null}
            </CardContent>
          </Card>

          {recurringCadence ? (
            <Card>
              <CardHeader>
                <CardTitle>Recurring controls</CardTitle>
                <CardDescription>
                  Editing or pausing keeps the linked work item active. Deleting archives the linked
                  standing work item automatically.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RecurringScheduleActions
                  scheduleId={schedule.id}
                  status={schedule.status}
                  cadenceKind={recurringCadence.cadenceKind}
                  initialTime={recurringCadence.time}
                  initialWeekday={recurringCadence.weekday}
                  initialTimezone={timezone}
                />
              </CardContent>
            </Card>
          ) : null}

          {summary ? (
            <Card>
              <CardHeader>
                <CardTitle>Canonical health summary</CardTitle>
                <CardDescription>
                  Derived summary used by Work, Schedules, and Inbox projections.
                </CardDescription>
              </CardHeader>
              <CardContent style={{ display: 'grid', gap: 'var(--space-2)' }}>
                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                  Status: {describeScheduleStatus(summary.status)}
                </p>
                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                  Last outcome: {summary.lastRunOutcome ?? 'unknown'}
                </p>
                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                  Last successful output:{' '}
                  {summary.lastSuccessfulOutputAt
                    ? formatScheduleTime(summary.lastSuccessfulOutputAt)
                    : 'none yet'}
                </p>
                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                  Missed flag: {summary.missedRun ? 'yes' : 'no'}
                </p>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Linked work</CardTitle>
              <CardDescription>
                Schedules stay anchored to the work item that created or owns them.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {linkedWorkItem ? (
                <Link href={`/work/${linkedWorkItem.id}`}>
                  Open work item: {linkedWorkItem.title}
                </Link>
              ) : (
                <p style={{ margin: 0, color: 'var(--text-tertiary)' }}>
                  No linked work item is recorded for this schedule.
                </p>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}
