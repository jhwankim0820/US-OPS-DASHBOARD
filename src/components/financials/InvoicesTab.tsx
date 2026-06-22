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

const STATUS_STYLE: Record<string, string> = {
  Demand: 'bg-amber-100 text-amber-700',
  Confirmed: 'bg-blue-100 text-blue-700',
  'Waiting for Delivery': 'bg-sky-100 text-sky-700',
  Delivered: 'bg-emerald-100 text-emerald-700',
  SUBMITTED: 'bg-violet-100 text-violet-700',
}

const inputCls =
  'w-full rounded-md border border-[#E2E8F0] bg-[#FAFAFA] px-2.5 py-2 text-sm text-[#111827] transition-colors focus:border-[#E21500] focus:bg-white focus:outline-none'
const labelCls = 'text-xs font-medium text-[#6B7280]'
const sectionCls = 'rounded-xl border border-[#E2E8F0] bg-white p-5'
const sectionTitleCls =
  'mb-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF]'

function money(n: number, currency = 'USD') {
  return `${currency} ${n.toLocaleString('en-US')}`
}

export default function InvoicesTab({ deals }: { deals: InvoiceDeal[] }) {
  const [selected, setSelected] = useState<InvoiceDeal | null>(null)
  const [form, setForm] = useState<InvoiceForm | null>(null)
  const [items, setItems] = useState<LineItem[]>([])
  const [email, setEmail] = useState({ to: '', cc: '', subject: '', body: '' })
  const [savingDrive, setSavingDrive] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)

  const total = useMemo(() => lineItemsTotal(items), [items])
  const totalQty = useMemo(() => items.reduce((s, li) => s + li.qty, 0), [items])

  function openInvoice(deal: InvoiceDeal) {
    const f = buildInitialForm(deal)
    setSelected(deal)
    setForm(f)
    setItems(buildInitialLineItems(deal))
    setEmail({ ...defaultEmail(deal, f), to: '', cc: '' })
  }

  function backToList() {
    setSelected(null)
    setForm(null)
    setItems([])
  }

  function setField<K extends keyof InvoiceForm>(key: K, value: InvoiceForm[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  function updateItem(i: number, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((li, idx) => (idx === i ? { ...li, ...patch } : li)))
  }
  function addItem() {
    setItems((prev) => [...prev, { item: '', qty: 1, desc: '', unitPrice: 0 }])
  }
  function removeItem(i: number) {
    setItems((prev) => prev.filter((_, idx) => idx !== i))
  }

  async function saveToDrive() {
    if (!form) return
    setSavingDrive(true)
    try {
      const res = await fetch('/api/invoice/save-drive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: invoiceFileName(form, selected?.customer ?? ''),
          htmlContent: buildInvoiceHTML(form, items),
        }),
      })
      const data = await res.json()
      if (!res.ok || data.success === false) throw new Error(data.error || data.detail || 'Save failed')
      toast.success('Saved to Google Drive', { description: data.message?.slice(0, 140) || undefined })
    } catch (e) {
      toast.error('Drive save failed', { description: e instanceof Error ? e.message : String(e) })
    } finally {
      setSavingDrive(false)
    }
  }

  async function sendEmail() {
    if (!form) return
    if (!email.to.trim()) {
      toast.error('Recipient email is required')
      return
    }
    setSendingEmail(true)
    try {
      const res = await fetch('/api/invoice/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: email.to.trim(),
          cc: email.cc.trim(),
          subject: email.subject,
          emailBody: email.body,
          fileName: invoiceFileName(form, selected?.customer ?? ''),
          htmlContent: buildInvoiceHTML(form, items),
        }),
      })
      const data = await res.json()
      if (!res.ok || data.success === false) throw new Error(data.error || data.detail || 'Send failed')
      toast.success('Invoice email sent', { description: `→ ${email.to}` })
    } catch (e) {
      toast.error('Email send failed', { description: e instanceof Error ? e.message : String(e) })
    } finally {
      setSendingEmail(false)
    }
  }

  // ---- Project list view ----
  if (!selected || !form) {
    return (
      <div className="p-6 sm:p-10">
        <h2 className="text-lg font-semibold text-[#111827]">Invoice Management</h2>
        <p className="mt-1 text-sm text-[#6B7280]">
          Select a deal to generate a Commercial Invoice.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {deals.map((d) => {
            const itemStr = [
              d.cards > 0 ? `Cards ${d.cards}` : null,
              d.servers > 0 ? `Servers ${d.servers}` : null,
            ]
              .filter(Boolean)
              .join(' · ')
            return (
              <button
                key={d.id}
                onClick={() => openInvoice(d)}
                className="group rounded-xl border border-[#E2E8F0] bg-white p-5 text-left transition-all hover:border-[#E21500]/40 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <span className="font-mono text-[11px] font-semibold tracking-wide text-[#9CA3AF]">
                    {d.id}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      STATUS_STYLE[d.status] ?? 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {d.status}
                  </span>
                </div>
                <p className="mt-3 text-[15px] font-semibold text-[#111827]">{d.customer}</p>
                <p className="mt-1 text-xs text-[#9CA3AF]">
                  {[d.formFactor, d.region, itemStr].filter(Boolean).join(' · ')}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-[15px] font-semibold text-[#111827]">
                    {d.revenue ? `$${d.revenue.toLocaleString('en-US')}` : '—'}
                  </span>
                  <span className="text-xs font-semibold text-[#E21500] group-hover:underline">
                    Generate invoice →
                  </span>
                </div>
              </button>
            )
          })}
        </div>
        {deals.length === 0 && (
          <p className="mt-8 text-sm text-[#9CA3AF]">No deals available.</p>
        )}
      </div>
    )
  }

  // ---- Invoice form + preview view ----
  return (
    <div className="p-6 sm:p-10">
      <button
        onClick={backToList}
        className="mb-5 flex items-center gap-1.5 text-sm text-[#6B7280] transition-colors hover:text-[#111827]"
      >
        ← Back to deals
      </button>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Form column */}
        <div className="min-w-0 flex-1 space-y-4">
          {/* Invoice Info */}
          <section className={sectionCls}>
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

          {/* Shipper */}
          <section className={sectionCls}>
            <p className={sectionTitleCls}>Shipper (Logistics)</p>
            <div className="space-y-3">
              <Field label="Company">
                <input className={inputCls} value={form.shipperCompany} onChange={(e) => setField('shipperCompany', e.target.value)} />
              </Field>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Contact">
                  <input className={inputCls} value={form.shipperContact} onChange={(e) => setField('shipperContact', e.target.value)} />
                </Field>
                <Field label="Email / Phone">
                  <input className={inputCls} value={form.shipperEmail} onChange={(e) => setField('shipperEmail', e.target.value)} />
                </Field>
              </div>
              <Field label="Address">
                <textarea rows={2} className={inputCls} value={form.shipperAddr} onChange={(e) => setField('shipperAddr', e.target.value)} />
              </Field>
            </div>
          </section>

          {/* Seller */}
          <section className={sectionCls}>
            <p className={sectionTitleCls}>Seller (FuriosaAI)</p>
            <div className="space-y-3">
              <Field label="Company">
                <input className={inputCls} value={form.sellerCompany} onChange={(e) => setField('sellerCompany', e.target.value)} />
              </Field>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Contact">
                  <input className={inputCls} value={form.sellerContact} onChange={(e) => setField('sellerContact', e.target.value)} />
                </Field>
                <Field label="Phone / Email">
                  <input className={inputCls} value={form.sellerPhone} onChange={(e) => setField('sellerPhone', e.target.value)} />
                </Field>
              </div>
              <Field label="Address">
                <textarea rows={2} className={inputCls} value={form.sellerAddr} onChange={(e) => setField('sellerAddr', e.target.value)} />
              </Field>
            </div>
          </section>

          {/* Ship To */}
          <section className={sectionCls}>
            <p className={sectionTitleCls}>Ship To</p>
            <div className="space-y-3">
              <Field label="Company">
                <input className={inputCls} value={form.shipToCompany} onChange={(e) => setField('shipToCompany', e.target.value)} />
              </Field>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Contact">
                  <input className={inputCls} value={form.shipToContact} onChange={(e) => setField('shipToContact', e.target.value)} />
                </Field>
                <Field label="Email / Phone">
                  <input className={inputCls} value={form.shipToContactInfo} onChange={(e) => setField('shipToContactInfo', e.target.value)} />
                </Field>
              </div>
              <Field label="Address">
                <textarea rows={2} className={inputCls} value={form.shipToAddr} onChange={(e) => setField('shipToAddr', e.target.value)} />
              </Field>
            </div>
          </section>

          {/* Bill To */}
          <section className={sectionCls}>
            <p className={sectionTitleCls}>Sold-To / Bill To</p>
            <div className="space-y-3">
              <Field label="Company">
                <input className={inputCls} value={form.billToCompany} onChange={(e) => setField('billToCompany', e.target.value)} />
              </Field>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Contact">
                  <input className={inputCls} value={form.billToContact} onChange={(e) => setField('billToContact', e.target.value)} />
                </Field>
                <Field label="Email / Phone">
                  <input className={inputCls} value={form.billToContactInfo} onChange={(e) => setField('billToContactInfo', e.target.value)} />
                </Field>
              </div>
              <Field label="Address">
                <textarea rows={2} className={inputCls} value={form.billToAddr} onChange={(e) => setField('billToAddr', e.target.value)} />
              </Field>
            </div>
          </section>

          {/* Line Items */}
          <section className={sectionCls}>
            <p className={sectionTitleCls}>Line Items</p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-[#E2E8F0] text-left text-xs text-[#9CA3AF]">
                    <th className="w-8 py-2">#</th>
                    <th className="py-2">Item / PN</th>
                    <th className="w-16 py-2">Qty</th>
                    <th className="py-2">Description</th>
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
                      </td>
                      <td className="py-2 pr-2">
                        <input type="number" min={0} className={inputCls} value={li.qty} onChange={(e) => updateItem(i, { qty: Number(e.target.value) })} />
                      </td>
                      <td className="py-2 pr-2">
                        <input className={inputCls} value={li.desc} onChange={(e) => updateItem(i, { desc: e.target.value })} />
                      </td>
                      <td className="py-2 pr-2">
                        <input type="number" min={0} className={inputCls} value={li.unitPrice} onChange={(e) => updateItem(i, { unitPrice: Number(e.target.value) })} />
                      </td>
                      <td className="py-2 text-right text-sm font-medium text-[#111827]">
                        {(li.qty * li.unitPrice).toLocaleString('en-US')}
                      </td>
                      <td className="py-2 text-center">
                        <button
                          onClick={() => removeItem(i)}
                          className="text-[#CBD5E1] transition-colors hover:text-[#E21500]"
                          aria-label="Remove line item"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              onClick={addItem}
              className="mt-3 text-sm font-medium text-[#E21500] hover:underline"
            >
              + Add line item
            </button>
            <div className="mt-4 flex justify-end border-t border-[#E2E8F0] pt-3 text-sm">
              <span className="mr-6 text-[#6B7280]">
                Total Qty <strong className="text-[#111827]">{totalQty}</strong>
              </span>
              <span className="text-[#6B7280]">
                Grand Total{' '}
                <strong className="text-[#111827]">{money(total, form.currency)}</strong>
              </span>
            </div>
          </section>

          {/* Totals & Notes */}
          <section className={sectionCls}>
            <p className={sectionTitleCls}>Origin &amp; Export Notice</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Certificate of Origin">
                <input className={inputCls} value={form.origin} onChange={(e) => setField('origin', e.target.value)} />
              </Field>
              <Field label="Signatory Title">
                <input className={inputCls} value={form.signatoryTitle} onChange={(e) => setField('signatoryTitle', e.target.value)} />
              </Field>
            </div>
            <div className="mt-3">
              <Field label="Export Control Notice (auto-filled)">
                <textarea rows={4} className={inputCls} value={form.exportNotice} onChange={(e) => setField('exportNotice', e.target.value)} />
              </Field>
            </div>
          </section>

          {/* Email section */}
          <section className="rounded-xl border border-[#FCD9D4] bg-[#FFF6F5] p-5">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#E21500]">
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
              <Field label="Email Subject">
                <input className={inputCls} value={email.subject} onChange={(e) => setEmail((s) => ({ ...s, subject: e.target.value }))} />
              </Field>
              <Field label="Email Body">
                <textarea rows={5} className={inputCls} value={email.body} onChange={(e) => setEmail((s) => ({ ...s, body: e.target.value }))} />
              </Field>
            </div>
          </section>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={saveToDrive}
              disabled={savingDrive}
              className="inline-flex items-center gap-2 rounded-lg bg-[#E21500] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#c41200] disabled:opacity-50"
            >
              {savingDrive ? <Spinner /> : '💾'} Save to Google Drive
            </button>
            <button
              onClick={sendEmail}
              disabled={sendingEmail}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
            >
              {sendingEmail ? <Spinner /> : '✉️'} Send via Gmail
            </button>
          </div>
        </div>

        {/* Preview column */}
        <div className="w-full lg:w-[440px] lg:flex-shrink-0">
          <div className="lg:sticky lg:top-20">
            <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] px-4 py-3">
                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF]">
                  Preview
                </span>
                <span className="text-xs font-medium text-[#111827]">{form.invoiceNo || '—'}</span>
              </div>
              <InvoicePreview form={form} items={items} total={total} totalQty={totalQty} />
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

function Spinner() {
  return (
    <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
  )
}

function InvoicePreview({
  form,
  items,
  total,
  totalQty,
}: {
  form: InvoiceForm
  items: LineItem[]
  total: number
  totalQty: number
}) {
  return (
    <div className="p-6 text-[11px] leading-relaxed text-[#1a1a1a]">
      <h1 className="mb-5 text-xl font-bold tracking-tight">Commercial Invoice</h1>

      <div className="mb-5 grid grid-cols-3 gap-2 rounded-md bg-[#F8F8F5] p-3">
        <Meta label="Invoice #" value={form.invoiceNo || '—'} />
        <Meta label="Date" value={form.invoiceDate || '—'} />
        <Meta label="Currency" value={`${form.currency} · ${form.incoterms}`} />
      </div>

      <div className="mb-5 grid grid-cols-2 gap-4">
        <Party label="Shipper" name={form.shipperCompany} lines={[form.shipperContact, form.shipperAddr]} />
        <Party label="Seller" name={form.sellerCompany} lines={[form.sellerContact, form.sellerAddr]} />
        <Party label="Ship To" name={form.shipToCompany || '—'} lines={[form.shipToContact, form.shipToAddr]} />
        <Party label="Sold-To / Bill To" name={form.billToCompany || '—'} lines={[form.billToContact, form.billToAddr]} />
      </div>

      {form.poNo && (
        <p className="mb-3 text-[10px] text-[#666]">
          End Customer PO #: <strong>{form.poNo}</strong> · Ship Date: {form.shipDate}
        </p>
      )}

      <table className="mb-4 w-full border-collapse">
        <thead>
          <tr className="border-b-2 border-[#1a1a1a] text-left text-[9px] uppercase tracking-wide text-[#888]">
            <th className="py-1.5">#</th>
            <th className="py-1.5">Item / Description</th>
            <th className="py-1.5 text-right">Qty</th>
            <th className="py-1.5 text-right">Unit Price</th>
            <th className="py-1.5 text-right">Sub Total</th>
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
              <td className="py-1.5 text-right font-medium">
                {(li.qty * li.unitPrice).toLocaleString('en-US')}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="text-[10px] font-semibold">
            <td className="py-1.5" colSpan={2}>
              Total
            </td>
            <td className="py-1.5 text-right">{totalQty}</td>
            <td />
            <td className="py-1.5 text-right font-bold">{money(total, form.currency)}</td>
          </tr>
        </tfoot>
      </table>

      <div className="ml-auto w-44">
        <div className="flex justify-between border-t border-[#1a1a1a] pt-1.5 text-[12px] font-bold">
          <span>Grand Total</span>
          <span>{money(total, form.currency)}</span>
        </div>
      </div>

      <p className="mt-4 text-[10px] italic text-[#666]">
        I certify that the information on this invoice is true and correct.
        <br />
        <br />
        ___________________________
        <br />
        {form.signatoryTitle}
      </p>

      <div className="mt-5 border-t border-[#E5E5E0] pt-3 text-[9px] leading-relaxed text-[#aaa]">
        Certificate of Origin: {form.origin}
        <br />
        <br />
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
