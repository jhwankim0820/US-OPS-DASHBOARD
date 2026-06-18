'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts'

const reps = [
  {
    name: 'Alex Liu',
    initials: 'AL',
    avatarBg: '#1A2A3A',
    avatarColor: '#B3C6E7',
    cards: 76,
    servers: 17,
    deals: [
      { name: 'Flexgrid', cards: 10, servers: 0, type: 'Sales', amount: '$70,368' },
      { name: 'J.A.M Global', cards: 2, servers: 0, type: 'Sales', amount: '$15,394' },
      { name: 'US Internal (Rack)', cards: 32, servers: 4, type: 'Internal', amount: '—' },
      { name: 'US Internal (Card)', cards: 24, servers: 0, type: 'Internal', amount: '—' },
      { name: 'US Internal (Rental)', cards: 8, servers: 12, type: 'Rental', amount: '—' },
    ],
  },
  {
    name: 'Addison Chi',
    initials: 'AC',
    avatarBg: '#0D2218',
    avatarColor: '#1D9E75',
    cards: 62,
    servers: 7,
    deals: [
      { name: 'MIMOS', cards: 2, servers: 0, type: 'Sales', amount: '$16,000' },
      { name: 'CADT', cards: 4, servers: 1, type: 'Sales', amount: '$100,000' },
      { name: 'NTU CCDS', cards: 48, servers: 6, type: 'Sales', amount: '$800,000' },
      { name: 'SG Keppel Rental', cards: 8, servers: 1, type: 'Rental', amount: '—' },
    ],
  },
  {
    name: 'Tom Gallivan',
    initials: 'TG',
    avatarBg: '#2A1008',
    avatarColor: '#F26B43',
    cards: 64,
    servers: 0,
    deals: [
      { name: 'I/ONX', cards: 64, servers: 0, type: 'Sales', amount: '$511,680' },
    ],
  },
  {
    name: 'Auro Tripathy',
    initials: 'AT',
    avatarBg: '#1A1830',
    avatarColor: '#9090D0',
    cards: 0,
    servers: 0,
    deals: [],
  },
  {
    name: 'Bill Leszinske',
    initials: 'BL',
    avatarBg: '#221508',
    avatarColor: '#C08040',
    cards: 0,
    servers: 0,
    deals: [],
  },
  {
    name: 'Sean Berner',
    initials: 'SB',
    avatarBg: '#1E1E1E',
    avatarColor: '#A0A0A0',
    cards: 0,
    servers: 0,
    deals: [],
  },
]

const typeColors: Record<string, string> = {
  Sales: 'bg-[#E21500]/20 text-[#E21500]',
  Internal: 'bg-[#2A2A2A] text-[#AAAAAA]',
  Rental: 'bg-purple-900/40 text-purple-400',
}

const cardChartData = reps.map((r) => ({ name: r.name.split(' ')[0], value: r.cards }))
const serverChartData = reps.map((r) => ({ name: r.name.split(' ')[0], value: r.servers }))

const totalCards = reps.reduce((s, r) => s + r.cards, 0)
const totalServers = reps.reduce((s, r) => s + r.servers, 0)

const tooltipStyle = {
  background: '#1E1E1E',
  border: '1px solid #2A2A2A',
  borderRadius: 8,
  color: '#E0E0E0',
  fontSize: 12,
}

export default function PocAllocationSection() {
  return (
    <div>
      <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#888888]">POC Allocation by Sales Rep</h2>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: 'Total cards', value: totalCards },
          { label: 'Total servers', value: totalServers },
          { label: 'Active deals', value: reps.reduce((s, r) => s + r.deals.length, 0) },
        ].map((m) => (
          <div key={m.label} className="bg-[#1E1E1E] rounded-xl px-4 py-3 border border-[#333333]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#888888] mb-1">{m.label}</p>
            <p className="text-[32px] font-semibold leading-tight text-white">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Rep rows */}
      <div className="rounded-xl border border-[#333333] bg-[#252525] divide-y divide-[#333333] mb-4">
        {reps.map((r) => {
          const cardPct = totalCards > 0 ? Math.round((r.cards / totalCards) * 100) : 0
          const svrPct = totalServers > 0 ? Math.round((r.servers / totalServers) * 100) : 0
          return (
            <div key={r.name} className="flex items-start gap-3 p-4">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5"
                style={{ background: r.avatarBg, color: r.avatarColor }}
              >
                {r.initials}
              </div>
              <div className="w-28 flex-shrink-0">
                <p className="text-sm font-medium text-white">{r.name}</p>
                <p className="text-xs text-[#888888]">Sales Professional</p>
              </div>
              <div className="flex-1 space-y-1.5">
                {r.cards === 0 && r.servers === 0 ? (
                  <p className="text-xs text-[#888888] py-1">No deals assigned</p>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#AAAAAA] w-11">Cards</span>
                      <div className="flex-1 h-1.5 bg-[#1E1E1E] rounded-full overflow-hidden">
                        <div className="h-full bg-[#E21500] rounded-full" style={{ width: `${cardPct}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-white w-5 text-right">{r.cards}</span>
                      <span className="text-xs text-[#888888] w-8">{cardPct}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#AAAAAA] w-11">Servers</span>
                      <div className="flex-1 h-1.5 bg-[#1E1E1E] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${svrPct}%`, background: 'rgb(124,77,255)' }} />
                      </div>
                      <span className="text-xs font-semibold text-white w-5 text-right">{r.servers}</span>
                      <span className="text-xs text-[#888888] w-8">{svrPct > 0 ? `${svrPct}%` : '—'}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {r.deals.map((d) => (
                        <span key={d.name} className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColors[d.type]}`}>
                          {d.name} · C{d.cards}{d.servers > 0 ? ` S${d.servers}` : ''} · {d.amount}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Cards chart */}
        <div className="rounded-xl border border-[#333333] bg-[#252525] p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-3 h-3 rounded-sm bg-[#E21500] inline-block" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#888888]">Cards per rep</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={cardChartData} layout="vertical" margin={{ left: 0, right: 40 }}>
              <XAxis type="number" tick={{ fontSize: 11, fill: '#666666' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#888888' }} width={60} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => [`${v} units`, 'Cards']} contentStyle={tooltipStyle} />
              <Bar dataKey="value" radius={[0, 3, 3, 0]} barSize={14}>
                {cardChartData.map((d, i) => (
                  <Cell key={i} fill={d.value > 0 ? '#E21500' : '#2A2A2A'} />
                ))}
                <LabelList
                  dataKey="value"
                  position="right"
                  formatter={(v) => (Number(v) > 0 ? String(v) : '')}
                  style={{ fill: '#E21500', fontSize: 11, fontWeight: 600 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Servers chart */}
        <div className="rounded-xl border border-[#333333] bg-[#252525] p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-3 h-3 rounded-sm inline-block" style={{ background: 'rgb(124,77,255)' }} />
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#888888]">Servers per rep</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={serverChartData} layout="vertical" margin={{ left: 0, right: 40 }}>
              <XAxis type="number" tick={{ fontSize: 11, fill: '#666666' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#888888' }} width={60} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => [`${v} units`, 'Servers']} contentStyle={tooltipStyle} />
              <Bar dataKey="value" radius={[0, 3, 3, 0]} barSize={14}>
                {serverChartData.map((d, i) => (
                  <Cell key={i} fill={d.value > 0 ? 'rgb(124,77,255)' : '#2A2A2A'} />
                ))}
                <LabelList
                  dataKey="value"
                  position="right"
                  formatter={(v) => (Number(v) > 0 ? String(v) : '')}
                  style={{ fill: 'rgb(124,77,255)', fontSize: 11, fontWeight: 600 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
