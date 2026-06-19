'use client'

import { useState } from 'react'

type HardwareType = 'RNGD Cards' | 'Rack Server' | 'Workstation'
type FedExService = 'FedEx Priority Overnight' | 'FedEx 2Day' | 'FedEx Ground' | 'FedEx International Priority'

interface ShipForm {
  recipientCompany: string
  contactName: string
  contactPhone: string
  hwType: HardwareType
  qty: number
  street: string
  city: string
  state: string
  zip: string
  country: string
  service: FedExService
  delivDate: string
}

interface TrackResult {
  status: string
  location: string
  eta: string | null
  scans: { date: string; description: string; location: string }[]
}

interface RateResult {
  amount: number | null
  currency: string
}

interface ShipResult {
  trackingNumber: string | null
  labelUrl: string | null
}

const UNIT_PRICES: Record<HardwareType, number> = {
  'RNGD Cards': 7184,
  'Rack Server': 180000,
  'Workstation': 90000,
}

const inbound = [
  {
    id: 'KR-2405',
    type: 'card' as const,
    title: 'RNGD Cards — Batch #KR-2405',
    sub: 'FedEx International Priority',
    trackingNumber: '774823910045',
    route: 'Seoul → Memphis hub → San Jose',
    qty: '32 cards',
    eta: 'ETA May 21',
    status: 'In transit',
    statusColor: 'bg-blue-100 text-blue-700',
    progress: 70,
    progressColor: 'bg-[#378ADD]',
  },
  {
    id: 'KR-2406',
    type: 'server' as const,
    title: 'Rack Servers — Batch #KR-2406',
    sub: 'FedEx International Economy',
    trackingNumber: '774823911102',
    route: 'Seoul → customs clearance',
    qty: '4 servers',
    eta: 'ETA Jun 3',
    status: 'Customs',
    statusColor: 'bg-amber-100 text-amber-700',
    progress: 30,
    progressColor: 'bg-[#378ADD]',
  },
]

const outbound = [
  {
    id: 'DMD-63',
    type: 'card' as const,
    title: 'RNGD Cards — DMD-63 · KT Cloud',
    sub: 'FedEx Ground',
    trackingNumber: '453988123301',
    route: 'San Jose → Seattle data center',
    qty: '8 cards',
    eta: 'ETA May 18',
    status: 'Out for delivery',
    statusColor: 'bg-emerald-100 text-emerald-700',
    progress: 90,
    progressColor: 'bg-[#1D9E75]',
  },
]

const INPUT_CLS = 'w-full border border-[#E2E8F0] bg-[#F8F9FA] text-[#111827] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E21500]/30'
const LABEL_CLS = 'block text-xs text-[#6B7280] mb-1'

function fmt(date: string) {
  try { return new Date(date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }
  catch { return date }
}

export default function ShipmentTracker() {
  const [fedexOpen, setFedexOpen] = useState(false)
  const [contractOpen, setContractOpen] = useState(false)

  const [form, setForm] = useState<ShipForm>({
    recipientCompany: '',
    contactName: '',
    contactPhone: '',
    hwType: 'RNGD Cards',
    qty: 4,
    street: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
    service: 'FedEx Priority Overnight',
    delivDate: '',
  })

  // Rate state
  const [rateLoading, setRateLoading] = useState(false)
  const [rateResult, setRateResult] = useState<RateResult | null>(null)
  const [rateError, setRateError] = useState<string | null>(null)

  // Ship state
  const [shipLoading, setShipLoading] = useState(false)
  const [shipResult, setShipResult] = useState<ShipResult | null>(null)
  const [shipError, setShipError] = useState<string | null>(null)

  // Track modal
  const [trackOpen, setTrackOpen] = useState(false)
  const [trackTitle, setTrackTitle] = useState('')
  const [trackNumber, setTrackNumber] = useState('')
  const [trackLoading, setTrackLoading] = useState(false)
  const [trackResult, setTrackResult] = useState<TrackResult | null>(null)
  const [trackError, setTrackError] = useState<string | null>(null)

  const unitPrice = UNIT_PRICES[form.hwType]
  const totalPrice = unitPrice * form.qty

  function resetFedex() {
    setFedexOpen(false)
    setRateResult(null)
    setRateError(null)
    setShipError(null)
  }

  function resetContract() {
    setContractOpen(false)
    setShipError(null)
  }

  async function handleGetRate() {
    if (!form.zip) { setRateError('Enter destination ZIP first'); return }
    setRateLoading(true)
    setRateError(null)
    setRateResult(null)
    try {
      const res = await fetch('/api/fedex/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destZip: form.zip,
          destCountry: form.country || 'US',
          hwType: form.hwType,
          qty: form.qty,
          service: form.service,
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) { setRateError(data.error ?? 'Rate lookup failed'); return }
      setRateResult({ amount: data.amount, currency: data.currency })
    } catch (e) {
      setRateError(String(e))
    } finally {
      setRateLoading(false)
    }
  }

  async function handleConfirm() {
    setShipLoading(true)
    setShipError(null)
    try {
      const res = await fetch('/api/fedex/ship', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientCompany: form.recipientCompany,
          contactName: form.contactName,
          contactPhone: form.contactPhone,
          street: form.street,
          city: form.city,
          state: form.state,
          zip: form.zip,
          country: form.country || 'US',
          hwType: form.hwType,
          qty: form.qty,
          service: form.service,
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) { setShipError(data.error ?? 'Shipment creation failed'); return }
      setShipResult({ trackingNumber: data.trackingNumber, labelUrl: data.labelUrl })
      setContractOpen(false)
      setFedexOpen(false)
    } catch (e) {
      setShipError(String(e))
    } finally {
      setShipLoading(false)
    }
  }

  async function openTrack(title: string, num: string) {
    setTrackOpen(true)
    setTrackTitle(title)
    setTrackNumber(num)
    setTrackLoading(true)
    setTrackResult(null)
    setTrackError(null)
    try {
      const res = await fetch('/api/fedex/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackingNumber: num }),
      })
      const data = await res.json()
      if (!res.ok || data.error) { setTrackError(data.error ?? 'Tracking failed'); return }
      setTrackResult(data)
    } catch (e) {
      setTrackError(String(e))
    } finally {
      setTrackLoading(false)
    }
  }

  const set = (k: keyof ShipForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: k === 'qty' ? parseInt(e.target.value) || 1 : e.target.value }))

  return (
    <div className="space-y-6">

      {/* Inbound + Outbound grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Inbound */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">Inbound</p>
              <p className="text-sm font-medium text-[#4B5563]">Korea HQ → US Office</p>
            </div>
            <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
              {inbound.length} active
            </span>
          </div>
          <div className="space-y-4">
            {inbound.map((s) => (
              <div key={s.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 text-blue-700 text-sm">
                  {s.type === 'card' ? '▣' : '⬛'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#111827] truncate">{s.title}</p>
                  <p className="text-xs text-[#9CA3AF] mt-0.5">{s.sub} · {s.trackingNumber}</p>
                  <div className="mt-1.5 h-1.5 bg-[#F1F3F5] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${s.progressColor}`} style={{ width: `${s.progress}%` }} />
                  </div>
                  <p className="text-xs text-[#9CA3AF] mt-1">{s.route}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-medium text-[#111827]">{s.qty}</p>
                  <p className="text-xs text-[#9CA3AF]">{s.eta}</p>
                  <span className={`mt-1 inline-block text-xs font-medium px-1.5 py-0.5 rounded ${s.statusColor}`}>
                    {s.status}
                  </span>
                  <button
                    onClick={() => openTrack(s.title, s.trackingNumber)}
                    className="mt-1 block text-xs text-[#E21500] hover:underline"
                  >
                    Track →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Outbound */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">Outbound</p>
              <p className="text-sm font-medium text-[#4B5563]">US Office → Clients</p>
            </div>
            <span className="text-xs font-medium bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
              {outbound.length} active
            </span>
          </div>
          <div className="space-y-4">
            {outbound.map((s) => (
              <div key={s.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0 text-emerald-700 text-sm">
                  {s.type === 'card' ? '▣' : '⬛'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#111827] truncate">{s.title}</p>
                  <p className="text-xs text-[#9CA3AF] mt-0.5">{s.sub} · {s.trackingNumber}</p>
                  <div className="mt-1.5 h-1.5 bg-[#F1F3F5] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${s.progressColor}`} style={{ width: `${s.progress}%` }} />
                  </div>
                  <p className="text-xs text-[#9CA3AF] mt-1">{s.route}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-medium text-[#111827]">{s.qty}</p>
                  <p className="text-xs text-[#9CA3AF]">{s.eta}</p>
                  <span className={`mt-1 inline-block text-xs font-medium px-1.5 py-0.5 rounded ${s.statusColor}`}>
                    {s.status}
                  </span>
                  <button
                    onClick={() => openTrack(s.title, s.trackingNumber)}
                    className="mt-1 block text-xs text-[#E21500] hover:underline"
                  >
                    Track →
                  </button>
                </div>
              </div>
            ))}
            <p className="text-xs text-[#9CA3AF] text-center pt-2 border-t border-[#E2E8F0]">
              ✓ 2 shipments delivered this month
            </p>
          </div>
        </div>
      </div>

      {/* FedEx Dispatch */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm font-semibold text-[#111827]">Ship hardware via FedEx</p>
          <p className="text-xs text-[#9CA3AF] mt-0.5">Create a new outbound shipment with live rate quote and label generation.</p>
        </div>
        <button
          onClick={() => setFedexOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-semibold transition-opacity hover:opacity-90"
          style={{ background: '#4D148C' }}
        >
          <span><span style={{ color: '#FF6200' }}>Fe</span>dEx</span>
          Ship
        </button>
      </div>

      {/* Ship result toast */}
      {shipResult && (
        <div className="fixed bottom-6 right-6 z-50 bg-white border border-[#E2E8F0] text-sm px-5 py-4 rounded-xl shadow-lg max-w-sm">
          <p className="font-semibold text-emerald-600 mb-1">✓ Shipment created!</p>
          {shipResult.trackingNumber && (
            <p className="text-xs text-[#6B7280]">Tracking: <span className="font-mono font-semibold text-[#111827]">{shipResult.trackingNumber}</span></p>
          )}
          {shipResult.labelUrl && (
            <a href={shipResult.labelUrl} target="_blank" rel="noopener noreferrer"
              className="mt-2 inline-block text-xs text-[#E21500] hover:underline">
              Download label PDF →
            </a>
          )}
          <button onClick={() => setShipResult(null)} className="absolute top-2 right-3 text-[#9CA3AF] hover:text-[#111827] text-lg">×</button>
        </div>
      )}

      {/* Track Modal */}
      {trackOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xl w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0]">
              <div>
                <p className="font-semibold text-[#111827] text-sm">{trackTitle}</p>
                <p className="font-mono text-xs text-[#9CA3AF] mt-0.5">{trackNumber}</p>
              </div>
              <button onClick={() => setTrackOpen(false)} className="text-[#9CA3AF] hover:text-[#111827] text-xl leading-none">×</button>
            </div>
            <div className="p-5">
              {trackLoading && (
                <div className="flex items-center justify-center py-8 text-[#9CA3AF] text-sm">
                  <span className="animate-spin mr-2">⟳</span> Fetching from FedEx…
                </div>
              )}
              {trackError && (
                <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">{trackError}</div>
              )}
              {trackResult && (
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[#111827]">{trackResult.status}</p>
                      {trackResult.location && <p className="text-xs text-[#6B7280] mt-0.5">{trackResult.location}</p>}
                    </div>
                    {trackResult.eta && (
                      <div className="text-right">
                        <p className="text-xs text-[#9CA3AF]">ETA</p>
                        <p className="text-xs font-medium text-[#111827]">{fmt(trackResult.eta)}</p>
                      </div>
                    )}
                  </div>
                  {trackResult.scans.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#9CA3AF] mb-2">Scan history</p>
                      <div className="space-y-2">
                        {trackResult.scans.map((sc, i) => (
                          <div key={i} className="flex gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#E21500] flex-shrink-0 mt-1.5" />
                            <div className="flex-1">
                              <p className="text-xs font-medium text-[#111827]">{sc.description}</p>
                              <p className="text-xs text-[#9CA3AF]">{sc.location} · {fmt(sc.date)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FedEx Form Modal */}
      {fedexOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xl w-full max-w-xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0]">
              <div>
                <p className="font-semibold text-[#111827]">New FedEx shipment</p>
                <p className="text-xs text-[#9CA3AF] mt-0.5">US Office → Client</p>
              </div>
              <button onClick={resetFedex} className="text-[#9CA3AF] hover:text-[#111827] text-xl leading-none">×</button>
            </div>

            <div className="p-5 space-y-4">
              {/* Recipient */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL_CLS}>Recipient company</label>
                  <input className={INPUT_CLS} placeholder="e.g. AWS, Google Cloud…" value={form.recipientCompany} onChange={set('recipientCompany')} />
                </div>
                <div>
                  <label className={LABEL_CLS}>Contact name</label>
                  <input className={INPUT_CLS} placeholder="Full name" value={form.contactName} onChange={set('contactName')} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL_CLS}>Contact phone</label>
                  <input className={INPUT_CLS} placeholder="e.g. 4085551234" value={form.contactPhone} onChange={set('contactPhone')} />
                </div>
                <div>
                  <label className={LABEL_CLS}>FedEx service</label>
                  <select className={INPUT_CLS} value={form.service} onChange={set('service')}>
                    <option>FedEx Priority Overnight</option>
                    <option>FedEx 2Day</option>
                    <option>FedEx Ground</option>
                    <option>FedEx International Priority</option>
                  </select>
                </div>
              </div>

              {/* Hardware */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL_CLS}>Hardware type</label>
                  <select className={INPUT_CLS} value={form.hwType} onChange={set('hwType')}>
                    <option>RNGD Cards</option>
                    <option>Rack Server</option>
                    <option>Workstation</option>
                  </select>
                </div>
                <div>
                  <label className={LABEL_CLS}>Quantity</label>
                  <input type="number" min={1} className={INPUT_CLS} value={form.qty} onChange={set('qty')} />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className={LABEL_CLS}>Street address</label>
                <input className={INPUT_CLS} placeholder="Street, Suite…" value={form.street} onChange={set('street')} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL_CLS}>City</label>
                  <input className={INPUT_CLS} placeholder="Seattle" value={form.city} onChange={set('city')} />
                </div>
                <div>
                  <label className={LABEL_CLS}>State</label>
                  <input className={INPUT_CLS} placeholder="WA" value={form.state} onChange={set('state')} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL_CLS}>ZIP code</label>
                  <input className={INPUT_CLS} placeholder="98101" value={form.zip} onChange={set('zip')} />
                </div>
                <div>
                  <label className={LABEL_CLS}>Country</label>
                  <input className={INPUT_CLS} placeholder="US" value={form.country} onChange={set('country')} />
                </div>
              </div>
              <div>
                <label className={LABEL_CLS}>Requested delivery date</label>
                <input type="date" className={INPUT_CLS} value={form.delivDate} onChange={set('delivDate')} />
              </div>

              {/* Rate quote */}
              <div className="pt-1 border-t border-[#E2E8F0]">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-[#6B7280]">Shipping rate estimate</p>
                  <button
                    onClick={handleGetRate}
                    disabled={rateLoading}
                    className="text-xs px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-[#6B7280] hover:bg-[#F1F3F5] disabled:opacity-50"
                  >
                    {rateLoading ? '⟳ Loading…' : 'Get Quote'}
                  </button>
                </div>
                {rateError && <p className="mt-2 text-xs text-red-600">{rateError}</p>}
                {rateResult && (
                  <div className="mt-2 rounded-lg bg-[#F8F9FA] border border-[#E2E8F0] px-4 py-2 flex items-center justify-between">
                    <span className="text-xs text-[#6B7280]">{form.service}</span>
                    <span className="text-sm font-semibold text-[#111827]">
                      {rateResult.amount != null ? `$${rateResult.amount.toFixed(2)} ${rateResult.currency}` : 'N/A'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 px-5 pb-5">
              <button onClick={resetFedex} className="px-4 py-2 text-sm rounded-lg border border-[#E2E8F0] text-[#6B7280] hover:bg-[#F1F3F5]">Cancel</button>
              <button
                onClick={() => { setFedexOpen(false); setContractOpen(true) }}
                className="px-4 py-2 text-sm rounded-lg text-white font-medium hover:opacity-90"
                style={{ background: '#4D148C' }}
              >
                Next — Transfer pricing contract →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contract Modal */}
      {contractOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xl w-full max-w-xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-[#E2E8F0] text-center">
              <p className="text-xs uppercase tracking-widest text-[#9CA3AF] mb-1">FuriosaAI, Inc.</p>
              <p className="font-semibold text-[#111827] text-lg">Intercompany Transfer Pricing Agreement</p>
              <p className="text-sm text-[#6B7280] mt-0.5">Hardware Transfer — US Operations</p>
              <span className="mt-2 inline-block text-xs font-medium bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                ⚠ Draft — For illustration only
              </span>
            </div>

            <div className="p-5 space-y-5">
              <div className="bg-amber-50 text-amber-700 text-xs rounded-lg px-4 py-3 border border-amber-200">
                계약서 양식 준비 중입니다. 아래 내용은 예시이며 법적 효력이 없습니다.
              </div>

              {/* Parties */}
              <div>
                <p className="text-xs uppercase tracking-wide text-[#9CA3AF] mb-2">Parties</p>
                <div className="space-y-1.5 text-sm">
                  {[
                    ['Transferor', 'FuriosaAI Inc. — US Operations (San Jose, CA)'],
                    ['Transferee / Client', form.recipientCompany || '—'],
                    ['Contact', `${form.contactName || '—'} · ${form.contactPhone || '—'}`],
                    ['Agreement date', new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between py-1.5 border-b border-[#E2E8F0]">
                      <span className="text-[#6B7280]">{label}</span>
                      <span className="font-medium text-[#111827] text-right max-w-xs">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hardware */}
              <div>
                <p className="text-xs uppercase tracking-wide text-[#9CA3AF] mb-2">Hardware details</p>
                <div className="space-y-1.5 text-sm">
                  {[
                    ['Item', `FuriosaAI ${form.hwType}`],
                    ['Quantity', `${form.qty} unit${form.qty > 1 ? 's' : ''}`],
                    ['Unit transfer price', `$${unitPrice.toLocaleString()} USD`],
                    ['Total value', `$${totalPrice.toLocaleString()} USD`],
                    ['Pricing method', 'Comparable Uncontrolled Price (CUP)'],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between py-1.5 border-b border-[#E2E8F0]">
                      <span className="text-[#6B7280]">{label}</span>
                      <span className="font-medium text-[#111827]">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping */}
              <div>
                <p className="text-xs uppercase tracking-wide text-[#9CA3AF] mb-2">Shipping & logistics</p>
                <div className="space-y-1.5 text-sm">
                  {[
                    ['Carrier', form.service],
                    ['Delivery address', [form.street, form.city, form.state, form.zip, form.country].filter(Boolean).join(', ') || '—'],
                    ['Risk transfer (Incoterms)', 'DAP — Delivered at Place'],
                    ...(rateResult?.amount != null ? [['Shipping charge', `$${rateResult.amount.toFixed(2)} ${rateResult.currency}`]] : []),
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between py-1.5 border-b border-[#E2E8F0]">
                      <span className="text-[#6B7280]">{label}</span>
                      <span className="font-medium text-[#111827] text-right max-w-xs">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Signatures */}
              <div>
                <p className="text-xs uppercase tracking-wide text-[#9CA3AF] mb-2">Signatures</p>
                <div className="grid grid-cols-2 gap-3">
                  {['Transferor — FuriosaAI US Ops', 'Transferee'].map((label) => (
                    <div key={label}>
                      <p className="text-xs text-[#9CA3AF] mb-2">{label}</p>
                      <div className="border border-dashed border-[#E2E8F0] rounded-lg p-4 text-center text-xs text-[#9CA3AF]">
                        ✍ Sign here
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {shipError && (
                <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">{shipError}</div>
              )}
            </div>

            <div className="flex justify-end gap-2 px-5 pb-5">
              <button onClick={() => { resetContract(); setFedexOpen(true) }} className="px-4 py-2 text-sm rounded-lg border border-[#E2E8F0] text-[#6B7280] hover:bg-[#F1F3F5]">← Back</button>
              <button onClick={resetContract} className="px-4 py-2 text-sm rounded-lg border border-[#E2E8F0] text-[#6B7280] hover:bg-[#F1F3F5]">Cancel</button>
              <button
                onClick={handleConfirm}
                disabled={shipLoading}
                className="px-4 py-2 text-sm rounded-lg bg-[#E21500] text-white font-medium hover:bg-[#C01200] disabled:opacity-60"
              >
                {shipLoading ? '⟳ Creating shipment…' : '✓ Sign & confirm shipment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
