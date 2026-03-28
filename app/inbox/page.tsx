import Link from 'next/link';
import { ApprovalResolutionActions } from '@/components/inbox/ApprovalResolutionActions';
import { Card, CardContent } from '@/components/ui/card';
import { listInboxItems, listRuns, listScheduleSummaries, listWorkItems } from '@/lib/product-state/repositories';

export const dynamic = 'force-dynamic';

const FILTERS = ['all', 'approvals', 'failures', 'schedules', 'resolved'] as const;
type FilterValue = (typeof FILTERS)[number];

function resolveFilter(value: string | undefined): FilterValue {
  return FILTERS.includes(value as FilterValue) ? (value as FilterValue) : 'all';
}

function matchesFilter(filter: FilterValue, item: ReturnType<typeof listInboxItems>[number]) {
  switch (filter) {
    case 'approvals':
      return item.category === 'approval_required';
    case 'failures':
      return item.category === 'run_failure' || item.category === 'tool_failure';
    case 'schedules':
      return item.category === 'missed_schedule';
    case 'resolved':
      return item.status === 'resolved';
    case 'all':
      return item.status === 'open';
  }
}

function renderSourceLink(input: {
  item: ReturnType<typeof listInboxItems>[number];
  workItemsById: Map<string, ReturnType<typeof listWorkItems>[number]>;
  runsById: Map<string, ReturnType<typeof listRuns>[number]>;
  scheduleSummariesById: Map<string, ReturnType<typeof listScheduleSummaries>[number]>;
}) {
  const { item, workItemsById, runsById, scheduleSummariesById } = input;

  if (typeof item.detail.workItemId === 'string') {
    return <Link href={`/work/${item.detail.workItemId}`}>{workItemsById.get(item.detail.workItemId)?.title ?? 'Open work'}</Link>;
  }

  if (typeof item.detail.scheduleId === 'string') {
    return <Link href={`/schedules/${item.detail.scheduleId}`}>{scheduleSummariesById.get(item.detail.scheduleId)?.label ?? 'Open schedule'}</Link>;
  }

  if (typeof item.detail.runId === 'string') {
    return <Link href={`/runs/${item.detail.runId}`}>{runsById.get(item.detail.runId)?.agentId ?? 'Open run'}</Link>;
  }

  return <Link href="/inbox">Stay in Inbox</Link>;
}

export default async function InboxPage({
  searchParams,
}: {
  searchParams?: Promise<{ filter?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const filter = resolveFilter(params.filter);
  const inboxItems = listInboxItems();
  const filteredItems = inboxItems.filter((item) => matchesFilter(filter, item));
  const workItemsById = new Map(listWorkItems().map((item) => [item.id, item]));
  const runsById = new Map(listRuns().map((run) => [run.id, run]));
  const scheduleSummariesById = new Map(listScheduleSummaries().map((summary) => [summary.scheduleId, summary]));

  return (
    <div className="h-full overflow-y-auto" style={{ background: 'transparent' }}>
      <div
        style={{
          maxWidth: 1020,
          margin: '0 auto',
          padding: 'var(--space-5) var(--space-4) var(--space-12)',
        }}
      >
        <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
          <header
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: '12px',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'grid', gap: '8px' }}>
              <h1 style={titleStyle}>Inbox</h1>
              <p style={subtitleStyle}>Operational attention only. Clear blockers, failures, and approvals fast.</p>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {FILTERS.map((value) => {
                const active = filter === value;
                const count =
                  value === 'all'
                    ? inboxItems.filter((item) => item.status === 'open').length
                    : value === 'resolved'
                      ? inboxItems.filter((item) => item.status === 'resolved').length
                      : inboxItems.filter((item) => matchesFilter(value, item)).length;

                return (
                  <Link
                    key={value}
                    href={value === 'all' ? '/inbox' : `/inbox?filter=${value}`}
                    style={filterStyle(active)}
                  >
                    {value[0].toUpperCase() + value.slice(1)} <span style={{ color: 'var(--text-tertiary)' }}>{count}</span>
                  </Link>
                );
              })}
            </div>
          </header>

          {filteredItems.length === 0 ? (
            <div style={emptyStateStyle}>Nothing is waiting in this slice.</div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {filteredItems.map((item) => (
                <Card key={item.id} className="border-white/8 bg-white/[0.035] py-4">
                  <CardContent style={{ display: 'grid', gap: '12px' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: '12px',
                        flexWrap: 'wrap',
                        alignItems: 'flex-start',
                      }}
                    >
                      <div style={{ display: 'grid', gap: '4px' }}>
                        <strong style={{ fontSize: '1rem' }}>{item.title}</strong>
                        <span style={metaStyle}>{item.category.replaceAll('_', ' ')}</span>
                      </div>
                      <span style={statusStyle(item.status)}>{item.status}</span>
                    </div>

                    {typeof item.detail.lastErrorText === 'string' ? (
                      <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{item.detail.lastErrorText}</p>
                    ) : null}

                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={metaStyle}>Source</span>
                      <div style={{ fontSize: '0.92rem' }}>
                        {renderSourceLink({ item, workItemsById, runsById, scheduleSummariesById })}
                      </div>
                    </div>

                    {item.category === 'approval_required' &&
                    typeof item.detail.approvalId === 'string' &&
                    item.status === 'open' ? (
                      <ApprovalResolutionActions approvalId={item.detail.approvalId} />
                    ) : null}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const titleStyle = {
  margin: 0,
  fontSize: '2.1rem',
  lineHeight: 0.96,
  letterSpacing: '-0.05em',
};

const subtitleStyle = {
  margin: 0,
  maxWidth: 620,
  color: 'var(--text-secondary)',
};

function filterStyle(active: boolean) {
  return {
    minHeight: '34px',
    padding: '0 12px',
    borderRadius: '999px',
    border: active ? '1px solid rgba(255,122,89,0.4)' : '1px solid rgba(255,255,255,0.07)',
    background: active ? 'var(--accent-fill)' : 'rgba(255,255,255,0.02)',
    color: active ? 'var(--accent)' : 'var(--text-secondary)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    textDecoration: 'none',
    fontSize: '0.84rem',
    fontWeight: 600,
  };
}

const metaStyle = {
  color: 'var(--text-tertiary)',
  fontSize: '0.84rem',
};

function statusStyle(status: string) {
  return {
    color: status === 'open' ? 'var(--accent)' : 'var(--text-tertiary)',
    background: status === 'open' ? 'rgba(255,122,89,0.08)' : 'rgba(255,255,255,0.04)',
    borderRadius: '999px',
    padding: '4px 9px',
    fontSize: '0.78rem',
    textTransform: 'capitalize' as const,
    fontWeight: 600,
  };
}

const emptyStateStyle = {
  border: '1px dashed rgba(255,255,255,0.08)',
  borderRadius: '18px',
  padding: '20px 18px',
  color: 'var(--text-tertiary)',
};
