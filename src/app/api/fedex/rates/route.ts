import { NextRequest, NextResponse } from 'next/server'
import { fedexRates } from '@/lib/fedex'

export async function POST(req: NextRequest) {
  try {
    const input = await req.json()
    const data = await fedexRates(input)
    const detail = data?.output?.rateReplyDetails?.[0]?.ratedShipmentDetails?.[0]
    return NextResponse.json({
      amount: detail?.totalNetCharge ?? null,
      currency: detail?.currency ?? 'USD',
      raw: data,
    })
  } catch (e) {
    console.error('[fedex/rates]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
