import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatRevenue } from '@/lib/utils'

interface StatCardsProps {
  totalDeals: number
  totalRevenue: number
  deliveredCards: number
  deliveredServers: number
}

export default function StatCards({
  totalDeals,
  totalRevenue,
  deliveredCards,
  deliveredServers,
}: StatCardsProps) {
  const stats = [
    { label: 'Total Deals', value: String(totalDeals), unit: '' },
    { label: 'Total Revenue', value: formatRevenue(totalRevenue), unit: '' },
    { label: 'Cards Delivered', value: deliveredCards > 0 ? String(deliveredCards) : '—', unit: deliveredCards > 0 ? 'ea' : '' },
    { label: 'Servers Delivered', value: deliveredServers > 0 ? String(deliveredServers) : '—', unit: deliveredServers > 0 ? 'ea' : '' },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {stats.map((s) => (
        <Card key={s.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">{s.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {s.value}
              {s.unit && <span className="ml-1 text-base font-normal text-gray-400">{s.unit}</span>}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
