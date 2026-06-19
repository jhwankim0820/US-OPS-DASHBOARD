import { NextResponse } from 'next/server'
import { getShipments, SheetShipment } from '@/lib/sheets'
import { fedexTrack } from '@/lib/fedex'

export async function GET() {
  const shipments = await getShipments()
  if (!shipments.length) return NextResponse.json({ inbound: [], outbound: [] })

  const results = await Promise.allSettled(
    shipments.map(async (s) => {
      try {
        const data = await fedexTrack(s.trackingNumber)
        const result = data?.output?.completeTrackResults?.[0]?.trackResults?.[0]
        const latest = result?.latestStatusDetail
        const eta = result?.estimatedDeliveryTimeWindow?.window?.ends
          ?? result?.dateAndTimes?.find((d: { type: string }) => d.type === 'ESTIMATED_DELIVERY')?.dateTime
        return {
          ...s,
          status: latest?.statusByLocale ?? latest?.description ?? 'Unknown',
          statusCode: latest?.code ?? null,
          location: [
            latest?.scanLocation?.city,
            latest?.scanLocation?.stateOrProvinceCode,
            latest?.scanLocation?.countryCode,
          ].filter(Boolean).join(', '),
          eta: eta ?? null,
          progress: calcProgress(latest?.code),
        }
      } catch {
        return { ...s, status: 'Unknown', statusCode: null, location: '', eta: null, progress: 0 }
      }
    })
  )

  const all = results
    .map((r) => (r.status === 'fulfilled' ? r.value : null))
    .filter(Boolean) as (SheetShipment & { status: string; statusCode: string | null; location: string; eta: string | null; progress: number })[]

  return NextResponse.json({
    inbound: all.filter((s) => s.direction === 'inbound'),
    outbound: all.filter((s) => s.direction === 'outbound'),
  })
}

function calcProgress(code: string | null | undefined): number {
  const map: Record<string, number> = { OC: 10, PU: 20, DP: 40, AR: 60, OD: 85, DL: 100, CA: 0, DE: 0 }
  return (code && map[code] !== undefined) ? map[code] : 30
}
