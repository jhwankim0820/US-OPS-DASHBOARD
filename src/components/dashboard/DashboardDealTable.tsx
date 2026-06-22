'use client'

import { useMemo, useState } from 'react'
import { type UsDeal, dealFinance, fmtUsdFull, fmtShortDate, repByEmail } from '@/lib/us-ops'

type StatusF = 'All' | 'Waiting' | 'Delivered' | 'Internal'
type RegionF = 'All' | 'US' | 'APAC'

const INV_BADGE: Record<string, { cls: string; label: string }> = {
  issued: { cls: 'bg-[#eaf3de] text-[#3b6d11]', label: '✓ Issued' },
  overdue: { cls: 'bg-[#fcebeb] text-[#a32d2d]', label: '⚠ Overdue' },
  pending: { cls: 'bg-[#fcebeb] text-[#a32d2d]', label: '⚠ Pending' },
  notyet: { cls: 'bg-[#faeeda] text-[#854f0b]', label: 'Not yet' },
  na: { cls: 'border border-[#e5e5e0] bg-[#fafafa] text-[#aaa]', label: 'N/A' },
}

const pill = 'inline-flex cursor-pointer items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] transition-colors'
const pillOn = 'border-[#5dcaa5] bg-[#e1f5ee] font-medium text-[#0f6e56]'
const pillOff = 'border-[#e5e5e0] bg-[#fafafa] text-[#888] hover:text-[#444]'

export default function DashboardDealTable({ deals }: { deals: UsDeal[] }) {
  const [statusF, setStatusF] = useState<StatusF>('All')
  const [regionF, setRegionF] = useState<RegionF>('All')

  const counts = useMemo(
    () => ({
      all: deals.length,
      waiting: deals.filter((d) => d.status === 'Waiting for Delivery').length,
      delivered: deals.filter((d) => d.status === 'Delivered' && d.category === 'B2B').length,
      internal: deals.filter((d) => d.category === 'Internal').length,
    }),
    [deals],
  )

  const rows = useMemo(() => {
    return deals.filter((d) => {
      if (statusF === 'Waiting' && d.status !== 'Waiting for Delivery') return false
      if (statusF === 'Delivered' && !(d.status === 'Delivered' && d.category === 'B2B')) return false
      if (statusF === 'Internal' && d.category !== 'Internal') return false
      if (regionF !== 'All' && d.region !== regionF) return false
      return true
    })
  }, [deals, statusF, regionF])

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <span className="w-11 flex-shrink-0 text-[10px] text-[#888]">Status</span>
        <button className={`${pill} ${statusF === 'All' ? pillOn : pillOff}`} onClick={() => setStatusF('All')}>All {counts.all}</button>
        <button className={`${pill} ${statusF === 'Waiting' ? pillOn : pillOff}`} onClick={() => setStatusF('Waiting')}>Waiting {counts.waiting}</button>
        <button className={`${pill} ${statusF === 'Delivered' ? pillOn : pillOff}`} onClick={() => setStatusF('Delivered')}>Delivered {counts.delivered}</button>
        <button className={`${pill} ${statusF === 'Internal' ? pillOn : pillOff}`} onClick={() => setStatusF('Internal')}>Internal {counts.internal}</button>
        <span className="ml-2 w-11 flex-shrink-0 text-[10px] text-[#888]">Region</span>
        <button className={`${pill} ${regionF === 'All' ? pillOn : pillOff}`} onClick={() => setRegionF('All')}>All</button>
        <button className={`${pill} ${regionF === 'US' ? pillOn : pillOff}`} onClick={() => setRegionF('US')}>US</button>
        <button className={`${pill} ${regionF === 'APAC' ? pillOn : pillOff}`} onClick={() => setRegionF('APAC')}>APAC</button>
      </div>

      <div className="overflow-hidden rounded-[10px] border border-[#e5e5e0] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-[11px]">
            <thead>
              <tr className="bg-[#fafafa] text-left text-[10px] font-medium text-[#888]">
                <th className="border-b border-[#e5e5e0] px-2.5 py-2">Deal ID</th>
                <th className="border-b border-[#e5e5e0] px-2.5 py-2">Customer</th>
                <th className="border-b border-[#e5e5e0] px-2.5 py-2">Status</th>
                <th className="border-b border-[#e5e5e0] px-2.5 py-2">Category</th>
                <th className="border-b border-[#e5e5e0] px-2.5 py-2">Region</th>
                <th className="border-b border-[#e5e5e0] px-2.5 py-2 text-right">Cards</th>
                <th className="border-b border-[#e5e5e0] px-2.5 py-2 text-right">Servers</th>
                <th className="border-b border-[#e5e5e0] px-2.5 py-2 text-right">Revenue</th>
                <th className="border-b border-[#e5e5e0] px-2.5 py-2">ETD</th>
                <th className="border-b border-[#e5e5e0] px-2.5 py-2">Owner</th>
                <th className="border-b border-[#e5e5e0] px-2.5 py-2">Invoice</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => {
                const fin = dealFinance(d)
                const inv = INV_BADGE[fin.invoice]
                const overdue = fin.invoice === 'overdue'
                return (
                  <tr key={d.id} className={`hover:bg-[#fafafa] ${overdue ? 'bg-[#fff8f8]' : ''}`}>
                    <td className="border-b border-[#f0f0f0] px-2.5 py-2 font-mono text-[10px] text-[#aaa]">{d.id}</td>
                    <td className="border-b border-[#f0f0f0] px-2.5 py-2 font-medium">{d.customer}</td>
                    <td className="border-b border-[#f0f0f0] px-2.5 py-2">
                      <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-medium ${d.status === 'Delivered' ? 'bg-[#eaf3de] text-[#3b6d11]' : 'bg-[#faeeda] text-[#854f0b]'}`}>
                        {d.status === 'Delivered' ? '✓ Delivered' : '⏱ Waiting'}
                      </span>
                    </td>
                    <td className="border-b border-[#f0f0f0] px-2.5 py-2">
                      <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-medium ${d.category === 'B2B' ? 'bg-[#e6f1fb] text-[#185fa5]' : 'bg-[#f1efe8] text-[#5f5e5a]'}`}>
                        {d.category}
                      </span>
                    </td>
                    <td className="border-b border-[#f0f0f0] px-2.5 py-2 text-[#aaa]">{d.country}</td>
                    <td className="border-b border-[#f0f0f0] px-2.5 py-2 text-right">{d.cards || <span className="text-[#aaa]">—</span>}</td>
                    <td className="border-b border-[#f0f0f0] px-2.5 py-2 text-right">{d.servers || <span className="text-[#aaa]">—</span>}</td>
                    <td className={`border-b border-[#f0f0f0] px-2.5 py-2 text-right font-medium ${overdue ? 'text-[#a32d2d]' : ''}`}>
                      {d.revenue > 0 ? fmtUsdFull(d.revenue) : <span className="text-[#aaa]">—</span>}
                    </td>
                    <td className="border-b border-[#f0f0f0] px-2.5 py-2 text-[10px] text-[#aaa]">{fmtShortDate(d.etd)}</td>
                    <td className="border-b border-[#f0f0f0] px-2.5 py-2 text-[#aaa]">{repByEmail(d.owner).initials}</td>
                    <td className="border-b border-[#f0f0f0] px-2.5 py-2">
                      <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-medium ${inv.cls}`}>{inv.label}</span>
                    </td>
                  </tr>
                )
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-2.5 py-8 text-center text-[#aaa]">No deals match.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
