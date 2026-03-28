import { NextRequest, NextResponse } from 'next/server';
import { apiErrorResponse } from '@/lib/api-error';
import { confirmSpecDecomposition, proposeSpecDecomposition } from '@/lib/specs/service';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as {
      confirm?: unknown;
      cards?: unknown;
    };

    if (body.confirm === true) {
      const cards = Array.isArray(body.cards)
        ? body.cards
            .filter((card): card is Record<string, unknown> => typeof card === 'object' && card !== null)
            .map((card) => ({
              title: typeof card.title === 'string' ? card.title : 'Unnamed card',
              intentSummary: typeof card.intentSummary === 'string' ? card.intentSummary : undefined,
              decompositionReason:
                typeof card.decompositionReason === 'string'
                  ? card.decompositionReason
                  : 'Split from the approved parent spec.',
              acceptanceCriteria: Array.isArray(card.acceptanceCriteria)
                ? card.acceptanceCriteria.filter((value): value is string => typeof value === 'string')
                : [],
              expectedOutput: typeof card.expectedOutput === 'string' ? card.expectedOutput : null,
              delegatedAgentId:
                typeof card.delegatedAgentId === 'string' ? card.delegatedAgentId : null,
              linkedRepos: Array.isArray(card.linkedRepos)
                ? card.linkedRepos.filter((value): value is string => typeof value === 'string')
                : undefined,
            }))
        : [];

      const created = confirmSpecDecomposition(id, cards);
      return NextResponse.json({ created }, { status: 201 });
    }

    return NextResponse.json(proposeSpecDecomposition(id));
  } catch (error) {
    return apiErrorResponse(error, 'Failed to decompose spec');
  }
}
