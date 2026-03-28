import { NextResponse } from 'next/server'
import { apiErrorResponse } from '@/lib/api-error'
import { listBoardLanes } from '@/lib/work-board/service'

export async function GET() {
  try {
    return NextResponse.json({ lanes: listBoardLanes() })
  } catch (error) {
    return apiErrorResponse(error, 'Failed to load work board')
  }
}
