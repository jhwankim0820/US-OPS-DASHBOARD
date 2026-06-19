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
  Demand: 'bg-[#E21500]',
  Confirmed: 'bg-violet-400',
  'Waiting for Delivery': 'bg-[#9CA3AF]',
  Delivered: 'bg-emerald-400',
  'Cancelled/Lost': 'bg-[#E21500]',
}

const STAGE_VALUE: Record<string, string> = {
  Demand: 'text-[#E21500]',
  Confirmed: 'text-violet-500',
  'Waiting for Delivery': 'text-[#6B7280]',
  Delivered: 'text-emerald-600',
  'Cancelled/Lost': 'text-[#E21500]',
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
      {/* Pipeline by stage */}
      <div className="col-span-2 rounded-xl border border-[#E2E8F0] bg-white p-5">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF]">Pipeline by stage</p>
        <div className="grid grid-cols-5 divide-x divide-[#E2E8F0]">
          {byStage.map((s) => (
            <div key={s.status} className="px-4 first:pl-0 last:pr-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STAGE_DOT[s.status] ?? 'bg-[#D1D5DB]'}`} />
                <span className="text-xs text-[#6B7280]">{s.status}</span>
              </div>
              <p className={`text-[28px] font-semibold leading-tight ${STAGE_VALUE[s.status] ?? 'text-[#6B7280]'}`}>
                {s.revenue > 0 ? formatRevenue(s.revenue) : '—'}
              </p>
              <p className="text-xs text-[#9CA3AF]">{s.count} deal{s.count !== 1 ? 's' : ''}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Cards ordered vs delivered */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF]">Cards ordered vs delivered</p>
          <span className="text-xs px-2 py-0.5 rounded-full bg-[#E21500]/10 text-[#E21500] font-semibold">NEW</span>
        </div>
        <div className="flex items-end gap-4 mb-3">
          <div>
            <p className="text-[36px] font-semibold leading-tight text-[#111827]">{totalCards}</p>
            <p className="text-xs text-[#9CA3AF]">Ordered</p>
          </div>
          <div className="w-px h-8 bg-[#E2E8F0] mb-1" />
          <div>
            <p className="text-[36px] font-semibold leading-tight text-emerald-600">{deliveredCards}</p>
            <p className="text-xs text-[#9CA3AF]">Delivered</p>
          </div>
        </div>
        <p className="text-xs text-[#9CA3AF] mb-1">{cardPct}% fulfillment</p>
        <div className="h-1.5 bg-[#F1F3F5] rounded-full overflow-hidden">
          <div className="h-full bg-[#E21500] rounded-full transition-all" style={{ width: `${cardPct}%` }} />
        </div>
      </div>

      {/* Servers ordered vs delivered */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF]">Servers ordered vs delivered</p>
          <span className="text-xs px-2 py-0.5 rounded-full bg-[#E21500]/10 text-[#E21500] font-semibold">NEW</span>
        </div>
        <div className="flex items-end gap-4 mb-3">
          <div>
            <p className="text-[36px] font-semibold leading-tight text-[#111827]">{totalServers}</p>
            <p className="text-xs text-[#9CA3AF]">Ordered</p>
          </div>
          <div className="w-px h-8 bg-[#E2E8F0] mb-1" />
          <div>
            <p className="text-[36px] font-semibold leading-tight text-emerald-600">{deliveredServers}</p>
            <p className="text-xs text-[#9CA3AF]">Delivered</p>
          </div>
        </div>
        <p className="text-xs text-[#9CA3AF] mb-1">{serverPct}% fulfillment</p>
        <div className="h-1.5 bg-[#F1F3F5] rounded-full overflow-hidden">
          <div className="h-full bg-[#E21500] rounded-full transition-all" style={{ width: `${serverPct}%` }} />
        </div>
      </div>
    </div>
  )
}
