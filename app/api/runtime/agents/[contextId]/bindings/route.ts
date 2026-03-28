import { NextResponse } from 'next/server'
import { apiErrorResponse } from '@/lib/api-error'
import {
  addRuntimeBinding,
  listRuntimeBindings,
  removeRuntimeBinding,
} from '@/lib/openclaw/runtime-agent-management'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ contextId: string }> },
) {
  try {
    const { contextId } = await params
    return NextResponse.json({ bindings: await listRuntimeBindings(contextId) })
  } catch (error) {
    return apiErrorResponse(error, 'Failed to load runtime bindings')
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ contextId: string }> },
) {
  try {
    const { contextId } = await params
    const body = (await request.json()) as { spec?: string }

    if (!body.spec?.trim()) {
      return apiErrorResponse(new Error('spec is required'), 'Invalid binding request', 400)
    }

    return NextResponse.json(await addRuntimeBinding(contextId, body.spec.trim()))
  } catch (error) {
    return apiErrorResponse(error, 'Failed to add runtime binding')
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ contextId: string }> },
) {
  try {
    const { contextId } = await params
    const url = new URL(request.url)
    const spec = url.searchParams.get('spec')

    if (!spec?.trim()) {
      return apiErrorResponse(new Error('spec is required'), 'Invalid binding request', 400)
    }

    return NextResponse.json(await removeRuntimeBinding(contextId, spec.trim()))
  } catch (error) {
    return apiErrorResponse(error, 'Failed to remove runtime binding')
  }
}
