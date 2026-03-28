import { FeaturePlaceholder } from '@/components/shell/FeaturePlaceholder'

export default function CronsPage() {
  return (
    <FeaturePlaceholder
      eyebrow="Legacy Route"
      title="The legacy cron dashboard has been retired."
      description="Schedules now live in the canonical product-state model and reconcile against OpenClaw runtime state from the dedicated Schedules surface. This route stays as a cutover notice so old bookmarks do not lead back into a parallel schedule UI."
      actions={[
        { href: '/schedules', label: 'Open Schedules' },
        { href: '/work', label: 'Open Work' },
        { href: '/inbox', label: 'Open Inbox' },
      ]}
    />
  )
}
