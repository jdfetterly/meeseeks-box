import { NextResponse } from 'next/server'
import { apiErrorResponse } from '@/lib/api-error'
import { resolveInboxItemById } from '@/lib/product-state/repositories'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const inboxItem = resolveInboxItemById(id)

    if (!inboxItem) {
      return apiErrorResponse(new Error('Inbox item not found'), 'Inbox item not found', 404)
    }

    return NextResponse.json({ inboxItem })
  } catch (error) {
    return apiErrorResponse(error, 'Failed to resolve inbox item')
  }
}
