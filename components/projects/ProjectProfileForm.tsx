'use client';

import { useState, type CSSProperties } from 'react';
import { Button } from '@/components/ui/button';
import type { ProjectRecord } from '@/lib/product-state/entities';

export function ProjectProfileForm({ project }: { project: ProjectRecord }) {
  const [title, setTitle] = useState(project.title);
  const [summary, setSummary] = useState(project.summary ?? '');
  const [activeGoal, setActiveGoal] = useState(project.activeGoal ?? '');
  const [currentFocus, setCurrentFocus] = useState(project.currentFocus ?? '');
  const [linkedRepos, setLinkedRepos] = useState(project.linkedRepos.join(', '));
  const [statusText, setStatusText] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        setIsSaving(true);
        setStatusText(null);

        try {
          const response = await fetch(`/api/product-state/projects/${project.id}`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              title,
              summary,
              activeGoal,
              currentFocus,
              linkedRepos: linkedRepos
                .split(',')
                .map((value) => value.trim())
                .filter(Boolean),
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to save project profile');
          }

          setStatusText('Project profile saved.');
        } catch (error) {
          setStatusText(error instanceof Error ? error.message : 'Failed to save project profile');
        } finally {
          setIsSaving(false);
        }
      }}
      style={{ display: 'grid', gap: 'var(--space-3)' }}
    >
      <input value={title} onChange={(event) => setTitle(event.target.value)} style={inputStyle} />
      <textarea
        value={summary}
        onChange={(event) => setSummary(event.target.value)}
        placeholder="Project summary"
        style={{ ...inputStyle, minHeight: 96, padding: 'var(--space-3)', resize: 'vertical' }}
      />
      <input
        value={activeGoal}
        onChange={(event) => setActiveGoal(event.target.value)}
        placeholder="Active goal"
        style={inputStyle}
      />
      <input
        value={currentFocus}
        onChange={(event) => setCurrentFocus(event.target.value)}
        placeholder="Current focus"
        style={inputStyle}
      />
      <input
        value={linkedRepos}
        onChange={(event) => setLinkedRepos(event.target.value)}
        placeholder="Linked repos"
        style={inputStyle}
      />
      <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', flexWrap: 'wrap' }}>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save profile'}
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
