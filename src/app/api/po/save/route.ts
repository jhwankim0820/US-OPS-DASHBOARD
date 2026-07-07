import { NextRequest, NextResponse } from 'next/server'
import { DEAL_FOLDER_IDS, findSubfolder, uploadFileToDrive } from '@/lib/drive-helpers'

export const runtime = 'nodejs'

// Store a received PO file (any type) into the deal's "2. PO" Drive subfolder.
// Body: { dealId, fileName, mimeType, contentBase64 } — contentBase64 is the raw file bytes, base64-encoded.
export async function POST(req: NextRequest) {
  let body: { dealId?: string; fileName?: string; mimeType?: string; contentBase64?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { dealId, fileName, mimeType, contentBase64 } = body
  if (!dealId || !fileName || !contentBase64) {
    return NextResponse.json({ error: 'dealId, fileName and contentBase64 are required' }, { status: 400 })
  }

  const folderId = DEAL_FOLDER_IDS[dealId]
  if (!folderId) {
    return NextResponse.json({ error: `No Drive folder mapped for ${dealId}` }, { status: 404 })
  }

  try {
    const poFolderId = await findSubfolder(folderId, '2. PO')
    if (!poFolderId) {
      return NextResponse.json({ error: `"2. PO" subfolder not found for ${dealId}` }, { status: 404 })
    }

    const link = await uploadFileToDrive({
      folderId: poFolderId,
      fileName,
      mimeType: mimeType || 'application/octet-stream',
      content: Buffer.from(contentBase64, 'base64'),
    })

    return NextResponse.json({ success: true, link })
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ success: false, error: detail }, { status: 502 })
  }
}
