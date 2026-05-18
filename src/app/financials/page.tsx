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
  q1: number  // FY24 full year
  q2: number  // H1 2025 (Jan–Jun)
  q3: number  // 9M 2025 (Jan–Sep)
  q4: number  // FY25 full year
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

export default function FinancialsPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* ─── KPI Strip ─────────────────────────────────────────────────── */}
      <div className="bg-gray-900 px-6 py-8 sm:px-10">
        <p className="mb-5 text-xs font-bold uppercase tracking-widest text-gray-400">
          Key Profitability Metrics
        </p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-gray-700 bg-gray-800 p-5">
            <p className="text-xs text-gray-400">Revenue (Cumulative)</p>
            <p className="mt-2 text-3xl font-bold text-white">$9,000</p>
            <p className="mt-1 text-xs text-gray-500">Service sales only</p>
          </div>
          <div className="rounded-xl border border-gray-700 bg-gray-800 p-5">
            <p className="text-xs text-gray-400">Operating Loss (Q4)</p>
            <p className="mt-2 text-3xl font-bold text-red-400">−$4.76M</p>
            <p className="mt-1 text-xs text-gray-500">vs Q3 −$3.62M</p>
          </div>
          <div className="rounded-xl border border-gray-700 bg-gray-800 p-5">
            <p className="text-xs text-gray-400">Net Loss (Q4)</p>
            <p className="mt-2 text-3xl font-bold text-red-400">−$4.74M</p>
            <p className="mt-1 text-xs text-gray-500">Cumulative −$13.3M</p>
          </div>
          <div className="rounded-xl border border-gray-700 bg-gray-800 p-5">
            <p className="text-xs text-gray-400">Cash Balance</p>
            <p className="mt-2 text-3xl font-bold text-white">$973K</p>
            <p className="mt-1 text-xs text-gray-500">↓ from $1.11M in Q3</p>
          </div>
        </div>
      </div>

      <div className="space-y-8 p-6 sm:p-10">
        {/* ─── Quarterly P&L Trend ──────────────────────────────────────── */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <p className="mb-1 text-xs font-bold uppercase tracking-widest text-gray-500">
            Quarterly P&amp;L Trend
          </p>
          <div className="mb-5 flex items-center gap-5">
            <span className="flex items-center gap-1.5 text-xs text-gray-600">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-blue-500" />
              Revenue
            </span>
            <span className="flex items-center gap-1.5 text-xs text-gray-600">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-red-500" />
              Operating Loss
            </span>
          </div>
          <ResponsiveContainer width="100%" height={310}>
            <ComposedChart data={plData} margin={{ top: 10, right: 70, bottom: 0, left: 10 }} barCategoryGap="35%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis
                dataKey="quarter"
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="rev"
                orientation="left"
                domain={[0, 9000]}
                tickFormatter={(v) => `$${v.toLocaleString()}`}
                tick={{ fontSize: 11, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
                width={68}
                label={{
                  value: 'Revenue (USD)',
                  angle: -90,
                  position: 'insideLeft',
                  offset: 15,
                  style: { fontSize: 10, fill: '#9ca3af', textAnchor: 'middle' },
                }}
              />
              <YAxis
                yAxisId="loss"
                orientation="right"
                domain={[-5000000, 0]}
                tickFormatter={(v) =>
                  v === 0 ? '$0.0M' : `-$${Math.abs(v / 1000000).toFixed(1)}M`
                }
                tick={{ fontSize: 11, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
                width={68}
                label={{
                  value: 'Operating Loss (USD)',
                  angle: 90,
                  position: 'insideRight',
                  offset: 15,
                  style: { fontSize: 10, fill: '#9ca3af', textAnchor: 'middle' },
                }}
              />
              <Tooltip
                formatter={(value: unknown, name: unknown) => {
                  const n = Number(value)
                  if (name === 'revenue') return [`$${n.toLocaleString()}`, 'Revenue']
                  return [`−$${Math.abs(n / 1000000).toFixed(2)}M`, 'Operating Loss']
                }}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
              />
              <Bar
                yAxisId="rev"
                dataKey="revenue"
                fill="#3B82F6"
                name="revenue"
                barSize={28}
                radius={[3, 3, 0, 0]}
              />
              <Bar
                yAxisId="loss"
                dataKey="opLoss"
                fill="#EF4444"
                name="opLoss"
                barSize={28}
                radius={[0, 0, 3, 3]}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* ─── Cost Breakdown ──────────────────────────────────────────── */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-6 py-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
                Cost Breakdown — All Quarters (USD, by Q4 size)
              </p>
              <p className="text-xs text-gray-400">Q1 = FY24 · Q2 = H1&apos;25 · Q3 = 9M&apos;25 · Q4 = FY25</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left">
                  <th className="w-10 py-3 pl-6 text-xs font-medium text-gray-400"></th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500">Item</th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-400">Q1</th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-400">Q2</th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-400">Q3</th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-700">Q4</th>
                  <th className="py-3 pr-6 text-right text-xs font-medium text-gray-500">QoQ</th>
                </tr>
              </thead>
              <tbody>
                {costs.map((c) => {
                  const qoq = c.grouped ? null : ((c.q4 - c.q3) / Math.abs(c.q3)) * 100
                  return (
                    <tr
                      key={String(c.rank)}
                      className="border-b border-gray-50 last:border-0 hover:bg-gray-50"
                    >
                      <td className="py-3.5 pl-6 text-sm text-gray-400">{c.rank}</td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm font-medium text-gray-900">{c.item}</span>
                        {c.badge === 'Largest' && (
                          <span className="ml-2 rounded-full bg-gray-900 px-2 py-0.5 text-xs font-semibold text-white">
                            Largest
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3.5 text-right text-xs text-gray-400">
                        {fmtAmtK(c.q1)}
                      </td>
                      <td className="px-3 py-3.5 text-right text-xs text-gray-400">
                        {fmtAmtK(c.q2)}
                      </td>
                      <td className="px-3 py-3.5 text-right text-xs text-gray-400">
                        {fmtAmtK(c.q3)}
                      </td>
                      <td className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                        {fmtAmtK(c.q4)}
                      </td>
                      <td className="py-3.5 pr-6 text-right">
                        {qoq === null ? (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
                            grouped
                          </span>
                        ) : (
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                              qoq < 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
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

        {/* ─── Liquidity & Financial Health ─────────────────────────────── */}
        <div>
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-500">
            Liquidity &amp; Financial Health
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <p className="text-xs text-gray-500">Total Assets</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">$1.12M</p>
              <p className="mt-1 text-xs text-gray-400">↓ from $1.18M in Q3</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <p className="text-xs text-gray-500">Total Liabilities</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">$100K</p>
              <p className="mt-1 text-xs text-gray-400">Mainly lease liabilities</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <p className="text-xs text-gray-500">Total Equity</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">$1.02M</p>
              <p className="mt-1 text-xs text-gray-400">Retained deficit ongoing</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <p className="text-xs text-gray-500">Current Ratio</p>
              <p className="mt-2 text-2xl font-bold text-emerald-500">1,214%</p>
              <p className="mt-1 text-xs text-gray-400">Short-term solvency solid</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
