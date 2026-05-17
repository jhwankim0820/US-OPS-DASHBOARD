'use client'

import { useState } from 'react'

type HardwareType = 'RNGD Cards' | 'Rack Server' | 'Workstation'
type FedExService = 'FedEx Priority Overnight' | 'FedEx 2Day' | 'FedEx Ground' | 'FedEx International Priority'

interface ShipmentForm {
  recipient: string
  hwType: HardwareType
  qty: number
  address: string
  service: FedExService
  delivDate: string
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
    sub: 'FedEx International Priority · 7748 2391 0045',
    route: 'Seoul → Memphis hub → San Jose',
    qty: '32 cards',
    eta: 'ETA May 21',
    status: 'In transit',
    statusColor: 'bg-blue-100 text-blue-800',
    progress: 70,
    progressColor: 'bg-blue-500',
  },
  {
    id: 'KR-2406',
    type: 'server' as const,
    title: 'Rack Servers — Batch #KR-2406',
    sub: 'FedEx International Economy · 7748 2391 1102',
    route: 'Seoul → customs clearance',
    qty: '4 servers',
    eta: 'ETA Jun 3',
    status: 'Customs',
    statusColor: 'bg-amber-100 text-amber-800',
    progress: 30,
    progressColor: 'bg-blue-500',
  },
]

const outbound = [
  {
    id: 'DMD-63',
    type: 'card' as const,
    title: 'RNGD Cards — DMD-63 · KT Cloud',
    sub: 'FedEx Ground · 4539 8812 3301',
    route: 'San Jose → Seattle data center',
    qty: '8 cards',
    eta: 'ETA May 18',
    status: 'Out for delivery',
    statusColor: 'bg-green-100 text-green-800',
    progress: 90,
    progressColor: 'bg-green-500',
  },
]

export default function ShipmentTracker() {
  const [fedexOpen, setFedexOpen] = useState(false)
  const [contractOpen, setContractOpen] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [form, setForm] = useState<ShipmentForm>({
    recipient: '',
    hwType: 'RNGD Cards',
    qty: 4,
    address: '',
    service: 'FedEx Priority Overnight',
    delivDate: '',
  })

  const unitPrice = UNIT_PRICES[form.hwType]
  const totalPrice = unitPrice * form.qty

  function handleConfirm() {
    setContractOpen(false)
    setConfirmed(true)
    setTimeout(() => setConfirmed(false), 3500)
  }

  return (
    <div className="space-y-6">

      {/* Inbound + Outbound grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Inbound */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Inbound</p>
              <p className="text-sm font-medium text-gray-700">Korea HQ → US Office</p>
            </div>
            <span className="text-xs font-medium bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
              {inbound.length} active
            </span>
          </div>
          <div className="space-y-4">
            {inbound.map((s) => (
              <div key={s.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 text-blue-600 text-sm">
                  {s.type === 'card' ? '▣' : '⬛'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{s.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
                  <div className="mt-1.5 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${s.progressColor}`} style={{ width: `${s.progress}%` }} />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{s.route}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-medium text-gray-800">{s.qty}</p>
                  <p className="text-xs text-gray-400">{s.eta}</p>
                  <span className={`mt-1 inline-block text-xs font-medium px-1.5 py-0.5 rounded ${s.statusColor}`}>
                    {s.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Outbound */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Outbound</p>
              <p className="text-sm font-medium text-gray-700">US Office → Clients</p>
            </div>
            <span className="text-xs font-medium bg-green-50 text-green-700 px-2 py-1 rounded-full">
              {outbound.length} active
            </span>
          </div>
          <div className="space-y-4">
            {outbound.map((s) => (
              <div key={s.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0 text-green-600 text-sm">
                  {s.type === 'card' ? '▣' : '⬛'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{s.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
                  <div className="mt-1.5 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${s.progressColor}`} style={{ width: `${s.progress}%` }} />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{s.route}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-medium text-gray-800">{s.qty}</p>
                  <p className="text-xs text-gray-400">{s.eta}</p>
                  <span className={`mt-1 inline-block text-xs font-medium px-1.5 py-0.5 rounded ${s.statusColor}`}>
                    {s.status}
                  </span>
                </div>
              </div>
            ))}
            <p className="text-xs text-gray-400 text-center pt-2 border-t border-gray-100">
              ✓ 2 shipments delivered this month
            </p>
          </div>
        </div>
      </div>

      {/* FedEx Dispatch */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm font-semibold text-gray-800">Ship hardware via FedEx</p>
          <p className="text-xs text-gray-400 mt-0.5">Create a new outbound shipment. A transfer pricing contract will be generated automatically.</p>
        </div>
        <button
          onClick={() => setFedexOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-semibold transition-opacity hover:opacity-90"
          style={{ background: '#4D148C' }}
        >
          <span><span style={{ color: '#FF6200' }}>Fe</span>dEx</span>
          배송하기
        </button>
      </div>

      {/* Confirmed toast */}
      {confirmed && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg">
          ✓ Shipment confirmed & logged!
        </div>
      )}

      {/* FedEx Modal */}
      {fedexOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <p className="font-semibold text-gray-900">New FedEx shipment</p>
                <p className="text-xs text-gray-400 mt-0.5">US Office → Client</p>
              </div>
              <button onClick={() => setFedexOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Recipient company</label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                  placeholder="e.g. AWS, Google Cloud…"
                  value={form.recipient}
                  onChange={(e) => setForm({ ...form, recipient: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Hardware type</label>
                  <select
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                    value={form.hwType}
                    onChange={(e) => setForm({ ...form, hwType: e.target.value as HardwareType })}
                  >
                    <option>RNGD Cards</option>
                    <option>Rack Server</option>
                    <option>Workstation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                    value={form.qty}
                    onChange={(e) => setForm({ ...form, qty: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Delivery address</label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                  placeholder="Street, City, State, ZIP"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">FedEx service</label>
                  <select
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                    value={form.service}
                    onChange={(e) => setForm({ ...form, service: e.target.value as FedExService })}
                  >
                    <option>FedEx Priority Overnight</option>
                    <option>FedEx 2Day</option>
                    <option>FedEx Ground</option>
                    <option>FedEx International Priority</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Requested delivery</label>
                  <input
                    type="date"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                    value={form.delivDate}
                    onChange={(e) => setForm({ ...form, delivDate: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 pb-5">
              <button onClick={() => setFedexOpen(false)} className="px-4 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50">Cancel</button>
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 text-center">
              <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">FuriosaAI, Inc.</p>
              <p className="font-semibold text-gray-900 text-lg">Intercompany Transfer Pricing Agreement</p>
              <p className="text-sm text-gray-500 mt-0.5">Hardware Transfer — US Operations</p>
              <span className="mt-2 inline-block text-xs font-medium bg-amber-50 text-amber-700 px-2 py-1 rounded-full">
                ⚠ Draft — For illustration only
              </span>
            </div>

            <div className="p-5 space-y-5">
              {/* Notice */}
              <div className="bg-amber-50 text-amber-700 text-xs rounded-lg px-4 py-3">
                계약서 양식 준비 중입니다. 아래 내용은 예시이며 법적 효력이 없습니다.
              </div>

              {/* Parties */}
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">Parties</p>
                <div className="space-y-1.5 text-sm">
                  {[
                    ['Transferor', 'FuriosaAI Inc. — US Operations (San Jose, CA)'],
                    ['Transferee / Client', form.recipient || '—'],
                    ['Agreement date', new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between py-1.5 border-b border-gray-100">
                      <span className="text-gray-500">{label}</span>
                      <span className="font-medium text-gray-900 text-right max-w-xs">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hardware */}
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">Hardware details</p>
                <div className="space-y-1.5 text-sm">
                  {[
                    ['Item', `FuriosaAI ${form.hwType}`],
                    ['Quantity', `${form.qty} unit${form.qty > 1 ? 's' : ''}`],
                    ['Unit transfer price', `$${unitPrice.toLocaleString()} USD`],
                    ['Total value', `$${totalPrice.toLocaleString()} USD`],
                    ['Pricing method', 'Comparable Uncontrolled Price (CUP)'],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between py-1.5 border-b border-gray-100">
                      <span className="text-gray-500">{label}</span>
                      <span className="font-medium text-gray-900">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping */}
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">Shipping & logistics</p>
                <div className="space-y-1.5 text-sm">
                  {[
                    ['Carrier', form.service],
                    ['Delivery address', form.address || '—'],
                    ['Risk transfer (Incoterms)', 'DAP — Delivered at Place'],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between py-1.5 border-b border-gray-100">
                      <span className="text-gray-500">{label}</span>
                      <span className="font-medium text-gray-900 text-right max-w-xs">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Signatures */}
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">Signatures</p>
                <div className="grid grid-cols-2 gap-3">
                  {['Transferor — FuriosaAI US Ops', 'Transferee'].map((label) => (
                    <div key={label}>
                      <p className="text-xs text-gray-400 mb-2">{label}</p>
                      <div className="border border-dashed border-gray-300 rounded-lg p-4 text-center text-xs text-gray-400">
                        ✍ Sign here
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 px-5 pb-5">
              <button onClick={() => { setContractOpen(false); setFedexOpen(true) }} className="px-4 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50">← Back</button>
              <button onClick={() => setContractOpen(false)} className="px-4 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50">Cancel</button>
              <button
                onClick={handleConfirm}
                className="px-4 py-2 text-sm rounded-lg bg-gray-900 text-white font-medium hover:bg-gray-700"
              >
                ✓ Sign & confirm shipment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
