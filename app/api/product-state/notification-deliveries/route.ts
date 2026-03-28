import { NextResponse } from 'next/server'
import { apiErrorResponse } from '@/lib/api-error'
import { listNotificationDeliveries } from '@/lib/product-state/repositories'

export async function GET() {
  try {
    return NextResponse.json({ notificationDeliveries: listNotificationDeliveries() })
  } catch (error) {
    return apiErrorResponse(error, 'Failed to load notification deliveries')
  }
}
