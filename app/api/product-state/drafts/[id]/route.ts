import { NextResponse } from 'next/server'
import { apiErrorResponse } from '@/lib/api-error'
import { deleteLaunchDraft } from '@/lib/product-state/repositories'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    deleteLaunchDraft(id)
    return NextResponse.json({ deleted: true })
  } catch (error) {
    return apiErrorResponse(error, 'Failed to delete draft', 422)
  }
}
