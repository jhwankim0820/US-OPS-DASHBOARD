import { formatRevenue } from '@/lib/utils'

interface StageData {
  status: string
  revenue: number
  count: number
}

interface StatCardsProps {
  totalCards: number
  deliveredCards: number
  totalServers: number
  deliveredServers: number
  byStage: StageData[]
}

const STAGE_DOT: Record<string, string> = {
  Demand: 'bg-blue-500',
  Confirmed: 'bg-violet-500',
  'Waiting for Delivery': 'bg-gray-400',
  Delivered: 'bg-emerald-500',
  'Cancelled/Lost': 'bg-red-500',
}

const STAGE_VALUE: Record<string, string> = {
  Demand: 'text-blue-600',
  Confirmed: 'text-violet-600',
  'Waiting for Delivery': 'text-gray-500',
  Delivered: 'text-emerald-600',
  'Cancelled/Lost': 'text-red-500',
}

export default function StatCards({
  totalCards,
  deliveredCards,
  totalServers,
  deliveredServers,
  byStage,
}: StatCardsProps) {
  const cardPct = totalCards > 0 ? Math.round((deliveredCards / totalCards) * 100) : 0
  const serverPct = totalServers > 0 ? Math.round((deliveredServers / totalServers) * 100) : 0

  return (
    <div className="grid grid-cols-4 gap-4 items-stretch">
      {/* Pipeline by stage — spans 2 cols (aligns with Inventory Cards box) */}
      <div className="col-span-2 rounded-xl border border-gray-200 bg-white p-5">
        <p className="text-sm font-semibold text-gray-700 mb-4">Pipeline by stage</p>
        <div className="grid grid-cols-5 divide-x divide-gray-100">
          {byStage.map((s) => (
            <div key={s.status} className="px-4 first:pl-0 last:pr-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STAGE_DOT[s.status] ?? 'bg-gray-300'}`} />
                <span className="text-xs text-gray-500">{s.status}</span>
              </div>
              <p className={`text-lg font-bold ${STAGE_VALUE[s.status] ?? 'text-gray-600'}`}>
                {s.revenue > 0 ? formatRevenue(s.revenue) : '—'}
              </p>
              <p className="text-xs text-gray-400">{s.count} deal{s.count !== 1 ? 's' : ''}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Cards ordered vs delivered */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-gray-500">Cards ordered vs delivered</p>
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">NEW</span>
        </div>
        <div className="flex items-end gap-4 mb-3">
          <div>
            <p className="text-2xl font-bold text-blue-600">{totalCards}</p>
            <p className="text-xs text-gray-400">Ordered</p>
          </div>
          <div className="w-px h-8 bg-gray-200" />
          <div>
            <p className="text-2xl font-bold text-emerald-600">{deliveredCards}</p>
            <p className="text-xs text-gray-400">Delivered</p>
          </div>
        </div>
        <p className="text-xs text-gray-400 mb-1">{cardPct}% fulfillment</p>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${cardPct}%` }} />
        </div>
      </div>

      {/* Servers ordered vs delivered */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-gray-500">Servers ordered vs delivered</p>
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">NEW</span>
        </div>
        <div className="flex items-end gap-4 mb-3">
          <div>
            <p className="text-2xl font-bold text-blue-600">{totalServers}</p>
            <p className="text-xs text-gray-400">Ordered</p>
          </div>
          <div className="w-px h-8 bg-gray-200" />
          <div>
            <p className="text-2xl font-bold text-emerald-600">{deliveredServers}</p>
            <p className="text-xs text-gray-400">Delivered</p>
          </div>
        </div>
        <p className="text-xs text-gray-400 mb-1">{serverPct}% fulfillment</p>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${serverPct}%` }} />
        </div>
      </div>
    </div>
  )
}
