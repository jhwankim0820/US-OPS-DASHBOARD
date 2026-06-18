'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const cardData = [
  { name: 'In use', value: 24 },
  { name: 'Available', value: 16 },
]

const serverData = [
  { name: 'In use', value: 10 },
  { name: 'Available', value: 6 },
]

const CARD_COLORS = ['#E21500', '#35353f']
const SERVER_COLORS = ['rgb(124,77,255)', '#35353f']

const pocSchedule = {
  cards: [
    { label: 'AWS', qty: '8 cards', month: 'Jun', active: true },
    { label: 'Meta', qty: '8 cards', month: 'Jul', active: false },
  ],
  servers: [
    { label: 'Google', qty: '4 svr', month: 'Jun', active: true },
    { label: 'Microsoft', qty: '2 svr', month: 'Jul', active: false },
  ],
}

interface DonutProps {
  data: { name: string; value: number }[]
  total: number
  label: string
  colors: string[]
  schedule: { label: string; qty: string; month: string; active: boolean }[]
}

function InventoryDonut({ data, total, label, colors, schedule }: DonutProps) {
  return (
    <div className="rounded-xl border border-[#3a3a48] bg-[#2a2a35] p-5">
      <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#888888]">{label}</p>
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
                  <Cell key={i} fill={colors[i]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v) => [`${v} units`, '']}
                contentStyle={{ background: '#232330', border: '1px solid #35353f', borderRadius: 8, color: '#E0E0E0', fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[28px] font-semibold leading-tight text-white">{total}</span>
            <span className="text-xs text-[#888888]">total</span>
          </div>
        </div>

        <div className="flex-1 space-y-3">
          <div className="space-y-1.5">
            {data.map((d, i) => (
              <div key={d.name} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: colors[i] }} />
                  <span className="text-xs text-[#AAAAAA]">{d.name}</span>
                </div>
                <span className="text-xs font-semibold text-white">{d.value}</span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-[#3a3a48]">
            <p className="text-xs text-[#888888] mb-1.5">Upcoming POC</p>
            <div className="flex flex-wrap gap-1.5">
              {schedule.map((s) => (
                <span
                  key={s.label}
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={s.active
                    ? { background: `${colors[0]}33`, color: colors[0] }
                    : { background: '#35353f', color: '#888888' }
                  }
                >
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
      <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#888888]">US Office Inventory</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InventoryDonut
          data={cardData}
          total={40}
          label="Cards"
          colors={CARD_COLORS}
          schedule={pocSchedule.cards}
        />
        <InventoryDonut
          data={serverData}
          total={16}
          label="Servers"
          colors={SERVER_COLORS}
          schedule={pocSchedule.servers}
        />
      </div>
    </div>
  )
}
