'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';

type ReviewDecision = 'accept' | 'request_changes';

export function ReviewDecisionActions({ reviewItemId }: { reviewItemId: string }) {
  const router = useRouter();
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [followUpHref, setFollowUpHref] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submitDecision(decision: ReviewDecision) {
    setError(null);
    setStatus(null);
    setFollowUpHref(null);

    startTransition(async () => {
      try {
        const response = await fetch(`/api/product-state/review-items/${reviewItemId}/decision`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            decision,
            feedback,
          }),
        });
        const result = (await response.json()) as {
          error?: string;
          followUpWorkItem?: { id: string };
        };

        if (!response.ok) {
          throw new Error(result.error ?? 'Failed to save review decision');
        }

        if (decision === 'accept') {
          setStatus('Accepted and cleared from Review Queue.');
        } else {
          setStatus('Follow-up work created from this review.');
          setFollowUpHref(
            result.followUpWorkItem?.id ? `/work/${result.followUpWorkItem.id}` : null,
          );
          setFeedback('');
        }

        router.refresh();
      } catch (decisionError) {
        setError(
          decisionError instanceof Error
            ? decisionError.message
            : 'Failed to save review decision',
        );
      }
    });
  }

  return (
    <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
      <label style={{ display: 'grid', gap: '6px' }}>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Optional follow-up guidance
        </span>
        <textarea
          value={feedback}
          onChange={(event) => setFeedback(event.target.value)}
          placeholder="What should change before this comes back for review?"
          rows={3}
          style={{
            width: '100%',
            resize: 'vertical',
            minHeight: 88,
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--separator)',
            background: 'var(--material-thin)',
            padding: '12px 14px',
            color: 'var(--text-primary)',
          }}
        />
      </label>
      <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', flexWrap: 'wrap' }}>
        <Button type="button" size="sm" disabled={isPending} onClick={() => submitDecision('accept')}>
          {isPending ? 'Saving…' : 'Accept'}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => submitDecision('request_changes')}
        >
          Request changes
        </Button>
        {followUpHref ? (
          <Link href={followUpHref} style={{ color: 'var(--accent)', fontSize: '0.9rem' }}>
            Open follow-up
          </Link>
        ) : null}
      </div>
      {status ? <span style={{ color: 'var(--system-green)', fontSize: '0.9rem' }}>{status}</span> : null}
      {error ? <span style={{ color: 'var(--system-red)', fontSize: '0.9rem' }}>{error}</span> : null}
    </div>
  );
}
