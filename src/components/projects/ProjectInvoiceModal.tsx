'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  type InvoiceDeal,
  type InvoiceForm,
  type LineItem,
  buildInitialForm,
  buildInitialLineItems,
  buildInvoiceHTML,
  defaultEmail,
  invoiceFileName,
  lineItemsTotal,
} from '@/lib/invoice-template'

const inputCls =
  'w-full rounded-md border border-[#E2E8F0] bg-[#FAFAFA] px-2.5 py-2 text-sm text-[#111827] transition-colors focus:border-[#1d9e75] focus:bg-white focus:outline-none'
const labelCls = 'text-xs font-medium text-[#6B7280]'
const sectionTitleCls = 'mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF]'

function money(n: number, currency = 'USD') {
  return `${currency} ${n.toLocaleString('en-US')}`
}

export default function ProjectInvoiceModal({
  deal,
  onClose,
  onSaved,
}: {
  deal: InvoiceDeal
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState<InvoiceForm>(() => buildInitialForm(deal))
  const [items, setItems] = useState<LineItem[]>(() => buildInitialLineItems(deal))
  const [email, setEmail] = useState(() => ({ ...defaultEmail(deal, buildInitialForm(deal)), to: '', cc: '' }))
  const [savingDrive, setSavingDrive] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)

  const total = useMemo(() => lineItemsTotal(items), [items])

  function setField<K extends keyof InvoiceForm>(key: K, value: InvoiceForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }
  function updateItem(i: number, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((li, idx) => (idx === i ? { ...li, ...patch } : li)))
  }

  // Validate the invoice content before any Drive/Gmail write. Returns an error
  // message, or null when the invoice is well-formed.
  function validateInvoice(): string | null {
    if (!form.invoiceNo.trim()) return 'Invoice # is required'
    if (items.length === 0) return 'Add at least one line item'
    if (items.some((li) => !li.item.trim())) return 'Every line item needs an item / PN'
    if (total <= 0) return 'Invoice total must be greater than 0'
    return null
  }

  function downloadInvoice() {
    const err = validateInvoice()
    if (err) {
      toast.error(err)
      return
    }
    const html = buildInvoiceHTML(form, items)
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = invoiceFileName(form, deal.customer).replace(/\.[^./]+$/, '') + '.html'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    toast.success('Invoice downloaded', { description: a.download })
  }

  // Core Drive save — returns success, does NOT close the modal (so it can be
  // composed with send). Handlers below decide when to call onSaved().
  async function doSave(): Promise<boolean> {
    try {
      const res = await fetch('/api/invoice/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealId: deal.id,
          fileName: invoiceFileName(form, deal.customer),
          htmlContent: buildInvoiceHTML(form, items),
        }),
      })
      const data = await res.json()
      if (!res.ok || data.success === false) throw new Error(data.error || 'Save failed')
      toast.success('Invoice saved to Drive', { description: `${deal.id} · 3. Invoice` })
      return true
    } catch (e) {
      toast.error('Drive save failed', { description: e instanceof Error ? e.message : String(e) })
      return false
    }
  }

  async function doSend(): Promise<boolean> {
    try {
      const res = await fetch('/api/invoice/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: email.to.trim(),
          cc: email.cc.trim(),
          subject: email.subject,
          emailBody: email.body,
          fileName: invoiceFileName(form, deal.customer),
          htmlContent: buildInvoiceHTML(form, items),
        }),
      })
      const data = await res.json()
      if (!res.ok || data.success === false) throw new Error(data.error || 'Send failed')
      toast.success('Invoice email sent', { description: `→ ${email.to}` })
      return true
    } catch (e) {
      toast.error('Email send failed', { description: e instanceof Error ? e.message : String(e) })
      return false
    }
  }

  async function saveToDrive() {
    const err = validateInvoice()
    if (err) {
      toast.error(err)
      return
    }
    setSavingDrive(true)
    const ok = await doSave()
    setSavingDrive(false)
    if (ok) onSaved()
  }

  async function sendEmail() {
    const err = validateInvoice()
    if (err) {
      toast.error(err)
      return
    }
    if (!email.to.trim()) {
      toast.error('Recipient email is required')
      return
    }
    setSendingEmail(true)
    await doSend()
    setSendingEmail(false)
  }

  async function saveAndSend() {
    const err = validateInvoice()
    if (err) {
      toast.error(err)
      return
    }
    if (!email.to.trim()) {
      toast.error('Recipient email is required')
      return
    }
    setSavingDrive(true)
    setSendingEmail(true)
    const saved = await doSave()
    let sent = false
    if (saved) sent = await doSend()
    setSavingDrive(false)
    setSendingEmail(false)
    if (saved && sent) onSaved()
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:p-8"
      onClick={onClose}
    >
      <div
        className="my-4 w-full max-w-5xl rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E2E8F0] px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-[#111827]">Generate Invoice</h2>
            <p className="text-xs text-[#9CA3AF]">
              {deal.id} · {deal.customer}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md px-2 py-1 text-xl leading-none text-[#9CA3AF] hover:bg-[#F1F3F5] hover:text-[#111827]"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="flex flex-col gap-6 p-6 lg:flex-row">
          {/* Form */}
          <div className="min-w-0 flex-1 space-y-5">
            <section>
              <p className={sectionTitleCls}>Invoice Info</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Invoice #">
                  <input className={inputCls} value={form.invoiceNo} onChange={(e) => setField('invoiceNo', e.target.value)} />
                </Field>
                <Field label="Invoice Date">
                  <input type="date" className={inputCls} value={form.invoiceDate} onChange={(e) => setField('invoiceDate', e.target.value)} />
                </Field>
                <Field label="Ship Date">
                  <input type="date" className={inputCls} value={form.shipDate} onChange={(e) => setField('shipDate', e.target.value)} />
                </Field>
                <Field label="Currency">
                  <select className={inputCls} value={form.currency} onChange={(e) => setField('currency', e.target.value)}>
                    <option value="USD">USD</option>
                    <option value="KRW">KRW</option>
                    <option value="SGD">SGD</option>
                  </select>
                </Field>
                <Field label="Incoterms">
                  <select className={inputCls} value={form.incoterms} onChange={(e) => setField('incoterms', e.target.value)}>
                    <option value="DAP">DAP</option>
                    <option value="FOB">FOB</option>
                    <option value="CIF">CIF</option>
                    <option value="EXW">EXW</option>
                    <option value="DDP">DDP</option>
                  </select>
                </Field>
                <Field label="End Customer PO #">
                  <input className={inputCls} placeholder="e.g. 5000098370" value={form.poNo} onChange={(e) => setField('poNo', e.target.value)} />
                </Field>
              </div>
            </section>

            <section>
              <p className={sectionTitleCls}>Ship To</p>
              <div className="space-y-3">
                <input className={inputCls} placeholder="Company" value={form.shipToCompany} onChange={(e) => setField('shipToCompany', e.target.value)} />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input className={inputCls} placeholder="Contact" value={form.shipToContact} onChange={(e) => setField('shipToContact', e.target.value)} />
                  <input className={inputCls} placeholder="Email / Phone" value={form.shipToContactInfo} onChange={(e) => setField('shipToContactInfo', e.target.value)} />
                </div>
                <textarea rows={2} className={inputCls} placeholder="Address" value={form.shipToAddr} onChange={(e) => setField('shipToAddr', e.target.value)} />
              </div>
            </section>

            <section>
              <p className={sectionTitleCls}>Sold-To / Bill To</p>
              <div className="space-y-3">
                <input className={inputCls} placeholder="Company" value={form.billToCompany} onChange={(e) => setField('billToCompany', e.target.value)} />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input className={inputCls} placeholder="Contact" value={form.billToContact} onChange={(e) => setField('billToContact', e.target.value)} />
                  <input className={inputCls} placeholder="Email / Phone" value={form.billToContactInfo} onChange={(e) => setField('billToContactInfo', e.target.value)} />
                </div>
                <textarea rows={2} className={inputCls} placeholder="Address" value={form.billToAddr} onChange={(e) => setField('billToAddr', e.target.value)} />
              </div>
            </section>

            <section>
              <p className={sectionTitleCls}>Line Items</p>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px] text-sm">
                  <thead>
                    <tr className="border-b border-[#E2E8F0] text-left text-xs text-[#9CA3AF]">
                      <th className="w-6 py-2">#</th>
                      <th className="py-2">Item / PN</th>
                      <th className="w-14 py-2">Qty</th>
                      <th className="w-24 py-2">Unit Price</th>
                      <th className="w-24 py-2 text-right">Sub Total</th>
                      <th className="w-6 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((li, i) => (
                      <tr key={i} className="border-b border-[#F1F3F5]">
                        <td className="py-2 text-xs text-[#9CA3AF]">{i + 1}</td>
                        <td className="py-2 pr-2">
                          <input className={inputCls} value={li.item} onChange={(e) => updateItem(i, { item: e.target.value })} />
                          <input className={`${inputCls} mt-1 text-xs`} placeholder="Description" value={li.desc} onChange={(e) => updateItem(i, { desc: e.target.value })} />
                        </td>
                        <td className="py-2 pr-2 align-top">
                          <input type="number" min={0} className={inputCls} value={li.qty} onChange={(e) => updateItem(i, { qty: Number(e.target.value) })} />
                        </td>
                        <td className="py-2 pr-2 align-top">
                          <input type="number" min={0} className={inputCls} value={li.unitPrice} onChange={(e) => updateItem(i, { unitPrice: Number(e.target.value) })} />
                        </td>
                        <td className="py-2 text-right align-top text-sm font-medium text-[#111827]">
                          {(li.qty * li.unitPrice).toLocaleString('en-US')}
                        </td>
                        <td className="py-2 text-center align-top">
                          <button
                            onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== i))}
                            className="text-[#CBD5E1] hover:text-[#e24b4a]"
                            aria-label="Remove"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <button
                  onClick={() => setItems((prev) => [...prev, { item: '', qty: 1, desc: '', unitPrice: 0 }])}
                  className="text-sm font-medium text-[#1d9e75] hover:underline"
                >
                  + Add line item
                </button>
                <span className="text-sm text-[#6B7280]">
                  Grand Total <strong className="text-[#111827]">{money(total, form.currency)}</strong>
                </span>
              </div>
            </section>

            <section className="rounded-xl border border-[#c0dd97] bg-[#f3f9ec] p-4">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#0f6e56]">
                📧 Send Invoice
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Recipient Email">
                  <input type="email" className={inputCls} placeholder="customer@example.com" value={email.to} onChange={(e) => setEmail((s) => ({ ...s, to: e.target.value }))} />
                </Field>
                <Field label="CC">
                  <input type="email" className={inputCls} placeholder="cc@example.com" value={email.cc} onChange={(e) => setEmail((s) => ({ ...s, cc: e.target.value }))} />
                </Field>
              </div>
              <div className="mt-3 space-y-3">
                <Field label="Subject">
                  <input className={inputCls} value={email.subject} onChange={(e) => setEmail((s) => ({ ...s, subject: e.target.value }))} />
                </Field>
                <Field label="Body">
                  <textarea rows={4} className={inputCls} value={email.body} onChange={(e) => setEmail((s) => ({ ...s, body: e.target.value }))} />
                </Field>
              </div>
            </section>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={saveToDrive}
                disabled={savingDrive || sendingEmail}
                className="inline-flex items-center gap-2 rounded-lg bg-[#1d9e75] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#187a5a] disabled:opacity-50"
              >
                {savingDrive ? <Spinner /> : '💾'} Save to “3. Invoice”
              </button>
              <button
                onClick={sendEmail}
                disabled={savingDrive || sendingEmail}
                className="inline-flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white px-4 py-2.5 text-sm font-medium text-[#111827] transition-colors hover:bg-[#F8F9FA] disabled:opacity-50"
              >
                {sendingEmail ? <Spinner dark /> : '✉️'} Send via Gmail
              </button>
              <button
                onClick={saveAndSend}
                disabled={savingDrive || sendingEmail}
                className="inline-flex items-center gap-2 rounded-lg bg-[#0f6e56] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0b5744] disabled:opacity-50"
              >
                {savingDrive || sendingEmail ? <Spinner /> : '🚀'} Save &amp; Send
              </button>
              <button
                onClick={downloadInvoice}
                disabled={savingDrive || sendingEmail}
                className="ml-auto inline-flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white px-4 py-2.5 text-sm font-medium text-[#6B7280] transition-colors hover:text-[#111827] disabled:opacity-50"
              >
                ⬇️ Download
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="w-full lg:w-[400px] lg:flex-shrink-0">
            <div className="lg:sticky lg:top-4">
              <div className="overflow-hidden rounded-xl border border-[#E2E8F0]">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] bg-[#FAFAFA] px-4 py-2.5">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF]">Preview</span>
                  <span className="text-xs font-medium text-[#111827]">{form.invoiceNo || '—'}</span>
                </div>
                <Preview form={form} items={items} total={total} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  )
}

function Spinner({ dark }: { dark?: boolean }) {
  return (
    <span
      className={`inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 ${
        dark ? 'border-[#CBD5E1] border-t-[#111827]' : 'border-white/40 border-t-white'
      }`}
    />
  )
}

function Preview({ form, items, total }: { form: InvoiceForm; items: LineItem[]; total: number }) {
  const totalQty = items.reduce((s, li) => s + li.qty, 0)
  return (
    <div className="max-h-[70vh] overflow-y-auto p-5 text-[11px] leading-relaxed text-[#1a1a1a]">
      <h1 className="mb-4 text-lg font-bold tracking-tight">Commercial Invoice</h1>
      <div className="mb-4 grid grid-cols-3 gap-2 rounded-md bg-[#F8F8F5] p-2.5">
        <Meta label="Invoice #" value={form.invoiceNo || '—'} />
        <Meta label="Date" value={form.invoiceDate || '—'} />
        <Meta label="Terms" value={`${form.currency} · ${form.incoterms}`} />
      </div>
      <div className="mb-4 grid grid-cols-2 gap-3">
        <Party label="Shipper" name={form.shipperCompany} lines={[form.shipperContact, form.shipperAddr]} />
        <Party label="Seller" name={form.sellerCompany} lines={[form.sellerContact, form.sellerAddr]} />
        <Party label="Ship To" name={form.shipToCompany || '—'} lines={[form.shipToContact, form.shipToAddr]} />
        <Party label="Sold-To / Bill To" name={form.billToCompany || '—'} lines={[form.billToContact, form.billToAddr]} />
      </div>
      <table className="mb-3 w-full border-collapse">
        <thead>
          <tr className="border-b-2 border-[#1a1a1a] text-left text-[9px] uppercase tracking-wide text-[#888]">
            <th className="py-1.5">#</th>
            <th className="py-1.5">Item</th>
            <th className="py-1.5 text-right">Qty</th>
            <th className="py-1.5 text-right">Unit</th>
            <th className="py-1.5 text-right">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {items.map((li, i) => (
            <tr key={i} className="border-b border-[#F0F0F0] align-top text-[10px]">
              <td className="py-1.5">{i + 1}</td>
              <td className="py-1.5">
                <strong>{li.item}</strong>
                {li.desc && <div className="text-[#888]">{li.desc}</div>}
              </td>
              <td className="py-1.5 text-right">{li.qty}</td>
              <td className="py-1.5 text-right">{li.unitPrice.toLocaleString('en-US')}</td>
              <td className="py-1.5 text-right font-medium">{(li.qty * li.unitPrice).toLocaleString('en-US')}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="ml-auto flex w-44 justify-between border-t border-[#1a1a1a] pt-1.5 text-[12px] font-bold">
        <span>Grand Total</span>
        <span>{money(total, form.currency)}</span>
      </div>
      <p className="mt-3 text-[9px] text-[#aaa]">Total Qty: {totalQty} · Certificate of Origin: {form.origin}</p>
      <div className="mt-3 border-t border-[#E5E5E0] pt-2 text-[9px] leading-relaxed text-[#aaa]">
        {form.exportNotice}
      </div>
    </div>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[9px] font-semibold uppercase tracking-wide text-[#aaa]">{label}</div>
      <div className="text-[11px] font-semibold text-[#1a1a1a]">{value}</div>
    </div>
  )
}

function Party({ label, name, lines }: { label: string; name: string; lines: string[] }) {
  return (
    <div>
      <div className="mb-1 text-[9px] font-semibold uppercase tracking-wide text-[#aaa]">{label}</div>
      <div className="text-[11px] font-semibold text-[#1a1a1a]">{name}</div>
      <div className="text-[10px] leading-relaxed text-[#666]">
        {lines.filter(Boolean).map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
    </div>
  )
}
