'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function ResolveReviewItemButton({ reviewItemId }: { reviewItemId: string }) {
  const [statusText, setStatusText] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', flexWrap: 'wrap' }}>
      <Button
        size="sm"
        disabled={isSubmitting}
        onClick={async () => {
          setIsSubmitting(true);
          setStatusText(null);

          try {
            const response = await fetch(`/api/product-state/review-items/${reviewItemId}/resolve`, {
              method: 'POST',
            });

            if (!response.ok) {
              throw new Error('Failed to mark review complete');
            }

            setStatusText('Marked reviewed.');
          } catch (error) {
            setStatusText(error instanceof Error ? error.message : 'Failed to mark reviewed');
          } finally {
            setIsSubmitting(false);
          }
        }}
      >
        {isSubmitting ? 'Updating...' : 'Mark reviewed'}
      </Button>
      {statusText ? <span style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>{statusText}</span> : null}
    </div>
  );
}
