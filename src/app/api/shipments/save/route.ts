import { NextRequest, NextResponse } from 'next/server'
import { addShipment, SheetShipment } from '@/lib/sheets'

export async function POST(req: NextRequest) {
  try {
    const body: SheetShipment = await req.json()
    await addShipment(body)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[shipments/save]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
