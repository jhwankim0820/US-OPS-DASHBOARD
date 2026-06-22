// Shared, client-safe helpers for the Commercial Invoice generator.
// Field structure mirrors reference/Invoice Template.xlsx (sheet "Commercial Invoice").

export interface InvoiceDeal {
  id: string
  customer: string
  status: string
  revenue: number | null
  cards: number
  servers: number
  owner: string
  region: string
  formFactor: string
  category: string
  npuModel: string
  /** ISO yyyy-mm-dd, best-known ship/delivery date */
  shipDate: string
}

export interface LineItem {
  item: string
  qty: number
  desc: string
  unitPrice: number
}

export interface InvoiceForm {
  invoiceNo: string
  invoiceDate: string
  shipDate: string
  currency: string
  incoterms: string
  poNo: string
  shipperCompany: string
  shipperContact: string
  shipperEmail: string
  shipperAddr: string
  sellerCompany: string
  sellerContact: string
  sellerPhone: string
  sellerAddr: string
  shipToCompany: string
  shipToContact: string
  shipToContactInfo: string
  shipToAddr: string
  billToCompany: string
  billToContact: string
  billToContactInfo: string
  billToAddr: string
  origin: string
  signatoryTitle: string
  exportNotice: string
}

// Fixed parties — straight from the official template.
export const SHIPPER = {
  company: 'Furiosa AI Inc. C/O DIVERSIFIED INTERNATIONAL LOGISTICS CO. LTD.',
  contact: 'Ying Chen',
  email: 'Ying_Y_Chen@dimerco.com / +886 3 3995200 Ext.103',
  addr: '3F., NO. 9/5F., NO. 7, HANGXIANG RD., DAYUAN DIST., TAOYUAN CITY, 33747, Taiwan(R.O.C.)',
}

export const SELLER = {
  company: 'FuriosaAI, Inc.',
  contact: 'Leo Seo',
  phone: '+82-10-9557-9037 / leo.seo@furiosa.ai',
  addr: '(06036) 14F, Dosan-daero 145, Gangnam-gu, Seoul, Republic of Korea',
}

export const EXPORT_NOTICE =
  'These items are controlled by the U.S. Government and authorized for export only to the country of ultimate destination for use by the ultimate consignee or end-user(s) herein identified. They may not be resold, transferred, or otherwise disposed of, to any other country or to any person other than the authorized ultimate consignee or end-user(s), either in their original form or after being incorporated into other items, without first obtaining approval from the U.S. government or as otherwise authorized by U.S. law and regulations.'

const CARD_DESC =
  'FuriosaAI RNGD TCP NPU Card, PCIeGen5 x16, 48GB HBM3, 180W TDP, Full-height, 3/4-length dual-slot'

function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

export function generateInvoiceNo(date = todayISO()): string {
  // e.g. 2026-06-22 -> 2026062201  (YYYY + MMDD + 01)
  return date.replace(/-/g, '') + '01'
}

export function buildInitialLineItems(deal: InvoiceDeal): LineItem[] {
  const items: LineItem[] = []
  if (deal.cards > 0) {
    items.push({
      item: 'RNGD PCIe Accelerator Card (FuriosaAI PN: RNGA0UNO-04)',
      qty: deal.cards,
      desc: CARD_DESC,
      unitPrice: deal.revenue && deal.cards ? Math.round(deal.revenue / deal.cards) : 4000,
    })
  }
  if (deal.servers > 0) {
    items.push({
      item: 'SMC Appliance TNRT2',
      qty: deal.servers,
      desc: 'SuperMicro Rack Server with RNGD NPU, configured as per order',
      unitPrice: 0,
    })
  }
  if (items.length === 0) {
    items.push({ item: '', qty: 1, desc: '', unitPrice: 0 })
  }
  return items
}

export function buildInitialForm(deal: InvoiceDeal): InvoiceForm {
  const today = todayISO()
  const invoiceNo = generateInvoiceNo(today)
  return {
    invoiceNo,
    invoiceDate: today,
    shipDate: deal.shipDate || today,
    currency: 'USD',
    incoterms: 'DAP',
    poNo: '',
    shipperCompany: SHIPPER.company,
    shipperContact: SHIPPER.contact,
    shipperEmail: SHIPPER.email,
    shipperAddr: SHIPPER.addr,
    sellerCompany: SELLER.company,
    sellerContact: SELLER.contact,
    sellerPhone: SELLER.phone,
    sellerAddr: SELLER.addr,
    shipToCompany: deal.customer,
    shipToContact: '',
    shipToContactInfo: '',
    shipToAddr: '',
    billToCompany: deal.customer,
    billToContact: '',
    billToContactInfo: '',
    billToAddr: '',
    origin: 'Taiwan',
    signatoryTitle: 'Sr. Manager, BD & Sales',
    exportNotice: EXPORT_NOTICE,
  }
}

export function defaultEmail(deal: InvoiceDeal, form: InvoiceForm) {
  const amount = lineItemsTotal(buildInitialLineItems(deal))
  return {
    subject: `Commercial Invoice - ${deal.customer} - ${form.invoiceNo}`,
    body: `Dear ${deal.customer} Team,\n\nPlease find attached the commercial invoice for your recent order.\n\nInvoice #: ${form.invoiceNo}\nDeal ID: ${deal.id}\nAmount: ${amount ? '$' + amount.toLocaleString('en-US') : 'TBD'}\n\nIf you have any questions, please don't hesitate to contact us.\n\nBest regards,\nFuriosaAI Sales Team`,
  }
}

export function lineItemsTotal(items: LineItem[]): number {
  return items.reduce((sum, li) => sum + li.qty * li.unitPrice, 0)
}

export function escHtml(s: string): string {
  return (s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Self-contained printable HTML document for Drive / email attachment. */
export function buildInvoiceHTML(form: InvoiceForm, items: LineItem[]): string {
  const total = lineItemsTotal(items)
  const totalQty = items.reduce((s, li) => s + li.qty, 0)
  const rows = items
    .map(
      (li, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><strong>${escHtml(li.item)}</strong><br><small style="color:#888">${escHtml(li.desc)}</small></td>
      <td align="right">${li.qty}</td>
      <td align="right">${form.currency} ${li.unitPrice.toLocaleString('en-US')}</td>
      <td align="right"><strong>${form.currency} ${(li.qty * li.unitPrice).toLocaleString('en-US')}</strong></td>
    </tr>`,
    )
    .join('')

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<title>Commercial Invoice ${escHtml(form.invoiceNo)}</title>
<style>
body { font-family: Arial, sans-serif; font-size: 11px; color: #1a1a1a; margin: 0; padding: 32px; }
h1 { font-size: 24px; margin-bottom: 20px; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
.section .label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; color: #aaa; font-weight: bold; margin-bottom: 4px; }
.section .value { font-weight: bold; margin-bottom: 2px; }
.section .addr { color: #666; line-height: 1.6; }
.meta { display: flex; flex-wrap: wrap; gap: 24px; background: #f8f8f8; padding: 12px; border-radius: 4px; margin-bottom: 20px; }
.meta-item .label { font-size: 9px; text-transform: uppercase; color: #aaa; font-weight: bold; }
.meta-item .value { font-weight: bold; font-size: 13px; }
table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
th { text-align: left; padding: 8px; border-bottom: 2px solid #1a1a1a; font-size: 9px; text-transform: uppercase; color: #888; }
td { padding: 8px; border-bottom: 1px solid #f0f0f0; vertical-align: top; }
.total-row td { font-weight: bold; font-size: 14px; border-top: 2px solid #1a1a1a; padding-top: 10px; }
.footer { margin-top: 24px; border-top: 1px solid #e5e5e0; padding-top: 12px; font-size: 9px; color: #aaa; line-height: 1.6; }
.cert { font-size: 10px; color: #666; margin: 16px 0; }
</style></head><body>
<h1>Commercial Invoice</h1>
<div class="meta">
  <div class="meta-item"><div class="label">Invoice #</div><div class="value">${escHtml(form.invoiceNo)}</div></div>
  <div class="meta-item"><div class="label">Date</div><div class="value">${escHtml(form.invoiceDate)}</div></div>
  <div class="meta-item"><div class="label">Ship Date</div><div class="value">${escHtml(form.shipDate)}</div></div>
  <div class="meta-item"><div class="label">Currency / Incoterms</div><div class="value">${escHtml(form.currency)} · ${escHtml(form.incoterms)}</div></div>
  ${form.poNo ? `<div class="meta-item"><div class="label">End Customer PO #</div><div class="value">${escHtml(form.poNo)}</div></div>` : ''}
</div>
<div class="grid">
  <div class="section"><div class="label">Shipper</div><div class="value">${escHtml(form.shipperCompany)}</div><div class="addr">${escHtml(form.shipperContact)} / ${escHtml(form.shipperEmail)}<br>${escHtml(form.shipperAddr)}</div></div>
  <div class="section"><div class="label">Seller</div><div class="value">${escHtml(form.sellerCompany)}</div><div class="addr">${escHtml(form.sellerContact)} / ${escHtml(form.sellerPhone)}<br>${escHtml(form.sellerAddr)}</div></div>
  <div class="section"><div class="label">Ship To</div><div class="value">${escHtml(form.shipToCompany)}</div><div class="addr">${escHtml(form.shipToContact)}${form.shipToContactInfo ? ' / ' + escHtml(form.shipToContactInfo) : ''}<br>${escHtml(form.shipToAddr)}</div></div>
  <div class="section"><div class="label">Sold-To / Bill To</div><div class="value">${escHtml(form.billToCompany)}</div><div class="addr">${escHtml(form.billToContact)}${form.billToContactInfo ? ' / ' + escHtml(form.billToContactInfo) : ''}<br>${escHtml(form.billToAddr)}</div></div>
</div>
<table>
  <thead><tr><th>Line</th><th>Item / Description of Goods</th><th align="right">Qty</th><th align="right">Unit Price</th><th align="right">Sub Total</th></tr></thead>
  <tbody>${rows}</tbody>
  <tr class="total-row"><td colspan="2">Grand Total</td><td align="right">${totalQty}</td><td></td><td align="right">${form.currency} ${total.toLocaleString('en-US')}</td></tr>
</table>
<div class="cert">
  Certificate of Origin: ${escHtml(form.origin)}<br><br>
  I certify that the information on this invoice is true and correct.<br><br>
  ___________________________<br>
  ${escHtml(form.signatoryTitle)}
</div>
<div class="footer">${escHtml(form.exportNotice)}</div>
</body></html>`
}

export function invoiceFileName(form: InvoiceForm, customer: string): string {
  return `Invoice_${form.invoiceNo}_${(customer || '').replace(/[^a-zA-Z0-9]/g, '_')}.html`
}
