'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function StartConversationBranchButton({
  conversationId,
}: {
  conversationId: string;
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div style={{ display: 'grid', gap: '6px' }}>
      <Button
        variant="outline"
        disabled={isPending}
        onClick={async () => {
          try {
            setIsPending(true);
            setError(null);
            const response = await fetch(`/api/product-state/conversations/${conversationId}/branch`, {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({}),
            });
            const payload = (await response.json()) as {
              conversation?: { id?: string };
              error?: string;
            };

            if (!response.ok || typeof payload.conversation?.id !== 'string') {
              throw new Error(payload.error ?? 'Failed to start alternative');
            }

            router.push(`/chat/${payload.conversation.id}`);
            router.refresh();
          } catch (branchError) {
            setError(branchError instanceof Error ? branchError.message : 'Failed to start alternative');
          } finally {
            setIsPending(false);
          }
        }}
      >
        {isPending ? 'Creating alternative…' : 'Start alternative from here'}
      </Button>
      {error ? <span style={{ color: 'var(--system-red)', fontSize: '0.85rem' }}>{error}</span> : null}
    </div>
  );
}
