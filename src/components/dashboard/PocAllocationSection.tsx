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
    avatarBg: '#E6F1FB',
    avatarColor: '#0C447C',
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
    avatarBg: '#E1F5EE',
    avatarColor: '#085041',
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
    avatarBg: '#FAECE7',
    avatarColor: '#712B13',
    cards: 64,
    servers: 0,
    deals: [
      { name: 'I/ONX', cards: 64, servers: 0, type: 'Sales', amount: '$511,680' },
    ],
  },
  {
    name: 'Auro Tripathy',
    initials: 'AT',
    avatarBg: '#EEEDFE',
    avatarColor: '#3C3489',
    cards: 0,
    servers: 0,
    deals: [],
  },
  {
    name: 'Bill Leszinske',
    initials: 'BL',
    avatarBg: '#FAEEDA',
    avatarColor: '#633806',
    cards: 0,
    servers: 0,
    deals: [],
  },
  {
    name: 'Sean Berner',
    initials: 'SB',
    avatarBg: '#F1EFE8',
    avatarColor: '#444441',
    cards: 0,
    servers: 0,
    deals: [],
  },
]

const typeColors: Record<string, string> = {
  Sales: 'bg-blue-100 text-blue-800',
  Internal: 'bg-gray-100 text-gray-700',
  Rental: 'bg-purple-100 text-purple-800',
}

const cardChartData = reps.map((r) => ({ name: r.name.split(' ')[0], value: r.cards }))
const serverChartData = reps.map((r) => ({ name: r.name.split(' ')[0], value: r.servers }))

const totalCards = reps.reduce((s, r) => s + r.cards, 0)
const totalServers = reps.reduce((s, r) => s + r.servers, 0)

export default function PocAllocationSection() {
  return (
    <div>
      <h2 className="mb-3 text-lg font-semibold">POC Allocation by Sales Rep</h2>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: 'Total cards', value: totalCards },
          { label: 'Total servers', value: totalServers },
          { label: 'Active deals', value: reps.reduce((s, r) => s + r.deals.length, 0) },
        ].map((m) => (
          <div key={m.label} className="bg-gray-100 rounded-xl px-4 py-3">
            <p className="text-xs text-gray-500 mb-1">{m.label}</p>
            <p className="text-xl font-semibold text-gray-900">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Rep rows */}
      <div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100 mb-4">
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
                <p className="text-sm font-medium text-gray-900">{r.name}</p>
                <p className="text-xs text-gray-400">Sales Professional</p>
              </div>
              <div className="flex-1 space-y-1.5">
                {r.cards === 0 && r.servers === 0 ? (
                  <p className="text-xs text-gray-400 py-1">No deals assigned</p>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-11">Cards</span>
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${cardPct}%` }} />
                      </div>
                      <span className="text-xs font-medium text-gray-900 w-5 text-right">{r.cards}</span>
                      <span className="text-xs text-gray-400 w-8">{cardPct}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-11">Servers</span>
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-teal-500 rounded-full" style={{ width: `${svrPct}%` }} />
                      </div>
                      <span className="text-xs font-medium text-gray-900 w-5 text-right">{r.servers}</span>
                      <span className="text-xs text-gray-400 w-8">{svrPct > 0 ? `${svrPct}%` : '—'}</span>
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
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-3 h-3 rounded-sm bg-blue-500 inline-block" />
            <p className="text-sm font-medium text-gray-700">Cards per rep</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={cardChartData} layout="vertical" margin={{ left: 0, right: 40 }}>
              <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={60} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => [`${v} units`, 'Cards']} />
              <Bar dataKey="value" radius={[0, 3, 3, 0]} barSize={14}>
                {cardChartData.map((d, i) => (
                  <Cell key={i} fill={d.value > 0 ? '#378ADD' : '#D3D1C7'} />
                ))}
                <LabelList
                  dataKey="value"
                  position="right"
                  formatter={(v) => (Number(v) > 0 ? String(v) : '')}
                  style={{ fill: '#378ADD', fontSize: 11, fontWeight: 600 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Servers chart */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-3 h-3 rounded-sm bg-teal-500 inline-block" />
            <p className="text-sm font-medium text-gray-700">Servers per rep</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={serverChartData} layout="vertical" margin={{ left: 0, right: 40 }}>
              <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={60} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => [`${v} units`, 'Servers']} />
              <Bar dataKey="value" radius={[0, 3, 3, 0]} barSize={14}>
                {serverChartData.map((d, i) => (
                  <Cell key={i} fill={d.value > 0 ? '#1D9E75' : '#D3D1C7'} />
                ))}
                <LabelList
                  dataKey="value"
                  position="right"
                  formatter={(v) => (Number(v) > 0 ? String(v) : '')}
                  style={{ fill: '#1D9E75', fontSize: 11, fontWeight: 600 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
