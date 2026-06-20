import { ParsedPO } from './po-parser'

export function generateInvoiceNumber(): string {
  const now = new Date()
  const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
  const random = String(Math.floor(Math.random() * 900) + 100)
  return `INV-${yyyymm}-${random}`
}

export function generateInvoiceHTML(po: ParsedPO, invoiceNumber: string, dealId: string): string {
  const today = new Date().toISOString().split('T')[0]
  const dueDate = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]

  const itemRows = po.items.map(item => `
    <tr>
      <td>${item.description}</td>
      <td style="text-align:center">${item.qty}</td>
      <td style="text-align:right">$${item.unitPrice.toLocaleString()}</td>
      <td style="text-align:right">$${item.total.toLocaleString()}</td>
    </tr>
  `).join('')

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body { font-family: Arial, sans-serif; font-size: 13px; color: #222; margin: 0; padding: 40px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
  .logo { font-size: 22px; font-weight: bold; color: #1A1A2E; }
  .invoice-meta { text-align: right; }
  .invoice-meta h1 { font-size: 28px; color: #E21500; margin: 0 0 8px; }
  .parties { display: flex; justify-content: space-between; margin-bottom: 32px; }
  .party h3 { font-size: 11px; color: #888; text-transform: uppercase; margin: 0 0 6px; }
  .party p { margin: 2px 0; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  thead tr { background: #111827; color: white; }
  thead th { padding: 10px 12px; text-align: left; font-size: 12px; }
  tbody td { padding: 9px 12px; border-bottom: 1px solid #eee; }
  tbody tr:nth-child(even) { background: #F8F9FA; }
  .totals { float: right; width: 280px; }
  .totals table td { padding: 6px 12px; }
  .totals .grand-total td { font-weight: bold; font-size: 15px; background: #F1F3F5; }
  .footer { margin-top: 60px; border-top: 1px solid #eee; padding-top: 16px; font-size: 11px; color: #888; }
  .badge { display: inline-block; padding: 4px 12px; background: #FEF3C7; color: #92400E; border-radius: 4px; font-size: 12px; font-weight: bold; }
</style>
</head>
<body>

<div class="header">
  <div>
    <div class="logo">FuriosaAI</div>
    <p style="color:#888; margin:4px 0 0">6F, 145 Dosan-daero, Gangnam-gu<br>Seoul, KR 06036</p>
  </div>
  <div class="invoice-meta">
    <h1>INVOICE</h1>
    <p><strong>${invoiceNumber}</strong></p>
    <p>Deal: ${dealId}</p>
    <p>Issue Date: ${today}</p>
    <p>Due Date: ${dueDate}</p>
    <p><span class="badge">UNPAID</span></p>
  </div>
</div>

<div class="parties">
  <div class="party">
    <h3>Bill To</h3>
    <p><strong>${po.customer}</strong></p>
    <p style="white-space:pre-line">${po.billingAddress}</p>
  </div>
  <div class="party">
    <h3>Ship To</h3>
    <p style="white-space:pre-line">${po.shippingAddress}</p>
  </div>
  <div class="party">
    <h3>PO Reference</h3>
    <p><strong>${po.poNumber}</strong></p>
    <p>PO Date: ${po.poDate}</p>
    <p>Terms: ${po.paymentTerms}</p>
    <p>Destination: ${po.destination}</p>
  </div>
</div>

<table>
  <thead>
    <tr>
      <th>Description</th>
      <th style="text-align:center">Qty</th>
      <th style="text-align:right">Unit Price</th>
      <th style="text-align:right">Total</th>
    </tr>
  </thead>
  <tbody>
    ${itemRows}
  </tbody>
</table>

<div class="totals">
  <table>
    <tr><td>Subtotal</td><td style="text-align:right">$${po.amount.toLocaleString()}</td></tr>
    <tr><td>Sales Tax</td><td style="text-align:right">$0.00</td></tr>
    <tr class="grand-total"><td>Total (USD)</td><td style="text-align:right">$${po.amount.toLocaleString()}</td></tr>
  </table>
</div>

<div style="clear:both"></div>

${po.notes ? `<p style="margin-top:24px; color:#555"><strong>Notes:</strong> ${po.notes}</p>` : ''}

<div class="footer">
  <p>Payment by wire transfer. Banking details provided separately.</p>
  <p>FuriosaAI Inc. · ops@furiosa.ai · www.furiosa.ai</p>
</div>

</body>
</html>`
}
