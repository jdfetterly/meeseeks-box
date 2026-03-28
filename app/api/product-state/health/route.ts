import { NextResponse } from 'next/server';
import { getProductStateHealth } from '@/lib/product-state/db';
import { apiErrorResponse } from '@/lib/api-error';

export async function GET() {
  try {
    return NextResponse.json(getProductStateHealth());
  } catch (error) {
    return apiErrorResponse(error, 'Failed to load product-state health');
  }
}
