import { NextRequest, NextResponse } from 'next/server'
import { getOrCreateDealFolder, uploadFileToDrive } from '@/lib/drive-helpers'
import { appendInvoiceRow, updateDealStatus } from '@/lib/sheets-helpers'
import { generateInvoiceNumber, generateInvoiceHTML } from '@/lib/invoice-generator'
import { ParsedPO } from '@/lib/po-parser'

export async function POST(req: NextRequest) {
  const body = await req.json()

  const {
    dealId,
    customer,
    amount,
    paymentTerms = 'Net 30',
    destination = 'US',
    hsCode = '8473.30.1100',
    items = [],
    billingAddress = '',
    shippingAddress = '',
    poNumber = '',
    poDate = '',
    notes = '',
  } = body

  if (!dealId || !customer || !amount) {
    return NextResponse.json({ error: 'dealId, customer, amount 필수' }, { status: 400 })
  }

  const invoiceNumber = generateInvoiceNumber()
  const today = new Date().toISOString().split('T')[0]
  const dueDate = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]

  const poData: ParsedPO = {
    customer,
    poNumber,
    poDate: poDate || today,
    amount,
    currency: 'USD',
    items: items.length ? items : [{ description: 'AI Hardware', qty: 1, unitPrice: amount, total: amount }],
    billingAddress,
    shippingAddress,
    paymentTerms,
    destination,
    notes,
  }

  const folderId = await getOrCreateDealFolder(dealId, customer)

  const invoiceHTML = generateInvoiceHTML(poData, invoiceNumber, dealId)
  const invoiceLink = await uploadFileToDrive({
    folderId,
    fileName: `${invoiceNumber}.html`,
    mimeType: 'text/html',
    content: Buffer.from(invoiceHTML, 'utf-8'),
  })

  await appendInvoiceRow({
    dealId,
    invoiceNumber,
    customer,
    invoiceDate: today,
    dueDate,
    paymentTerms,
    amount,
    paymentStatus: 'Unpaid',
    hsCode,
    destination,
    eeiNumber: '',
    salesTaxState: destination === 'US' ? 'CA' : 'N/A',
    taxRate: destination === 'US' ? 10.25 : 0,
    driveLink: invoiceLink,
  })

  return NextResponse.json({
    success: true,
    invoiceNumber,
    invoiceLink,
    folderId,
    message: `${dealId} 인보이스 생성 완료`,
  })
}

export async function PATCH(req: NextRequest) {
  const { dealId, status } = await req.json()
  if (!dealId || !status) {
    return NextResponse.json({ error: 'dealId, status 필수' }, { status: 400 })
  }
  await updateDealStatus(dealId, status)
  return NextResponse.json({ success: true })
}
