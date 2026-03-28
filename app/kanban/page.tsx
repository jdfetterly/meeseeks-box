import { FeaturePlaceholder } from '@/components/shell/FeaturePlaceholder'

export default function KanbanPage() {
  return (
    <FeaturePlaceholder
      eyebrow="Legacy Route"
      title="The legacy Kanban board has been retired."
      description="Meeseek Box now treats the canonical Work surface as the only operator-facing board. The old browser-local ticket board is intentionally out of the flow so work state does not split across local storage and server-backed projections."
      actions={[
        { href: '/work', label: 'Open Work' },
        { href: '/chat', label: 'Open Chat' },
        { href: '/inbox', label: 'Open Inbox' },
      ]}
    />
  )
}
