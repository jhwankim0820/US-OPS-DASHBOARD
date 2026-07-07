import { NextRequest, NextResponse } from 'next/server'
import { updateDealStage, type DealStage } from '@/lib/sheets'

export const runtime = 'nodejs'

const STAGES: DealStage[] = ['quote', 'po', 'invoice', 'ship', 'tp']

// Mark a workflow stage on the Deals (Project Management) tab.
// Body: { dealId, stage, value? }  — value defaults to today's ISO date.
export async function POST(req: NextRequest) {
  let body: { dealId?: string; stage?: string; value?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { dealId, stage } = body
  if (!dealId || !stage) {
    return NextResponse.json({ error: 'dealId and stage are required' }, { status: 400 })
  }
  if (!STAGES.includes(stage as DealStage)) {
    return NextResponse.json({ error: `stage must be one of ${STAGES.join(', ')}` }, { status: 400 })
  }

  const value = (body.value ?? new Date().toISOString().split('T')[0]).trim()

  try {
    const ok = await updateDealStage(dealId, stage as DealStage, value)
    if (!ok) return NextResponse.json({ error: `Deal ${dealId} not found in sheet` }, { status: 404 })
    return NextResponse.json({ success: true, dealId, stage, value })
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ success: false, error: detail }, { status: 502 })
  }
}
