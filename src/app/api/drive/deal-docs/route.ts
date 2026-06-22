import { NextRequest, NextResponse } from 'next/server'
import { DEAL_FOLDER_IDS, getDealDocStatus } from '@/lib/drive-helpers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const dealId = req.nextUrl.searchParams.get('dealId')
  if (!dealId) {
    return NextResponse.json({ error: 'dealId is required' }, { status: 400 })
  }

  const folderId = DEAL_FOLDER_IDS[dealId]
  if (!folderId) {
    return NextResponse.json({ error: `No Drive folder mapped for ${dealId}` }, { status: 404 })
  }

  try {
    const status = await getDealDocStatus(folderId)
    return NextResponse.json({ dealId, ...status })
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: detail }, { status: 502 })
  }
}
