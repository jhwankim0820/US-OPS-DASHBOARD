import { Badge } from '@/components/ui/badge'

interface Deal {
  dmdId: string
  customer: string
  formFactor: string
  revenue: number
  cards: number
  servers: number
  owner: string
  category: string
}

interface DealStatusFlowProps {
  demand: Deal[]
  confirmed: Deal[]
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
    key: 'delivered' as const,
    label: 'Delivered',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-800',
  },
]

function qtyLabel(deal: Deal) {
  const parts = []
  if (deal.cards > 0) parts.push(`카드 ${deal.cards}ea`)
  if (deal.servers > 0) parts.push(`서버 ${deal.servers}ea`)
  return parts.join(' · ') || '—'
}

export default function DealStatusFlow({ demand, confirmed, delivered }: DealStatusFlowProps) {
  const groups = { demand, confirmed, delivered }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {COLUMNS.map((col) => (
        <div key={col.key} className={`rounded-xl border ${col.border} ${col.bg} p-4`}>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">{col.label}</h3>
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
                    <span className="text-sm font-semibold">{deal.revenue.toFixed(1)}억</span>
                  )}
                </div>
                <p className="mt-0.5 font-medium">{deal.customer}</p>
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
