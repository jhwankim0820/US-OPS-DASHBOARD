import { NextRequest, NextResponse } from 'next/server'
import { gmail } from '@/lib/google-auth'
import { parsePOWithClaude } from '@/lib/po-parser'
import { getOrCreateDealFolder, uploadFileToDrive } from '@/lib/drive-helpers'
import { appendInvoiceRow } from '@/lib/sheets-helpers'
import { generateInvoiceNumber, generateInvoiceHTML } from '@/lib/invoice-generator'

async function processPOEmails() {
  const gmailClient = gmail()
  const results: string[] = []

  const listRes = await gmailClient.users.messages.list({
    userId: 'me',
    q: 'label:PO -label:processed is:unread',
    maxResults: 10,
  })

  const messages = listRes.data.messages ?? []
  if (!messages.length) return { processed: 0, results: [] }

  for (const msg of messages) {
    try {
      const full = await gmailClient.users.messages.get({
        userId: 'me',
        id: msg.id!,
        format: 'full',
      })

      const payload = full.data.payload!
      const headers = payload.headers ?? []
      const subject = headers.find(h => h.name === 'Subject')?.value ?? 'No Subject'

      let emailBody = ''
      let pdfBase64: string | undefined

      const extractParts = (parts: typeof payload.parts) => {
        for (const part of parts ?? []) {
          if (part.mimeType === 'text/plain' && part.body?.data) {
            emailBody = Buffer.from(part.body.data, 'base64').toString('utf-8')
          }
          if (part.mimeType === 'application/pdf' && part.body?.attachmentId) {
            gmailClient.users.messages.attachments.get({
              userId: 'me',
              messageId: msg.id!,
              id: part.body.attachmentId,
            }).then(att => {
              pdfBase64 = att.data.data ?? undefined
            })
          }
          if (part.parts) extractParts(part.parts)
        }
      }
      extractParts(payload.parts)

      const po = await parsePOWithClaude(emailBody, pdfBase64)
      const dealId = `SHT-${String(Date.now()).slice(-3)}`
      const invoiceNumber = generateInvoiceNumber()

      const folderId = await getOrCreateDealFolder(dealId, po.customer)

      if (pdfBase64) {
        await uploadFileToDrive({
          folderId,
          fileName: `PO_${po.customer.replace(/\s+/g, '_')}_${po.poDate}.pdf`,
          mimeType: 'application/pdf',
          content: pdfBase64,
        })
      }

      const invoiceHTML = generateInvoiceHTML(po, invoiceNumber, dealId)
      const invoiceBuffer = Buffer.from(invoiceHTML, 'utf-8')

      const invoiceLink = await uploadFileToDrive({
        folderId,
        fileName: `${invoiceNumber}.html`,
        mimeType: 'text/html',
        content: invoiceBuffer,
      })

      const today = new Date().toISOString().split('T')[0]
      const dueDate = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]

      await appendInvoiceRow({
        dealId,
        invoiceNumber,
        customer: po.customer,
        invoiceDate: today,
        dueDate,
        paymentTerms: po.paymentTerms,
        amount: po.amount,
        paymentStatus: 'Unpaid',
        hsCode: '8473.30.1100',
        destination: po.destination,
        eeiNumber: '',
        salesTaxState: po.destination === 'US' ? 'CA' : 'N/A',
        taxRate: po.destination === 'US' ? 10.25 : 0,
        driveLink: invoiceLink,
      })

      await gmailClient.users.messages.modify({
        userId: 'me',
        id: msg.id!,
        requestBody: {
          addLabelIds: [],    // TODO: "processed" 라벨 ID 입력
          removeLabelIds: ['UNREAD'],
        },
      })

      if (process.env.SLACK_WEBHOOK_URL) {
        await fetch(process.env.SLACK_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `✅ PO 수신 완료\n*Deal:* ${dealId}\n*고객:* ${po.customer}\n*금액:* $${po.amount.toLocaleString()}\n*인보이스:* ${invoiceNumber}\n*Drive:* ${invoiceLink}`,
          }),
        })
      }

      results.push(`✅ ${dealId} - ${po.customer} ($${po.amount.toLocaleString()})`)
      void subject
    } catch (err) {
      results.push(`❌ ${msg.id}: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  return { processed: messages.length, results }
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await processPOEmails()
  return NextResponse.json(result)
}

export async function POST() {
  const result = await processPOEmails()
  return NextResponse.json(result)
}
