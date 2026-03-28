import { NextRequest, NextResponse } from 'next/server'
import { apiErrorResponse } from '@/lib/api-error'
import { resolveCanonicalApproval } from '@/lib/approvals/service'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const body = (await request.json()) as {
      decision?: unknown
    }

    if (body.decision !== 'allow-once' && body.decision !== 'deny') {
      return apiErrorResponse(
        new Error('Approval decision must be "allow-once" or "deny"'),
        'Invalid approval resolution payload',
        400,
      )
    }

    const result = resolveCanonicalApproval({
      approvalId: id,
      decision: body.decision,
    })

    return NextResponse.json(
      { resolution: result },
      {
        status: result.runtime.status === 'resolved' ? 200 : 409,
      },
    )
  } catch (error) {
    return apiErrorResponse(error, 'Failed to resolve approval', 422)
  }
}
