import { Badge } from '@/components/ui/badge'
import { formatRevenue } from '@/lib/utils'

interface Deal {
  dmdId: string
  customer: string
  formFactor: string
  revenue: number
  currency: string
  cards: number
  servers: number
  owner: string
  category: string
}

interface DealStatusFlowProps {
  demand: Deal[]
  confirmed: Deal[]
  waitingForDelivery: Deal[]
  delivered: Deal[]
}

const COLUMNS = [
  {
    key: 'demand' as const,
    label: 'Demand',
    bg: 'bg-[#1A0F00]',
    border: 'border-[#3D2600]',
    badge: 'bg-[#3D2600] text-amber-400',
  },
  {
    key: 'confirmed' as const,
    label: 'Confirmed',
    bg: 'bg-[#001228]',
    border: 'border-[#002855]',
    badge: 'bg-[#002855] text-[#B3C6E7]',
  },
  {
    key: 'waitingForDelivery' as const,
    label: 'Waiting for Delivery',
    bg: 'bg-[#001520]',
    border: 'border-[#003344]',
    badge: 'bg-[#003344] text-sky-400',
  },
  {
    key: 'delivered' as const,
    label: 'Delivered',
    bg: 'bg-[#001509]',
    border: 'border-[#003320]',
    badge: 'bg-[#003320] text-emerald-400',
  },
]

function qtyLabel(deal: Deal) {
  const parts = []
  if (deal.cards > 0) parts.push(`Cards ${deal.cards}`)
  if (deal.servers > 0) parts.push(`Servers ${deal.servers}`)
  return parts.join(' · ') || '—'
}

export default function DealStatusFlow({
  demand,
  confirmed,
  waitingForDelivery,
  delivered,
}: DealStatusFlowProps) {
  const groups = { demand, confirmed, waitingForDelivery, delivered }

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {COLUMNS.map((col) => (
        <div key={col.key} className={`rounded-xl border ${col.border} ${col.bg} p-4`}>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#666666]">{col.label}</h3>
            <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${col.badge}`}>
              {groups[col.key].length}
            </span>
          </div>

          <div className="space-y-2">
            {groups[col.key].map((deal) => (
              <div key={deal.dmdId} className="rounded-lg bg-[#1E1E1E] p-3 shadow-sm">
                <div className="flex items-start justify-between">
                  <span className="font-mono text-xs text-[#666666]">{deal.dmdId}</span>
                  {deal.revenue > 0 && (
                    <span className="text-sm font-semibold text-[#E0E0E0]">{formatRevenue(deal.revenue, deal.currency)}</span>
                  )}
                </div>
                <p className="mt-0.5 text-sm font-medium text-[#E0E0E0]">{deal.customer}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-xs border-[#3A3A3A] text-[#A0A0A0]">
                    {deal.formFactor}
                  </Badge>
                  <Badge variant="outline" className="text-xs border-[#3A3A3A] text-[#A0A0A0]">
                    {deal.category}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-[#666666]">
                  {qtyLabel(deal)} · {deal.owner}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
