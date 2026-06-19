import { NextRequest, NextResponse } from 'next/server'
import { fedexShip } from '@/lib/fedex'

export async function POST(req: NextRequest) {
  try {
    const input = await req.json()
    const data = await fedexShip(input)
    const shipment = data?.output?.transactionShipments?.[0]
    const piece = shipment?.pieceResponses?.[0]
    const labelUrl = piece?.packageDocuments?.[0]?.url ?? null
    return NextResponse.json({
      trackingNumber: shipment?.masterTrackingNumber ?? piece?.trackingNumber ?? null,
      labelUrl,
      raw: data,
    })
  } catch (e) {
    console.error('[fedex/ship]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
