import {
  createSavedLaunchPreset,
  listSavedLaunchPresets,
  listSchedules,
} from '@/lib/product-state/repositories'
import type { SavedLaunchPresetRecord } from '@/lib/product-state/entities'

export interface RecommendedJobDefinition {
  slug: string
  title: string
  cadenceLabel: string
  cadenceKind: 'daily' | 'weekly'
  defaultTime: string
  defaultWeekday?: 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday'
  summary: string
  scope: 'mini-ops'
  agentId: string
  timingPreference: 'now'
  priority: string
  outputType: string
  outputSlot: string
  outputTitle: string
  outputPathExample: string
  includes: string[]
  promptTemplate: string
}

export interface RecommendedJobInstallation extends RecommendedJobDefinition {
  installedPresetId: string | null
  scheduledScheduleId: string | null
  scheduledStatus: string | null
}

const CHILDCARE_SHEET_URL =
  'https://docs.google.com/spreadsheets/d/1_W0AB9UYz0Kj40z-HDEs_nJE9IvywXuh/edit?resourcekey=0-UkvM9mfNzG-xXPqBp_xvgA&gid=1069668836#gid=1069668836'

export const recommendedJobs: RecommendedJobDefinition[] = [
  {
    slug: 'morning-ops-brief',
    title: 'Morning Ops Brief',
    cadenceLabel: 'Daily',
    cadenceKind: 'daily',
    defaultTime: '07:00',
    summary:
      'A daily high-signal operating brief that combines overnight runtime health with today\'s childcare reality.',
    scope: 'mini-ops',
    agentId: 'jarvis',
    timingPreference: 'now',
    priority: 'normal',
    outputType: 'markdown-brief',
    outputSlot: 'morning-ops-brief',
    outputTitle: 'Morning Ops Brief',
    outputPathExample: '/workspace/outputs/morning-ops-brief.md',
    includes: [
      'Overnight failures, pending approvals, missed schedules, and active runs',
      'Newest scheduled-job artifacts worth looking at first',
      'Today and tomorrow childcare ownership from the Google Sheet',
      'A short needs-attention-first section with recommended next actions',
    ],
    promptTemplate: `Create a concise morning operations brief in markdown.

Primary goals:
- summarize overnight runtime state
- surface anything that needs attention first
- include childcare context so the day is realistic

You must include these sections:
1. Needs attention first
2. Overnight failures and blocked work
3. Pending approvals
4. Active or still-running work
5. New artifacts from scheduled jobs
6. Childcare schedule for today and tomorrow
7. Recommended next actions

Childcare schedule source:
- Read this Google Sheet as a read-only source: ${CHILDCARE_SHEET_URL}
- My childcare days are blue
- Kayla's childcare days are green
- Do not modify the sheet
- Do not suggest edits to the sheet unless you explicitly label them as suggestions outside the operational summary

Artifact/output expectations:
- Write the finished brief to /workspace/outputs/morning-ops-brief.md
- After writing the file, report it back to Meeseek Box with:
  npm run report-schedule-output -- --schedule <schedule-id> --file /workspace/outputs/morning-ops-brief.md --slot morning-ops-brief --title "Morning Ops Brief"

Important constraints:
- keep the brief concise and operator-focused
- prefer bullet points over long paragraphs
- if a section has nothing important, say so briefly instead of padding it`,
  },
  {
    slug: 'weekly-system-review',
    title: 'Weekly System Review',
    cadenceLabel: 'Weekly',
    cadenceKind: 'weekly',
    defaultTime: '16:00',
    defaultWeekday: 'sunday',
    summary:
      'A weekly review that looks for patterns across schedules, failures, outputs, and the upcoming childcare week.',
    scope: 'mini-ops',
    agentId: 'jarvis',
    timingPreference: 'now',
    priority: 'normal',
    outputType: 'markdown-review',
    outputSlot: 'weekly-system-review',
    outputTitle: 'Weekly System Review',
    outputPathExample: '/workspace/outputs/weekly-system-review.md',
    includes: [
      'Schedule success/failure patterns and recurring problem areas',
      'Approval volume, blocked work, and stale work items',
      'Notable artifact families created this week',
      'Upcoming childcare ownership for the next 7 days',
      'A short list of cleanup or improvement actions for next week',
    ],
    promptTemplate: `Create a weekly system review in markdown.

Primary goals:
- identify meaningful operating patterns from the last week
- surface cleanup or reliability work worth doing next
- include next week's childcare schedule so planning reflects real availability

You must include these sections:
1. Weekly summary
2. Schedule reliability and recurring failures
3. Approvals, blocked work, and stale work
4. Notable outputs and artifact families
5. Childcare schedule for the next 7 days
6. Recommended cleanup or improvement actions

Childcare schedule source:
- Read this Google Sheet as a read-only source: ${CHILDCARE_SHEET_URL}
- My childcare days are blue
- Kayla's childcare days are green
- Do not modify the sheet

Artifact/output expectations:
- Write the finished review to /workspace/outputs/weekly-system-review.md
- After writing the file, report it back to Meeseek Box with:
  npm run report-schedule-output -- --schedule <schedule-id> --file /workspace/outputs/weekly-system-review.md --slot weekly-system-review --title "Weekly System Review"

Important constraints:
- focus on patterns, not exhaustive logs
- keep recommendations concrete and ranked
- note uncertainty clearly if the childcare sheet cannot be read at execution time`,
  },
]

export function getRecommendedJobBySlug(slug: string) {
  return recommendedJobs.find((entry) => entry.slug === slug) ?? null
}

export function renderRecommendedJobPrompt(job: RecommendedJobDefinition, scheduleId: string) {
  return job.promptTemplate.replaceAll('<schedule-id>', scheduleId)
}

export function listRecommendedJobInstallations(
  rootDir = process.cwd(),
): RecommendedJobInstallation[] {
  const presets = listSavedLaunchPresets(rootDir)
  const presetsByTitle = new Map(presets.map((preset) => [preset.title, preset]))
  const schedules = listSchedules(rootDir)

  return recommendedJobs.map((job) => {
    const linkedSchedule =
      schedules.find(
        (schedule) =>
          schedule.scheduleKind === 'cron' &&
          schedule.status !== 'deleted' &&
          typeof schedule.metadata?.recommendedJobSlug === 'string' &&
          schedule.metadata.recommendedJobSlug === job.slug,
      ) ?? null

    return {
      ...job,
      installedPresetId: presetsByTitle.get(job.title)?.id ?? null,
      scheduledScheduleId: linkedSchedule?.id ?? null,
      scheduledStatus: linkedSchedule?.status ?? null,
    }
  })
}

export function installRecommendedJob(
  slug: string,
  rootDir = process.cwd(),
): { preset: SavedLaunchPresetRecord; created: boolean } {
  const job = recommendedJobs.find((entry) => entry.slug === slug)

  if (!job) {
    throw new Error(`Unknown recommended job: ${slug}`)
  }

  const existing = listSavedLaunchPresets(rootDir).find((preset) => preset.title === job.title)

  if (existing) {
    return { preset: existing, created: false }
  }

  const preset = createSavedLaunchPreset(
    {
      title: job.title,
      scope: job.scope,
      agentId: job.agentId,
      priority: job.priority,
      outputType: job.outputType,
      timingPreference: job.timingPreference,
      promptTemplate: job.promptTemplate,
    },
    rootDir,
  )

  return { preset, created: true }
}

export function installAllRecommendedJobs(rootDir = process.cwd()) {
  return recommendedJobs.map((job) => ({
    slug: job.slug,
    ...installRecommendedJob(job.slug, rootDir),
  }))
}
