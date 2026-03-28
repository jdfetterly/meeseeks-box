'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function ProjectSuggestionActions({
  projectId,
  suggestionId,
}: {
  projectId: string;
  suggestionId: string;
}) {
  const [statusText, setStatusText] = useState<string | null>(null);

  async function updateStatus(status: 'accepted' | 'rejected') {
    setStatusText(null);

    try {
      const response = await fetch(
        `/api/product-state/projects/${projectId}/suggestions/${suggestionId}`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ status }),
        },
      );

      if (!response.ok) {
        throw new Error('Failed to update suggestion');
      }

      setStatusText(status === 'accepted' ? 'Accepted.' : 'Rejected.');
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : 'Failed to update suggestion');
    }
  }

  return (
    <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', flexWrap: 'wrap' }}>
      <Button size="sm" onClick={() => updateStatus('accepted')}>
        Accept
      </Button>
      <Button size="sm" variant="ghost" onClick={() => updateStatus('rejected')}>
        Reject
      </Button>
      {statusText ? <span style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>{statusText}</span> : null}
    </div>
  );
}
