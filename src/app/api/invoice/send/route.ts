import { NextRequest, NextResponse } from 'next/server'
import { gmail } from '@/lib/google-auth'

export const runtime = 'nodejs'

function encodeHeader(value: string): string {
  // RFC 2047-encode headers that contain non-ASCII characters.
  const isAscii = [...value].every((ch) => ch.charCodeAt(0) <= 127)
  if (isAscii) return value
  return `=?UTF-8?B?${Buffer.from(value, 'utf-8').toString('base64')}?=`
}

function buildRawMessage(opts: {
  to: string
  cc?: string
  subject: string
  body: string
  fileName: string
  htmlContent: string
}): string {
  const boundary = 'furiosa_invoice_boundary_42'
  const attachment = Buffer.from(opts.htmlContent, 'utf-8').toString('base64')

  const headers = [
    `To: ${opts.to}`,
    opts.cc ? `Cc: ${opts.cc}` : null,
    `Subject: ${encodeHeader(opts.subject)}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
  ]
    .filter(Boolean)
    .join('\r\n')

  const mime =
    `${headers}\r\n\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: text/plain; charset="UTF-8"\r\n` +
    `Content-Transfer-Encoding: 7bit\r\n\r\n` +
    `${opts.body}\r\n\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: text/html; charset="UTF-8"; name="${opts.fileName}"\r\n` +
    `Content-Disposition: attachment; filename="${opts.fileName}"\r\n` +
    `Content-Transfer-Encoding: base64\r\n\r\n` +
    `${attachment}\r\n` +
    `--${boundary}--`

  return Buffer.from(mime, 'utf-8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

export async function POST(req: NextRequest) {
  let body: {
    to?: string
    cc?: string
    subject?: string
    emailBody?: string
    fileName?: string
    htmlContent?: string
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { to, cc, subject, emailBody, fileName, htmlContent } = body
  if (!to || !htmlContent) {
    return NextResponse.json({ error: 'to and htmlContent are required' }, { status: 400 })
  }

  if (!process.env.GMAIL_REFRESH_TOKEN) {
    return NextResponse.json({ error: 'Gmail is not configured (missing refresh token)' }, { status: 500 })
  }

  try {
    const raw = buildRawMessage({
      to,
      cc: cc?.trim() || undefined,
      subject: subject ?? '',
      body: emailBody ?? '',
      fileName: fileName ?? 'invoice.html',
      htmlContent,
    })

    const res = await gmail().users.messages.send({
      userId: 'me',
      requestBody: { raw },
    })

    return NextResponse.json({ success: true, id: res.data.id })
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ success: false, error: detail }, { status: 502 })
  }
}
