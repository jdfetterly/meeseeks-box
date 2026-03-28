'use client';

import { useState, type CSSProperties } from 'react';
import { Button } from '@/components/ui/button';
import type { ProjectPlaybookRecord } from '@/lib/product-state/entities';

function stringifyList(values: string[]) {
  return values.join(', ');
}

function parseList(value: string) {
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function ProjectPlaybookForm({
  projectId,
  playbook,
}: {
  projectId: string;
  playbook: ProjectPlaybookRecord | null;
}) {
  const [goals, setGoals] = useState(stringifyList(playbook?.goals ?? []));
  const [preferredAgents, setPreferredAgents] = useState(
    stringifyList(playbook?.preferredAgents ?? []),
  );
  const [workingStyle, setWorkingStyle] = useState(playbook?.workingStyle ?? '');
  const [reviewPreferences, setReviewPreferences] = useState(playbook?.reviewPreferences ?? '');
  const [schedulePatterns, setSchedulePatterns] = useState(playbook?.schedulePatterns ?? '');
  const [repoContext, setRepoContext] = useState(playbook?.repoContext ?? '');
  const [recentDecisions, setRecentDecisions] = useState(
    stringifyList(playbook?.recentDecisions ?? []),
  );
  const [statusText, setStatusText] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        setIsSaving(true);
        setStatusText(null);

        try {
          const response = await fetch(`/api/product-state/projects/${projectId}/playbook`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              goals: parseList(goals),
              preferredAgents: parseList(preferredAgents),
              workingStyle,
              reviewPreferences,
              schedulePatterns,
              repoContext,
              recentDecisions: parseList(recentDecisions),
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to save project playbook');
          }

          setStatusText('Project playbook saved.');
        } catch (error) {
          setStatusText(error instanceof Error ? error.message : 'Failed to save project playbook');
        } finally {
          setIsSaving(false);
        }
      }}
      style={{ display: 'grid', gap: 'var(--space-3)' }}
    >
      <input value={goals} onChange={(event) => setGoals(event.target.value)} placeholder="Goals" style={inputStyle} />
      <input
        value={preferredAgents}
        onChange={(event) => setPreferredAgents(event.target.value)}
        placeholder="Preferred agents"
        style={inputStyle}
      />
      <textarea
        value={workingStyle}
        onChange={(event) => setWorkingStyle(event.target.value)}
        placeholder="Working style"
        style={{ ...inputStyle, minHeight: 88, padding: 'var(--space-3)', resize: 'vertical' }}
      />
      <textarea
        value={reviewPreferences}
        onChange={(event) => setReviewPreferences(event.target.value)}
        placeholder="Review preferences"
        style={{ ...inputStyle, minHeight: 88, padding: 'var(--space-3)', resize: 'vertical' }}
      />
      <textarea
        value={schedulePatterns}
        onChange={(event) => setSchedulePatterns(event.target.value)}
        placeholder="Schedule patterns"
        style={{ ...inputStyle, minHeight: 88, padding: 'var(--space-3)', resize: 'vertical' }}
      />
      <textarea
        value={repoContext}
        onChange={(event) => setRepoContext(event.target.value)}
        placeholder="Repo context"
        style={{ ...inputStyle, minHeight: 88, padding: 'var(--space-3)', resize: 'vertical' }}
      />
      <input
        value={recentDecisions}
        onChange={(event) => setRecentDecisions(event.target.value)}
        placeholder="Recent decisions"
        style={inputStyle}
      />
      <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', flexWrap: 'wrap' }}>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save playbook'}
        </Button>
        {statusText ? <span style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>{statusText}</span> : null}
      </div>
    </form>
  );
}

const inputStyle: CSSProperties = {
  width: '100%',
  minHeight: 44,
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--separator)',
  background: 'rgba(0,0,0,0.12)',
  color: 'var(--text-primary)',
  padding: '0 var(--space-3)',
};
