import { sheets } from './google-auth'
import { logAuditSafe } from '@/lib/audit'

const SHEET_ID = process.env.GOOGLE_SPREADSHEET_ID!.replace(/^﻿/, '').trim()

export async function appendInvoiceRow(data: {
  dealId: string
  invoiceNumber: string
  customer: string
  invoiceDate: string
  dueDate: string
  paymentTerms: string
  amount: number
  paymentStatus: string
  hsCode: string
  destination: string
  eeiNumber: string
  salesTaxState: string
  taxRate: number
  driveLink?: string
}) {
  const client = sheets()

  const row = [
    data.dealId,
    data.invoiceNumber,
    data.customer,
    data.invoiceDate,
    data.dueDate,
    data.paymentTerms,
    data.amount,
    data.paymentStatus,
    data.hsCode,
    data.destination,
    data.eeiNumber,
    data.salesTaxState,
    data.taxRate,
    '',
    data.driveLink ?? '',
  ]

  await client.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: 'Invoice & Tax!A:O',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [row] },
  })

  await logAuditSafe({
    action: 'CREATE_INVOICE',
    source: 'sheets',
    dealId: data.dealId,
    newValue: data.invoiceNumber,
  })
}

export async function updateDealStatus(dealId: string, status: string) {
  const client = sheets()

  const res = await client.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Invoice & Tax!A:A',
  })

  const rows = res.data.values ?? []
  const rowIndex = rows.findIndex(r => r[0] === dealId)
  if (rowIndex < 0) return

  const rowNumber = rowIndex + 1

  await client.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `Invoice & Tax!H${rowNumber}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[status]] },
  })

  await logAuditSafe({
    action: 'UPDATE_INVOICE_STATUS',
    source: 'sheets',
    dealId,
    field: 'paymentStatus',
    newValue: status,
  })
}
