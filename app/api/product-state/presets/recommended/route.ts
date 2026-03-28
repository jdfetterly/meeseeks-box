import { NextRequest, NextResponse } from 'next/server'
import { apiErrorResponse } from '@/lib/api-error'
import {
  installAllRecommendedJobs,
  installRecommendedJob,
  listRecommendedJobInstallations,
} from '@/lib/recommended-jobs'

export async function GET() {
  try {
    return NextResponse.json({ jobs: listRecommendedJobInstallations() })
  } catch (error) {
    return apiErrorResponse(error, 'Failed to load recommended jobs')
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { slug?: unknown; installAll?: unknown }

    if (body.installAll === true) {
      return NextResponse.json({
        results: installAllRecommendedJobs(),
      }, { status: 201 })
    }

    if (typeof body.slug !== 'string' || !body.slug.trim()) {
      return apiErrorResponse(
        new Error('Recommended job slug is required'),
        'Invalid recommended job payload',
        400,
      )
    }

    const result = installRecommendedJob(body.slug.trim())

    return NextResponse.json(result, { status: result.created ? 201 : 200 })
  } catch (error) {
    return apiErrorResponse(error, 'Failed to install recommended job')
  }
}
