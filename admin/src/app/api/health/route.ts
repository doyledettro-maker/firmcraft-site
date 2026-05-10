import { NextResponse } from 'next/server'
import { checkAllServices, overallStatus } from '@/lib/health-checks'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const checks = await checkAllServices()
  const overall = overallStatus(checks)
  const httpStatus = overall === 'up' ? 200 : overall === 'degraded' ? 200 : 503

  return NextResponse.json(
    {
      overall,
      checkedAt: new Date().toISOString(),
      services: checks,
    },
    {
      status: httpStatus,
      headers: {
        'cache-control': 'no-store, max-age=0',
      },
    },
  )
}
