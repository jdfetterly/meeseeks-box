import { NextResponse } from 'next/server'
import { apiErrorResponse } from '@/lib/api-error'
import { getRuntimeApprovalPolicySnapshot } from '@/lib/openclaw/runtime-approvals'

export async function GET() {
  try {
    return NextResponse.json({ policy: getRuntimeApprovalPolicySnapshot() })
  } catch (error) {
    return apiErrorResponse(error, 'Failed to load runtime approval policy')
  }
}
