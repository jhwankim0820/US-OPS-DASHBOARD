'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const cardData = [
  { name: 'In stock', value: 24 },
  { name: 'POC reserved', value: 16 },
]

const serverData = [
  { name: 'In stock', value: 10 },
  { name: 'POC reserved', value: 6 },
]

const COLORS = ['#378ADD', '#FAC775']

const pocSchedule = {
  cards: [
    { label: 'AWS', qty: '8 cards', month: 'Jun', color: 'bg-amber-100 text-amber-800' },
    { label: 'Meta', qty: '8 cards', month: 'Jul', color: 'bg-gray-100 text-gray-700' },
  ],
  servers: [
    { label: 'Google', qty: '4 svr', month: 'Jun', color: 'bg-blue-100 text-blue-800' },
    { label: 'Microsoft', qty: '2 svr', month: 'Jul', color: 'bg-purple-100 text-purple-800' },
  ],
}

interface DonutProps {
  data: { name: string; value: number }[]
  total: number
  label: string
  schedule: { label: string; qty: string; month: string; color: string }[]
}

function InventoryDonut({ data, total, label, schedule }: DonutProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <p className="text-sm font-semibold text-gray-800 mb-4">{label}</p>
      <div className="flex items-center gap-5">
        <div className="relative w-28 h-28 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={36}
                outerRadius={52}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => [`${v} units`, '']} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xl font-semibold text-gray-900">{total}</span>
            <span className="text-xs text-gray-400">total</span>
          </div>
        </div>

        <div className="flex-1 space-y-3">
          <div className="space-y-1.5">
            {data.map((d, i) => (
              <div key={d.name} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: COLORS[i] }} />
                  <span className="text-xs text-gray-500">{d.name}</span>
                </div>
                <span className="text-xs font-medium text-gray-900">{d.value}</span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-1.5">Upcoming POC</p>
            <div className="flex flex-wrap gap-1.5">
              {schedule.map((s) => (
                <span key={s.label} className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.color}`}>
                  {s.label} · {s.qty} · {s.month}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function InventorySection() {
  return (
    <div>
      <h2 className="mb-3 text-lg font-semibold">US Office Inventory</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InventoryDonut
          data={cardData}
          total={40}
          label="Cards"
          schedule={pocSchedule.cards}
        />
        <InventoryDonut
          data={serverData}
          total={16}
          label="Servers"
          schedule={pocSchedule.servers}
        />
      </div>
    </div>
  )
}
