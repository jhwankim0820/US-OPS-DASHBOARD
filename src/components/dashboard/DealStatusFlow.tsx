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
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    badge: 'bg-amber-100 text-amber-800',
  },
  {
    key: 'confirmed' as const,
    label: 'Confirmed',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-800',
  },
  {
    key: 'waitingForDelivery' as const,
    label: 'Waiting for Delivery',
    bg: 'bg-sky-50',
    border: 'border-sky-200',
    badge: 'bg-sky-100 text-sky-800',
  },
  {
    key: 'delivered' as const,
    label: 'Delivered',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-800',
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
            <h3 className="text-sm font-semibold">{col.label}</h3>
            <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${col.badge}`}>
              {groups[col.key].length}
            </span>
          </div>

          <div className="space-y-2">
            {groups[col.key].map((deal) => (
              <div key={deal.dmdId} className="rounded-lg bg-white p-3 shadow-sm">
                <div className="flex items-start justify-between">
                  <span className="font-mono text-xs text-gray-400">{deal.dmdId}</span>
                  {deal.revenue > 0 && (
                    <span className="text-sm font-semibold">{formatRevenue(deal.revenue, deal.currency)}</span>
                  )}
                </div>
                <p className="mt-0.5 text-sm font-medium">{deal.customer}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-xs">
                    {deal.formFactor}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {deal.category}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-gray-400">
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
