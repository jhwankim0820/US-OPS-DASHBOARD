'use client'

import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

interface CostItem {
  rank: number | string
  item: string
  q1: number
  q2: number
  q3: number
  q4: number
  badge?: 'Largest'
  grouped?: boolean
}

const plData = [
  { quarter: 'FY25 Q1', revenue: 9000, opLoss: -3174932 },
  { quarter: 'FY25 Q2', revenue: 0, opLoss: -2026617 },
  { quarter: 'FY25 Q3', revenue: 0, opLoss: -3619463 },
  { quarter: 'FY25 Q4', revenue: 0, opLoss: -4760564 },
]

const costs: CostItem[] = [
  { rank: 1, item: 'Salaries',                              q1: 2309083, q2: 1529174, q3: 2612729, q4: 3322646, badge: 'Largest' },
  { rank: 2, item: 'Employee Benefits',                     q1: 231621,  q2: 143523,  q3: 221910,  q4: 325823 },
  { rank: 3, item: 'Taxes & Dues',                          q1: 176976,  q2: 126754,  q3: 182808,  q4: 212637 },
  { rank: 4, item: 'Retirement Benefits',                   q1: 106868,  q2: 102772,  q3: 121120,  q4: 133296 },
  { rank: 5, item: 'Professional Fees',                     q1: 120484,  q2: 48377,   q3: 343305,  q4: 95625 },
  { rank: 6, item: 'Travel & Transportation',               q1: 97622,   q2: 23639,   q3: 53429,   q4: 82964 },
  { rank: 7, item: 'Depreciation',                          q1: 69518,   q2: 35140,   q3: 52667,   q4: 71536 },
  { rank: '…', item: 'Others (Rent, R&D, Consumables + 2 more)', q1: 71760, q2: 17239, q3: 31495, q4: 65557, grouped: true },
]

function fmtAmtK(v: number) {
  return `$${(v / 1000).toLocaleString('en-US', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}K`
}

const tooltipStyle = {
  background: '#20202c',
  border: '1px solid #35353f',
  borderRadius: 8,
  color: '#E0E0E0',
  fontSize: 12,
}

export default function FinancialsPage() {
  return (
    <main className="min-h-screen bg-[#1c1c22]">
      {/* KPI Strip */}
      <div className="bg-[#16161c] border-b border-[#3a3a48] px-6 py-8 sm:px-10">
        <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#888888]">
          Key Profitability Metrics
        </p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-[#3a3a48] bg-[#2a2a35] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#888888]">Revenue (Cumulative)</p>
            <p className="mt-2 text-[36px] font-semibold leading-tight text-white">$9,000</p>
            <p className="mt-1 text-xs text-[#888888]">Service sales only</p>
          </div>
          <div className="rounded-xl border border-[#3a3a48] bg-[#2a2a35] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#888888]">Operating Loss (Q4)</p>
            <p className="mt-2 text-[36px] font-semibold leading-tight text-[#E21500]">−$4.76M</p>
            <p className="mt-1 text-xs text-[#888888]">vs Q3 −$3.62M</p>
          </div>
          <div className="rounded-xl border border-[#3a3a48] bg-[#2a2a35] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#888888]">Net Loss (Q4)</p>
            <p className="mt-2 text-[36px] font-semibold leading-tight text-[#E21500]">−$4.74M</p>
            <p className="mt-1 text-xs text-[#888888]">Cumulative −$13.3M</p>
          </div>
          <div className="rounded-xl border border-[#3a3a48] bg-[#2a2a35] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#888888]">Cash Balance</p>
            <p className="mt-2 text-[36px] font-semibold leading-tight text-white">$973K</p>
            <p className="mt-1 text-xs text-[#888888]">↓ from $1.11M in Q3</p>
          </div>
        </div>
      </div>

      <div className="space-y-8 p-6 sm:p-10">
        {/* Quarterly P&L Trend */}
        <div className="rounded-xl border border-[#3a3a48] bg-[#2a2a35] p-6">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#888888]">
            Quarterly P&amp;L Trend
          </p>
          <div className="mb-5 flex items-center gap-5">
            <span className="flex items-center gap-1.5 text-xs text-[#AAAAAA]">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#B3C6E7]" />
              Revenue
            </span>
            <span className="flex items-center gap-1.5 text-xs text-[#AAAAAA]">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#E21500]" />
              Operating Loss
            </span>
          </div>
          <ResponsiveContainer width="100%" height={310}>
            <ComposedChart data={plData} margin={{ top: 10, right: 70, bottom: 0, left: 10 }} barCategoryGap="35%">
              <CartesianGrid strokeDasharray="3 3" stroke="#35353f" vertical={false} />
              <XAxis
                dataKey="quarter"
                tick={{ fontSize: 12, fill: '#666666' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="rev"
                orientation="left"
                domain={[0, 9000]}
                tickFormatter={(v) => `$${v.toLocaleString()}`}
                tick={{ fontSize: 11, fill: '#666666' }}
                axisLine={false}
                tickLine={false}
                width={68}
                label={{
                  value: 'Revenue (USD)',
                  angle: -90,
                  position: 'insideLeft',
                  offset: 15,
                  style: { fontSize: 10, fill: '#555555', textAnchor: 'middle' },
                }}
              />
              <YAxis
                yAxisId="loss"
                orientation="right"
                domain={[-5000000, 0]}
                tickFormatter={(v) =>
                  v === 0 ? '$0.0M' : `-$${Math.abs(v / 1000000).toFixed(1)}M`
                }
                tick={{ fontSize: 11, fill: '#666666' }}
                axisLine={false}
                tickLine={false}
                width={68}
                label={{
                  value: 'Operating Loss (USD)',
                  angle: 90,
                  position: 'insideRight',
                  offset: 15,
                  style: { fontSize: 10, fill: '#555555', textAnchor: 'middle' },
                }}
              />
              <Tooltip
                formatter={(value: unknown, name: unknown) => {
                  const n = Number(value)
                  if (name === 'revenue') return [`$${n.toLocaleString()}`, 'Revenue']
                  return [`−$${Math.abs(n / 1000000).toFixed(2)}M`, 'Operating Loss']
                }}
                contentStyle={tooltipStyle}
              />
              <Bar
                yAxisId="rev"
                dataKey="revenue"
                fill="#B3C6E7"
                name="revenue"
                barSize={28}
                radius={[3, 3, 0, 0]}
              />
              <Bar
                yAxisId="loss"
                dataKey="opLoss"
                fill="#E21500"
                name="opLoss"
                barSize={28}
                radius={[0, 0, 3, 3]}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Cost Breakdown */}
        <div className="overflow-hidden rounded-xl border border-[#3a3a48] bg-[#2a2a35]">
          <div className="border-b border-[#3a3a48] px-6 py-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#888888]">
                Cost Breakdown — All Quarters (USD, by Q4 size)
              </p>
              <p className="text-xs text-[#888888]">Q1 = FY24 · Q2 = H1&apos;25 · Q3 = 9M&apos;25 · Q4 = FY25</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-[#3a3a48] bg-[#20202c] text-left">
                  <th className="w-10 py-3 pl-6 text-xs font-medium text-[#888888]"></th>
                  <th className="px-4 py-3 text-xs font-medium text-[#AAAAAA]">Item</th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-[#888888]">Q1</th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-[#888888]">Q2</th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-[#888888]">Q3</th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-white">Q4</th>
                  <th className="py-3 pr-6 text-right text-xs font-medium text-[#AAAAAA]">QoQ</th>
                </tr>
              </thead>
              <tbody>
                {costs.map((c) => {
                  const qoq = c.grouped ? null : ((c.q4 - c.q3) / Math.abs(c.q3)) * 100
                  return (
                    <tr
                      key={String(c.rank)}
                      className="border-b border-[#35353f] last:border-0 hover:bg-[#35353f]"
                    >
                      <td className="py-3.5 pl-6 text-sm text-[#888888]">{c.rank}</td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm font-medium text-white">{c.item}</span>
                        {c.badge === 'Largest' && (
                          <span className="ml-2 rounded-full bg-[#E21500] px-2 py-0.5 text-xs font-semibold text-white">
                            Largest
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3.5 text-right text-xs text-[#888888]">
                        {fmtAmtK(c.q1)}
                      </td>
                      <td className="px-3 py-3.5 text-right text-xs text-[#888888]">
                        {fmtAmtK(c.q2)}
                      </td>
                      <td className="px-3 py-3.5 text-right text-xs text-[#888888]">
                        {fmtAmtK(c.q3)}
                      </td>
                      <td className="px-3 py-3.5 text-right text-sm font-semibold text-white">
                        {fmtAmtK(c.q4)}
                      </td>
                      <td className="py-3.5 pr-6 text-right">
                        {qoq === null ? (
                          <span className="inline-flex items-center rounded-full bg-[#35353f] px-2 py-0.5 text-xs font-semibold text-[#AAAAAA]">
                            grouped
                          </span>
                        ) : (
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                              qoq < 0 ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'
                            }`}
                          >
                            {qoq > 0 ? '+' : ''}
                            {qoq.toFixed(1)}%
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Liquidity & Financial Health */}
        <div>
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#888888]">
            Liquidity &amp; Financial Health
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-[#3a3a48] bg-[#2a2a35] p-5">
              <p className="text-xs text-[#AAAAAA]">Total Assets</p>
              <p className="mt-2 text-2xl font-bold text-white">$1.12M</p>
              <p className="mt-1 text-xs text-[#888888]">↓ from $1.18M in Q3</p>
            </div>
            <div className="rounded-xl border border-[#3a3a48] bg-[#2a2a35] p-5">
              <p className="text-xs text-[#AAAAAA]">Total Liabilities</p>
              <p className="mt-2 text-2xl font-bold text-white">$100K</p>
              <p className="mt-1 text-xs text-[#888888]">Mainly lease liabilities</p>
            </div>
            <div className="rounded-xl border border-[#3a3a48] bg-[#2a2a35] p-5">
              <p className="text-xs text-[#AAAAAA]">Total Equity</p>
              <p className="mt-2 text-2xl font-bold text-white">$1.02M</p>
              <p className="mt-1 text-xs text-[#888888]">Retained deficit ongoing</p>
            </div>
            <div className="rounded-xl border border-[#3a3a48] bg-[#2a2a35] p-5">
              <p className="text-xs text-[#AAAAAA]">Current Ratio</p>
              <p className="mt-2 text-2xl font-bold text-emerald-400">1,214%</p>
              <p className="mt-1 text-xs text-[#888888]">Short-term solvency solid</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
