import Link from 'next/link';
import type { ProjectDetailRecord } from '@/lib/projects/service';
import type { ShellVariant } from '@/lib/experiments/shell-variants';
import { describeShellVariant } from '@/lib/experiments/shell-variants';

export function ProjectExecutionHeader({
  detail,
  variant,
}: {
  detail: ProjectDetailRecord;
  variant: ShellVariant;
}) {
  const variantMeta = describeShellVariant(variant);

  return (
    <header style={headerStyle}>
      <div style={{ display: 'grid', gap: '10px' }}>
        <div style={{ display: 'grid', gap: '6px' }}>
          <span style={variantTagStyle}>{variantMeta.title}</span>
          <h1 style={titleStyle}>{detail.project.title}</h1>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <StatPill label="Workspace" value={detail.summary.workspaceStatus.replaceAll('_', ' ')} />
          <StatPill label="Cards" value={String(detail.summary.workCount)} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        <Link href={`/projects/${detail.project.id}`} style={linkChipStyle}>
          Control project
        </Link>
      </div>
    </header>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <span style={pillStyle}>
      <strong style={{ color: 'var(--text-primary)' }}>{label}</strong>
      <span style={{ color: 'var(--text-secondary)' }}>{value}</span>
    </span>
  );
}

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '16px',
  flexWrap: 'wrap' as const,
  alignItems: 'flex-start',
};

const titleStyle = {
  margin: 0,
  fontSize: 'clamp(2rem, 4vw, 3rem)',
  lineHeight: 0.96,
  letterSpacing: '-0.05em',
};

const variantTagStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: 28,
  padding: '0 10px',
  borderRadius: '999px',
  border: '1px solid color-mix(in srgb, var(--accent) 28%, transparent)',
  background: 'color-mix(in srgb, var(--accent) 16%, transparent)',
  color: 'var(--text-primary)',
  fontSize: '0.82rem',
  fontWeight: 700,
};

const pillStyle = {
  display: 'inline-flex',
  gap: '8px',
  alignItems: 'center',
  minHeight: 30,
  padding: '0 12px',
  borderRadius: '999px',
  border: '1px solid var(--separator)',
  background: 'var(--material-thin)',
  fontSize: '0.86rem',
};

const linkChipStyle = {
  minHeight: 36,
  padding: '0 12px',
  borderRadius: '999px',
  border: '1px solid var(--separator)',
  display: 'inline-flex',
  alignItems: 'center',
  textDecoration: 'none',
  color: 'var(--text-primary)',
  background: 'var(--material-thin)',
};
