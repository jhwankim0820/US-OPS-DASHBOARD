import { NextRequest, NextResponse } from 'next/server'
import { fedexTrack } from '@/lib/fedex'

export async function POST(req: NextRequest) {
  const { trackingNumber } = await req.json()
  if (!trackingNumber) return NextResponse.json({ error: 'trackingNumber required' }, { status: 400 })
  try {
    const data = await fedexTrack(trackingNumber)
    const result = data?.output?.completeTrackResults?.[0]?.trackResults?.[0]
    if (!result) return NextResponse.json({ error: 'No tracking data found' }, { status: 404 })

    const latest = result.latestStatusDetail
    const eta = result.estimatedDeliveryTimeWindow?.window?.ends
      ?? result.dateAndTimes?.find((d: { type: string }) => d.type === 'ESTIMATED_DELIVERY')?.dateTime
    const scans = (result.scanEvents ?? []).slice(0, 8).map((e: {
      date: string
      eventDescription: string
      scanLocation?: { city?: string; stateOrProvinceCode?: string; countryCode?: string }
    }) => ({
      date: e.date,
      description: e.eventDescription,
      location: [e.scanLocation?.city, e.scanLocation?.stateOrProvinceCode, e.scanLocation?.countryCode]
        .filter(Boolean).join(', '),
    }))

    return NextResponse.json({
      trackingNumber,
      status: latest?.statusByLocale ?? latest?.description ?? 'Unknown',
      statusCode: latest?.code,
      location: [
        latest?.scanLocation?.city,
        latest?.scanLocation?.stateOrProvinceCode,
        latest?.scanLocation?.countryCode,
      ].filter(Boolean).join(', '),
      eta: eta ?? null,
      scans,
    })
  } catch (e) {
    console.error('[fedex/track]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
