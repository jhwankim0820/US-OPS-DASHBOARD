'use client'

import { useMemo, useState } from 'react'
import { type UsDeal, dealFinance, fmtUsdFull } from '@/lib/us-ops'

// ── Curated quarterly financials (from financial statements, not the deals sheet) ──
const COSTS = [
  { rank: '1', item: 'Salaries', q1: 2309083, q2: 1529174, q3: 2612729, q4: 3322646, badge: 'Largest' },
  { rank: '2', item: 'Employee Benefits', q1: 231621, q2: 143523, q3: 221910, q4: 325823 },
  { rank: '3', item: 'Taxes & Dues', q1: 176976, q2: 126754, q3: 182808, q4: 212637 },
  { rank: '4', item: 'Retirement Benefits', q1: 106868, q2: 102772, q3: 121120, q4: 133296 },
  { rank: '5', item: 'Professional Fees', q1: 120484, q2: 48377, q3: 343305, q4: 95625 },
  { rank: '6', item: 'Travel & Transportation', q1: 97622, q2: 23639, q3: 53429, q4: 82964 },
  { rank: '7', item: 'Depreciation', q1: 69518, q2: 35140, q3: 52667, q4: 71536 },
  { rank: '…', item: 'Others (Rent, R&D, Consumables +2)', q1: 71760, q2: 17239, q3: 31495, q4: 65557, grouped: true },
]
const PL = [
  { q: 'Q1', opLoss: 3174932 },
  { q: 'Q2', opLoss: 2026617 },
  { q: 'Q3', opLoss: 3619463 },
  { q: 'Q4', opLoss: 4760564 },
]

function costK(v: number) {
  return `$${Math.round(v / 1000).toLocaleString('en-US')}K`
}
function fmtK(v: number) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2).replace(/\.?0+$/, '')}M`
  if (v >= 1000) return `$${Math.round(v / 1000)}K`
  return `$${v.toLocaleString('en-US')}`
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul+']
const BAR_FILLS = ['bg-[#7f77dd]', 'bg-[#378add]', 'bg-[#1d9e75]', 'bg-[#ef9f27]', 'bg-[#888780]']

const INV_BADGE: Record<string, { cls: string; label: string }> = {
  issued: { cls: 'bg-[#eaf3de] text-[#3b6d11]', label: '✓ Issued' },
  overdue: { cls: 'bg-[#fcebeb] text-[#a32d2d]', label: '⚠ Overdue' },
  pending: { cls: 'bg-[#faeeda] text-[#854f0b]', label: '⚠ Pending' },
  notyet: { cls: 'bg-[#faeeda] text-[#854f0b]', label: '⚠ Pending' },
  na: { cls: 'border border-[#e5e5e0] bg-[#fafafa] text-[#aaa]', label: 'N/A' },
}
const PAY_BADGE: Record<string, { cls: string; label: string }> = {
  paid: { cls: 'bg-[#eaf3de] text-[#3b6d11]', label: '✓ Paid' },
  unpaid: { cls: 'bg-[#faeeda] text-[#854f0b]', label: '⏱ Unpaid' },
  na: { cls: 'border border-[#e5e5e0] bg-[#fafafa] text-[#aaa]', label: '—' },
}

export default function OverviewTab({ deals }: { deals: UsDeal[] }) {
  const [month, setMonth] = useState('All')
  const [search, setSearch] = useState('')

  const b2b = useMemo(() => deals.filter((d) => d.category === 'B2B'), [deals])

  const totalRev = b2b.reduce((s, d) => s + d.revenue, 0)
  const deliveredRev = b2b.filter((d) => d.status === 'Delivered').reduce((s, d) => s + d.revenue, 0)
  const outstanding = b2b.filter((d) => dealFinance(d).payment === 'unpaid').reduce((s, d) => s + d.revenue, 0)
  const monthRev = (m: number) =>
    b2b.filter((d) => d.status === 'Delivered' && new Date(d.etd).getMonth() === m).reduce((s, d) => s + d.revenue, 0)
  const juneRev = monthRev(5)

  // Revenue by deal (top 4 + others)
  const byDeal = useMemo(() => {
    const sorted = [...b2b].sort((a, b) => b.revenue - a.revenue).filter((d) => d.revenue > 0)
    const top = sorted.slice(0, 4)
    const rest = sorted.slice(4)
    const items = top.map((d) => ({ name: d.customer, rev: d.revenue }))
    if (rest.length) items.push({ name: `Others (${rest.map((d) => d.customer).join(', ')})`, rev: rest.reduce((s, d) => s + d.revenue, 0) })
    return items
  }, [b2b])

  // Monthly delivered revenue
  const monthly = useMemo(() => {
    const arr = [0, 0, 0, 0, 0, 0, 0]
    b2b.filter((d) => d.status === 'Delivered').forEach((d) => {
      const m = new Date(d.etd).getMonth()
      if (isNaN(m)) return
      arr[m >= 6 ? 6 : m] += d.revenue
    })
    return arr
  }, [b2b])
  const monthlyMax = Math.max(...monthly, 1)

  const q = search.trim().toLowerCase()
  const mi = MONTHS.indexOf(month)
  const detailRows = b2b.filter((d) => {
    if (month !== 'All' && new Date(d.dealDate).getMonth() !== mi && new Date(d.etd).getMonth() !== mi) return false
    if (q && !d.customer.toLowerCase().includes(q)) return false
    return true
  })

  const hw = (d: UsDeal) => (d.servers > 0 ? `Rack ×${d.servers} + Cards ×${d.cards}` : `RNGD ×${d.cards}`)

  return (
    <div className="bg-[#F8F9FA] text-[#1a1a1a]">
      {/* KPI stat row */}
      <div className="grid grid-cols-2 border-b border-[#e5e5e0] bg-white sm:grid-cols-4">
        <Kpi label="Operating Loss (Q4)" value="−$4.76M" valueCls="text-[#a32d2d]" sub="vs Q3 −$3.62M · ↑31%" icon="📉" iconCls="bg-[#fcebeb] text-[#a32d2d]" />
        <Kpi label="Net Loss (Q4)" value="−$4.74M" valueCls="text-[#a32d2d]" sub="Cumulative −$13.3M" icon="📊" iconCls="bg-[#eeedfe] text-[#534ab7]" />
        <Kpi label="Cash Balance" value="$973K" sub="↓ from $1.11M in Q3" icon="👛" iconCls="bg-[#faeeda] text-[#854f0b]" />
        <Kpi label="Current Ratio" value="1,214%" valueCls="text-[#0f6e56]" sub="Short-term solvency solid" icon="🛡" iconCls="bg-[#e1f5ee] text-[#0f6e56]" />
      </div>

      <div className="px-5 py-3.5">
        {/* ── REVENUE MANAGEMENT ── */}
        <SectionTitle icon="🪙">Revenue Management</SectionTitle>

        <div className="mb-3.5 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <GradCard from="#f0fdf8" to="#e1f5ee" border="#9fe1cb" labelColor="#0f6e56" valueColor="#085041" label="2026 Cumulative Revenue" value={fmtUsdFull(totalRev)} note="↑ YTD confirmed B2B" />
          <GradCard from="#fefdf0" to="#faeeda" border="#fac775" labelColor="#854f0b" valueColor="#633806" label="This Month (Jun)" value={fmtUsdFull(juneRev)} note="I/ONX delivery · Jun 15" />
          <GradCard from="#fdf5f5" to="#fcebeb" border="#f7c1c1" labelColor="#a32d2d" valueColor="#791f1f" label="Outstanding (Unpaid)" value={fmtUsdFull(outstanding)} note={`${b2b.filter((d) => dealFinance(d).payment === 'unpaid').length} deals · not yet received`} />
          <div className="rounded-[10px] border border-[#e5e5e0] bg-white p-3">
            <div className="mb-1 text-[10px] font-medium text-[#888]">Delivered Revenue</div>
            <div className="text-[20px] font-medium">{fmtUsdFull(deliveredRev)}</div>
            <div className="mt-0.5 text-[10px] text-[#888]">{b2b.filter((d) => d.status === 'Delivered').length} deals · Delivered B2B</div>
          </div>
        </div>

        <div className="mb-3.5 grid grid-cols-1 gap-2.5 lg:grid-cols-2">
          {/* Revenue by deal */}
          <Card>
            <CardTitle icon="◍" color="#185fa5">2026 Revenue by Deal</CardTitle>
            <p className="mb-2.5 text-[10px] text-[#888]">Breakdown by deal · delivered vs pipeline</p>
            <div className="flex flex-col gap-1.5">
              {byDeal.map((it, i) => {
                const pct = totalRev ? Math.round((it.rev / totalRev) * 100) : 0
                return (
                  <div key={it.name}>
                    <div className="mb-0.5 flex justify-between text-[11px]">
                      <span className="truncate pr-2">{it.name}</span>
                      <span className="font-medium whitespace-nowrap">{fmtK(it.rev)} · {pct}%</span>
                    </div>
                    <div className="h-1 overflow-hidden rounded bg-[#f0f0ea]">
                      <div className={`h-full rounded ${BAR_FILLS[i % BAR_FILLS.length]}`} style={{ width: `${Math.max(pct, 2)}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Monthly bar chart */}
          <Card>
            <CardTitle icon="▥" color="#1d9e75">2026 Monthly Revenue</CardTitle>
            <p className="mb-2.5 text-[10px] text-[#888]">Revenue recognized by delivery month</p>
            <div className="flex h-[90px] items-end gap-1.5 px-1">
              {monthly.map((v, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                  <div className="flex h-[70px] items-end">
                    <div
                      className="w-5 rounded-t bg-[#7f77dd]"
                      style={{ height: `${Math.max((v / monthlyMax) * 70, v > 0 ? 6 : 2)}px`, background: v > 0 ? undefined : '#f0f0ea' }}
                      title={v > 0 ? fmtUsdFull(v) : ''}
                    />
                  </div>
                  <div className="text-[9px] text-[#888]">{MONTHS[i]}</div>
                </div>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-[#888]">
              <Legend color="#1d9e75" label="Card Only" />
              <Legend color="#378add" label="Delivered B2B" />
              <Legend color="#7f77dd" label="Rack Server" />
            </div>
          </Card>
        </div>

        {/* Revenue detail table */}
        <SectionTitle icon="≣">Revenue Detail</SectionTitle>
        <div className="mb-2.5 flex flex-wrap items-center gap-2">
          <select className="rounded-[7px] border border-[#e0e0e0] bg-white px-2.5 py-1.5 text-[11px]" value="2026" disabled>
            <option>2026</option>
          </select>
          <select className="rounded-[7px] border border-[#e0e0e0] bg-white px-2.5 py-1.5 text-[11px]" value={month} onChange={(e) => setMonth(e.target.value)}>
            <option value="All">All months</option>
            <option value="May">May</option>
            <option value="Jun">Jun</option>
            <option value="Jul+">Jul+</option>
          </select>
          <input className="min-w-[140px] flex-1 rounded-[7px] border border-[#e0e0e0] bg-white px-2.5 py-1.5 text-[11px]" placeholder="Search deal name, customer, channel..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="mb-3.5 overflow-hidden rounded-[10px] border border-[#e5e5e0] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-[11px]">
              <thead>
                <tr className="bg-[#fafafa] text-left text-[10px] font-medium text-[#888]">
                  <Th>Deal Name</Th><Th>Type</Th><Th>Channel</Th><Th>Amount</Th>
                  <Th>Deal Date</Th><Th>Expected Pay</Th><Th>Paid Date</Th><Th>Payment</Th><Th>Invoice</Th>
                </tr>
              </thead>
              <tbody>
                {detailRows.map((d) => {
                  const fin = dealFinance(d)
                  const inv = INV_BADGE[fin.invoice]
                  const pay = PAY_BADGE[fin.payment]
                  const overdue = fin.invoice === 'overdue'
                  return (
                    <tr key={d.id} className={`hover:bg-[#fafafa] ${overdue ? 'bg-[#fff8f8]' : ''}`}>
                      <Td className="font-medium">{d.customer} · {hw(d)}</Td>
                      <Td><span className="inline-flex rounded-full bg-[#e6f1fb] px-1.5 py-0.5 text-[9px] font-medium text-[#185fa5]">B2B</span></Td>
                      <Td><span className="inline-flex rounded-full bg-[#eeedfe] px-1.5 py-0.5 text-[9px] font-medium text-[#534ab7]">{fin.channel}</span></Td>
                      <Td className={`font-medium ${overdue ? 'text-[#a32d2d]' : ''}`}>{fmtUsdFull(d.revenue)}</Td>
                      <Td className="text-[#aaa]">{d.dealDate || '—'}</Td>
                      <Td className="text-[#aaa]">{fin.expectedPay || '—'}</Td>
                      <Td className="text-[#aaa]">{fin.paidDate || '—'}</Td>
                      <Td><span className={`inline-flex rounded-full px-1.5 py-0.5 text-[9px] font-medium ${pay.cls}`}>{pay.label}</span></Td>
                      <Td><span className={`inline-flex rounded-full px-1.5 py-0.5 text-[9px] font-medium ${inv.cls}`}>{inv.label}</span></Td>
                    </tr>
                  )
                })}
                {detailRows.length === 0 && (
                  <tr><td colSpan={9} className="px-2.5 py-8 text-center text-[#aaa]">No deals match.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="my-4 h-px bg-[#e5e5e0]" />

        {/* ── COST & P&L ── */}
        <SectionTitle icon="🏛">Cost &amp; P&amp;L</SectionTitle>

        <div className="mb-3.5 grid grid-cols-1 gap-2.5 lg:grid-cols-2">
          {/* P&L trend */}
          <Card>
            <CardTitle icon="▥" color="#1d9e75">Quarterly P&amp;L Trend</CardTitle>
            <p className="mb-2.5 text-[10px] text-[#888]">Revenue vs Operating Loss by quarter</p>
            <div className="flex h-[80px] items-end gap-1.5 px-1">
              {PL.map((p) => {
                const maxLoss = Math.max(...PL.map((x) => x.opLoss))
                return (
                  <div key={p.q} className="flex flex-1 flex-col items-center gap-1">
                    <div className="flex h-[70px] w-full items-end justify-center gap-0.5">
                      <div className="w-3 rounded-t bg-[#1d9e75]" style={{ height: '2px' }} />
                      <div className="w-3 rounded-t bg-[#e24b4a]" style={{ height: `${(p.opLoss / maxLoss) * 70}px` }} title={`−${fmtK(p.opLoss)}`} />
                    </div>
                    <div className="text-[9px] text-[#888]">{p.q}</div>
                  </div>
                )
              })}
            </div>
            <div className="mt-2 flex gap-3 text-[10px] text-[#888]">
              <Legend color="#1d9e75" label="Revenue" />
              <Legend color="#e24b4a" label="Operating Loss" />
            </div>
          </Card>

          {/* Liquidity */}
          <Card>
            <CardTitle icon="⚡" color="#185fa5">Liquidity &amp; Financial Health</CardTitle>
            <p className="mb-2.5 text-[10px] text-[#888]">Balance sheet snapshot · Q4 FY25</p>
            <div className="grid grid-cols-2 gap-2">
              <Mini label="Total Assets" value="$1.12M" sub="↓ from $1.18M Q3" subCls="text-[#a32d2d]" />
              <Mini label="Total Liabilities" value="$100K" sub="Lease liabilities" subCls="text-[#888]" />
              <Mini label="Total Equity" value="$1.02M" sub="Retained deficit" subCls="text-[#888]" />
              <Mini label="Current Ratio" value="1,214%" valueCls="text-[#1d9e75]" sub="Solvency solid" subCls="text-[#0f6e56]" />
            </div>
          </Card>
        </div>

        {/* Cost breakdown */}
        <SectionTitle icon="▦">Cost Breakdown — All Quarters</SectionTitle>
        <p className="mb-2 text-[10px] text-[#888]">Q1 = FY24 · Q2 = H1&apos;25 · Q3 = 9M&apos;25 · Q4 = FY25</p>
        <div className="mb-3.5 overflow-hidden rounded-[10px] border border-[#e5e5e0] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse text-[11px]">
              <thead>
                <tr className="bg-[#fafafa] text-left text-[10px] font-medium text-[#888]">
                  <Th>#</Th><Th>Item</Th>
                  <Th className="text-right">Q1</Th><Th className="text-right">Q2</Th>
                  <Th className="text-right">Q3</Th><Th className="text-right">Q4</Th>
                  <Th className="text-center">QoQ</Th>
                </tr>
              </thead>
              <tbody>
                {COSTS.map((c) => {
                  const qoq = c.grouped ? null : ((c.q4 - c.q3) / Math.abs(c.q3)) * 100
                  return (
                    <tr key={c.rank} className="hover:bg-[#fafafa]">
                      <Td className="text-[#aaa]">{c.rank}</Td>
                      <Td>
                        <span className="font-medium">{c.item}</span>
                        {c.badge && <span className="ml-1.5 inline-flex rounded-full bg-[#faeeda] px-1.5 py-0.5 text-[9px] font-medium text-[#854f0b]">{c.badge}</span>}
                      </Td>
                      <Td className="text-right text-[#aaa]">{costK(c.q1)}</Td>
                      <Td className="text-right text-[#aaa]">{costK(c.q2)}</Td>
                      <Td className="text-right text-[#aaa]">{costK(c.q3)}</Td>
                      <Td className="text-right font-medium">{costK(c.q4)}</Td>
                      <Td className="text-center">
                        {qoq === null ? (
                          <span className="inline-flex rounded-full border border-[#e5e5e0] bg-[#fafafa] px-1.5 py-0.5 text-[9px] text-[#888]">grouped</span>
                        ) : (
                          <span className={`inline-flex rounded-full px-1.5 py-0.5 text-[9px] font-medium ${qoq < 0 ? 'bg-[#eaf3de] text-[#3b6d11]' : 'bg-[#fcebeb] text-[#a32d2d]'}`}>
                            {qoq < 0 ? '↓ −' : '↑ +'}{Math.abs(qoq).toFixed(1)}%
                          </span>
                        )}
                      </Td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function Kpi({ label, value, sub, icon, iconCls, valueCls }: { label: string; value: string; sub: string; icon: string; iconCls: string; valueCls?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-r border-[#e5e5e0] px-4 py-3 last:border-r-0 sm:border-b-0">
      <div className="min-w-0">
        <div className="text-[10px] font-medium text-[#888]">{label}</div>
        <div className={`text-[18px] font-medium ${valueCls ?? 'text-[#1a1a1a]'}`}>{value}</div>
        <div className="mt-0.5 truncate text-[10px] text-[#aaa]">{sub}</div>
      </div>
      <div className={`flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-[7px] text-sm ${iconCls}`}>{icon}</div>
    </div>
  )
}

function GradCard({ from, to, border, labelColor, valueColor, label, value, note }: { from: string; to: string; border: string; labelColor: string; valueColor: string; label: string; value: string; note: string }) {
  return (
    <div className="rounded-[10px] border p-3" style={{ background: `linear-gradient(135deg, ${from}, ${to})`, borderColor: border }}>
      <div className="mb-1 text-[10px] font-medium" style={{ color: labelColor }}>{label}</div>
      <div className="text-[20px] font-medium" style={{ color: valueColor }}>{value}</div>
      <div className="mt-0.5 text-[10px]" style={{ color: labelColor }}>{note}</div>
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-[10px] border border-[#e5e5e0] bg-white p-3.5">{children}</div>
}
function CardTitle({ children, icon, color }: { children: React.ReactNode; icon: string; color: string }) {
  return <div className="mb-0.5 flex items-center gap-1.5 text-[12px] font-medium"><span style={{ color }}>{icon}</span> {children}</div>
}
function SectionTitle({ children, icon }: { children: React.ReactNode; icon: string }) {
  return <div className="mb-2 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-[#888]"><span>{icon}</span> {children}</div>
}
function Legend({ color, label }: { color: string; label: string }) {
  return <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm" style={{ background: color }} />{label}</span>
}
function Mini({ label, value, sub, subCls, valueCls }: { label: string; value: string; sub: string; subCls: string; valueCls?: string }) {
  return (
    <div className="rounded-[7px] bg-[#fafafa] p-2.5">
      <div className="mb-0.5 text-[10px] text-[#888]">{label}</div>
      <div className={`text-[14px] font-medium ${valueCls ?? 'text-[#1a1a1a]'}`}>{value}</div>
      <div className={`mt-0.5 text-[10px] ${subCls}`}>{sub}</div>
    </div>
  )
}
function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <th className={`border-b border-[#e5e5e0] px-2.5 py-2 ${className}`}>{children}</th>
}
function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`border-b border-[#f0f0f0] px-2.5 py-2 ${className}`}>{children}</td>
}
