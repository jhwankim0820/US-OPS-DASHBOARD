import { NextRequest, NextResponse } from 'next/server'
import { DEAL_FOLDER_IDS, findSubfolder, uploadFileToDrive } from '@/lib/drive-helpers'

export const runtime = 'nodejs'

// Save a generated quote HTML into the deal's "1. Quote" Drive subfolder.
export async function POST(req: NextRequest) {
  let body: { dealId?: string; fileName?: string; htmlContent?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { dealId, fileName, htmlContent } = body
  if (!dealId || !fileName || !htmlContent) {
    return NextResponse.json({ error: 'dealId, fileName and htmlContent are required' }, { status: 400 })
  }

  const folderId = DEAL_FOLDER_IDS[dealId]
  if (!folderId) {
    return NextResponse.json({ error: `No Drive folder mapped for ${dealId}` }, { status: 404 })
  }

  try {
    const quoteFolderId = await findSubfolder(folderId, '1. Quote')
    if (!quoteFolderId) {
      return NextResponse.json({ error: `"1. Quote" subfolder not found for ${dealId}` }, { status: 404 })
    }

    const link = await uploadFileToDrive({
      folderId: quoteFolderId,
      fileName,
      mimeType: 'text/html',
      content: Buffer.from(htmlContent, 'utf-8'),
    })

    return NextResponse.json({ success: true, link })
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ success: false, error: detail }, { status: 502 })
  }
}
