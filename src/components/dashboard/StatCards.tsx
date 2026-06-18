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
  Demand: 'bg-[#B3C6E7]',
  Confirmed: 'bg-violet-400',
  'Waiting for Delivery': 'bg-[#888888]',
  Delivered: 'bg-emerald-400',
  'Cancelled/Lost': 'bg-[#E21500]',
}

const STAGE_VALUE: Record<string, string> = {
  Demand: 'text-[#B3C6E7]',
  Confirmed: 'text-violet-400',
  'Waiting for Delivery': 'text-[#888888]',
  Delivered: 'text-emerald-400',
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
      <div className="col-span-2 rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-5">
        <p className="text-sm font-semibold text-[#A0A0A0] mb-4">Pipeline by stage</p>
        <div className="grid grid-cols-5 divide-x divide-[#2A2A2A]">
          {byStage.map((s) => (
            <div key={s.status} className="px-4 first:pl-0 last:pr-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STAGE_DOT[s.status] ?? 'bg-[#555555]'}`} />
                <span className="text-xs text-[#888888]">{s.status}</span>
              </div>
              <p className={`text-lg font-bold ${STAGE_VALUE[s.status] ?? 'text-[#A0A0A0]'}`}>
                {s.revenue > 0 ? formatRevenue(s.revenue) : '—'}
              </p>
              <p className="text-xs text-[#666666]">{s.count} deal{s.count !== 1 ? 's' : ''}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Cards ordered vs delivered */}
      <div className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-[#888888]">Cards ordered vs delivered</p>
          <span className="text-xs px-2 py-0.5 rounded-full bg-[#E21500]/20 text-[#F26B43] font-semibold">NEW</span>
        </div>
        <div className="flex items-end gap-4 mb-3">
          <div>
            <p className="text-2xl font-bold text-[#B3C6E7]">{totalCards}</p>
            <p className="text-xs text-[#666666]">Ordered</p>
          </div>
          <div className="w-px h-8 bg-[#333333]" />
          <div>
            <p className="text-2xl font-bold text-emerald-400">{deliveredCards}</p>
            <p className="text-xs text-[#666666]">Delivered</p>
          </div>
        </div>
        <p className="text-xs text-[#666666] mb-1">{cardPct}% fulfillment</p>
        <div className="h-1.5 bg-[#2A2A2A] rounded-full overflow-hidden">
          <div className="h-full bg-[#B3C6E7] rounded-full transition-all" style={{ width: `${cardPct}%` }} />
        </div>
      </div>

      {/* Servers ordered vs delivered */}
      <div className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-[#888888]">Servers ordered vs delivered</p>
          <span className="text-xs px-2 py-0.5 rounded-full bg-[#E21500]/20 text-[#F26B43] font-semibold">NEW</span>
        </div>
        <div className="flex items-end gap-4 mb-3">
          <div>
            <p className="text-2xl font-bold text-[#B3C6E7]">{totalServers}</p>
            <p className="text-xs text-[#666666]">Ordered</p>
          </div>
          <div className="w-px h-8 bg-[#333333]" />
          <div>
            <p className="text-2xl font-bold text-emerald-400">{deliveredServers}</p>
            <p className="text-xs text-[#666666]">Delivered</p>
          </div>
        </div>
        <p className="text-xs text-[#666666] mb-1">{serverPct}% fulfillment</p>
        <div className="h-1.5 bg-[#2A2A2A] rounded-full overflow-hidden">
          <div className="h-full bg-[#1D9E75] rounded-full transition-all" style={{ width: `${serverPct}%` }} />
        </div>
      </div>
    </div>
  )
}
